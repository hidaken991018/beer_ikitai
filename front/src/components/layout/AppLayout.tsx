'use client';

import React from 'react';
import { useSelector } from 'react-redux';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { logout } = useAuth();
  const authState = useSelector((state: any) => state.auth);

  return (
    <>
      <Header isAuthenticated={authState.isAuthenticated} onLogout={logout} />
      <main className='flex-1 container mx-auto px-4 py-6'>{children}</main>
      <Footer />
    </>
  );
}
