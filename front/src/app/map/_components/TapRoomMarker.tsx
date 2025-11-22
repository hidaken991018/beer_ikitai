import { Marker } from 'react-map-gl';

import { Brewery } from '@/types/brewery';

interface TapRoomMarkerProps {
  brewery: Brewery;
  isSelected: boolean;
  onSelect: (brewery: Brewery) => void;
}

export function TapRoomMarker({
  brewery,
  isSelected,
  onSelect,
}: TapRoomMarkerProps) {
  return (
    <Marker
      longitude={brewery.longitude}
      latitude={brewery.latitude}
      anchor="center"
    >
      <button
        onClick={() => onSelect(brewery)}
        className="group relative"
      >
        {/* マーカーの影 */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-8 h-2 bg-black/20 rounded-full blur-sm" />

        {/* ビールマーカー */}
        <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center border-3 border-white shadow-lg transition-transform group-hover:scale-110 group-active:scale-95">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 11h1a3 3 0 0 1 0 6h-1" />
            <path d="M9 12v6" />
            <path d="M13 12v6" />
            <path d="M14 7.5c-1 0-1.44.5-3 .5s-2-.5-3-.5-1.72.5-2.5.5a2.5 2.5 0 0 1 0-5c.78 0 1.57.5 2.5.5S9.44 2 11 2s2 1.5 3 1.5 1.72-.5 2.5-.5a2.5 2.5 0 0 1 0 5c-.78 0-1.5-.5-2.5-.5Z" />
            <path d="M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8" />
          </svg>
        </div>

        {/* 選択時のリング */}
        {isSelected && (
          <div className="absolute inset-0 -m-2 rounded-full border-2 border-amber-500 animate-ping" />
        )}
      </button>
    </Marker>
  );
}
