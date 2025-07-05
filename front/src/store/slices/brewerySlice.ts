import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type {
  Brewery,
  BreweryWithDistance,
  Visit,
  CheckinAttempt,
} from '@/types/brewery';

interface BreweryState {
  breweries: Brewery[];
  nearbyBreweries: BreweryWithDistance[];
  currentBrewery: Brewery | null;
  visits: Visit[];
  isLoading: boolean;
  error: string | null;
  lastLocation: {
    latitude: number;
    longitude: number;
  } | null;
  searchQuery: string;
  filters: {
    radius: number;
    limit: number;
  };
}

const initialState: BreweryState = {
  breweries: [],
  nearbyBreweries: [],
  currentBrewery: null,
  visits: [],
  isLoading: false,
  error: null,
  lastLocation: null,
  searchQuery: '',
  filters: {
    radius: 5, // 5km default radius
    limit: 20,
  },
};

const brewerySlice = createSlice({
  name: 'brewery',
  initialState,
  reducers: {
    // Loading states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Error handling
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    clearError: state => {
      state.error = null;
    },

    // Brewery operations
    setBreweries: (state, action: PayloadAction<Brewery[]>) => {
      state.breweries = action.payload;
      state.isLoading = false;
      state.error = null;
    },

    addBrewery: (state, action: PayloadAction<Brewery>) => {
      state.breweries.unshift(action.payload);
    },

    updateBrewery: (state, action: PayloadAction<Brewery>) => {
      const index = state.breweries.findIndex(
        (b: Brewery) => b.id === action.payload.id
      );
      if (index !== -1) {
        state.breweries[index] = action.payload;
      }
      if (state.currentBrewery?.id === action.payload.id) {
        state.currentBrewery = action.payload;
      }
    },

    removeBrewery: (state, action: PayloadAction<number>) => {
      state.breweries = state.breweries.filter(
        (b: Brewery) => b.id !== action.payload
      );
      if (state.currentBrewery?.id === action.payload) {
        state.currentBrewery = null;
      }
    },

    // Current brewery
    setCurrentBrewery: (state, action: PayloadAction<Brewery | null>) => {
      state.currentBrewery = action.payload;
    },

    // Nearby breweries
    setNearbyBreweries: (
      state,
      action: PayloadAction<BreweryWithDistance[]>
    ) => {
      state.nearbyBreweries = action.payload;
      state.isLoading = false;
      state.error = null;
    },

    updateBreweryDistance: (
      state,
      action: PayloadAction<{
        breweryId: number;
        distance: number;
      }>
    ) => {
      const nearby = state.nearbyBreweries.find(
        (b: BreweryWithDistance) => b.id === action.payload.breweryId
      );
      if (nearby) {
        nearby.distance = action.payload.distance;
      }
    },

    // User location
    setLastLocation: (
      state,
      action: PayloadAction<{
        latitude: number;
        longitude: number;
      }>
    ) => {
      state.lastLocation = action.payload;
    },

    // Search and filters
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },

    setFilters: (
      state,
      action: PayloadAction<Partial<BreweryState['filters']>>
    ) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    resetFilters: state => {
      state.filters = initialState.filters;
      state.searchQuery = '';
    },

    // Visit operations
    setVisits: (state, action: PayloadAction<Visit[]>) => {
      state.visits = action.payload;
    },

    addVisit: (state, action: PayloadAction<Visit>) => {
      state.visits.unshift(action.payload);
    },

    updateVisit: (state, action: PayloadAction<Visit>) => {
      const index = state.visits.findIndex(
        (v: Visit) => v.id === action.payload.id
      );
      if (index !== -1) {
        state.visits[index] = action.payload;
      }
    },

    removeVisit: (state, action: PayloadAction<number>) => {
      state.visits = state.visits.filter((v: Visit) => v.id !== action.payload);
    },

    // Checkin operation
    checkinStart: (state, action: PayloadAction<CheckinAttempt>) => {
      state.isLoading = true;
      state.error = null;
      console.log('Checkin started:', action);
    },

    checkinSuccess: (state, action: PayloadAction<Visit>) => {
      state.visits.unshift(action.payload);
      state.isLoading = false;
      state.error = null;
    },

    checkinFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    // Clear all data (for logout)
    clearBreweryData: state => {
      state.breweries = [];
      state.nearbyBreweries = [];
      state.currentBrewery = null;
      state.visits = [];
      state.isLoading = false;
      state.error = null;
      state.lastLocation = null;
      state.searchQuery = '';
      state.filters = initialState.filters;
    },
  },
});

export const {
  setLoading,
  setError,
  clearError,
  setBreweries,
  addBrewery,
  updateBrewery,
  removeBrewery,
  setCurrentBrewery,
  setNearbyBreweries,
  updateBreweryDistance,
  setLastLocation,
  setSearchQuery,
  setFilters,
  resetFilters,
  setVisits,
  addVisit,
  updateVisit,
  removeVisit,
  checkinStart,
  checkinSuccess,
  checkinFailure,
  clearBreweryData,
} = brewerySlice.actions;

export default brewerySlice.reducer;

// Selectors
export const selectBrewery = (state: { brewery: BreweryState }) =>
  state.brewery;
export const selectBreweries = (state: { brewery: BreweryState }) =>
  state.brewery.breweries;
export const selectNearbyBreweries = (state: { brewery: BreweryState }) =>
  state.brewery.nearbyBreweries;
export const selectCurrentBrewery = (state: { brewery: BreweryState }) =>
  state.brewery.currentBrewery;
export const selectVisits = (state: { brewery: BreweryState }) =>
  state.brewery.visits;
export const selectIsLoading = (state: { brewery: BreweryState }) =>
  state.brewery.isLoading;
export const selectError = (state: { brewery: BreweryState }) =>
  state.brewery.error;
export const selectLastLocation = (state: { brewery: BreweryState }) =>
  state.brewery.lastLocation;
export const selectSearchQuery = (state: { brewery: BreweryState }) =>
  state.brewery.searchQuery;
export const selectFilters = (state: { brewery: BreweryState }) =>
  state.brewery.filters;

// Computed selectors
export const selectFilteredBreweries = (state: { brewery: BreweryState }) => {
  const { breweries, searchQuery } = state.brewery;

  if (!searchQuery.trim()) {
    return breweries;
  }

  const query = searchQuery.toLowerCase();
  return breweries.filter(
    brewery =>
      brewery.name.toLowerCase().includes(query) ||
      brewery.address?.toLowerCase().includes(query) ||
      brewery.description?.toLowerCase().includes(query)
  );
};

export const selectVisitsByBrewery = (state: { brewery: BreweryState }) => {
  const visits = state.brewery.visits;
  const visitMap = new Map<number, Visit[]>();

  visits.forEach(visit => {
    const breweryId = visit.breweryId;
    if (!visitMap.has(breweryId)) {
      visitMap.set(breweryId, []);
    }
    visitMap.get(breweryId)!.push(visit);
  });

  return visitMap;
};

export const selectVisitCount = (state: { brewery: BreweryState }) =>
  state.brewery.visits.length;

export const selectUniqueBreweriesVisited = (state: {
  brewery: BreweryState;
}) => {
  const visits = state.brewery.visits;
  const uniqueBreweryIds = new Set(visits.map(visit => visit.breweryId));
  return uniqueBreweryIds.size;
};
