"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@clerk/nextjs';
import { useUserRole, type UserRole } from '@/contexts/UserRoleContext';
import { AppLogo } from '@/components/AppLogo';
import { ArrowRight, Briefcase, Brush, UploadCloud } from 'lucide-react';
import { useEffect } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function LandingPage() {
  const router = useRouter();
  const { setUserRole, userRole, isLoading: isLoadingRole } = useUserRole();
  const { isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && isSignedIn && !isLoadingRole && userRole) {
      router.push('/generate');
    }
  }, [isSignedIn, userRole, isLoaded, isLoadingRole, router]);

  if (!isLoaded || (isSignedIn && isLoadingRole && !userRole)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (isSignedIn && userRole) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  const handleRoleSelection = (role: UserRole) => {
    if (!role) return;
    setUserRole(role);

    if (isSignedIn) {
      router.push('/generate');
    } else {
      // If not signed in, Clerk's components in layout.tsx will prompt login/signup
      // No need to redirect to a custom login page with intendedRole
      // The user will be redirected to Clerk's sign-in page if they try to access a protected route
      // or they can use the Sign In/Sign Up buttons in the header.
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 bg-background selection:bg-accent selection:text-accent-foreground">
      <header className="mb-10 md:mb-16 text-center">
        <AppLogo size="lg" className="justify-center mb-2" />
        <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Flat Design Logos, Effortlessly.
        </h1>
        <p className="mt-3 text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto">
          Generate unique, professional flat design logos for your business using advanced AI.
        </p>
        {isSignedIn && !userRole && (
          <p className="mt-4 text-md text-primary font-medium">Welcome! Please select your role to continue.</p>
        )}
        {!isSignedIn && (
          <p className="mt-4 text-md text-primary font-medium">Please select a role to get started. You'll be prompted to log in or sign up.</p>
        )}
      </header>

      <main className="w-full max-w-3xl">
        <Card className="shadow-xl border-2 border-transparent hover:border-primary/20 transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl sm:text-3xl text-center font-semibold">Choose Your Path</CardTitle>
            <CardDescription className="text-center text-md sm:text-base">
              Select the mode that best fits your creative needs.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:gap-6 p-4 sm:p-6">
            {[
              {
                role: 'novice' as UserRole,
                icon: Briefcase,
                title: 'Small Business Owner',
                description: 'Guided, simple logo creation for your brand.',
              },
              {
                role: 'professional' as UserRole,
                icon: Brush,
                title: 'Freelance Designer',
                description: 'Advanced tools and prompt control for rapid concepts.',
              },
              {
                role: 'imageEditor' as UserRole,
                icon: UploadCloud,
                title: 'Image-Based Generator',
                description: 'Upload an image, get a new logo in a similar style.',
              },
            ].map(({ role, icon: Icon, title, description }) => (
              <Button
                key={role}
                variant="outline"
                size="lg"
                className="h-auto py-6 sm:py-8 px-6 text-left flex items-center justify-between shadow-md hover:shadow-lg hover:bg-card hover:border-primary/50 focus-visible:ring-primary/50 transition-all duration-300 group"
                onClick={() => handleRoleSelection(role)}
              >
                <div className="flex items-center gap-4 sm:gap-5">
                  <Icon className="w-10 h-10 sm:w-12 sm:h-12 text-primary group-hover:text-accent transition-colors duration-300" />
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground">{title}</h3>
                    <p className="text-sm sm:text-base text-muted-foreground group-hover:text-foreground/80 transition-colors">
                      {description}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:text-accent transition-all duration-300 transform group-hover:translate-x-1" />
              </Button>
            ))}
          </CardContent>
        </Card>
      </main>
      <footer className="mt-12 md:mt-16 text-center">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Flatify AI. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
