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
  metadataBase: new URL('https://elisamsigorta07.com'),
  title: {
    default: "Elisam Sigorta | Alanya Sigorta Acentesi - Kasko, Trafik, DASK, Sağlık",
    template: "%s | Elisam Sigorta Alanya"
  },
  description: "Alanya'nın lider sigorta acentesi Elisam Sigorta. Kasko, Zorunlu Trafik Sigortası, DASK, Konut, İşyeri ve Tamamlayıcı Sağlık Sigortasında 20+ şirketten anında en uygun fiyat karşılaştırması ve 7/24 hasar danışmanlığı.",
  keywords: [
    "alanya sigorta",
    "alanya sigorta acentesi",
    "alanya kasko",
    "alanya trafik sigortası",
    "alanya dask",
    "alanya konut sigortası",
    "alanya sağlık sigortası",
    "en uygun sigorta alanya",
    "alanya sigortacı",
    "elisam sigorta",
    "elisam rent a car",
    "alanya araç kiralama"
  ],
  authors: [{ name: "Elisam Sigorta Aracılık Hizmetleri", url: "https://elisamsigorta07.com" }],
  creator: "Elisam Sigorta",
  publisher: "Elisam Sigorta",
  alternates: {
    canonical: 'https://elisamsigorta07.com',
  },
  openGraph: {
    title: "Elisam Sigorta | Alanya'nın En Güvenilir Sigorta Acentesi",
    description: "Alanya'da Kasko, Trafik, DASK ve Sağlık sigortalarında en iyi fiyat garantisi ve 7/24 uzman danışmanlık.",
    url: 'https://elisamsigorta07.com',
    siteName: 'Elisam Sigorta Alanya',
    locale: 'tr_TR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Elisam Sigorta | Alanya Sigorta Acentesi",
    description: "Alanya'da Kasko, Trafik Sigortası, DASK ve Sağlık Sigortasında en uygun teklifler Elisam Sigorta'da.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "InsuranceAgency",
  "name": "Elisam Sigorta Aracılık Hizmetleri",
  "alternateName": "Elisam Sigorta Alanya",
  "description": "Alanya ve Antalya bölgesinde Kasko, Trafik, DASK, Konut, İşyeri ve Sağlık Sigortası hizmetleri sunan yetkili sigorta acentesi.",
  "url": "https://elisamsigorta07.com",
  "logo": "https://elisamsigorta07.com/logo.png",
  "telephone": "+905514387771",
  "email": "info@elisamsigorta07.com",
  "priceRange": "₺₺",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Saray Mah. Galatasaray Cad.",
    "addressLocality": "Alanya",
    "addressRegion": "Antalya",
    "postalCode": "07400",
    "addressCountry": "TR"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 36.54375,
    "longitude": 31.99982
  },
  "areaServed": [
    { "@type": "City", "name": "Alanya" },
    { "@type": "AdministrativeArea", "name": "Antalya" },
    { "@type": "Country", "name": "Türkiye" }
  ],
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      "opens": "08:30",
      "closes": "19:00"
    }
  ],
  "sameAs": [
    "https://instagram.com/elisamsigorta07",
    "https://facebook.com/elisamsigorta07"
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
