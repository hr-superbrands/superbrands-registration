"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";

type Lang = "hr" | "en";

const copy = {
  hr: {
    title: "Uredi podatke",
    subtitle:
      "Možete izmijeniti podatke o registraciji. E-mail adresa se ne može mijenjati.",
    fullName: "Ime i prezime",
    email: "E-mail (nije moguće mijenjati)",
    phone: "Telefon (opcionalno)",
    company: "Tvrtka (opcionalno)",
    plusOneLabel: "Dolazim s +1 osobom",
    plusOneFirst: "Ime (+1)",
    plusOneLast: "Prezime (+1)",
    save: "Spremi promjene",
    resend: "Pošalji ponovno link",
    backHome: "Natrag",
    lang: "Jezik",
    plusOneRequired: "Unesite ime i prezime za +1.",
    lockedTitle: "Uređivanje je zaključano 24h prije događaja.",
  },
  en: {
    title: "Edit details",
    subtitle: "You can edit your registration. Email cannot be changed.",
    fullName: "Full name",
    email: "Email (read-only)",
    phone: "Phone (optional)",
    company: "Company (optional)",
    plusOneLabel: "I’m bringing a +1",
    plusOneFirst: "First name (+1)",
    plusOneLast: "Last name (+1)",
    save: "Save changes",
    resend: "Resend edit link",
    backHome: "Back",
    lang: "Language",
    plusOneRequired: "Please enter first and last name for your +1.",
    lockedTitle: "Editing is locked 24 hours before the event.",
  },
} as const;

type Registration = {
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  guests: number | null; // legacy 0/1
  metadata?: any | null;
};

