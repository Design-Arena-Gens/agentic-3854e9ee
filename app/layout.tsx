import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Captioner & Emailer",
  description: "Upload a photo + text, get a smart caption and emailed thumbnail.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
