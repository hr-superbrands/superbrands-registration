"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

type Lang = "hr" | "en";

const copy = {
  hr: {
    title: "Registracija",
    subtitle:
      "Molimo unesite svoje podatke. Nakon registracije ćete dobiti e-mail s linkom za uređivanje.",
    fullName: "Ime i prezime",
    email: "E-mail",
    phone: "Telefon (opcionalno)",
    company: "Tvrtka (opcionalno)",
    plusOneLabel: "Dolazim s +1 osobom",
    plusOneFirst: "Ime (+1)",
    plusOneLast: "Prezime (+1)",
    submit: "Potvrdi registraciju",
    backHome: "Natrag",
    successTitle: "Registracija zaprimljena",
    successBody:
      "Hvala! Poslali smo vam e-mail s potvrdom i linkom za uređivanje podataka.",
    goHome: "Povratak na pozivnicu",
    lang: "Jezik",
    required: "Obavezno polje.",
    invalidEmail: "Neispravan e-mail.",
    plusOneRequired: "Unesite ime i prezime za +1.",
  },
  en: {
    title: "Registration",
    subtitle:
      "Please enter your details. After registration you’ll receive an email with an edit link.",
    fullName: "Full name",
    email: "Email",
    phone: "Phone (optional)",
    company: "Company (optional)",
    plusOneLabel: "I’m bringing a +1",
    plusOneFirst: "First name (+1)",
    plusOneLast: "Last name (+1)",
    submit: "Confirm registration",
    backHome: "Back",
    successTitle: "Registration received",
    successBody:
      "Thank you! We’ve sent you a confirmation email with an edit link.",
    goHome: "Back to invitation",
    lang: "Language",
    required: "This field is required.",
    invalidEmail: "Invalid email address.",
    plusOneRequired: "Please enter first and last name for your +1.",
  },
} as const;

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export default function RegisterPage() {
  const [lang, setLang] = useState<Lang>("hr");
  const t = copy[lang];

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");

  const [plusOne, setPlusOne] = useState(false);
  const [plusOneFirst, setPlusOneFirst] = useState("");
  const [plusOneLast, setPlusOneLast] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const plusOneFullName = useMemo(() => {
    if (!plusOne) return null;
    const fn = plusOneFirst.trim();
    const ln = plusOneLast.trim();
    const combined = `${fn} ${ln}`.trim();
    return combined.length ? combined : null;
  }, [plusOne, plusOneFirst, plusOneLast]);

  function validate() {
    const e: Record<string, string> = {};

    if (fullName.trim().length < 2) e.fullName = t.required;
    if (!isValidEmail(email)) e.email = t.invalidEmail;

    if (plusOne) {
      if (!plusOneFirst.trim() || !plusOneLast.trim()) {
        e.plusOne = t.plusOneRequired;
      }
    }

    setFieldErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || "",
          company: company.trim() || "",
          plus_one: plusOne,
          plus_one_full_name: plusOne ? plusOneFullName : null,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setError(json?.message || "Unexpected error.");
        setSubmitting(false);
        return;
      }

      setDone(true);
      setSubmitting(false);
    } catch (err: any) {
      setError("Network error.");
      setSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* Backdrop (same as landing) */}
      <div className="absolute inset-0">
        <Image
          src="/backdrop.jpg"
          alt="Backdrop"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/35" />
      </div>

      {/* Top bar (same vibe) */}
      <header className="relative z-[20] mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-8">
        <Link href="/" className="inline-flex items-center">
          <Image
            src="/logo-top.png"
            alt="Logo"
            width={170}
            height={48}
            className="h-9 w-auto md:h-10"
            priority
          />
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

      {/* Content */}
      <section className="relative z-[10] mx-auto flex w-full max-w-6xl items-center justify-center px-4 pb-16 pt-6 md:px-8">
        <div className="w-full max-w-3xl">
          <div className="rounded-3xl bg-white/10 p-5 backdrop-blur-md ring-1 ring-white/15 shadow-[0_35px_110px_-65px_rgba(0,0,0,0.75)] sm:p-7">
            {!done ? (
              <>
                <div className="mb-6">
                  <h1 className="text-2xl font-semibold text-white">
                    {t.title}
                  </h1>
                  <p className="mt-2 text-sm text-white/80">{t.subtitle}</p>
                </div>

                {error && (
                  <div className="mb-5 rounded-2xl bg-red-500/15 px-4 py-3 text-sm text-white ring-1 ring-red-300/30">
                    {error}
                  </div>
                )}

                <form onSubmit={onSubmit} className="space-y-4">
                  {/* Full name */}
                  <div>
                    <label className="mb-1 block text-sm text-white/85">
                      {t.fullName}
                    </label>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-2xl bg-white/10 px-4 py-3 text-white placeholder:text-white/45 ring-1 ring-white/15 outline-none focus:ring-2 focus:ring-white/30"
                      placeholder={t.fullName}
                    />
                    {fieldErrors.fullName && (
                      <p className="mt-1 text-xs text-red-200">
                        {fieldErrors.fullName}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="mb-1 block text-sm text-white/85">
                      {t.email}
                    </label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-2xl bg-white/10 px-4 py-3 text-white placeholder:text-white/45 ring-1 ring-white/15 outline-none focus:ring-2 focus:ring-white/30"
                      placeholder="email@example.com"
                      inputMode="email"
                    />
                    {fieldErrors.email && (
                      <p className="mt-1 text-xs text-red-200">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone + company */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm text-white/85">
                        {t.phone}
                      </label>
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-2xl bg-white/10 px-4 py-3 text-white placeholder:text-white/45 ring-1 ring-white/15 outline-none focus:ring-2 focus:ring-white/30"
                        placeholder={t.phone}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm text-white/85">
                        {t.company}
                      </label>
                      <input
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full rounded-2xl bg-white/10 px-4 py-3 text-white placeholder:text-white/45 ring-1 ring-white/15 outline-none focus:ring-2 focus:ring-white/30"
                        placeholder={t.company}
                      />
                    </div>
                  </div>

                  {/* +1 checkbox */}
                  <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                    <label className="flex cursor-pointer items-center gap-3 text-sm text-white/90">
                      <input
                        type="checkbox"
                        checked={plusOne}
                        onChange={(e) => {
                          const v = e.target.checked;
                          setPlusOne(v);
                          if (!v) {
                            setPlusOneFirst("");
                            setPlusOneLast("");
                            setFieldErrors((prev) => {
                              const { plusOne: _omit, ...rest } = prev;
                              return rest;
                            });
                          }
                        }}
                        className="h-4 w-4 rounded border-white/40 bg-transparent"
                      />
                      {t.plusOneLabel}
                    </label>

                    {plusOne && (
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-sm text-white/85">
                            {t.plusOneFirst}
                          </label>
                          <input
                            value={plusOneFirst}
                            onChange={(e) => setPlusOneFirst(e.target.value)}
                            className="w-full rounded-2xl bg-white/10 px-4 py-3 text-white placeholder:text-white/45 ring-1 ring-white/15 outline-none focus:ring-2 focus:ring-white/30"
                            placeholder={t.plusOneFirst}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm text-white/85">
                            {t.plusOneLast}
                          </label>
                          <input
                            value={plusOneLast}
                            onChange={(e) => setPlusOneLast(e.target.value)}
                            className="w-full rounded-2xl bg-white/10 px-4 py-3 text-white placeholder:text-white/45 ring-1 ring-white/15 outline-none focus:ring-2 focus:ring-white/30"
                            placeholder={t.plusOneLast}
                          />
                        </div>

                        {fieldErrors.plusOne && (
                          <p className="sm:col-span-2 -mt-2 text-xs text-red-200">
                            {fieldErrors.plusOne}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                    <Link
                      href="/"
                      className="text-sm text-white/80 hover:text-white"
                    >
                      ← {t.backHome}
                    </Link>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-2xl bg-black px-6 py-3 text-base font-medium text-white shadow-md hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? "..." : t.submit}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="py-6 text-center">
                <h2 className="text-2xl font-semibold text-white">
                  {t.successTitle}
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm text-white/80">
                  {t.successBody}
                </p>

                <div className="mt-6 flex justify-center">
                  <Link
                    href="/"
                    className="rounded-2xl bg-white/10 px-6 py-3 text-sm text-white ring-1 ring-white/15 backdrop-blur-md hover:bg-white/15"
                  >
                    {t.goHome}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
