import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpaceXplore Tchiowa | Agricultural Intelligence",
  description: "Explore climate data and adaptive crop rotation scenarios powered by NASA Earth data."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
