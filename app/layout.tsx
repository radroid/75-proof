import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

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
                  logo: "https://75.createplus.club/logo.svg",
                },
                {
                  "@type": "FAQPage",
                  mainEntity: [
                    {
                      "@type": "Question",
                      name: "What is 75 HARD?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "75 HARD is a 75-day mental toughness program created by Andy Frisella. Every day you must complete six tasks: two 45-minute workouts (one outdoors), follow a diet with no alcohol or cheat meals, drink a gallon of water, read 10 pages of non-fiction, and take a progress photo. Miss any single task and you restart from Day 0.",
                      },
                    },
                    {
                      "@type": "Question",
                      name: "Is 75 Proof free?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "Yes — 100% free, forever. No premium tier, no ads, no in-app purchases. We built 75 Proof for the community, not for profit.",
                      },
                    },
                    {
                      "@type": "Question",
                      name: "How does 75 Proof track workouts?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "Tap the workout card on your dashboard, mark it as indoor or outdoor, log the duration and type, and you're done. 75 Proof checks that you've logged two 45-minute sessions (one outdoor) before marking the day complete.",
                      },
                    },
                    {
                      "@type": "Question",
                      name: "What happens if I miss a day?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "Per the official 75 HARD rules, missing any single task resets your challenge to Day 0. 75 Proof enforces this automatically — there's no way to skip or backfill. That's the whole point of the challenge.",
                      },
                    },
                    {
                      "@type": "Question",
                      name: "Is my data private?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "Yes. We don't run ads, we don't sell your data, and progress photos are private by default. Your information is yours — period.",
                      },
                    },
                    {
                      "@type": "Question",
                      name: "Can I install 75 Proof on my phone?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "Yes! 75 Proof is a Progressive Web App (PWA). On iOS, open it in Safari and tap \"Add to Home Screen.\" On Android, Chrome will prompt you to install it. You'll get an app icon and full-screen experience with no app store needed.",
                      },
                    },
                    {
                      "@type": "Question",
                      name: "What are the dashboard themes?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "75 Proof offers multiple visual themes for your dashboard including Minimalist, Brutalist, Vaporwave, and more. Switch anytime from the settings — your data stays the same, only the look changes.",
                      },
                    },
                    {
                      "@type": "Question",
                      name: "How is 75 Proof different from other 75 HARD apps?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "Most alternatives charge money, run ads, or collect your data. 75 Proof is free, ad-free, and privacy-first. It's also a web app that works on any device — no app store download required — with a guest mode so you can try the full dashboard before signing up.",
                      },
                    },
                  ],
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
