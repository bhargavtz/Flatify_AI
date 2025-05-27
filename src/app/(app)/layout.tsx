
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
import { useClerk, useUser } from '@clerk/nextjs';

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
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container flex items-center justify-between h-16 max-w-screen-2xl">
          <div className="flex items-center gap-6">
            <AppLogo />
            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
              <Link href="/dashboard" className="transition-colors hover:text-primary">
                Dashboard
              </Link>
              <Link href="/generate" className="transition-colors hover:text-primary">
                Generate
              </Link>
              <Link href="/help" className="transition-colors hover:text-primary">
                Help
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-sm font-medium text-muted-foreground hidden sm:inline">
              User: <span className="text-primary font-semibold">{user?.fullName || user?.emailAddresses[0]?.emailAddress || 'Guest'}</span> | Mode: <span className="text-primary font-semibold capitalize">{userRole}</span>
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 sm:w-10 sm:h-10">
                  <User className="w-5 h-5" />
                  <span className="sr-only">User Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.fullName || user?.emailAddresses[0]?.emailAddress}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.emailAddresses[0]?.emailAddress}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/dashboard')} className="cursor-pointer">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleGoHomeAndClearRole} className="cursor-pointer">
                  <Home className="w-4 h-4 mr-2" />
                  <span>Change Role / Home</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/help')} className="cursor-pointer">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  <span>Help & Docs</span>
                </DropdownMenuItem>
                {/* <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  <span>Settings</span>
                </DropdownMenuItem> */}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                  <LogOut className="w-4 h-4 mr-2" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
