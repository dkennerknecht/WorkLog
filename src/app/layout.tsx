import type { Metadata } from "next";
import { Outfit, Source_Code_Pro } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"]
});

const sourceCode = Source_Code_Pro({
  variable: "--font-source-code",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "WorkLog",
  description: "Kiosk- und Admin-WebApp zur Erfassung von Tagesaufgaben"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={`${outfit.variable} ${sourceCode.variable}`}>
      <body className="bg-slate-50 font-sans text-slate-900">{children}</body>
    </html>
  );
}
