'use client';
import { configureStore } from '@reduxjs/toolkit';

import authReducer from '@/store/slices/authSlice';
import breweryReducer from '@/store/slices/brewerySlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    brewery: breweryReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export { store };
