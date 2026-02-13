import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { ThemeProvider } from "@/components/theme-provider";
import { GuestProvider } from "@/components/guest-provider";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { clerkProviderAppearance } from "@/lib/clerk-appearance";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://75.createplus.club"),
  title: {
    default: "75 Proof - 75 HARD Challenge Tracker",
    template: "%s | 75 Proof",
  },
  description:
    "Transform your life with 75 Proof. Track workouts, water intake, reading, and progress photos. Build mental toughness with the ultimate 75 HARD companion.",
  keywords: [
    "75 HARD",
    "challenge tracker",
    "fitness tracker",
    "habit tracker",
    "mental toughness",
    "workout tracker",
  ],
  authors: [{ name: "Create+ Club" }],
  creator: "Create+ Club",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://75.createplus.club",
    siteName: "75 Proof",
    title: "75 Proof - 75 HARD Challenge Tracker",
    description:
      "Track workouts, water, reading, and progress photos. Build mental toughness with the ultimate 75 HARD companion.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "75 Proof - Do Hard Stuff. Feel Amazing.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "75 Proof - 75 HARD Challenge Tracker",
    description: "Do Hard Stuff. Feel Amazing. Track your 75 HARD challenge.",
    images: ["/opengraph-image"],
    creator: "@createplusclub",
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "75 Proof",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#FF6154" />
        {/* Google Fonts for all themes */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Crimson+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=JetBrains+Mono:wght@300;400;500&family=Black+Ops+One&family=IBM+Plex+Mono:wght@300;400;500;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Karla:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "SoftwareApplication",
                  name: "75 Proof",
                  description:
                    "Track your 75 HARD challenge — workouts, water, reading, and progress photos. Build mental toughness with the ultimate companion app.",
                  url: "https://75.createplus.club",
                  applicationCategory: "HealthApplication",
                  operatingSystem: "Web",
                  offers: {
                    "@type": "Offer",
                    price: "0",
                    priceCurrency: "USD",
                  },
                },
                {
                  "@type": "Organization",
                  name: "Create+ Club",
                  url: "https://75.createplus.club",
                  logo: "https://75.createplus.club/opengraph-image",
                },
              ],
            }),
          }}
        />
        <ServiceWorkerRegistration />
        <ClerkProvider appearance={clerkProviderAppearance}>
          <ThemeProvider>
            <ConvexClientProvider>
              <GuestProvider>{children}</GuestProvider>
            </ConvexClientProvider>
            <Toaster />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
