import "./globals.css";

export const metadata = {
  title: "Superbrands Registration",
  description: "Superbrands Gala registration platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hr">
      <body className="bg-neutral-950 text-white antialiased">{children}</body>
    </html>
  );
}
