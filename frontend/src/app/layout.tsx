import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Self-hosted (not next/font/google) — Turbopack's google-font fetch is unreliable in dev
// on some networks ("Module not found: @vercel/turbopack-next/.../font"). Local files sidestep it.
const plusJakartaSans = localFont({
  src: "./fonts/PlusJakartaSans-Variable.woff2",
  variable: "--font-geist-sans",
  weight: "200 800",
});

const jetBrainsMono = localFont({
  src: "./fonts/JetBrainsMono-Variable.woff2",
  variable: "--font-geist-mono",
  weight: "400 700",
});

// Scoped to the dark feature-showcase section only (Stitch design system) — not the app-wide sans.
const poppins = localFont({
  src: [
    { path: "./fonts/Poppins-600.woff2", weight: "600" },
    { path: "./fonts/Poppins-700.woff2", weight: "700" },
  ],
  variable: "--font-poppins",
});

const inter = localFont({
  src: "./fonts/Inter-Variable.woff2",
  variable: "--font-inter",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "NutriScan AI",
  description: "Scan foto makanan, dapat estimasi kalori & gizi otomatis.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} ${jetBrainsMono.variable} ${poppins.variable} ${inter.variable} h-full scroll-smooth antialiased`}
    >
      <head>
        {/* Material Symbols — used verbatim by the /studio dashboard port (Stitch mockup). Plain stylesheet link, loaded by the browser at runtime — not a next/font build-time fetch, so it doesn't hit the Turbopack font bug. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-dvh flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
