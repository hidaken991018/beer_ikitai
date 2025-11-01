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
  hasProfile: null,
  isCheckingProfile: false,
  profileError: null,
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
      // Profile state reset
      state.hasProfile = null;
      state.isCheckingProfile = false;
      state.profileError = null;
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
      state.isAuthenticated = true;
      state.isLoading = false;
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

    // Profile check start
    profileCheckStart: state => {
      state.isCheckingProfile = true;
      state.profileError = null;
    },

    // Profile check success (profile exists)
    profileCheckSuccess: state => {
      state.hasProfile = true;
      state.isCheckingProfile = false;
      state.profileError = null;
    },

    // Profile check not found (profile does not exist)
    profileCheckNotFound: state => {
      state.hasProfile = false;
      state.isCheckingProfile = false;
      state.profileError = null;
    },

    // Profile check error
    profileCheckError: (state, action: PayloadAction<string>) => {
      state.hasProfile = null;
      state.isCheckingProfile = false;
      state.profileError = action.payload;
    },

    // Clear profile error
    clearProfileError: state => {
      state.profileError = null;
    },

    // Set profile status (for manual update)
    setProfileStatus: (state, action: PayloadAction<boolean>) => {
      state.hasProfile = action.payload;
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
  profileCheckStart,
  profileCheckSuccess,
  profileCheckNotFound,
  profileCheckError,
  clearProfileError,
  setProfileStatus,
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

// Profile selectors
export const selectHasProfile = (state: { auth: AuthState }) =>
  state.auth.hasProfile;
export const selectIsCheckingProfile = (state: { auth: AuthState }) =>
  state.auth.isCheckingProfile;
export const selectProfileError = (state: { auth: AuthState }) =>
  state.auth.profileError;
