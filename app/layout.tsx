import type { Metadata } from "next";import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "DueBlink - Stop Chasing Clients. Get Paid Faster.",
  description:
    "Track unpaid clients, generate professional reminders, and recover overdue payments using AI and payment psychology.",
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
      <head>
        {/* Razorpay Checkout Script */}
        <script
          src="https://checkout.razorpay.com/v1/checkout.js"
          async
        />
      </head>

      <body
        className="font-sans antialiased bg-white"
        suppressHydrationWarning={true}
      >
        {/* Main Content */}
        {children}

        {/*
          REMOVED: The FloatingRobot instance was deleted from here.
          It is now only rendered inside specific pages (like DashboardPage.tsx),
          which prevents the double-render and overlapping click events.
        */}
      </body>
    </html>
  );
}