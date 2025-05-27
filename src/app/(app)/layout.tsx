"use client";
import { type ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserRole, type UserRole } from '@/contexts/UserRoleContext';
import { AppLogo } from '@/components/AppLogo';
import { Button } from '@/components/ui/button';
import { Home, LogOut, User, HelpCircle, Settings, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useClerk, useUser, UserButton } from '@clerk/nextjs';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { userRole, isLoading: isLoadingRole, setUserRole } = useUserRole();
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/login');
    } else if (isLoaded && isSignedIn && !isLoadingRole && !userRole) {
      router.push('/');
    }
  }, [isLoaded, isSignedIn, userRole, isLoadingRole, router]);

  if (!isLoaded || (isLoaded && isSignedIn && isLoadingRole)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (isSignedIn && !userRole && !isLoadingRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut();
    setUserRole(null);
    router.push('/');
  };

  const handleGoHomeAndClearRole = () => {
    setUserRole(null);
    router.push('/');
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 {/* test */}">
      <header className="sticky top-0 z-50 w-full border-b border-primary/10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm shadow-lg shadow-primary/5">
        <div className="container mx-auto">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center gap-8">
              <AppLogo />
              <nav className="hidden md:flex items-center space-x-6">
                <Link 
                  href="/" 
                  className="text-sm font-medium px-3 py-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-primary/10 hover:text-primary transition-all duration-200 ease-in-out"
                >
                  Home
                </Link>
                <Link 
                  href="/dashboard" 
                  className="text-sm font-medium px-3 py-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-primary/10 hover:text-primary transition-all duration-200 ease-in-out"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/help" 
                  className="text-sm font-medium px-3 py-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-primary/10 hover:text-primary transition-all duration-200 ease-in-out"
                >
                  Help
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-primary transition-colors duration-200 ease-in-out hover:scale-105"
                    >
                      Change Role
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm">
                    <DropdownMenuItem onClick={() => { setUserRole('novice'); router.push('/generate'); }} className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                      Small Business Owner
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setUserRole('professional'); router.push('/generate'); }} className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                      Freelance Designer
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setUserRole('imageEditor'); router.push('/generate'); }} className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                      Image-Based Generator
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              {isLoaded && isSignedIn && user && <UserButton />}
            </div>
          </div>
        </div>
      </header>
      <main className="flex-grow w-full">
        {children}
      </main>
      <footer className="py-6 mt-auto border-t bg-background">
        <div className="container flex flex-col items-center justify-center text-center text-muted-foreground sm:flex-row sm:justify-between">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Flatify AI. All Rights Reserved.
          </p>
          <p className="text-xs mt-2 sm:mt-0">
            Powered by Google AI & Genkit
          </p>
        </div>
      </footer>
    </div>
  );
}
