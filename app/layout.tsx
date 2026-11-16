import type { Metadata } from "next";
import { DM_Mono, DM_Sans } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-dm-mono", display: "swap" });


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
  return <html lang="pt"><body className={`${dmSans.variable} ${dmMono.variable}`}><LocaleProvider>{children}</LocaleProvider></body></html>;
}
