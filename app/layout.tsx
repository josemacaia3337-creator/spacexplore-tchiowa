import type { Metadata } from "next";
import "./globals.css";

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
  return <html lang="pt"><body>{children}</body></html>;
}
