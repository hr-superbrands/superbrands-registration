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

type RegistrationRow = {
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  guests: number;
  edit_token_expires_at: string | null;
  status: string;
  metadata: any | null;
};

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
    .select(
      "full_name,email,phone,company,guests,metadata,edit_token_expires_at,status"
    )
    .eq("edit_token", token)
    .maybeSingle<RegistrationRow>();

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

  // ✅ Pull +1 details from metadata (fallback to guests if needed)
  const meta = (data.metadata ?? {}) as Record<string, any>;
  const plus_one =
    typeof meta.plus_one === "boolean" ? meta.plus_one : (data.guests ?? 0) > 0;

  const plus_one_full_name =
    typeof meta.plus_one_full_name === "string" &&
    meta.plus_one_full_name.trim()
      ? meta.plus_one_full_name.trim()
      : null;

  return NextResponse.json({
    ok: true,
    locked,
    lockReason,
    registration: {
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      guests: data.guests, // still returned if you need it
      status: data.status,
      edit_token_expires_at: data.edit_token_expires_at,

      // ✅ new fields your edit UI can use directly
      plus_one,
      plus_one_full_name,
    },
  });
}
