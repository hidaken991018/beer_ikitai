'use client';

import { MapPin, Navigation, RefreshCw, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { BreweryCard } from '@/components/brewery/BreweryCard';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBreweries } from '@/hooks/useBreweries';
import { useGeolocation } from '@/hooks/useGeolocation';
import { ROUTES } from '@/lib/constants';

// Force client-side rendering for this page
export const dynamic = 'force-dynamic';

export default function NearbyBreweriesPage() {
  const router = useRouter();
  const {
    breweryState,
    fetchNearbyBreweries,
    updateFilters,
    clearErrors,
    checkin,
  } = useBreweries();

  const {
    position: userLocation,
    error: geoError,
    isLoading: geoLoading,
    getCurrentPosition,
  } = useGeolocation();

  const [showSettings, setShowSettings] = useState(false);
  const [tempRadius, setTempRadius] = useState(breweryState?.filters?.radius);
  const [tempLimit, setTempLimit] = useState(breweryState?.filters?.limit);

  // Load nearby breweries when user location is available
  useEffect(() => {
    if (userLocation) {
      fetchNearbyBreweries(userLocation, {
        radius: breweryState?.filters?.radius,
        limit: breweryState?.filters?.limit,
      });
    }
  }, [
    userLocation,
    fetchNearbyBreweries,
    breweryState?.filters?.radius,
    breweryState?.filters?.limit,
  ]);

  // Get user location on component mount
  useEffect(() => {
    getCurrentPosition();
  }, [getCurrentPosition]);

  const handleRefresh = () => {
    if (userLocation) {
      fetchNearbyBreweries(userLocation, {
        radius: breweryState?.filters.radius,
        limit: breweryState?.filters.limit,
      });
    } else {
      getCurrentPosition();
    }
  };

  const handleUpdateLocation = () => {
    getCurrentPosition();
  };

  const handleApplySettings = () => {
    updateFilters({
      radius: tempRadius,
      limit: tempLimit,
    });
    setShowSettings(false);
  };

  const handleResetSettings = () => {
    setTempRadius(5);
    setTempLimit(20);
    updateFilters({
      radius: 5,
      limit: 20,
    });
  };

  const handleCheckin = async (breweryId: number) => {
    if (!userLocation) {
      alert('位置情報が必要です。位置情報を有効にしてください。');
      return;
    }

    try {
      await checkin({
        breweryId,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      });
      alert('チェックインしました！');
    } catch (error) {
      console.error('Checkin failed:', error);
      alert('チェックインに失敗しました。もう一度お試しください。');
    }
  };

  const handleViewDetails = (breweryId: number) => {
    router.push(ROUTES.breweryDetail(breweryId));
  };

  const formatLocation = (lat: number, lng: number): string => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  return (
    <div className='container mx-auto px-4 py-6'>
      {/* Header */}
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-6'>
        <div>
          <h1 className='text-3xl font-bold mb-2'>近隣の醸造所</h1>
          <p className='text-muted-foreground'>
            {userLocation
              ? `現在地から${breweryState?.filters.radius}km以内の醸造所`
              : '位置情報を取得して近隣の醸造所を表示します'}
          </p>
        </div>

        <div className='flex space-x-2 mt-4 md:mt-0'>
          <Button
            variant='outline'
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className='h-4 w-4 mr-2' />
            設定
          </Button>
          <Button
            variant='outline'
            onClick={handleRefresh}
            disabled={geoLoading || breweryState?.isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${geoLoading || breweryState?.isLoading ? 'animate-spin' : ''}`}
            />
            更新
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card className='mb-6'>
          <CardHeader>
            <CardTitle className='text-lg'>検索設定</CardTitle>
            <CardDescription>検索範囲と表示件数を調整できます</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='radius'>検索範囲 (km)</Label>
                <Input
                  id='radius'
                  type='number'
                  min='0.1'
                  max='50'
                  step='0.1'
                  value={tempRadius}
                  onChange={e => setTempRadius(Number(e.target.value))}
                  className='mt-1'
                />
                <p className='text-xs text-muted-foreground mt-1'>
                  0.1km〜50kmの範囲で設定できます
                </p>
              </div>

              <div>
                <Label htmlFor='limit'>最大表示件数</Label>
                <Input
                  id='limit'
                  type='number'
                  min='5'
                  max='100'
                  step='5'
                  value={tempLimit}
                  onChange={e => setTempLimit(Number(e.target.value))}
                  className='mt-1'
                />
                <p className='text-xs text-muted-foreground mt-1'>
                  5件〜100件の範囲で設定できます
                </p>
              </div>
            </div>

            <div className='flex space-x-2 mt-4'>
              <Button onClick={handleApplySettings}>設定を適用</Button>
              <Button variant='outline' onClick={handleResetSettings}>
                リセット
              </Button>
              <Button variant='outline' onClick={() => setShowSettings(false)}>
                キャンセル
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location Status */}
      <Card className='mb-6'>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <MapPin className='h-5 w-5' />
              <div>
                <p className='font-medium'>現在地</p>
                {userLocation ? (
                  <p className='text-sm text-muted-foreground'>
                    {formatLocation(
                      userLocation.latitude,
                      userLocation.longitude
                    )}
                  </p>
                ) : geoLoading ? (
                  <p className='text-sm text-muted-foreground'>
                    位置情報を取得中...
                  </p>
                ) : geoError ? (
                  <p className='text-sm text-red-600'>{geoError}</p>
                ) : (
                  <p className='text-sm text-muted-foreground'>
                    位置情報が利用できません
                  </p>
                )}
              </div>
            </div>

            <Button
              variant='outline'
              size='sm'
              onClick={handleUpdateLocation}
              disabled={geoLoading}
            >
              <Navigation className='h-4 w-4 mr-2' />
              位置を更新
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {breweryState?.error && (
        <Card className='mb-6 border-red-200 bg-red-50'>
          <CardContent className='p-4'>
            <div className='flex justify-between items-center'>
              <p className='text-red-600'>{breweryState?.error}</p>
              <Button variant='outline' size='sm' onClick={clearErrors}>
                閉じる
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Geolocation Error */}
      {geoError && (
        <Card className='mb-6 border-yellow-200 bg-yellow-50'>
          <CardContent className='p-4'>
            <div className='flex justify-between items-center'>
              <div>
                <p className='text-yellow-800 font-medium'>位置情報エラー</p>
                <p className='text-yellow-700 text-sm'>{geoError}</p>
                <p className='text-yellow-700 text-sm mt-1'>
                  ブラウザの設定で位置情報の利用を許可してください
                </p>
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={handleUpdateLocation}
              >
                再試行
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {breweryState?.isLoading && (
        <div className='flex justify-center items-center py-12'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4'></div>
            <p className='text-muted-foreground'>近隣の醸造所を検索中...</p>
          </div>
        </div>
      )}

      {/* Nearby Breweries */}
      {!breweryState?.isLoading && userLocation && (
        <>
          <div className='flex justify-between items-center mb-4'>
            <p className='text-muted-foreground'>
              {breweryState?.nearbyBreweries?.length}件の醸造所が見つかりました
            </p>
            <Button
              variant='outline'
              onClick={() => router.push(ROUTES.breweries)}
            >
              すべての醸造所を見る
            </Button>
          </div>

          {breweryState?.nearbyBreweries?.length === 0 ? (
            <Card>
              <CardContent className='p-12 text-center'>
                <h3 className='text-lg font-semibold mb-2'>
                  近隣に醸造所が見つかりませんでした
                </h3>
                <p className='text-muted-foreground mb-4'>
                  検索範囲を広げるか、別の場所から検索してみてください。
                </p>
                <div className='space-x-2'>
                  <Button
                    onClick={() => {
                      setTempRadius(breweryState.filters.radius * 2);
                      updateFilters({
                        radius: breweryState?.filters.radius * 2,
                      });
                    }}
                  >
                    検索範囲を広げる
                  </Button>
                  <Button
                    variant='outline'
                    onClick={() => router.push(ROUTES.breweries)}
                  >
                    すべての醸造所を見る
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
              {breweryState?.nearbyBreweries?.map(brewery => (
                <BreweryCard
                  key={brewery.id}
                  brewery={brewery}
                  distance={brewery.distance}
                  onCheckin={handleCheckin}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* No Location State */}
      {!breweryState?.isLoading && !userLocation && !geoLoading && (
        <Card>
          <CardContent className='p-12 text-center'>
            <MapPin className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
            <h3 className='text-lg font-semibold mb-2'>位置情報が必要です</h3>
            <p className='text-muted-foreground mb-4'>
              近隣の醸造所を表示するには、位置情報の利用を許可してください。
            </p>
            <div className='space-x-2'>
              <Button onClick={handleUpdateLocation}>
                <Navigation className='h-4 w-4 mr-2' />
                位置情報を取得
              </Button>
              <Button
                variant='outline'
                onClick={() => router.push(ROUTES.breweries)}
              >
                すべての醸造所を見る
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