export default function EditPage() {
  const [lang, setLang] = useState<Lang>("hr");
  const t = copy[lang];

  const [token, setToken] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState(false);

  const [locked, setLocked] = useState(false);
  const [lockReason, setLockReason] = useState<string | null>(null);

  const [data, setData] = useState<Registration | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(""); // read-only
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");

  const [plusOne, setPlusOne] = useState(false);
  const [plusOneFirst, setPlusOneFirst] = useState("");
  const [plusOneLast, setPlusOneLast] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [resentOk, setResentOk] = useState(false);

  const plusOneFullName = useMemo(() => {
    if (!plusOne) return null;
    const fn = plusOneFirst.trim();
    const ln = plusOneLast.trim();
    const combined = `${fn} ${ln}`.trim();
    return combined.length ? combined : null;
  }, [plusOne, plusOneFirst, plusOneLast]);

  const canSave = useMemo(() => {
    if (locked) return false;
    if (saving) return false;
    if (!token) return false;
    if (fullName.trim().length < 2) return false;
    if (plusOne && (!plusOneFirst.trim() || !plusOneLast.trim())) return false;
    return true;
  }, [locked, saving, token, fullName, plusOne, plusOneFirst, plusOneLast]);

  async function load(tkn: string) {
    setLoading(true);
    setError(null);
    setOk(false);
    setResentOk(false);

    try {
      const res = await fetch(
        `/api/registration?token=${encodeURIComponent(tkn)}`
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

      // ✅ učitaj +1 iz metadata (razni key-evi zbog historije)
      const meta = r.metadata ?? {};
      const metaPlusOne =
        Boolean(meta.plus_one) || Boolean(meta.bringing_plus_one);

      const legacyGuests = typeof r.guests === "number" ? r.guests : 0;
      const plusOneOn = metaPlusOne || legacyGuests >= 1;

      setPlusOne(plusOneOn);

      const metaName = (meta.plus_one_full_name ?? "").toString().trim();
      if (metaName) {
        const parts = metaName.split(" ").filter(Boolean);
        setPlusOneFirst(parts[0] ?? "");
        setPlusOneLast(parts.slice(1).join(" ") ?? "");
      } else {
        setPlusOneFirst("");
        setPlusOneLast("");
      }
    } catch {
      setError("Greška pri učitavanju. Pokušajte ponovno.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const tkn = sp.get("token") || "";
    setToken(tkn);

    if (!tkn) {
      setLoading(false);
      setError("Nedostaje token. Otvorite link iz e-maila.");
      return;
    }

    load(tkn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);
    setResentOk(false);

    if (!canSave) {
      setError(
        locked
          ? t.lockedTitle
          : plusOne && (!plusOneFirst.trim() || !plusOneLast.trim())
          ? t.plusOneRequired
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
          full_name: fullName.trim(),
          phone: phone.trim() || "",
          company: company.trim() || "",
          plus_one: plusOne,
          plus_one_full_name: plusOne ? plusOneFullName : null,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok && json?.ok) {
        setOk(true);

        // token rotation
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
        setError(json?.message || t.lockedTitle);
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
        setError(json?.message || t.lockedTitle);
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
    <main className="relative min-h-screen w-full overflow-hidden">
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
        <div className="absolute inset-0 bg-black/35" />
      </div>

      {/* Top bar */}
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

        <div className="flex items-center gap-2">
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

          <Link
            href="/"
            className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/85 ring-1 ring-white/15 backdrop-blur-md hover:bg-white/15"
          >
            ← {t.backHome}
          </Link>
        </div>
      </header>

      {/* Content */}
      <section className="relative z-[10] mx-auto flex w-full max-w-6xl items-center justify-center px-4 pb-16 pt-6 md:px-8">
        <div className="w-full max-w-3xl">
          <div className="rounded-3xl bg-white/10 p-5 backdrop-blur-md ring-1 ring-white/15 shadow-[0_35px_110px_-65px_rgba(0,0,0,0.75)] sm:p-7">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-white">{t.title}</h1>
              <p className="mt-2 text-sm text-white/80">{t.subtitle}</p>
            </div>

            {loading ? (
              <div className="text-sm text-white/70">Učitavanje…</div>
            ) : error ? (
              <div className="mb-5 rounded-2xl bg-red-500/15 px-4 py-3 text-sm text-white ring-1 ring-red-300/30">
                {error}
              </div>
            ) : !data ? (
              <div className="text-sm text-white/70">Nema podataka.</div>
            ) : (
              <>
                {locked && (
                  <div className="mb-5 rounded-2xl bg-amber-500/15 px-4 py-3 text-sm text-amber-100 ring-1 ring-amber-300/30">
                    <div>{t.lockedTitle}</div>
                    {lockReason ? (
                      <div className="mt-1 text-xs text-amber-100/70">
                        {lockReason}
                      </div>
                    ) : null}
                  </div>
                )}

                {ok && (
                  <div className="mb-5 rounded-2xl bg-emerald-500/15 px-4 py-3 text-sm text-emerald-50 ring-1 ring-emerald-300/30">
                    Podaci su uspješno ažurirani.
                  </div>
                )}

                {resentOk && (
                  <div className="mb-5 rounded-2xl bg-sky-500/15 px-4 py-3 text-sm text-sky-50 ring-1 ring-sky-300/30">
                    Link za uređivanje je ponovno poslan na e-mail.
                  </div>
                )}

                <form onSubmit={onSave} className="space-y-4">
                  {/* Full name */}
                  <div>
                    <label className="mb-1 block text-sm text-white/85">
                      {t.fullName}
                    </label>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={locked}
                      className="w-full rounded-2xl bg-white/10 px-4 py-3 text-white placeholder:text-white/45 ring-1 ring-white/15 outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-60"
                      placeholder={t.fullName}
                    />
                  </div>

                  {/* Email (read-only) */}
                  <div>
                    <label className="mb-1 block text-sm text-white/85">
                      {t.email}
                    </label>
                    <input
                      value={email}
                      readOnly
                      className="w-full cursor-not-allowed rounded-2xl bg-white/5 px-4 py-3 text-white/70 ring-1 ring-white/10 outline-none"
                    />
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
                        disabled={locked}
                        className="w-full rounded-2xl bg-white/10 px-4 py-3 text-white placeholder:text-white/45 ring-1 ring-white/15 outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-60"
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
                        disabled={locked}
                        className="w-full rounded-2xl bg-white/10 px-4 py-3 text-white placeholder:text-white/45 ring-1 ring-white/15 outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-60"
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
                        disabled={locked}
                        onChange={(e) => {
                          const v = e.target.checked;
                          setPlusOne(v);
                          if (!v) {
                            setPlusOneFirst("");
                            setPlusOneLast("");
                          }
                        }}
                        className="h-4 w-4 rounded border-white/40 bg-transparent disabled:opacity-60"
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
                            disabled={locked}
                            className="w-full rounded-2xl bg-white/10 px-4 py-3 text-white placeholder:text-white/45 ring-1 ring-white/15 outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-60"
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
                            disabled={locked}
                            className="w-full rounded-2xl bg-white/10 px-4 py-3 text-white placeholder:text-white/45 ring-1 ring-white/15 outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-60"
                            placeholder={t.plusOneLast}
                          />
                        </div>

                        {plusOne &&
                          (!plusOneFirst.trim() || !plusOneLast.trim()) &&
                          !locked && (
                            <p className="sm:col-span-2 -mt-2 text-xs text-red-200">
                              {t.plusOneRequired}
                            </p>
                          )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={onResend}
                      disabled={resending || !token || locked}
                      className="rounded-2xl bg-white/10 px-6 py-3 text-sm font-medium text-white ring-1 ring-white/15 backdrop-blur-md hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {resending ? "..." : t.resend}
                    </button>

                    <button
                      type="submit"
                      disabled={!canSave}
                      className="rounded-2xl bg-black px-6 py-3 text-base font-medium text-white shadow-md hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? "..." : t.save}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
