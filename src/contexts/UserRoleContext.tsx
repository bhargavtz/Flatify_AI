
"use client";

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type UserRole = 'novice' | 'professional' | 'imageEditor' | null;

interface UserRoleContextType {
  userRole: UserRole;
  setUserRole: Dispatch<SetStateAction<UserRole>>;
  isLoading: boolean;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export const UserRoleProvider = ({ children }: { children: ReactNode }) => {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true

  useEffect(() => {
    // This effect runs once on mount to load the role from localStorage
    try {
      const storedRole = localStorage.getItem('flatify_userRole') as UserRole;
      if (storedRole && ['novice', 'professional', 'imageEditor'].includes(storedRole)) {
        setUserRole(storedRole);
      }
    } catch (error) {
      console.error("Failed to access localStorage on mount for role:", error);
    }
    setIsLoading(false); // Set loading to false after attempting to load
  }, []);

  useEffect(() => {
    // This effect runs when userRole changes and isLoading is false
    if (!isLoading) { // Only proceed if initial load is complete
      if (userRole) {
        try {
          localStorage.setItem('flatify_userRole', userRole);
        } catch (error) {
          console.error("Failed to access localStorage on role change:", error);
        }
      } else if (userRole === null) { // Explicitly check for null to clear
        try {
          localStorage.removeItem('flatify_userRole');
        } catch (error) {
          console.error("Failed to access localStorage on role clear:", error);
        }
      }
    }
  }, [userRole, isLoading]);

  return (
    <UserRoleContext.Provider value={{ userRole, setUserRole, isLoading }}>
      {children}
    </UserRoleContext.Provider>
  );
};

export const useUserRole = (): UserRoleContextType => {
  const context = useContext(UserRoleContext);
  if (context === undefined) {
    throw new Error('useUserRole must be used within a UserRoleProvider');
  }
  return context;
};
