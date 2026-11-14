import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpaceXplore Tchiowa | Agricultural Intelligence",
  description: "Explore NASA climate data, manage farm profiles and compare adaptive crop rotation scenarios."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
