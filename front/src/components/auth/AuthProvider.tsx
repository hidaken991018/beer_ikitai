'use client';

import { configureStore } from '@reduxjs/toolkit';
import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { Provider } from 'react-redux';

import { useAuth } from '@/hooks/useAuth';
import { configureAmplify, validateAmplifyConfig } from '@/lib/auth/amplify';
import authReducer from '@/store/slices/authSlice';
import type { AuthContextType } from '@/types/auth';

// Create Redux store
const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Auth context for easier access
const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

function AuthInitializer({ children }: AuthProviderProps) {
  const auth = useAuth();

  useEffect(() => {
    // Validate Amplify configuration
    if (!validateAmplifyConfig()) {
      console.warn(
        'Amplify configuration is incomplete. Authentication may not work properly.'
      );
      return;
    }

    // Configure Amplify
    try {
      configureAmplify();
    } catch (error) {
      console.error('Failed to configure Amplify:', error);
      return;
    }

    // Check for existing authentication on mount
    const initializeAuth = async () => {
      try {
        await auth.refreshAuth();
      } catch (error) {
        console.log('No existing authentication found', error);
      }
    };

    initializeAuth();
  }, [auth]);

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <Provider store={store}>
      <AuthInitializer>{children}</AuthInitializer>
    </Provider>
  );
}

// Hook to use auth context
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

// Export store for testing and advanced usage
export { store };
