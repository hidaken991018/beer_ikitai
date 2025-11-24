'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Map, { NavigationControl, MapRef } from 'react-map-gl';

import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useBreweries } from '@/hooks/useBreweries';
import { useAppSelector } from '@/store/hooks';
import { selectIsAuthenticated } from '@/store/slices/authSlice';
import { Brewery } from '@/types/brewery';

import { CurrentLocationMarker } from './_components/CurrentLocationMarker';
import { LoadingScreen } from './_components/LoadingScreen';
import { LocateMeButton } from './_components/LocateMeButton';
import { TapRoomBottomSheet } from './_components/TapRoomBottomSheet';
import { TapRoomMarker } from './_components/TapRoomMarker';
import { calculateDistance, formatDistance } from './_domain/distance';

import 'mapbox-gl/dist/mapbox-gl.css';

export default function MapPage() {
  const router = useRouter();
  const mapRef = useRef<MapRef>(null);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { breweryState, fetchNearbyBreweries, checkin, fetchVisits } =
    useBreweries();
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [selectedBrewery, setSelectedBrewery] = useState<Brewery | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [viewState, setViewState] = useState({
    longitude: 139.698,
    latitude: 35.6437,
    zoom: 14,
  });

  useEffect(() => {
    // 現在地を取得
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          setViewState({
            longitude: location.lng,
            latitude: location.lat,
            zoom: 14,
          });

          // 近隣醸造所を取得
          fetchNearbyBreweries(
            {
              latitude: location.lat,
              longitude: location.lng,
            },
            {
              radius: 10, // 10km以内
              limit: 50, // 最大50件
            }
          );
        },
        () => {
          // 位置情報取得失敗時はデフォルト位置（東京）
          const defaultLocation = { lat: 35.6437, lng: 139.698 };
          setUserLocation(defaultLocation);

          // デフォルト位置で醸造所を取得
          fetchNearbyBreweries(
            {
              latitude: defaultLocation.lat,
              longitude: defaultLocation.lng,
            },
            {
              radius: 10,
              limit: 50,
            }
          );
        }
      );
    } else {
      const defaultLocation = { lat: 35.6437, lng: 139.698 };
      setUserLocation(defaultLocation);

      // デフォルト位置で醸造所を取得
      fetchNearbyBreweries(
        {
          latitude: defaultLocation.lat,
          longitude: defaultLocation.lng,
        },
        {
          radius: 10,
          limit: 50,
        }
      );
    }
  }, [fetchNearbyBreweries]);

  // 地図を日本語表記に変更
  const handleMapLoad = () => {
    const map = mapRef.current?.getMap();
    if (map) {
      const layers = map.getStyle().layers;
      if (layers) {
        layers.forEach((layer) => {
          if (
            layer.type === 'symbol' &&
            layer.layout &&
            'text-field' in layer.layout
          ) {
            map.setLayoutProperty(layer.id, 'text-field', [
              'coalesce',
              ['get', 'name_ja'],
              ['get', 'name:ja'],
              ['get', 'name_en'],
              ['get', 'name'],
            ]);
          }
        });
      }
    }
  };

  const handleLocateMe = () => {
    if (userLocation) {
      setViewState({
        longitude: userLocation.lng,
        latitude: userLocation.lat,
        zoom: 14,
      });
    }
  };

  const handleCheckIn = async () => {
    if (!selectedBrewery || !userLocation) return;

    try {
      await checkin({
        brewery_id: selectedBrewery.id,
        latitude: userLocation.lat,
        longitude: userLocation.lng,
      });

      setCheckedIn(true);

      // 訪問履歴を再取得（認証済みの場合のみ）
      if (isAuthenticated) {
        fetchVisits();
      }
    } catch (error) {
      console.error('チェックインエラー:', error);
      // エラーはbreweryState.errorに格納されているので、ここでは何もしない
    }
  };

  const handleLoginRequest = () => {
    router.push('/auth/login');
  };

  if (!userLocation) {
    return <LoadingScreen />;
  }

  const distance =
    selectedBrewery && userLocation
      ? calculateDistance(
        userLocation.lat,
        userLocation.lng,
        selectedBrewery.latitude,
        selectedBrewery.longitude
      )
      : null;

  const isWithinRange = distance !== null && distance <= 100;

  return (
    <MobileLayout showBottomNav>
      <div className="relative h-full">
        <Map
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken={
            process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""
          }
          onLoad={handleMapLoad}
          ref={mapRef}
        >
          <NavigationControl position="top-left" />

          {/* ユーザーの現在地マーカー */}
          <CurrentLocationMarker
            longitude={userLocation.lng}
            latitude={userLocation.lat}
          />

          {/* 醸造所マーカー */}
          {breweryState.nearbyBreweries.map((brewery) => (
            <TapRoomMarker
              key={brewery.id}
              brewery={brewery}
              isSelected={selectedBrewery?.id === brewery.id}
              onSelect={setSelectedBrewery}
            />
          ))}
        </Map>

        {/* 現在地ボタン */}
        <LocateMeButton onClick={handleLocateMe} />

        {/* 醸造所情報カード */}
        <TapRoomBottomSheet
          brewery={selectedBrewery}
          distance={distance}
          isWithinRange={isWithinRange}
          isAuthenticated={isAuthenticated}
          checkedIn={checkedIn}
          isLoading={breweryState.isLoading}
          error={breweryState.error}
          onClose={() => setSelectedBrewery(null)}
          onCheckIn={handleCheckIn}
          onLoginRequest={handleLoginRequest}
          formatDistance={formatDistance}
        />
      </div>
      <BottomNavigation />
    </MobileLayout>
  );
}
