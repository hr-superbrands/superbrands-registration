import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import crypto from "crypto";

const emptyToNull = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? null : v;

const toInt = (v: unknown) => {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
    return Number(v);
  }
  return v;
};

const EditSchema = z.object({
  token: z.string().min(10),
  full_name: z.string().min(2).max(120),
  phone: z.preprocess(emptyToNull, z.string().max(50).nullable().optional()),
  company: z.preprocess(emptyToNull, z.string().max(120).nullable().optional()),
  guests: z
    .preprocess(toInt, z.number().int().min(0).max(10))
    .optional()
    .default(0),
});

function makeToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString("hex");
}

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
    const body = EditSchema.parse(json);

    const { data: row, error: findErr } = await supabaseAdmin
      .from("registrations")
      .select("id,edit_token_expires_at")
      .eq("edit_token", body.token)
      .maybeSingle();

    if (findErr) {
      return NextResponse.json(
        { ok: false, message: findErr.message },
        { status: 500 }
      );
    }
    if (!row) {
      return NextResponse.json(
        { ok: false, message: "Invalid token." },
        { status: 404 }
      );
    }

    const exp = row.edit_token_expires_at
      ? new Date(row.edit_token_expires_at)
      : null;
    if (exp && exp.getTime() < Date.now()) {
      return NextResponse.json(
        { ok: false, message: "Token expired." },
        { status: 410 }
      );
    }

    // ✅ rotate token so old link becomes invalid
    const new_token = makeToken(24);
    const new_expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);

    const { error: updErr } = await supabaseAdmin
      .from("registrations")
      .update({
        full_name: body.full_name.trim(),
        phone: body.phone ? String(body.phone).trim() : null,
        company: body.company ? String(body.company).trim() : null,
        guests: body.guests,
        status: "updated",
        edit_token: new_token,
        edit_token_expires_at: new_expires.toISOString(),
      })
      .eq("id", row.id);

    if (updErr) {
      return NextResponse.json(
        { ok: false, message: updErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, new_token });
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
