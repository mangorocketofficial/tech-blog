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
    default: "테크매니아 | 최신 테크 트렌드와 리뷰",
    template: "%s | 테크매니아",
  },
  description:
    "최신 테크 제품 리뷰와 트렌드를 분석합니다. AI 도구, 휴대폰, 노트북, 가전제품 등 다양한 테크 정보를 제공합니다.",
  keywords: ["테크", "리뷰", "AI", "휴대폰", "노트북", "가전제품", "테크 트렌드"],
  authors: [{ name: "테크매니아" }],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: siteUrl,
    siteName: "테크매니아",
    title: "테크매니아 | 최신 테크 트렌드와 리뷰",
    description:
      "최신 테크 제품 리뷰와 트렌드를 분석합니다.",
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
  name: "테크매니아",
  alternateName: "Tech Mania",
  url: siteUrl,
  description: "최신 테크 제품 리뷰와 트렌드를 분석합니다.",
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
  name: "테크매니아",
  alternateName: "Tech Mania",
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
  description: "최신 테크 제품 리뷰와 트렌드를 분석하는 블로그",
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
