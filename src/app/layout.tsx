
import type {Metadata} from 'next';
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import { UserRoleProvider } from '@/contexts/UserRoleContext';
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Flatify AI - Flat Design Logo Generator',
  description: 'Generate professional flat design logos effortlessly with AI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`} suppressHydrationWarning={true}>
          {/* Removed Clerk's UserButton from root layout to avoid duplication with AppLayout's custom user menu */}
          {/* Removed header for signed-out users as requested */}
          <UserRoleProvider>
            {children}
            <Toaster />
          </UserRoleProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
