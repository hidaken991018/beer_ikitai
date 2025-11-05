'use client';

import { MapPin, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useGeolocation, isWithinCheckinRadius } from '@/hooks/useGeolocation';
import { GEOLOCATION_CONFIG } from '@/lib/constants';
import type { CheckinButtonProps } from '@/types/brewery';

export function CheckinButton({
  brewery,
  userLocation,
  onCheckin,
  disabled = false,
}: CheckinButtonProps) {
  const [isChecking, setIsChecking] = useState(false);
  const { getCurrentPosition, isLoading: geoLoading } = useGeolocation();

  const breweryLocation = {
    latitude: brewery.latitude,
    longitude: brewery.longitude,
  };

  // Check if user is within checkin radius
  const canCheckin = userLocation
    ? isWithinCheckinRadius(userLocation, breweryLocation)
    : false;

  const distance = userLocation
    ? (() => {
        const R = 6371; // Earth's radius in kilometers
        const dLat =
          (breweryLocation.latitude - userLocation.latitude) * (Math.PI / 180);
        const dLon =
          (breweryLocation.longitude - userLocation.longitude) *
          (Math.PI / 180);

        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(userLocation.latitude * (Math.PI / 180)) *
            Math.cos(breweryLocation.latitude * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      })()
    : null;

  const formatDistance = (distanceKm: number): string => {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    } else {
      return `${distanceKm.toFixed(1)}km`;
    }
  };

  const handleCheckin = async () => {
    setIsChecking(true);

    try {
      const currentLocation = userLocation;

      // If no user location, try to get current position
      if (!currentLocation) {
        await new Promise<void>((resolve, reject) => {
          getCurrentPosition();
          // Note: This is a simplified approach. In a real implementation,
          // you'd want to use the geolocation hook's state properly
          setTimeout(() => {
            // This would need to be replaced with actual position from the hook
            reject(new Error('位置情報を取得できませんでした'));
          }, GEOLOCATION_CONFIG.timeout);
        });
      }

      if (currentLocation && canCheckin) {
        await onCheckin(brewery.id);
      }
    } catch (error) {
      console.error('Checkin failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const renderContent = () => {
    if (geoLoading || isChecking) {
      return (
        <>
          <Loader2 className='h-4 w-4 mr-2 animate-spin' />
          {geoLoading ? '位置取得中...' : 'チェックイン中...'}
        </>
      );
    }

    if (!userLocation) {
      return (
        <>
          <MapPin className='h-4 w-4 mr-2' />
          位置情報が必要です
        </>
      );
    }

    if (canCheckin) {
      return (
        <>
          <CheckCircle className='h-4 w-4 mr-2' />
          チェックイン可能
        </>
      );
    }

    return (
      <>
        <AlertCircle className='h-4 w-4 mr-2' />
        {distance
          ? `${formatDistance(distance)} 離れています`
          : '距離を計算中...'}
      </>
    );
  };

  const getVariant = () => {
    if (!userLocation) return 'outline';
    if (canCheckin) return 'default';
    return 'secondary';
  };

  const isDisabled =
    disabled || geoLoading || isChecking || !userLocation || !canCheckin;

  return (
    <div className='space-y-2'>
      <Button
        onClick={handleCheckin}
        disabled={isDisabled}
        variant={getVariant()}
        className='w-full'
      >
        {renderContent()}
      </Button>

      {distance !== null && (
        <div className='text-xs text-center text-muted-foreground'>
          {canCheckin ? (
            <span className='text-green-600'>
              チェックイン範囲内（{GEOLOCATION_CONFIG.checkinRadius * 1000}
              m以内）
            </span>
          ) : (
            <span>
              チェックインには醸造所から
              {GEOLOCATION_CONFIG.checkinRadius * 1000}m以内である必要があります
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Simplified version for inline use
export function CheckinButtonSimple({
  brewery,
  userLocation,
  onCheckin,
  disabled = false,
}: CheckinButtonProps) {
  const [isChecking, setIsChecking] = useState(false);

  const breweryLocation = {
    latitude: brewery.latitude,
    longitude: brewery.longitude,
  };

  const canCheckin = userLocation
    ? isWithinCheckinRadius(userLocation, breweryLocation)
    : false;

  const handleCheckin = async () => {
    if (!canCheckin || isChecking) return;

    setIsChecking(true);
    try {
      await onCheckin(brewery.id);
    } catch (error) {
      console.error('Checkin failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Button
      onClick={handleCheckin}
      disabled={disabled || isChecking || !canCheckin}
      size='sm'
      variant={canCheckin ? 'default' : 'secondary'}
    >
      {isChecking ? (
        <Loader2 className='h-4 w-4 animate-spin' />
      ) : canCheckin ? (
        'チェックイン'
      ) : (
        '範囲外'
      )}
    </Button>
  );
}
