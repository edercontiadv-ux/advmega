import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

// Forçar novo build da Vercel para limpar o cache de borda do novo domínio

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Godoi, Santos & Conti Advogados",
  description: "Dashboard interno de gestão de publicações do DJEN com resumos por IA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex bg-[#0a0a0a] text-[#ededed]">
        <Sidebar />
        <main className="ml-[200px] flex-1 p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
