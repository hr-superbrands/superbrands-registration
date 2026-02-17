"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Lang = "hr" | "en";

const copy = {
  hr: {
    title: "Registracija",
    subtitle:
      "Molimo unesite podatke. Potvrdu registracije ćete dobiti na e-mail.",
    full_name: "Ime i prezime",
    email: "E-mail",
    phone: "Telefon (opcionalno)",
    company: "Tvrtka (opcionalno)",
    guestsLabel: "Broj osoba koje dolaze s Vama",
    guestsHelp: "0 = dolazim sam/sama",
    submit: "Pošalji prijavu",
    sending: "Slanje...",
    back: "Natrag na pozivnicu",
    successTitle: "Hvala! Registracija je zaprimljena.",
    successBody:
      "Uskoro ćete dobiti e-mail potvrdu. Ako trebate izmijeniti podatke, koristite link iz e-maila.",
    errorGeneric: "Došlo je do greške. Pokušajte ponovno.",
    errorInvalid: "Provjerite unesene podatke.",
    errorDuplicate: "Ovaj e-mail je već registriran.",
    lang: "Jezik",
    leftNoteTitle: "Superbrands Gala 2026",
    leftNoteBody:
      "Ispunite prijavu kako bismo potvrdili Vaše sudjelovanje. Podatke možete naknadno izmijeniti putem linka iz e-maila.",
  },
  en: {
    title: "Registration",
    subtitle:
      "Please enter your details. You’ll receive a confirmation email shortly.",
    full_name: "Full name",
    email: "Email",
    phone: "Phone (optional)",
    company: "Company (optional)",
    guestsLabel: "Number of people attending with you",
    guestsHelp: "0 = I’m attending alone",
    submit: "Submit registration",
    sending: "Sending...",
    back: "Back to invitation",
    successTitle: "Thank you! Your registration has been received.",
    successBody:
      "You’ll receive a confirmation email shortly. To edit your details, use the link in the email.",
    errorGeneric: "Something went wrong. Please try again.",
    errorInvalid: "Please check your input.",
    errorDuplicate: "This email is already registered.",
    lang: "Language",
    leftNoteTitle: "Superbrands Gala 2026",
    leftNoteBody:
      "Fill out the form to confirm your attendance. You can edit your details later via the email link.",
  },
} as const;

type FormState = {
  full_name: string;
  email: string;
  phone: string;
  company: string;
  guests: number; // NEW
};

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

