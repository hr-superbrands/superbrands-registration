import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resend, appUrl, registrationEmailHtml } from "@/lib/email";

const BodySchema = z.object({
  token: z.string().min(10),
});

function isLockedNow() {
  const iso = process.env.EVENT_START_ISO;
  if (!iso) return false;

  const eventStart = new Date(iso);
  const lockAt = new Date(eventStart.getTime() - 24 * 60 * 60 * 1000);
  return Date.now() >= lockAt.getTime();
}

/**
 * Resend expects:
 *  - email@example.com
 *  - Name <email@example.com>
 *
 * People often set EMAIL_FROM with extra quotes in .env, e.g.
 *   "\"Superbrands <no-reply@...>\""
 * This normalizes that to: Superbrands <no-reply@...>
 */
function normalizeFrom(raw: string) {
  let s = raw.trim();

  // remove wrapping quotes (single or double) repeatedly
  while (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }

  // also unescape \"...\" cases
  s = s.replace(/\\"/g, '"').trim();

  return s;
}

export async function POST(req: Request) {
  try {
    if (isLockedNow()) {
      return NextResponse.json(
        { ok: false, message: "Editing is locked 24 hours before the event." },
        { status: 423 }
      );
    }

    const json = await req.json();
    const body = BodySchema.parse(json);

    const { data, error } = await supabaseAdmin
      .from("registrations")
      .select("full_name,email,edit_token_expires_at,status")
      .eq("edit_token", body.token)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: 500 }
      );
    }
    if (!data) {
      return NextResponse.json(
        { ok: false, message: "Invalid token." },
        { status: 404 }
      );
    }

    const exp = data.edit_token_expires_at
      ? new Date(data.edit_token_expires_at)
      : null;

    if (exp && exp.getTime() < Date.now()) {
      return NextResponse.json(
        { ok: false, message: "Token expired." },
        { status: 410 }
      );
    }

    const fromEnv = process.env.EMAIL_FROM;
    if (!fromEnv) {
      return NextResponse.json(
        { ok: false, message: "EMAIL_FROM not set; cannot send." },
        { status: 500 }
      );
    }

    const from = normalizeFrom(fromEnv);
    const to = String(data.email || "")
      .trim()
      .toLowerCase();

    const editUrl = appUrl(`/edit?token=${body.token}`);
    const { subject, html } = registrationEmailHtml({
      lang: "hr",
      full_name: data.full_name,
      editUrl,
    });

    try {
      await resend.emails.send({
        from,
        to,
        subject,
        html,
      });
    } catch (sendErr: any) {
      // Resend errors often include { name, message, statusCode }
      const status = Number(sendErr?.statusCode) || 502;
      return NextResponse.json(
        {
          ok: false,
          message: sendErr?.message || "Email provider error.",
          provider: "resend",
          statusCode: status,
        },
        { status }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json(
        { ok: false, message: "Invalid request.", issues: err.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: false, message: "Unexpected error." },
      { status: 500 }
    );
  }
}
