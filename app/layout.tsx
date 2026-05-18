import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const SITE_NAME = "The Bangkok Barber";
const SITE_DESCRIPTION =
  "Reserve a chair at The Bangkok Barber. Thirty-minute appointments in central Bangkok.";

export const metadata: Metadata = {
  // `template` lets per-route titles slot into a consistent suffix.
  // Pages export `title: "Reserve"` and the rendered tag becomes
  // "Reserve · The Bangkok Barber".
  title: {
    default: `${SITE_NAME} — Appointments`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Appointments`,
    description: SITE_DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: `${SITE_NAME} — Appointments`,
    description: SITE_DESCRIPTION,
  },
  // Stop iOS Safari from auto-linking 10-digit numbers as phone calls inside
  // booking lists — those are reference values, not click-to-dial targets.
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1a1a1a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
