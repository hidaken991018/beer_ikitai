'use client';

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { AuthState, CognitoUser } from '@/types/auth';

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
  accessToken: null,
  idToken: null,
  refreshToken: null,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Authentication start
    authStart: state => {
      state.isLoading = true;
      state.error = null;
    },

    // Login success
    loginSuccess: (
      state,
      action: PayloadAction<{
        user: CognitoUser;
        accessToken: string;
        idToken: string;
        refreshToken: string;
      }>
    ) => {
      state.isAuthenticated = true;
      state.isLoading = false;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.idToken = action.payload.idToken;
      state.refreshToken = action.payload.refreshToken;
      state.error = null;
    },

    // Logout
    logout: state => {
      state.isAuthenticated = false;
      state.isLoading = false;
      state.user = null;
      state.accessToken = null;
      state.idToken = null;
      state.refreshToken = null;
      state.error = null;
    },

    // Authentication error
    authError: (state, action: PayloadAction<string>) => {
      state.isAuthenticated = false;
      state.isLoading = false;
      state.user = null;
      state.accessToken = null;
      state.idToken = null;
      state.refreshToken = null;
      state.error = action.payload;
    },

    // Update user profile
    updateUser: (state, action: PayloadAction<Partial<CognitoUser>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },

    // Update tokens (for refresh)
    updateTokens: (
      state,
      action: PayloadAction<{
        accessToken: string;
        idToken: string;
        refreshToken?: string;
      }>
    ) => {
      state.accessToken = action.payload.accessToken;
      state.idToken = action.payload.idToken;
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
      }
    },

    // Clear error
    clearError: state => {
      state.error = null;
    },

    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const {
  authStart,
  loginSuccess,
  logout,
  authError,
  updateUser,
  updateTokens,
  clearError,
  setLoading,
} = authSlice.actions;

export default authSlice.reducer;

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  state.auth.isAuthenticated;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectAccessToken = (state: { auth: AuthState }) =>
  state.auth.accessToken;
export const selectIsLoading = (state: { auth: AuthState }) =>
  state.auth.isLoading;
export const selectError = (state: { auth: AuthState }) => state.auth.error;
