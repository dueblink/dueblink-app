import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import PwaSetup from "@/components/PwaSetup";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const SITE_URL = "https://www.dueblink.com";

const TITLE = "DueBlink – AI Payment Reminders for Freelancers & Small Businesses";
const DESCRIPTION =
  "Get paid on time. DueBlink writes polite payment reminders for email and WhatsApp and follows up automatically when clients go quiet, for freelancers, agencies and small businesses.";

export const metadata: Metadata = {
  // Lets every page use short paths like "/pricing" for its links and images.
  metadataBase: new URL(SITE_URL),

  title: TITLE,
  description: DESCRIPTION,

  keywords: [
    "payment reminder",
    "payment reminder message",
    "invoice payment reminder",
    "overdue payment reminder",
    "WhatsApp payment reminder",
    "payment reminder email",
    "how to ask client for payment",
    "freelancer payment reminders",
    "small business payment reminders",
    "late payment follow up",
    "DueBlink",
  ],

  openGraph: {
    title: TITLE,
    description:
      "Polite payment reminders for email and WhatsApp that follow up for you, step by step. Free to start.",
    url: SITE_URL,
    type: "website",
    siteName: "DueBlink",
    locale: "en_IN",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DueBlink – Stop chasing clients. Get paid faster.",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description:
      "Polite payment reminders for email and WhatsApp that follow up for you, step by step.",
    images: ["/og-image.png"],
  },

  // Install DueBlink like an app (PWA). The app settings live in app/manifest.ts.
  applicationName: "DueBlink",
  appleWebApp: {
    capable: true,
    title: "DueBlink",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

// Colour of the phone's top bar when DueBlink is opened as an app.
export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} scroll-smooth`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning={true}
    >
      {/*
        Razorpay's checkout.js is NOT loaded here any more. Loading it on
        every page opened a hidden payment iframe on the homepage. It is now
        loaded on demand by loadRazorpay() in src/lib/loadRazorpay.ts, right
        before the checkout opens.
      */}

      <body
        className="font-sans antialiased bg-white"
        suppressHydrationWarning={true}
      >
        {/* Main Content */}
        {children}
        <Analytics />
        <SpeedInsights />
        <PwaSetup />


        {/*
          REMOVED: The FloatingRobot instance was deleted from here.
          It is now only rendered inside specific pages (like DashboardPage.tsx),
          which prevents the double-render and overlapping click events.
        */}
      </body>
    </html>
  );
}
