import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { LazorkitProviderWrapper } from "@/components/LazorkitProviderWrapper";
import { ToastProvider } from "@/components/ToastProvider";
import "./globals.css";

/**
 * Inter font configuration for the application.
 * Using variable font for optimal performance.
 */
const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

/**
 * SEO Metadata for the application.
 * Provides comprehensive information for search engines and social sharing.
 */
export const metadata: Metadata = {
  title: {
    default: "Lazorkit Passkey Wallet | Solana Wallet with Passkey Authentication",
    template: "%s | Lazorkit Wallet",
  },
  description: "A production-ready Solana wallet with passkey-based authentication and gasless transactions. No seed phrases, no gas fees, just simple and secure crypto.",
  keywords: [
    "Solana",
    "wallet",
    "passkey",
    "WebAuthn",
    "gasless",
    "USDC",
    "cryptocurrency",
    "blockchain",
    "Lazorkit",
    "smart wallet",
  ],
  authors: [{ name: "Lazorkit" }],
  creator: "Lazorkit",
  publisher: "Lazorkit",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Lazorkit Passkey Wallet",
    title: "Lazorkit Passkey Wallet | Solana Wallet with Passkey Authentication",
    description: "A production-ready Solana wallet with passkey-based authentication and gasless transactions. No seed phrases, no gas fees.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lazorkit Passkey Wallet",
    description: "Solana wallet with passkey authentication and gasless transactions.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

/**
 * Viewport configuration for responsive design.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0f0f23",
};

/**
 * Root Layout Component
 * 
 * Provides the base HTML structure, global styles, fonts,
 * LazorKit SDK provider, and toast notification provider for the entire application.
 * 
 * The LazorKitProvider wraps the application to enable real WebAuthn passkey
 * authentication with native biometric prompts (Touch ID, Face ID, Windows Hello).
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 7.1
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <LazorkitProviderWrapper>
          <ToastProvider>
            {children}
          </ToastProvider>
        </LazorkitProviderWrapper>
      </body>
    </html>
  );
}
