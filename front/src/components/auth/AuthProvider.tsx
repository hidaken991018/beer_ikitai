'use client';

import { configureStore } from '@reduxjs/toolkit';
import { useRouter, usePathname } from 'next/navigation';
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
  const router = useRouter();
  const pathname = usePathname();

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

        // Auto-check profile after authentication is restored
        if (auth.authState.isAuthenticated) {
          await checkProfileAndRedirect();
        }
      } catch (error) {
        console.log('No existing authentication found', error);
      }
    };

    // Profile check and redirect logic
    const checkProfileAndRedirect = async () => {
      try {
        // Skip profile check if already on profile creation page
        if (pathname === '/profile/create') {
          return;
        }

        // Check if profile exists
        const hasProfile = await auth.checkProfile();

        // Redirect to profile creation if profile doesn't exist
        if (!hasProfile) {
          console.log('Profile not found, redirecting to /profile/create');
          router.push('/profile/create');
        }
      } catch (error) {
        console.error('Profile check failed:', error);
        // Don't redirect on error, let user continue
      }
    };

    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-check profile when authentication state changes
  useEffect(() => {
    const handleAuthStateChange = async () => {
      // Only auto-check if:
      // 1. User is authenticated
      // 2. Profile check is not in progress
      // 3. Profile status is unknown (null) or false
      // 4. Not already on profile creation page
      if (
        auth.authState.isAuthenticated &&
        !auth.authState.isCheckingProfile &&
        (auth.authState.hasProfile === null || auth.authState.hasProfile === false) &&
        pathname !== '/profile/create'
      ) {
        try {
          const hasProfile = await auth.checkProfile();
          
          // Redirect to profile creation if profile doesn't exist
          if (!hasProfile) {
            console.log('Profile not found after login, redirecting to /profile/create');
            router.push('/profile/create');
          }
        } catch (error) {
          console.error('Auto profile check failed:', error);
          // Don't redirect on error, let user continue
        }
      }
    };

    // Trigger when authentication state changes to authenticated
    if (auth.authState.isAuthenticated && !auth.authState.isLoading) {
      handleAuthStateChange();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.authState.isAuthenticated, auth.authState.isLoading, pathname]);

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