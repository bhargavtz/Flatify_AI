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
import MobileDock from '@/components/site/MobileDock';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { userRole, isLoading: isLoadingRole, setUserRole } = useUserRole();
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/login');
    } else if (isLoaded && isSignedIn && !isLoadingRole && !userRole) {
      setUserRole('novice');
    }
  }, [isLoaded, isSignedIn, userRole, isLoadingRole, setUserRole, router]);

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
    <div className="flex min-h-dvh min-w-0 flex-col overflow-x-hidden bg-ink text-chalk selection:bg-cobalt selection:text-chalk">
      <header
        className="sticky top-0 z-50 w-full border-b border-chalk/10 bg-ink/85 backdrop-blur-md"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="container mx-auto min-w-0">
          <div className="flex h-16 min-w-0 items-center justify-between gap-2 px-4">
            <div className="flex min-w-0 items-center gap-8">
              <AppLogo className="min-w-0" size="sm" />
              <nav className="hidden items-center space-x-1 lg:flex lg:space-x-2">
                <Link 
                  href="/images" 
                  className="rounded-md px-3 py-2 text-xs font-semibold text-mist transition-colors duration-200 ease-out hover:bg-chalk/5 hover:text-chalk"
                >
                  Images
                </Link>
                <Link 
                  href="/video" 
                  className="rounded-md px-3 py-2 text-xs font-semibold text-mist transition-colors duration-200 ease-out hover:bg-chalk/5 hover:text-chalk"
                >
                  Video
                </Link>
                <Link 
                  href="/studio" 
                  className="rounded-md px-3 py-2 text-xs font-semibold text-mist transition-colors duration-200 ease-out hover:bg-chalk/5 hover:text-chalk"
                >
                  Studio
                </Link>
                <Link 
                  href="/explore" 
                  className="rounded-md px-3 py-2 text-xs font-semibold text-mist transition-colors duration-200 ease-out hover:bg-chalk/5 hover:text-chalk"
                >
                  Explore
                </Link>
                <Link 
                  href="/settings" 
                  className="rounded-md px-3 py-2 text-xs font-semibold text-mist transition-colors duration-200 ease-out hover:bg-chalk/5 hover:text-chalk"
                >
                  Settings
                </Link>
                <Link 
                  href="/dashboard" 
                  className="rounded-md px-3 py-2 text-xs font-semibold text-mist transition-colors duration-200 ease-out hover:bg-chalk/5 hover:text-chalk"
                >
                  Library
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="text-xs font-semibold text-mist hover:bg-chalk/5 hover:text-chalk"
                    >
                      Change Role
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48 glass-panel border border-white/10 text-slate-200">
                    <DropdownMenuItem onClick={() => { setUserRole('novice'); router.push('/generate'); }} className="cursor-pointer hover:bg-white/10">
                      Small Business Owner
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setUserRole('professional'); router.push('/generate'); }} className="cursor-pointer hover:bg-white/10">
                      Freelance Designer
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setUserRole('imageEditor'); router.push('/generate'); }} className="cursor-pointer hover:bg-white/10">
                      Image-Based Generator
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </nav>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {isLoaded && isSignedIn && user && <UserButton />}
            </div>
          </div>
        </div>
      </header>
      <main className="desk-shell min-w-0 w-full flex-grow">
        {children}
      </main>
      <footer className="mt-auto hidden border-t border-chalk/10 py-6 lg:block">
        <div className="container flex flex-col items-center justify-center px-4 text-center text-mist sm:flex-row sm:justify-between">
          <p className="text-xs">© {new Date().getFullYear()} Flatify</p>
          <p className="mt-2 font-mono text-xs text-mist/70 sm:mt-0">Studio</p>
        </div>
      </footer>
      <MobileDock />
    </div>
  );
}
