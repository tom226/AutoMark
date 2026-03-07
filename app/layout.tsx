import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "SocialDukaan", template: "%s · SocialDukaan" },
  description: "Plan, schedule, and analyze your social content — all in one place.",
  icons: { icon: "/icon.svg" },
  manifest: "/manifest.webmanifest"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}
