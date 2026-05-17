import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { ThemeProvider } from "@/components/theme-provider";
import { GuestProvider } from "@/components/guest-provider";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { InstallPromptCapture } from "@/components/pwa/install-prompt-capture";
import { clerkProviderAppearance } from "@/lib/clerk-appearance";
import { PostHogUserIdentifier } from "@/components/PostHogUserIdentifier";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://75.createplus.club"),
  title: {
    default: "earned",
    template: "%s | earned",
  },
  description: "Show up. Every day. Build the streak.",
  authors: [{ name: "Create+ Club" }],
  creator: "Create+ Club",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://75.createplus.club",
    siteName: "earned",
    title: "earned",
    description: "Show up. Every day. Build the streak.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "earned",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "earned",
    description: "Show up. Every day. Build the streak.",
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
    title: "earned",
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
                  name: "earned",
                  description: "Show up. Every day. Build the streak.",
                  url: "https://75.createplus.club",
                  applicationCategory: "LifestyleApplication",
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
                  logo: "https://75.createplus.club/logo.svg",
                },
              ],
            }),
          }}
        />
        <ServiceWorkerRegistration />
        <InstallPromptCapture />
        <ClerkProvider appearance={clerkProviderAppearance}>
          <ThemeProvider>
            <ConvexClientProvider>
              <PostHogUserIdentifier />
              <GuestProvider>{children}</GuestProvider>
            </ConvexClientProvider>
            <Toaster />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
