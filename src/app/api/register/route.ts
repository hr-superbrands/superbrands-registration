import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import crypto from "crypto";
import { resend, appUrl, registrationEmailHtml } from "@/lib/email";

const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const toInt = (v: unknown) => {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
    return Number(v);
  }
  return v;
};

const RegistrationSchema = z.object({
  full_name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  phone: z.preprocess(emptyToUndefined, z.string().max(50).optional()),
  company: z.preprocess(emptyToUndefined, z.string().max(120).optional()),
  guests: z.preprocess(toInt, z.number().int().min(0).max(10)).optional(),
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

    const { error } = await supabaseAdmin.from("registrations").insert({
      full_name: data.full_name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || null,
      company: data.company?.trim() || null,
      guests: data.guests ?? 0,
      edit_token,
      edit_token_expires_at: expires.toISOString(),
      status: "submitted",
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

    // Always send Croatian email now
    const editUrl = appUrl(`/edit?token=${edit_token}`);
    const { subject, html } = registrationEmailHtml({
      lang: "hr",
      full_name: data.full_name,
      editUrl,
    });

    const from = process.env.EMAIL_FROM;

    if (from) {
      await resend.emails.send({
        from,
        to: data.email.trim().toLowerCase(),
        subject,
        html,
      });
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
