import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "75 Proof - 75 HARD Challenge Tracker",
  description: "Transform your life with 75 Proof. Track workouts, water intake, reading, and progress photos. Build mental toughness with the ultimate 75 HARD companion.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
        <ClerkProvider
          appearance={{
            layout: {
              socialButtonsPlacement: "top",
              socialButtonsVariant: "blockButton",
            },
            variables: {
              borderRadius: "0px",
              colorPrimary: "#FF6154",
              colorBackground: "#FFFBF0",
              colorText: "#1a1a1a",
              colorInputBackground: "#FFFBF0",
              colorInputText: "#1a1a1a",
              fontFamily: "'DM Sans', sans-serif",
            },
            elements: {
              rootBox: "w-full max-w-[min(400px,calc(100vw-2rem))]",
              card: "shadow-none border border-[#1a1a1a]/10 rounded-none",
              socialButtonsBlockButton:
                "min-h-[44px] rounded-none border-[#1a1a1a]/15 font-bold text-[14px]",
              socialButtonsBlockButtonText: "font-bold",
              formButtonPrimary:
                "min-h-[44px] rounded-none bg-[#FF6154] hover:bg-[#e5534b] font-bold text-[14px]",
              formFieldInput:
                "min-h-[44px] rounded-none border-[#1a1a1a]/15 text-[16px]",
              headerTitle: "font-black text-[#1a1a1a]",
              headerSubtitle: "text-[#1a1a1a]/55",
              footerActionLink: "text-[#FF6154] hover:text-[#e5534b] font-bold",
              modalBackdrop: "backdrop-blur-sm",
            },
          }}
        >
          <ThemeProvider>
            <ConvexClientProvider>{children}</ConvexClientProvider>
            <Toaster />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
