
"use client";

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

// Simulate a user object
interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: Dispatch<SetStateAction<User | null>>;
  isLoadingAuth: boolean;
  login: (email?: string, password?: string) => Promise<boolean>;
  signup: (name?: string, email?: string, password?: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Load user from localStorage on mount
    try {
      const storedUser = localStorage.getItem('flatify_currentUser');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to access localStorage for user:", error);
    }
    setIsLoadingAuth(false);
  }, []);

  const login = async (email = "test@example.com", password = "password") => {
    setIsLoadingAuth(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem('flatify_currentUser', JSON.stringify(data.user));
        toast({ title: "Login Successful", description: `Welcome back, ${data.user.name}!` });
        router.push('/'); // Redirect to home to pick role or go to generate
        return true;
      } else {
        toast({ title: "Login Failed", description: data.message || "Invalid credentials.", variant: "destructive" });
        setCurrentUser(null);
        localStorage.removeItem('flatify_currentUser');
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({ title: "Login Error", description: "An unexpected error occurred.", variant: "destructive" });
      setCurrentUser(null);
      localStorage.removeItem('flatify_currentUser');
      return false;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const signup = async (name = "Test User", email = "test@example.com", password = "password") => {
    setIsLoadingAuth(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: "Signup Successful", description: "Please log in with your new account." });
        router.push('/login');
        return true;
      } else {
        toast({ title: "Signup Failed", description: data.message || "Could not create account.", variant: "destructive" });
        return false;
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast({ title: "Signup Error", description: "An unexpected error occurred.", variant: "destructive" });
      return false;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('flatify_currentUser');
    // UserRoleContext will also need to be cleared, typically done where logout is invoked
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, isLoadingAuth, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
