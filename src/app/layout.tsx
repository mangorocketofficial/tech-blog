import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import Script from "next/script";
import "./globals.css";

// Google Analytics Measurement ID
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Google Search Console Verification
const GOOGLE_SITE_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://golf-blog.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "테니스 뇌피셜 | 물리원리와 인체구조로 배우는 테니스",
    template: "%s | 테니스 뇌피셜",
  },
  description:
    "테니스를 물리원리와 인체구조로 설명합니다. 스윙 메커니즘, 스핀의 과학, 운동역학적 분석을 통해 테니스 실력 향상에 도움을 드립니다.",
  keywords: ["테니스", "테니스 스윙", "테니스 물리", "테니스 기술", "테니스 분석"],
  authors: [{ name: "테니스 뇌피셜" }],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: siteUrl,
    siteName: "테니스 뇌피셜",
    title: "테니스 뇌피셜 | 물리원리와 인체구조로 배우는 테니스",
    description:
      "테니스를 물리원리와 인체구조로 설명합니다.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: GOOGLE_SITE_VERIFICATION || undefined,
    other: {
      "naver-site-verification": "b51349914fb24612e3a5ed8d11501df5ffc47ae3",
    },
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      "ko-KR": siteUrl,
      "x-default": siteUrl,
    },
    types: {
      "application/rss+xml": `${siteUrl}/feed.xml`,
    },
  },
};

// JSON-LD WebSite Schema with SearchAction
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "테니스 뇌피셜",
  alternateName: "Tennis Brain Theory",
  url: siteUrl,
  description: "테니스를 물리원리와 인체구조로 설명합니다.",
  inLanguage: "ko-KR",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${siteUrl}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

// JSON-LD Organization Schema
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "테니스 뇌피셜",
  alternateName: "Tennis Brain Theory",
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
  description: "테니스를 물리원리와 인체구조로 설명하는 블로그",
  sameAs: [],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    availableLanguage: ["Korean"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* Google Analytics */}
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
        {/* JSON-LD WebSite Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        {/* JSON-LD Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className={`${notoSansKr.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
