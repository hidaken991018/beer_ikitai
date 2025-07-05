import { renderHook, act } from '@testing-library/react';
import {
  useGeolocation,
  calculateDistance,
  isWithinCheckinRadius,
} from '@/hooks/useGeolocation';

// Mock constants
jest.mock('@/lib/constants', () => ({
  GEOLOCATION_CONFIG: {
    timeout: 10000,
    maximumAge: 600000,
    enableHighAccuracy: true,
    checkinRadius: 0.1,
  },
  ERROR_MESSAGES: {
    geolocationDenied: '位置情報の取得が拒否されました',
    geolocationUnavailable: '位置情報が利用できません',
    geolocationTimeout: '位置情報の取得がタイムアウトしました',
    unknownError: '不明なエラーが発生しました',
  },
}));

// Mock geolocation API
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

describe('useGeolocation Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useGeolocation());

    expect(result.current.position).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSupported).toBe(true);
  });

  it('detects when geolocation is not supported', () => {
    // Temporarily remove geolocation
    const originalGeolocation = global.navigator.geolocation;
    Object.defineProperty(global.navigator, 'geolocation', {
      value: undefined,
      writable: true,
    });

    const { result } = renderHook(() => useGeolocation());

    expect(result.current.isSupported).toBe(false);

    // Restore geolocation
    Object.defineProperty(global.navigator, 'geolocation', {
      value: originalGeolocation,
      writable: true,
    });
  });

  it('successfully gets current position', async () => {
    const mockPosition = {
      coords: {
        latitude: 35.6762,
        longitude: 139.6503,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    };

    mockGeolocation.getCurrentPosition.mockImplementation(success => {
      success(mockPosition);
    });

    const { result } = renderHook(() => useGeolocation());

    act(() => {
      result.current.getCurrentPosition();
    });

    expect(result.current.position).toEqual({
      latitude: 35.6762,
      longitude: 139.6503,
    });
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('handles permission denied error', async () => {
    const mockError = {
      code: 1, // PERMISSION_DENIED
      message: 'User denied geolocation',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error(mockError);
    });

    const { result } = renderHook(() => useGeolocation());

    act(() => {
      result.current.getCurrentPosition();
    });

    expect(result.current.position).toBeNull();
    expect(result.current.error).toBe('位置情報の取得が拒否されました');
    expect(result.current.isLoading).toBe(false);
  });

  it('handles position unavailable error', async () => {
    const mockError = {
      code: 2, // POSITION_UNAVAILABLE
      message: 'Position unavailable',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error(mockError);
    });

    const { result } = renderHook(() => useGeolocation());

    act(() => {
      result.current.getCurrentPosition();
    });

    expect(result.current.error).toBe('位置情報が利用できません');
  });

  it('handles timeout error', async () => {
    const mockError = {
      code: 3, // TIMEOUT
      message: 'Timeout',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error(mockError);
    });

    const { result } = renderHook(() => useGeolocation());

    act(() => {
      result.current.getCurrentPosition();
    });

    expect(result.current.error).toBe('位置情報の取得がタイムアウトしました');
  });

  it('clears error when clearError is called', () => {
    const { result } = renderHook(() => useGeolocation());

    // Simulate an error first
    const mockError = {
      code: 1,
      message: 'Error',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error(mockError);
    });

    act(() => {
      result.current.getCurrentPosition();
    });

    expect(result.current.error).toBeTruthy();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('sets up watch position correctly', () => {
    const mockWatchId = 123;
    mockGeolocation.watchPosition.mockReturnValue(mockWatchId);

    const { result } = renderHook(() => useGeolocation());

    act(() => {
      const watchId = result.current.watchPosition();
      expect(watchId).toBe(mockWatchId);
    });

    expect(mockGeolocation.watchPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.objectContaining({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000,
      })
    );
  });

  it('clears watch position correctly', () => {
    const mockWatchId = 123;

    const { result } = renderHook(() => useGeolocation());

    act(() => {
      result.current.clearWatch(mockWatchId);
    });

    expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(mockWatchId);
  });
});

describe('calculateDistance Utility', () => {
  it('calculates distance between two points correctly', () => {
    const tokyo = { latitude: 35.6762, longitude: 139.6503 };
    const osaka = { latitude: 34.6937, longitude: 135.5023 };

    const distance = calculateDistance(tokyo, osaka);

    // Distance between Tokyo and Osaka is approximately 392km
    expect(distance).toBeGreaterThan(390);
    expect(distance).toBeLessThan(400);
  });

  it('returns 0 for identical coordinates', () => {
    const point = { latitude: 35.6762, longitude: 139.6503 };
    const distance = calculateDistance(point, point);

    expect(distance).toBe(0);
  });

  it('calculates short distances accurately', () => {
    const point1 = { latitude: 35.6762, longitude: 139.6503 };
    const point2 = { latitude: 35.6763, longitude: 139.6504 };

    const distance = calculateDistance(point1, point2);

    // Very short distance, should be less than 1km
    expect(distance).toBeLessThan(1);
    expect(distance).toBeGreaterThan(0);
  });
});

describe('isWithinCheckinRadius Utility', () => {
  it('returns true when within default radius', () => {
    const brewery = { latitude: 35.6762, longitude: 139.6503 };
    const userLocation = { latitude: 35.6763, longitude: 139.6504 };

    const isWithin = isWithinCheckinRadius(userLocation, brewery);

    expect(isWithin).toBe(true);
  });

  it('returns false when outside default radius', () => {
    const brewery = { latitude: 35.6762, longitude: 139.6503 };
    const userLocation = { latitude: 35.7762, longitude: 139.7503 }; // Much farther

    const isWithin = isWithinCheckinRadius(userLocation, brewery);

    expect(isWithin).toBe(false);
  });

  it('respects custom radius parameter', () => {
    const brewery = { latitude: 35.6762, longitude: 139.6503 };
    const userLocation = { latitude: 35.7762, longitude: 139.7503 };
    const customRadius = 20; // 20km

    const isWithin = isWithinCheckinRadius(userLocation, brewery, customRadius);

    expect(isWithin).toBe(true);
  });

  it('returns true for exact same location', () => {
    const location = { latitude: 35.6762, longitude: 139.6503 };

    const isWithin = isWithinCheckinRadius(location, location);

    expect(isWithin).toBe(true);
  });
});
