'use client';

import React from 'react';

import { Footer } from '@/components/layout/Footer';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {

  return (
    <>
      <header />
      <main className='flex-1 container mx-auto px-4 py-6'>{children}</main>
      <Footer />
    </>
  );
}