export default function RegisterPage() {
  const [lang, setLang] = useState<Lang>("hr");
  const t = copy[lang];

  const [form, setForm] = useState<FormState>({
    full_name: "",
    email: "",
    phone: "",
    company: "",
    guests: 0,
  });

  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    const nameOk = form.full_name.trim().length >= 2;
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
    return nameOk && emailOk && !loading;
  }, [form.full_name, form.email, loading]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!canSubmit) {
      setError(t.errorInvalid);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          company: form.company,
          guests: form.guests, // NEW
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.ok) {
        setOk(true);
        return;
      }

      if (res.status === 409) {
        setError(t.errorDuplicate);
        return;
      }

      if (res.status === 400) {
        setError(t.errorInvalid);
        return;
      }

      setError(data?.message || t.errorGeneric);
    } catch {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen w-full bg-neutral-950 text-white">
      {/* top bar */}
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 md:px-8">
        <Link
          href="/"
          className="text-sm text-white/80 hover:text-white transition"
        >
          ← {t.back}
        </Link>

        <div className="flex items-center gap-2 rounded-full bg-white/10 px-2 py-1 backdrop-blur-md ring-1 ring-white/15">
          <span className="hidden text-xs text-white/70 md:block">
            {t.lang}
          </span>
          <button
            onClick={() => setLang("hr")}
            className={`rounded-full px-3 py-1 text-sm transition ${
              lang === "hr"
                ? "bg-white text-black"
                : "text-white/85 hover:bg-white/10"
            }`}
            aria-pressed={lang === "hr"}
            type="button"
          >
            HR
          </button>
          <button
            onClick={() => setLang("en")}
            className={`rounded-full px-3 py-1 text-sm transition ${
              lang === "en"
                ? "bg-white text-black"
                : "text-white/85 hover:bg-white/10"
            }`}
            aria-pressed={lang === "en"}
            type="button"
          >
            EN
          </button>
        </div>
      </header>

      {/* content */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6 md:px-8">
        <div className="grid gap-8 md:grid-cols-2 md:gap-10">
          {/* LEFT — e-card background */}
          <div className="relative overflow-hidden rounded-3xl ring-1 ring-white/10">
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
                {t.title}
              </h1>
              <p className="mt-2 text-sm text-white/80 md:text-base">
                {t.subtitle}
              </p>

              <div className="mt-6 rounded-2xl bg-black/35 p-4 ring-1 ring-white/15 backdrop-blur-md">
                <div className="text-xs text-white/70">{t.leftNoteTitle}</div>
                <div className="mt-2 text-sm text-white/85">
                  {t.leftNoteBody}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — form + guests stepper */}
          <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10 backdrop-blur-md md:p-8">
            {ok ? (
              <div>
                <h2 className="text-xl font-semibold">{t.successTitle}</h2>
                <p className="mt-2 text-sm text-white/70">{t.successBody}</p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-medium text-black hover:bg-white/90"
                  >
                    {lang === "hr" ? "Povratak" : "Back"}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setOk(false);
                      setForm({
                        full_name: "",
                        email: "",
                        phone: "",
                        company: "",
                        guests: 0,
                      });
                      setError(null);
                    }}
                    className="inline-flex items-center justify-center rounded-2xl bg-white/10 px-5 py-3 text-sm font-medium text-white ring-1 ring-white/15 hover:bg-white/15"
                  >
                    {lang === "hr" ? "Nova registracija" : "New registration"}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <Field
                  label={t.full_name}
                  value={form.full_name}
                  onChange={(v) => setForm((s) => ({ ...s, full_name: v }))}
                  autoComplete="name"
                />
                <Field
                  label={t.email}
                  value={form.email}
                  onChange={(v) => setForm((s) => ({ ...s, email: v }))}
                  type="email"
                  autoComplete="email"
                />
                <Field
                  label={t.phone}
                  value={form.phone}
                  onChange={(v) => setForm((s) => ({ ...s, phone: v }))}
                  autoComplete="tel"
                />
                <Field
                  label={t.company}
                  value={form.company}
                  onChange={(v) => setForm((s) => ({ ...s, company: v }))}
                  autoComplete="organization"
                />

                {/* Guests stepper */}
                <div className="rounded-2xl bg-black/25 p-4 ring-1 ring-white/10">
                  <div className="mb-2 text-xs text-white/70">
                    {t.guestsLabel}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setForm((s) => ({
                          ...s,
                          guests: clamp(s.guests - 1, 0, 10),
                        }))
                      }
                      className="h-11 w-11 rounded-xl bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/15 active:scale-[0.99]"
                      aria-label="Decrease guests"
                    >
                      −
                    </button>

                    <div className="flex-1 text-center">
                      <div className="text-3xl font-semibold tabular-nums">
                        {form.guests}
                      </div>
                      <div className="text-xs text-white/55">
                        {t.guestsHelp}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setForm((s) => ({
                          ...s,
                          guests: clamp(s.guests + 1, 0, 10),
                        }))
                      }
                      className="h-11 w-11 rounded-xl bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/15 active:scale-[0.99]"
                      aria-label="Increase guests"
                    >
                      +
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200 ring-1 ring-red-500/20">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={`w-full rounded-2xl px-5 py-3 text-center text-sm font-medium shadow-md transition active:scale-[0.99] ${
                    canSubmit
                      ? "bg-white text-black hover:bg-white/90"
                      : "bg-white/20 text-white/60 cursor-not-allowed"
                  }`}
                >
                  {loading ? t.sending : t.submit}
                </button>

                <p className="text-center text-xs text-white/55">
                  {lang === "hr"
                    ? "Podatke možete naknadno izmijeniti putem linka iz e-maila."
                    : "You can edit your details later via the email link."}
                </p>
              </form>
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
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs text-white/70">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="w-full rounded-2xl bg-black/30 px-4 py-3 text-sm text-white ring-1 ring-white/10 placeholder:text-white/35 outline-none focus:ring-white/25"
        placeholder=""
      />
    </label>
  );
}
