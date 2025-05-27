"use client";

import { useRouter } from 'next/navigation';
import { useUserRole } from '@/contexts/UserRoleContext';
import { useUser, useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function RoleSelectPage() {
  const router = useRouter();
  const { userRole, setUserRole, isLoading: isLoadingRole } = useUserRole();
  const { isLoaded, isSignedIn } = useUser();
  const { signOut } = useAuth();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/login');
    } else if (isLoaded && isSignedIn && !isLoadingRole && userRole) {
      // If user is signed in and already has a role, redirect to generate page
      router.push('/generate');
    }
  }, [isLoaded, isSignedIn, userRole, isLoadingRole, router]);

  const handleRoleSelect = (role: 'novice' | 'professional' | 'imageEditor') => {
    setUserRole(role);
    router.push('/generate');
  };

  if (!isLoaded || (isLoaded && isSignedIn && isLoadingRole)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (isSignedIn && userRole && !isLoadingRole) {
    return null; // Already redirected by useEffect
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 p-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
          Select Your Role
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
          Choose the role that best describes you to get a tailored experience.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        <Card className="flex flex-col items-center text-center p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold mb-2">Small Business Owner</CardTitle>
            <CardDescription>
              Perfect for entrepreneurs needing a quick, effective logo without design expertise.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex items-end">
            <Button 
              size="lg" 
              onClick={() => handleRoleSelect('novice')}
              className="w-full"
            >
              I'm a Business Owner
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col items-center text-center p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold mb-2">Freelance Designer</CardTitle>
            <CardDescription>
              Ideal for designers looking to generate concepts and refine them with AI assistance.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex items-end">
            <Button 
              size="lg" 
              onClick={() => handleRoleSelect('professional')}
              className="w-full"
            >
              I'm a Designer
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col items-center text-center p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold mb-2">Image-Based Generator</CardTitle>
            <CardDescription>
              For users who prefer to generate logos based on existing images or visual inputs.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex items-end">
            <Button 
              size="lg" 
              onClick={() => handleRoleSelect('imageEditor')}
              className="w-full"
            >
              Image-Based
            </Button>
          </CardContent>
        </Card>
      </div>

      <Button 
        variant="link" 
        onClick={() => signOut(() => router.push('/'))} 
        className="mt-8 text-muted-foreground hover:text-foreground"
      >
        Not {isLoaded && isSignedIn ? `(${useUser().user?.emailAddresses[0]?.emailAddress})` : ''}? Sign Out
      </Button>
    </div>
  );
}
