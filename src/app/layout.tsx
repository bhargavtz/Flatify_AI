
import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import { UserRoleProvider } from '@/contexts/UserRoleContext';
import { AuthProvider } from '@/contexts/AuthContext'; // Import AuthProvider
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`} suppressHydrationWarning={true}>
        <AuthProvider> {/* Wrap with AuthProvider */}
          <UserRoleProvider>
            {children}
            <Toaster />
          </UserRoleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
