import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/common/WhatsAppButton";
import { LanguageProvider } from "@/context/LanguageContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Elisam Sigorta | Alanya'nın En Güvenilir Sigorta Acentesi",
  description: "Alanya sigorta işlemleriniz için Elisam Sigorta. Kasko, Trafik, Konut, Sağlık ve Seyahat sigortalarında en uygun fiyatlar ve güvenilir hizmet.",
  keywords: "alanya sigorta, alanya kasko, alanya trafik sigortası, en uygun sigorta alanya, elisam sigorta",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <LanguageProvider>
          <Header />
          <main style={{ paddingTop: '80px', display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 80px)' }}>
            {children}
          </main>
          <WhatsAppButton />
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
