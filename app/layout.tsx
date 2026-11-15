import type { Metadata } from "next";
import { DM_Mono, DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-dm-mono", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["500", "600"], style: ["normal", "italic"], variable: "--font-playfair", display: "swap" });

export const metadata: Metadata = {
  title: "SpaceXplore Tchiowa | Inteligência Agrícola",
  description: "Uma plataforma de inteligência agrícola que conecta observação da Terra, dados ambientais, ciência e tecnologia para apoiar uma compreensão mais informada da agricultura.",
  applicationName: "SpaceXplore Tchiowa",
  keywords: ["inteligência agrícola", "observação da Terra", "NASA POWER", "dados ambientais", "agricultura", "JPM Tech Solutions"],
  openGraph: {
    title: "SpaceXplore Tchiowa | Inteligência Agrícola",
    description: "Compreender a Terra. Transformar a agricultura. Ciência, dados e tecnologia ao serviço da inteligência agrícola.",
    siteName: "SpaceXplore Tchiowa",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="pt"><body className={`${dmSans.variable} ${dmMono.variable} ${playfair.variable}`}>{children}</body></html>;
}
