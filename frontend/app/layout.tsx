import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SkipLink from "@/components/SkipLink";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Anexlk - Find Your Perfect Boarding",
  description: "The #1 platform for finding student boardings in Sri Lanka.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} font-sans bg-brand-bg text-brand-text antialiased`}>
        <SkipLink />
        <div id="content">{children}</div>
      </body>
    </html>
  );
}
