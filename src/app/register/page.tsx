"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

export default function RegisterPage() {
  const [full_name, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [guests, setGuests] = useState(0);

  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return full_name.trim().length >= 2 && email.includes("@") && !loading;
  }, [full_name, email, loading]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);

    if (!canSubmit) return;

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name,
          email,
          phone,
          company,
          guests,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok && json?.ok) {
        setOk(true);
        return;
      }

      setError(json?.message || "Došlo je do greške. Pokušajte ponovno.");
    } catch {
      setError("Došlo je do greške. Pokušajte ponovno.");
    } finally {
      setLoading(false);
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
                Registracija
              </h1>
              <p className="mt-2 text-sm text-white/80 md:text-base">
                Unesite podatke i potvrdićemo Vašu registraciju e-mailom.
              </p>

              <div className="mt-6 rounded-2xl bg-black/35 p-4 ring-1 ring-white/15 backdrop-blur-md">
                <div className="text-xs text-white/70">
                  Superbrands Gala 2026
                </div>
                <div className="mt-2 text-sm text-white/85">
                  Datum: 04.03.2026. • Vrijeme: 19:00–23:00
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — form */}
          <div className="rounded-3xl bg-white/10 p-6 ring-1 ring-white/15 backdrop-blur-md md:p-8">
            {error && (
              <div className="mb-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200 ring-1 ring-red-500/20">
                {error}
              </div>
            )}
            {ok && (
              <div className="mb-4 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 ring-1 ring-emerald-500/20">
                Registracija je zaprimljena. Provjerite e-mail za link za
                uređivanje podataka.
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <Field
                label="Ime i prezime"
                value={full_name}
                onChange={setFullName}
              />
              <Field
                label="E-mail"
                value={email}
                onChange={setEmail}
                type="email"
              />
              <Field
                label="Telefon (opcionalno)"
                value={phone}
                onChange={setPhone}
              />
              <Field
                label="Tvrtka (opcionalno)"
                value={company}
                onChange={setCompany}
              />

              {/* Guests stepper */}
              <div className="rounded-2xl bg-black/25 p-4 ring-1 ring-white/10">
                <div className="mb-2 text-xs text-white/70">
                  Broj osoba koje dolaze s Vama
                </div>

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setGuests((g) => clamp(g - 1, 0, 10))}
                    className="h-11 w-11 rounded-xl bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/15 active:scale-[0.99]"
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
                    onClick={() => setGuests((g) => clamp(g + 1, 0, 10))}
                    className="h-11 w-11 rounded-xl bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/15 active:scale-[0.99]"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className={`w-full rounded-2xl px-5 py-3 text-center text-sm font-medium shadow-md transition active:scale-[0.99] ${
                  canSubmit
                    ? "bg-white text-black hover:bg-white/90"
                    : "bg-white/20 text-white/60 cursor-not-allowed"
                }`}
              >
                {loading ? "Slanje…" : "Pošalji registraciju"}
              </button>

              <p className="text-center text-xs text-white/55">
                Nakon registracije dobijate e-mail sa linkom za izmjenu
                podataka.
              </p>
            </form>
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
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs text-white/70">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl bg-black/30 px-4 py-3 text-sm text-white ring-1 ring-white/10 placeholder:text-white/35 outline-none focus:ring-white/25"
      />
    </label>
  );
}
