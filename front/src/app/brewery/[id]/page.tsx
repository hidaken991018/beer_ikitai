'use client';

import {
  ArrowLeft,
  MapPin,
  Clock,
  Star,
  Navigation,
  Share,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

import { useAuthContext } from '@/components/auth/AuthProvider';
import { CheckinButton } from '@/components/brewery/CheckinButton';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useBreweries } from '@/hooks/useBreweries';
import { useGeolocation } from '@/hooks/useGeolocation';
import { ROUTES } from '@/lib/constants';

// Force client-side rendering for this page
export const dynamic = 'force-dynamic';

export default function BreweryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const breweryId = parseInt(params.id as string);

  const { authState } = useAuthContext();
  const { breweryState, fetchBreweryById, fetchVisits, checkin } =
    useBreweries();

  const { position: userLocation, getCurrentPosition } = useGeolocation();

  const brewery = breweryState?.currentBrewery;
  const visits = breweryState?.visits.filter(
    visit => visit.breweryId === breweryId
  );

  // Load brewery details and visits
  useEffect(() => {
    if (breweryId) {
      fetchBreweryById(breweryId);
      if (authState.isAuthenticated) {
        fetchVisits();
      }
    }
  }, [breweryId, fetchBreweryById, fetchVisits, authState.isAuthenticated]);

  // Get user location
  useEffect(() => {
    getCurrentPosition();
  }, [getCurrentPosition]);

  const handleCheckin = async (breweryId: number) => {
    if (!authState.isAuthenticated) {
      router.push(ROUTES.login);
      return;
    }

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

  const handleShare = async () => {
    if (navigator.share && brewery) {
      try {
        await navigator.share({
          title: brewery.name,
          text: `${brewery.name} をチェックしてみてください！`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share failed:', error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('URLをクリップボードにコピーしました');
      } catch (error) {
        console.error('Copy failed:', error);
      }
    }
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const distance =
    userLocation && brewery
      ? calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          brewery.latitude,
          brewery.longitude
        )
      : null;

  const formatDistance = (distanceKm: number): string => {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    } else {
      return `${distanceKm.toFixed(1)}km`;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (breweryState?.isLoading) {
    return (
      <AppLayout>
        <div className='flex justify-center items-center py-12'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4'></div>
            <p className='text-muted-foreground'>醸造所情報を読み込み中...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (breweryState?.error) {
    return (
      <AppLayout>
        <Card className='border-red-200 bg-red-50'>
          <CardContent className='p-6 text-center'>
            <h3 className='text-lg font-semibold mb-2 text-red-800'>
              エラーが発生しました
            </h3>
            <p className='text-red-600 mb-4'>{breweryState?.error}</p>
            <div className='space-x-2'>
              <Button onClick={() => window.location.reload()}>
                再読み込み
              </Button>
              <Button
                variant='outline'
                onClick={() => router.push(ROUTES.breweries)}
              >
                醸造所一覧に戻る
              </Button>
            </div>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  if (!brewery) {
    return (
      <AppLayout>
        <Card>
          <CardContent className='p-12 text-center'>
            <h3 className='text-lg font-semibold mb-2'>
              醸造所が見つかりませんでした
            </h3>
            <p className='text-muted-foreground mb-4'>
              指定された醸造所は存在しないか、削除された可能性があります。
            </p>
            <Button onClick={() => router.push(ROUTES.breweries)}>
              醸造所一覧に戻る
            </Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className='max-w-4xl mx-auto'>
        {/* Header */}
        <div className='flex items-center justify-between mb-6'>
          <Button
            variant='outline'
            onClick={() => router.back()}
            className='flex items-center'
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            戻る
          </Button>

          <Button
            variant='outline'
            onClick={handleShare}
            className='flex items-center'
          >
            <Share className='h-4 w-4 mr-2' />
            共有
          </Button>
        </div>

        {/* Main Content */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Brewery Info */}
          <div className='lg:col-span-2'>
            <Card>
              <CardHeader>
                <div className='flex justify-between items-start'>
                  <div>
                    <CardTitle className='text-2xl'>{brewery.name}</CardTitle>
                    {brewery.address && (
                      <CardDescription className='flex items-center mt-2'>
                        <MapPin className='h-4 w-4 mr-1' />
                        {brewery.address}
                      </CardDescription>
                    )}
                  </div>
                  {distance !== null && (
                    <div className='text-right'>
                      <div className='flex items-center text-sm text-muted-foreground'>
                        <Navigation className='h-4 w-4 mr-1' />
                        {formatDistance(distance)}
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {brewery.description && (
                  <div className='mb-6'>
                    <h3 className='font-semibold mb-2'>説明</h3>
                    <p className='text-gray-700 leading-relaxed'>
                      {brewery.description}
                    </p>
                  </div>
                )}

                <div className='grid grid-cols-2 gap-4 text-sm'>
                  <div>
                    <span className='font-semibold'>緯度:</span>{' '}
                    {brewery.latitude.toFixed(6)}
                  </div>
                  <div>
                    <span className='font-semibold'>経度:</span>{' '}
                    {brewery.longitude.toFixed(6)}
                  </div>
                  <div>
                    <span className='font-semibold'>登録日:</span>{' '}
                    {formatDate(brewery.createdAt)}
                  </div>
                  <div>
                    <span className='font-semibold'>更新日:</span>{' '}
                    {formatDate(brewery.updatedAt)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Visit History */}
            {authState.isAuthenticated && visits.length > 0 && (
              <Card className='mt-6'>
                <CardHeader>
                  <CardTitle className='flex items-center'>
                    <Star className='h-5 w-5 mr-2' />
                    あなたの訪問履歴 ({visits.length}回)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {visits.slice(0, 5).map(visit => (
                      <div
                        key={visit.id}
                        className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
                      >
                        <div className='flex items-center'>
                          <Clock className='h-4 w-4 mr-2 text-muted-foreground' />
                          <span className='font-medium'>
                            {formatDate(visit.visitedAt)}
                          </span>
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          訪問 #{visit.id}
                        </div>
                      </div>
                    ))}
                    {visits.length > 5 && (
                      <p className='text-sm text-muted-foreground text-center'>
                        他 {visits.length - 5} 回の訪問
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Action Panel */}
          <div className='space-y-6'>
            {/* Checkin Section */}
            <Card>
              <CardHeader>
                <CardTitle>チェックイン</CardTitle>
                <CardDescription>
                  この醸造所にチェックインしましょう
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CheckinButton
                  brewery={brewery}
                  userLocation={userLocation || undefined}
                  onCheckin={handleCheckin}
                />
              </CardContent>
            </Card>

            {/* Navigation */}
            <Card>
              <CardHeader>
                <CardTitle>ナビゲーション</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <Button
                  variant='outline'
                  className='w-full'
                  onClick={() => {
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${brewery.latitude},${brewery.longitude}`;
                    window.open(url, '_blank');
                  }}
                >
                  <Navigation className='h-4 w-4 mr-2' />
                  Google Mapsで開く
                </Button>

                <Button
                  variant='outline'
                  className='w-full'
                  onClick={() => router.push(ROUTES.nearbyBreweries)}
                >
                  <MapPin className='h-4 w-4 mr-2' />
                  近隣の醸造所を探す
                </Button>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>統計情報</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span>醸造所ID:</span>
                    <span className='font-mono'>{brewery.id}</span>
                  </div>
                  {authState.isAuthenticated && (
                    <div className='flex justify-between'>
                      <span>あなたの訪問回数:</span>
                      <span className='font-semibold'>{visits.length}回</span>
                    </div>
                  )}
                  {distance !== null && (
                    <div className='flex justify-between'>
                      <span>現在地からの距離:</span>
                      <span className='font-semibold'>
                        {formatDistance(distance)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
