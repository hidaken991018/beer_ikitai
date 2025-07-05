'use client';

import React from 'react';

import { useAuthContext } from '@/components/auth/AuthProvider';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { authState, logout } = useAuthContext();

  return (
    <>
      <Header isAuthenticated={authState.isAuthenticated} onLogout={logout} />
      <main className='flex-1 container mx-auto px-4 py-6'>{children}</main>
      <Footer />
    </>
  );
}
