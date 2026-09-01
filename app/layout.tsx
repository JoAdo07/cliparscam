import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CliparsCAM — Random Video Chat",
  description: "Talk to strangers. CliparsCAM is an Omegle-style random video chat platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0f] text-zinc-100 antialiased">{children}</body>
    </html>
  );
}
