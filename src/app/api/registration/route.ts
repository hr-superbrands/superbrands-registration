import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function getLockInfo() {
  const iso = process.env.EVENT_START_ISO;
  if (!iso) return { locked: false, lockReason: null as string | null };

  const eventStart = new Date(iso);
  const lockAt = new Date(eventStart.getTime() - 24 * 60 * 60 * 1000);

  const now = new Date();
  const locked = now.getTime() >= lockAt.getTime();

  return {
    locked,
    lockReason: locked
      ? `Editing is locked 24h before the event (locked since ${lockAt.toISOString()}).`
      : null,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { ok: false, message: "Missing token." },
      { status: 400 }
    );
  }

  const { locked, lockReason } = getLockInfo();

  const { data, error } = await supabaseAdmin
    .from("registrations")
    .select("full_name,email,phone,company,guests,edit_token_expires_at,status")
    .eq("edit_token", token)
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

  return NextResponse.json({
    ok: true,
    locked,
    lockReason,
    registration: data,
  });
}
