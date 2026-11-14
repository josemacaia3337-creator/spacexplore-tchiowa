import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
 title: "SpaceXplore Tchiowa | Inteligência Agrícola",
 description: "Explore dados ambientais, organize propriedades agrícolas e apoie decisões com informação científica.",
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt"><body>{children}</body></html>}
