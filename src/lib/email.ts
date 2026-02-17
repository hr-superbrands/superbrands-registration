import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export function appUrl(path: string) {
  const base = process.env.PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function registrationEmailHtml(opts: {
  lang: "hr" | "en";
  full_name: string;
  editUrl: string;
}) {
  const { lang, full_name, editUrl } = opts;

  const subject =
    lang === "hr"
      ? "Potvrda registracije — Superbrands Gala 2026"
      : "Registration confirmation — Superbrands Gala 2026";

  const intro =
    lang === "hr"
      ? `Pozdrav ${escapeHtml(
          full_name
        )},<br/><br/>Hvala na registraciji za Superbrands Gala 2026.`
      : `Hi ${escapeHtml(
          full_name
        )},<br/><br/>Thanks for registering for Superbrands Gala 2026.`;

  const editText =
    lang === "hr"
      ? "Ako trebate izmijeniti podatke, koristite ovaj link:"
      : "If you need to edit your details, use this link:";

  const button = lang === "hr" ? "Uredi podatke" : "Edit details";

  const footer =
    lang === "hr"
      ? "Ako niste Vi napravili ovu registraciju, možete ignorirati ovu poruku."
      : "If you didn’t make this registration, you can ignore this email.";

  const html = `
  <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height:1.45; color:#111;">
    <div style="max-width:560px;margin:0 auto;padding:24px;">
      <h2 style="margin:0 0 12px;">Superbrands Gala 2026</h2>
      <p style="margin:0 0 14px;">${intro}</p>

      <p style="margin:0 0 10px;">${editText}</p>

      <p style="margin:16px 0;">
        <a href="${editUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 16px;border-radius:12px;">
          ${button}
        </a>
      </p>

      <p style="margin:12px 0 0;font-size:12px;color:#555;word-break:break-all;">
        ${lang === "hr" ? "Direktan link:" : "Direct link:"}<br/>
        <a href="${editUrl}" style="color:#111;">${editUrl}</a>
      </p>

      <hr style="margin:24px 0;border:none;border-top:1px solid #e5e5e5;" />
      <p style="margin:0;font-size:12px;color:#666;">${footer}</p>
    </div>
  </div>
  `;

  return { subject, html };
}

function escapeHtml(str: string) {
  return str.replace(/[&<>"']/g, (m) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return map[m] || m;
  });
}
