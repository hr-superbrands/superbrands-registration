"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Lang = "hr" | "en";

const copy = {
  hr: {
    openHint: "Klikni na kuvertu",
    flipHint: "Okreni pozivnicu",
    eventTitle: "Superbrands Gala 2026",
    backTitle: "Detalji događaja",
    details: [
      { k: "Datum", v: "04.03.2026." },
      { k: "Vrijeme", v: "19:00 – 23:00" },
      { k: "Lokacija", v: "Riverside Garden, Zagreb" },
      { k: "Dress code", v: "Gala / svečano" },
    ],
    register: "Registracija",
    close: "Zatvori",
    lang: "Jezik",
  },
  en: {
    openHint: "Click the envelope",
    flipHint: "Flip the invitation",
    eventTitle: "Superbrands Gala 2026",
    backTitle: "Event details",
    details: [
      { k: "Date", v: "04 Mar 2026" },
      { k: "Time", v: "19:00 – 23:00" },
      { k: "Venue", v: "Riverside Garden, Zagreb" },
      { k: "Dress code", v: "Gala / formal" },
    ],
    register: "Register",
    close: "Close",
    lang: "Language",
  },
} as const;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function HomePage() {
  const [lang, setLang] = useState<Lang>("hr");
  const t = copy[lang];

  const [opened, setOpened] = useState(false);
  const [slideAway, setSlideAway] = useState(false);
  const [busy, setBusy] = useState(false);

  const [cardFlipped, setCardFlipped] = useState(false);
  const title = useMemo(() => t.eventTitle, [t.eventTitle]);

  const SIZE_W = 600;
  const SIZE_H = 400;

  async function openSequence() {
    if (busy || opened) return;
    setBusy(true);

    setOpened(true);
    await wait(520); // delay between flap opening and slide away
    setSlideAway(true);

    setBusy(false);
  }

  function resetAll() {
    setOpened(false);
    setSlideAway(false);
    setCardFlipped(false);
    setBusy(false);
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
      <header className="relative z-[999] mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-8">
        <Image
          src="/logo-top.png"
          alt="Logo"
          width={170}
          height={48}
          className="h-9 w-auto md:h-10"
          priority
        />

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

      <section className="relative z-40 mx-auto flex min-h-[calc(100vh-72px)] max-w-6xl items-center justify-center px-4 pb-10 md:px-8">
        <div className="w-full max-w-[900px]">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="mb-5 text-center text-white/90"
          >
            <div className="text-sm md:text-base">
              {opened ? t.flipHint : t.openHint}
            </div>
          </motion.div>

          <div className="relative mx-auto h-[900px] w-full">
            {/* Arrow */}
            <AnimatePresence>
              {!opened && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="pointer-events-none absolute left-1/2 top-[120px] z-[900] -translate-x-1/2"
                >
                  <SwirlArrow />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute left-1/2 top-[190px] z-[500] -translate-x-1/2">
              <div
                className="relative"
                style={{
                  width: `min(92vw, ${SIZE_W}px)`,
                  aspectRatio: `${SIZE_W} / ${SIZE_H}`,
                }}
              >
                {/* Back */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                  <EnvelopeBackRect />
                </div>

                {/* E-card */}
                <div className="absolute inset-[16px] z-10 pointer-events-auto">
                  <Card3D
                    flipped={cardFlipped}
                    setFlipped={setCardFlipped}
                    title={title}
                    t={t}
                    showFlip={slideAway}
                  />
                </div>

                {/* Envelope shell */}
                <motion.div
                  className="absolute inset-0 z-30 pointer-events-none"
                  initial={false}
                  animate={{
                    y: slideAway ? 900 : 0,
                    opacity: slideAway ? 0 : 1,
                  }}
                  transition={{
                    y: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
                    opacity: { duration: 0.18, delay: slideAway ? 0.6 : 0 },
                  }}
                  style={{ willChange: "transform" }}
                >
                  <div className="absolute inset-0 z-10">
                    <EnvelopeSideTriangles />
                  </div>
                  <div className="absolute inset-0 z-20">
                    <EnvelopeBottomPocket />
                  </div>
                  <div className="absolute inset-0 z-30">
                    <EnvelopeTopFlap opened={opened} />
                  </div>
                </motion.div>

                {/* Click catcher */}
                {!opened && (
                  <button
                    type="button"
                    onClick={openSequence}
                    aria-label="Open envelope"
                    className="absolute inset-0 z-[950] cursor-pointer bg-transparent"
                  />
                )}

                {/* Close */}
                {(opened || slideAway) && (
                  <div className="absolute left-1/2 -bottom-14 z-[999] -translate-x-1/2">
                    <button
                      className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/85 ring-1 ring-white/15 backdrop-blur-md hover:bg-white/15"
                      onClick={resetAll}
                      type="button"
                    >
                      {t.close}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ---------------- Envelope parts (600x400) ---------------- */

function EnvelopeBackRect() {
  return (
    <svg viewBox="0 0 600 400" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="envBackRect" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#14141a" />
          <stop offset="60%" stopColor="#0b0b0f" />
          <stop offset="100%" stopColor="#070709" />
        </linearGradient>
      </defs>

      <rect
        x="14"
        y="14"
        width="572"
        height="372"
        rx="24"
        fill="url(#envBackRect)"
        stroke="#2f2f3a"
        strokeWidth="2"
      />
      <rect
        x="30"
        y="30"
        width="540"
        height="340"
        rx="20"
        fill="transparent"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function EnvelopeSideTriangles() {
  return (
    <svg viewBox="0 0 600 400" className="h-full w-full" aria-hidden>
      <path d="M0 0 L0 400 L600 400 Z" fill="#141418" />
      <path d="M600 0 L0 400 L600 400 Z" fill="#121216" />
      <path
        d="M0 0 L600 400"
        stroke="rgba(255,255,255,0.055)"
        strokeWidth="1.6"
      />
      <path
        d="M600 0 L0 400"
        stroke="rgba(255,255,255,0.055)"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function EnvelopeBottomPocket() {
  return (
    <svg viewBox="0 0 600 400" className="h-full w-full" aria-hidden>
      <path
        d="M0 400 L600 400 L300 200 Z"
        fill="#0d0d12"
        stroke="#2f2f3a"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M0 400 L300 200 L600 400"
        stroke="rgba(255,255,255,0.10)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EnvelopeTopFlap({ opened }: { opened: boolean }) {
  return (
    <div className="absolute inset-0" style={{ perspective: 1200 }}>
      <motion.div
        initial={false}
        animate={{ rotateX: opened ? -180 : 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 20 }}
        style={{
          transformStyle: "preserve-3d",
          transformOrigin: "50% 0%",
          willChange: "transform",
        }}
      >
        <svg viewBox="0 0 600 400" className="h-full w-full" aria-hidden>
          <path
            d="M0 0 L600 0 L300 200 Z"
            fill="#111117"
            stroke="#2f2f3a"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M0 0 H600"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </svg>
      </motion.div>
    </div>
  );
}

/* ---------------- Card ---------------- */

function Card3D({
  flipped,
  setFlipped,
  title,
  t,
  showFlip,
}: {
  flipped: boolean;
  setFlipped: (v: boolean) => void;
  title: string;
  t: any;
  showFlip: boolean;
}) {
  return (
    <div className="relative h-full w-full" style={{ perspective: 1200 }}>
      {/* ✅ Bulletproof clickable overlay when flipped */}
      {flipped && (
        <div className="pointer-events-none absolute inset-0 z-[99999]">
          <div className="absolute bottom-6 left-6 right-6 pointer-events-auto">
            <Link
              href="/register"
              className="block w-full rounded-2xl bg-black px-5 py-3 text-center text-base font-medium text-white shadow-md hover:bg-black/90 active:scale-[0.99]"
            >
              {t.register}
            </Link>
          </div>
        </div>
      )}

      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 22 }}
        className="relative h-full w-full rounded-3xl shadow-[0_45px_130px_-65px_rgba(0,0,0,0.80)]"
        style={{ transformStyle: "preserve-3d", willChange: "transform" }}
      >
        {/* FRONT */}
        <div
          className="absolute inset-0 overflow-hidden rounded-3xl ring-1 ring-white/15"
          style={{ backfaceVisibility: "hidden" }}
        >
          <Image
            src="/e-card.jpg"
            alt="E-card"
            fill
            priority
            sizes="(max-width: 768px) 92vw, 600px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/10" />

          <div className="absolute left-4 top-4">
            <Image
              src="/logo-card.png"
              alt="Card logo"
              width={120}
              height={40}
              className="h-8 w-auto md:h-9"
              priority
            />
          </div>

          <div className="absolute bottom-5 right-5 text-right">
            <div className="max-w-[320px] text-lg font-semibold leading-snug text-white drop-shadow">
              {title}
            </div>
          </div>

          {showFlip && (
            <button
              type="button"
              onClick={() => setFlipped(!flipped)}
              className="absolute right-3 top-1/2 z-[9999] -translate-y-1/2 rounded-full bg-white/95 p-3 shadow-lg ring-1 ring-black/10 active:scale-[0.98]"
              aria-label="Flip card"
            >
              <span className="block text-black">{flipped ? "↩" : "→"}</span>
            </button>
          )}
        </div>

        {/* BACK */}
        <div
          className="absolute inset-0 overflow-hidden rounded-3xl bg-white ring-1 ring-black/10"
          style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}
        >
          <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_1px_1px,black_1px,transparent_0)] [background-size:14px_14px]" />
          <div className="flex h-full flex-col p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-black/60">{t.backTitle}</div>
                <div className="mt-1 text-xl font-semibold text-black">
                  {title}
                </div>
              </div>
              <Image
                src="/logo-card.png"
                alt="Card logo"
                width={96}
                height={32}
                className="h-7 w-auto opacity-90"
              />
            </div>

            <div className="mt-5 space-y-3 text-sm text-black/75">
              {t.details.map((row: any) => (
                <div
                  key={row.k}
                  className="flex items-start justify-between gap-4"
                >
                  <div className="font-medium text-black/80">{row.k}</div>
                  <div className="text-right">{row.v}</div>
                </div>
              ))}
            </div>

            <p className="mt-auto text-center text-xs text-black/55 pt-6">
              {t.lang}: HR / EN
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ---------------- Arrow ---------------- */

function SwirlArrow() {
  return (
    <motion.div
      animate={{ y: [0, 6, 0] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      className="pointer-events-none"
    >
      <svg width="240" height="130" viewBox="0 0 240 130" fill="none">
        <path
          d="M18 28
             C 78 0, 150 12, 160 62
             C 170 108, 122 122, 96 104
             C 70 86, 78 60, 108 60
             C 152 60, 170 94, 164 118"
          stroke="white"
          strokeOpacity="0.92"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M164 118 L150 110 M164 118 L170 100"
          stroke="white"
          strokeOpacity="0.92"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </motion.div>
  );
}
