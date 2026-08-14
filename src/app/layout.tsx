
import type {Metadata, Viewport} from 'next';
import {ClerkProvider} from '@clerk/nextjs';
import {Geist_Mono, Manrope, Syne} from 'next/font/google';
import './globals.css';
import { UserRoleProvider } from '@/contexts/UserRoleContext';
import { Toaster } from "@/components/ui/toaster";
import CookieBanner from "@/components/site/CookieBanner";

const syne = Syne({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
});

const manrope = Manrope({
  variable: '--font-body',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: "Flatify — Stills. Motion. Cut.",
  description: "Generate images, generate video, and merge them on one studio desk.",
  keywords: ["AI image generator", "AI video generator", "video editor", "image to video", "flatify studio"],
  authors: [{ name: 'Flatify AI Team' }],
  openGraph: {
    title: "Flatify — Image & video studio",
    description: "Generate stills and clips, then cut them together.",
    url: 'https://flatify-ai.vercel.app',
    siteName: 'Flatify AI',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Flatify — Image & video studio",
    description: "Generate stills and clips, then cut them together.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#12151C",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark" suppressHydrationWarning>
        <body className={`${syne.variable} ${manrope.variable} ${geistMono.variable} antialiased min-h-dvh min-w-0 flex flex-col`} suppressHydrationWarning={true}>
          {/* Removed Clerk's UserButton from root layout to avoid duplication with AppLayout's custom user menu */}
          {/* Removed header for signed-out users as requested */}
          <UserRoleProvider>
            {children}
            <Toaster />
            <CookieBanner />
          </UserRoleProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
