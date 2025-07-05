'use client';

import React from 'react';

import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingPage } from '@/components/ui/loading';

export default function Loading() {
  return (
    <AppLayout>
      <LoadingPage
        title='ページを読み込み中...'
        description='しばらくお待ちください'
      />
    </AppLayout>
  );
}
