import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import crypto from "crypto";
import { resend, appUrl, registrationEmailHtml } from "@/lib/email";

const emptyToUndefined = (v: unknown) => {
  if (v === null || v === undefined) return undefined;
  if (typeof v === "string" && v.trim() === "") return undefined;
  return v;
};

/**
 * Coerce checkbox-ish values into a real boolean.
 * Handles: true/false, "true"/"false", "on"/"off", "1"/"0", 1/0, null/undefined/""
 */
const toBool = (v: unknown) => {
  if (v === undefined || v === null || v === "") return false;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;

  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (["true", "1", "yes", "y", "on"].includes(s)) return true;
    if (["false", "0", "no", "n", "off"].includes(s)) return false;
  }

  return v; // let Zod throw if it's something weird
};

const RegistrationSchema = z
  .object({
    full_name: z.string().min(2).max(120),
    email: z.string().email().max(200),

    phone: z.preprocess(emptyToUndefined, z.string().max(50).optional()),
    company: z.preprocess(emptyToUndefined, z.string().max(120).optional()),

    plus_one: z.preprocess(toBool, z.boolean()).default(false),

    plus_one_full_name: z.preprocess(
      emptyToUndefined,
      z.string().min(2).max(120).optional()
    ),
  })
  .superRefine((val, ctx) => {
    if (val.plus_one) {
      const name = val.plus_one_full_name?.trim();
      if (!name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "plus_one_full_name is required when plus_one is true",
          path: ["plus_one_full_name"],
        });
      }
    }
  });

function makeToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const data = RegistrationSchema.parse(json);

    const edit_token = makeToken(24);
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);

    const plusOneName = data.plus_one ? data.plus_one_full_name!.trim() : null;

    // If you still want guests as INT: 0/1
    const guests = data.plus_one ? 1 : 0;

    // Optional metadata (requires column in DB)
    const metadata = {
      plus_one: data.plus_one,
      plus_one_full_name: plusOneName,
    };

    const { error } = await supabaseAdmin.from("registrations").insert({
      full_name: data.full_name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || null,
      company: data.company?.trim() || null,
      guests,
      edit_token,
      edit_token_expires_at: expires.toISOString(),
      status: "submitted",
      metadata, // ⬅️ remove this line if you don't have a metadata column
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { ok: false, message: "This email is already registered." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: 500 }
      );
    }

    // ✅ Send Croatian email
    const editUrl = appUrl(`/edit?token=${edit_token}`);
    const { subject, html } = registrationEmailHtml({
      lang: "hr",
      full_name: data.full_name,
      editUrl,
    });

    const from = process.env.EMAIL_FROM;
    if (!from) {
      return NextResponse.json(
        {
          ok: true,
          edit_token,
          warning: "EMAIL_FROM not set; registration stored, email not sent.",
        },
        { status: 200 }
      );
    }

    try {
      await resend.emails.send({
        from,
        to: data.email.trim().toLowerCase(),
        subject,
        html,
      });
    } catch (emailErr: any) {
      return NextResponse.json(
        {
          ok: true,
          edit_token,
          warning:
            emailErr?.message ||
            "Email sending failed, but registration was stored.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ ok: true, edit_token });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json(
        { ok: false, message: "Invalid form data.", issues: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { ok: false, message: "Unexpected error." },
      { status: 500 }
    );
  }
}
