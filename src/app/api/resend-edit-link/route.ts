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
      .select("full_name,email,edit_token_expires_at")
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

    const from = process.env.EMAIL_FROM;
    if (!from) {
      return NextResponse.json(
        { ok: false, message: "EMAIL_FROM not set; cannot send." },
        { status: 500 }
      );
    }

    const editUrl = appUrl(`/edit?token=${body.token}`);
    const { subject, html } = registrationEmailHtml({
      lang: "hr",
      full_name: data.full_name,
      editUrl,
    });

    await resend.emails.send({
      from,
      to: data.email,
      subject,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json(
        { ok: false, message: "Invalid request." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { ok: false, message: "Unexpected error." },
      { status: 500 }
    );
  }
}
