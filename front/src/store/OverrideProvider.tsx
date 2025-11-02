'use client';

import { Provider } from 'react-redux';

import { AuthInitializer } from '@/components/auth/AuthInitializer';
import { store } from '@/store/store';


export function OverrideProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthInitializer>{children}</AuthInitializer>
    </Provider>
  );
}