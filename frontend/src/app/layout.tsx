import type { Metadata } from "next";
import "./globals.css";
import LayoutShell from "@/components/Layout/LayoutShell";

export const metadata: Metadata = {
  title: "MontgomeryAI - Smart City Dashboard",
  description:
    "AI-Enhanced Civic Dashboard for the City of Montgomery, Alabama. Real-time data, interactive maps, and AI-powered insights.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="antialiased bg-mgm-bg">
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
