"use client";

import { SignIn } from '@clerk/nextjs';
import { AppLogo } from '@/components/AppLogo';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background selection:bg-accent selection:text-accent-foreground">
      <div className="mb-8">
        <AppLogo size="lg" />
      </div>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Welcome Back!</CardTitle>
          <CardDescription className="text-center">
            Log in to continue to Flatify AI.
          </CardDescription>
        </CardHeader>
        <div className="flex justify-center p-6">
          <SignIn />
        </div>
      </Card>
    </div>
  );
}
