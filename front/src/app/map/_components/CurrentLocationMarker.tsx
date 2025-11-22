import { Marker } from 'react-map-gl';

interface CurrentLocationMarkerProps {
  longitude: number;
  latitude: number;
}

export function CurrentLocationMarker({
  longitude,
  latitude,
}: CurrentLocationMarkerProps) {
  return (
    <Marker longitude={longitude} latitude={latitude} anchor="center">
      <div className="relative">
        {/* 範囲サークル */}
        <div className="absolute inset-0 flex items-center justify-center -m-16">
          <div className="w-32 h-32 rounded-full border-2 border-blue-400 bg-blue-400/10" />
        </div>
        {/* 現在地マーカー */}
        <div className="w-4 h-4 rounded-full bg-blue-500 border-3 border-white shadow-lg" />
      </div>
    </Marker>
  );
}
