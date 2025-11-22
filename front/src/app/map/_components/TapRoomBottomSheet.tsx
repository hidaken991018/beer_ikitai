import { Navigation, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Brewery } from '@/types/brewery';

interface TapRoomBottomSheetProps {
  brewery: Brewery | null;
  distance: number | null;
  isWithinRange: boolean;
  isAuthenticated: boolean;
  checkedIn: boolean;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onCheckIn: () => void;
  onLoginRequest: () => void;
  formatDistance: (meters: number) => string;
}

export function TapRoomBottomSheet({
  brewery,
  distance,
  isWithinRange,
  isAuthenticated,
  checkedIn,
  isLoading,
  error,
  onClose,
  onCheckIn,
  onLoginRequest,
  formatDistance,
}: TapRoomBottomSheetProps) {
  if (!brewery) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 bg-white rounded-t-3xl shadow-2xl p-6 animate-in slide-in-from-bottom duration-300">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
      >
        <X className="w-5 h-5 text-gray-500" />
      </button>

      <div className="mb-4">
        <h2 className="mb-2 pr-8 text-xl font-bold">{brewery.name}</h2>

        <div className="flex items-start gap-2 text-gray-600 mb-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mt-1 flex-shrink-0"
          >
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <p>{brewery.address}</p>
        </div>

        {distance !== null && (
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-amber-500" />
            <p className="text-amber-600">
              現在地から {formatDistance(distance)}
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {checkedIn ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-green-600"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span className="text-green-700">チェックインしました！</span>
        </div>
      ) : (
        <>
          {isAuthenticated ? (
            isWithinRange ? (
              <Button
                onClick={onCheckIn}
                disabled={isLoading}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50"
              >
                {isLoading ? 'チェックイン中...' : 'チェックインする'}
              </Button>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-gray-600">
                  チェックインするには100m以内に近づいてください
                </p>
              </div>
            )
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
              <p className="text-amber-700 mb-2">
                チェックインするにはログインが必要です
              </p>
              <Button
                onClick={onLoginRequest}
                className="w-full bg-amber-500 hover:bg-amber-600"
              >
                ログインする
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
