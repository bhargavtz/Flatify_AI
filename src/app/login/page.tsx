"use client";

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLogo } from '@/components/AppLogo';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useUserRole } from '@/contexts/UserRoleContext';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoadingAuth } = useAuth();
  const { setUserRole } = useUserRole();
  const searchParams = useSearchParams();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const success = await login(email, password);
    if (success) {
      const intendedRole = searchParams.get('intendedRole') as 'novice' | 'professional' | null;
      if (intendedRole) {
        setUserRole(intendedRole);
      }
    }
  };

  return (
    <div>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button type="submit" className="w-full" disabled={isLoadingAuth} onClick={handleSubmit}>
          {isLoadingAuth ? 'Logging in...' : 'Login'}
        </Button>
        <p className="text-sm text-center text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </div>
  );
}

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
        <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </Card>
    </div>
  );
}
