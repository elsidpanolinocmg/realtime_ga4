import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import WakeLockProvider from "../components/WakeLockProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Charlton Media Dashboard",
  description: "Dashboard for monitoring media analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <WakeLockProvider>
          {children}
        </WakeLockProvider>
      </body>
    </html>
  );
}
