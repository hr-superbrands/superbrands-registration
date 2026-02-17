"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Registration = {
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  guests: number | null;
};

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

export default function EditPage() {
  const [token, setToken] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState(false);

  const [locked, setLocked] = useState(false);
  const [lockReason, setLockReason] = useState<string | null>(null);

  const [data, setData] = useState<Registration | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [resentOk, setResentOk] = useState(false);

  const [full_name, setFullName] = useState("");
  const [email, setEmail] = useState(""); // read-only
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [guests, setGuests] = useState(0);

  const canSave = useMemo(() => {
    return full_name.trim().length >= 2 && token && !saving && !locked;
  }, [full_name, token, saving, locked]);

  async function load(t: string) {
    setLoading(true);
    setError(null);
    setOk(false);
    setResentOk(false);

    try {
      const res = await fetch(
        `/api/registration?token=${encodeURIComponent(t)}`
      );
      const json = await res.json();

      if (!res.ok || !json?.ok) {
        setError(json?.message || "Neispravan ili istekao link.");
        setData(null);
        return;
      }

      setLocked(Boolean(json.locked));
      setLockReason(json.lockReason ?? null);

      const r: Registration = json.registration;
      setData(r);

      setFullName(r.full_name ?? "");
      setEmail(r.email ?? "");
      setPhone(r.phone ?? "");
      setCompany(r.company ?? "");
      setGuests(typeof r.guests === "number" ? r.guests : 0);
    } catch {
      setError("Greška pri učitavanju. Pokušajte ponovno.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const t = sp.get("token") || "";
    setToken(t);

    if (!t) {
      setLoading(false);
      setError("Nedostaje token. Otvorite link iz e-maila.");
      return;
    }

    load(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setOk(false);
    setError(null);
    setResentOk(false);

    if (!canSave) {
      setError(
        locked
          ? "Uređivanje je zaključano."
          : "Provjerite podatke i pokušajte ponovno."
      );
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          full_name,
          phone,
          company,
          guests,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok && json?.ok) {
        setOk(true);

        if (json.new_token && typeof json.new_token === "string") {
          setToken(json.new_token);
          const url = new URL(window.location.href);
          url.searchParams.set("token", json.new_token);
          window.history.replaceState({}, "", url.toString());
        }

        return;
      }

      if (res.status === 423) {
        setLocked(true);
        setError(json?.message || "Uređivanje je zaključano.");
        return;
      }

      setError(json?.message || "Došlo je do greške. Pokušajte ponovno.");
    } catch {
      setError("Došlo je do greške. Pokušajte ponovno.");
    } finally {
      setSaving(false);
    }
  }

  async function onResend() {
    setResentOk(false);
    setError(null);

    if (!token) return;

    setResending(true);
    try {
      const res = await fetch("/api/resend-edit-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok && json?.ok) {
        setResentOk(true);
        return;
      }

      if (res.status === 423) {
        setLocked(true);
        setError(json?.message || "Uređivanje je zaključano.");
        return;
      }

      setError(json?.message || "Ne mogu poslati e-mail. Pokušajte ponovno.");
    } catch {
      setError("Ne mogu poslati e-mail. Pokušajte ponovno.");
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden text-white">
      {/* Backdrop */}
      <div className="absolute inset-0">
        <Image
          src="/backdrop.jpg"
          alt="Backdrop"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/45" />
      </div>

      {/* Top bar */}
      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo-top.png"
            alt="Logo"
            width={170}
            height={48}
            className="h-9 w-auto md:h-10"
            priority
          />
        </Link>

        <Link
          href="/"
          className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/85 ring-1 ring-white/15 backdrop-blur-md hover:bg-white/15"
        >
          ← Nazad
        </Link>
      </header>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 pt-6 md:px-8">
        <div className="grid gap-8 md:grid-cols-2 md:gap-10">
          {/* LEFT — e-card image panel */}
          <div className="relative overflow-hidden rounded-3xl ring-1 ring-white/15 shadow-[0_40px_120px_-70px_rgba(0,0,0,0.85)]">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: "url(/e-card.jpg)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className="absolute inset-0 bg-black/55" />
            <div className="relative p-6 md:p-8">
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Uredi podatke
              </h1>
              <p className="mt-2 text-sm text-white/80 md:text-base">
                Možete izmijeniti podatke o registraciji. E-mail adresa se ne
                može mijenjati.
              </p>

              {locked && (
                <div className="mt-6 rounded-2xl bg-amber-500/10 p-4 ring-1 ring-amber-500/20">
                  <div className="text-sm text-amber-200">
                    Uređivanje je zaključano 24h prije događaja.
                  </div>
                  {lockReason ? (
                    <div className="mt-1 text-xs text-amber-200/70">
                      {lockReason}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — form */}
          <div className="rounded-3xl bg-white/10 p-6 ring-1 ring-white/15 backdrop-blur-md md:p-8">
            {loading ? (
              <div className="text-sm text-white/70">Učitavanje…</div>
            ) : error ? (
              <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200 ring-1 ring-red-500/20">
                {error}
              </div>
            ) : !data ? (
              <div className="text-sm text-white/70">Nema podataka.</div>
            ) : (
              <>
                <form onSubmit={onSave} className="space-y-4">
                  <Field
                    label="Ime i prezime"
                    value={full_name}
                    onChange={setFullName}
                    disabled={locked}
                  />

                  <label className="block">
                    <div className="mb-1 text-xs text-white/70">
                      E-mail (nije moguće mijenjati)
                    </div>
                    <input
                      value={email}
                      readOnly
                      className="w-full cursor-not-allowed rounded-2xl bg-black/20 px-4 py-3 text-sm text-white/70 ring-1 ring-white/10 outline-none"
                    />
                  </label>

                  <Field
                    label="Telefon (opcionalno)"
                    value={phone}
                    onChange={setPhone}
                    disabled={locked}
                  />
                  <Field
                    label="Tvrtka (opcionalno)"
                    value={company}
                    onChange={setCompany}
                    disabled={locked}
                  />

                  <div className="rounded-2xl bg-black/25 p-4 ring-1 ring-white/10">
                    <div className="mb-2 text-xs text-white/70">
                      Broj osoba koje dolaze s Vama
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        disabled={locked}
                        onClick={() => setGuests((g) => clamp(g - 1, 0, 10))}
                        className={`h-11 w-11 rounded-xl ring-1 ring-white/15 active:scale-[0.99] ${
                          locked
                            ? "bg-white/5 text-white/35 cursor-not-allowed"
                            : "bg-white/10 text-white hover:bg-white/15"
                        }`}
                      >
                        −
                      </button>

                      <div className="flex-1 text-center">
                        <div className="text-3xl font-semibold tabular-nums">
                          {guests}
                        </div>
                        <div className="text-xs text-white/55">
                          0 = dolazim sam/sama
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={locked}
                        onClick={() => setGuests((g) => clamp(g + 1, 0, 10))}
                        className={`h-11 w-11 rounded-xl ring-1 ring-white/15 active:scale-[0.99] ${
                          locked
                            ? "bg-white/5 text-white/35 cursor-not-allowed"
                            : "bg-white/10 text-white hover:bg-white/15"
                        }`}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {ok && (
                    <div className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 ring-1 ring-emerald-500/20">
                      Podaci su uspješno ažurirani.
                    </div>
                  )}

                  {resentOk && (
                    <div className="rounded-2xl bg-sky-500/10 px-4 py-3 text-sm text-sky-200 ring-1 ring-sky-500/20">
                      Link za uređivanje je ponovno poslan na e-mail.
                    </div>
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="submit"
                      disabled={!canSave}
                      className={`flex-1 rounded-2xl px-5 py-3 text-center text-sm font-medium shadow-md transition active:scale-[0.99] ${
                        canSave
                          ? "bg-white text-black hover:bg-white/90"
                          : "bg-white/20 text-white/60 cursor-not-allowed"
                      }`}
                    >
                      {saving ? "Spremanje…" : "Spremi promjene"}
                    </button>

                    <button
                      type="button"
                      onClick={onResend}
                      disabled={resending || !token || locked}
                      className={`flex-1 rounded-2xl px-5 py-3 text-center text-sm font-medium ring-1 ring-white/15 transition active:scale-[0.99] ${
                        locked
                          ? "bg-white/5 text-white/40 cursor-not-allowed"
                          : "bg-white/10 text-white hover:bg-white/15"
                      }`}
                    >
                      {resending ? "Slanje…" : "Pošalji ponovno link"}
                    </button>
                  </div>
                </form>

                {/* tiny helper */}
                <p className="mt-4 text-center text-xs text-white/55">
                  E-mail ostaje isti. Na mobitelu sadržaj se automatski skrola.
                </p>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs text-white/70">{label}</div>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-2xl px-4 py-3 text-sm ring-1 ring-white/10 outline-none ${
          disabled
            ? "bg-black/20 text-white/50 cursor-not-allowed"
            : "bg-black/30 text-white focus:ring-white/25"
        }`}
      />
    </label>
  );
}
