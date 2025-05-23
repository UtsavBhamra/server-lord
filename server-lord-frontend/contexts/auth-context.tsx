"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import { UserSession, getUserFromSession } from '@/lib/auth';

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    const loadUserData = async () => {
      if (status === 'loading') return;
      
      if (session) {
        const userData = await getUserFromSession();
        setUser(userData);
      } else {
        setUser(null);
      }
      
      setLoading(false);
    };
    
    loadUserData();
  }, [session, status]);
  
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      
      if (result?.error) {
        throw new Error(result.error);
      }
      
      // The session will be updated automatically by useSession hook
      router.push('/dashboard');
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const logout = async () => {
    await signOut({ callbackUrl: '/login' });
  };
  
  const value = {
    user,
    loading: loading || status === 'loading',
    login,
    logout,
    isAuthenticated: !!session,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};