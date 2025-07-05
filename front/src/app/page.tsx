'use client';

import { MapPin, Navigation, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

import { useAuthContext } from '@/components/auth/AuthProvider';
import { BreweryCard } from '@/components/brewery/BreweryCard';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useBreweries } from '@/hooks/useBreweries';
import { useGeolocation } from '@/hooks/useGeolocation';
import { ROUTES, APP_CONFIG } from '@/lib/constants';

// Force client-side rendering for this page
export const dynamic = 'force-dynamic';

export default function HomePage() {
  const router = useRouter();
  const { authState } = useAuthContext();
  const {
    breweryState,
    fetchBreweries,
    fetchNearbyBreweries,
    fetchVisits,
    checkin,
  } = useBreweries();

  const { position: userLocation, getCurrentPosition } = useGeolocation();

  // Load initial data
  useEffect(() => {
    // Load recent breweries
    fetchBreweries({ limit: 6 });

    // Load user visits if authenticated
    if (authState.isAuthenticated) {
      fetchVisits({ limit: 5 });
    }
  }, [fetchBreweries, fetchVisits, authState.isAuthenticated]);

  // Load nearby breweries when location is available
  useEffect(() => {
    if (userLocation) {
      fetchNearbyBreweries(userLocation, { limit: 4 });
    }
  }, [userLocation, fetchNearbyBreweries]);

  // Get user location on mount
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

  const handleViewDetails = (breweryId: number) => {
    router.push(ROUTES.breweryDetail(breweryId));
  };

  const recentBreweries = breweryState?.breweries.slice(0, 6);
  const nearbyBreweries = breweryState?.nearbyBreweries.slice(0, 4);
  const recentVisits = breweryState?.visits.slice(0, 3);

  return (
    <AppLayout>
      <div className='min-h-screen'>
        {/* Hero Section */}
        <section className='bg-gradient-to-br from-blue-50 to-indigo-100 py-16 -mx-4 -mt-6'>
          <div className='container mx-auto px-4 text-center'>
            <h1 className='text-4xl md:text-6xl font-bold text-gray-900 mb-4'>
              {APP_CONFIG.name}
            </h1>
            <p className='text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto'>
              GPSベースの醸造所チェックイン機能で、あなたのクラフトビール体験を記録しよう
            </p>

            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              {authState.isAuthenticated ? (
                <>
                  <Button
                    size='lg'
                    onClick={() => router.push(ROUTES.nearbyBreweries)}
                  >
                    <Navigation className='h-5 w-5 mr-2' />
                    近隣の醸造所を探す
                  </Button>
                  <Button
                    variant='outline'
                    size='lg'
                    onClick={() => router.push(ROUTES.breweries)}
                  >
                    <MapPin className='h-5 w-5 mr-2' />
                    すべての醸造所を見る
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size='lg'
                    onClick={() => router.push(ROUTES.register)}
                  >
                    無料で始める
                  </Button>
                  <Button
                    variant='outline'
                    size='lg'
                    onClick={() => router.push(ROUTES.login)}
                  >
                    ログイン
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>
      </div>

      <div className='container mx-auto px-4 py-12'>
        {/* Stats Section for Authenticated Users */}
        {authState.isAuthenticated && (
          <section className='mb-12'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <Card>
                <CardContent className='p-6 text-center'>
                  <TrendingUp className='h-8 w-8 mx-auto mb-2 text-blue-600' />
                  <h3 className='text-2xl font-bold'>
                    {breweryState?.visits?.length}
                  </h3>
                  <p className='text-muted-foreground'>総チェックイン数</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className='p-6 text-center'>
                  <MapPin className='h-8 w-8 mx-auto mb-2 text-green-600' />
                  <h3 className='text-2xl font-bold'>
                    {new Set(breweryState?.visits.map(v => v.breweryId)).size}
                  </h3>
                  <p className='text-muted-foreground'>訪問した醸造所数</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className='p-6 text-center'>
                  <Users className='h-8 w-8 mx-auto mb-2 text-purple-600' />
                  <h3 className='text-2xl font-bold'>
                    {breweryState?.breweries?.length}
                  </h3>
                  <p className='text-muted-foreground'>登録醸造所数</p>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* Recent Visits Section (Authenticated Users Only) */}
        {authState.isAuthenticated && recentVisits?.length > 0 && (
          <section className='mb-12'>
            <div className='flex justify-between items-center mb-6'>
              <h2 className='text-2xl font-bold'>最近の訪問</h2>
              <Link href={ROUTES.visits}>
                <Button variant='outline'>すべて見る</Button>
              </Link>
            </div>

            <div className='space-y-4'>
              {recentVisits?.map(visit => (
                <Card key={visit.id}>
                  <CardContent className='p-4'>
                    <div className='flex justify-between items-center'>
                      <div>
                        <h3 className='font-semibold'>
                          {visit.brewery?.name ||
                            `醸造所 ID: ${visit.breweryId}`}
                        </h3>
                        <p className='text-sm text-muted-foreground'>
                          {new Date(visit.visitedAt).toLocaleString('ja-JP')}
                        </p>
                      </div>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleViewDetails(visit.breweryId)}
                      >
                        詳細を見る
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Nearby Breweries Section */}
        {userLocation && nearbyBreweries?.length > 0 && (
          <section className='mb-12'>
            <div className='flex justify-between items-center mb-6'>
              <h2 className='text-2xl font-bold'>近隣の醸造所</h2>
              <Link href={ROUTES.nearbyBreweries}>
                <Button variant='outline'>すべて見る</Button>
              </Link>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
              {nearbyBreweries.map(brewery => (
                <BreweryCard
                  key={brewery.id}
                  brewery={brewery}
                  distance={brewery.distance}
                  onCheckin={handleCheckin}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          </section>
        )}

        {/* Recent Breweries Section */}
        <section className='mb-12'>
          <div className='flex justify-between items-center mb-6'>
            <h2 className='text-2xl font-bold'>最近登録された醸造所</h2>
            <Link href={ROUTES.breweries}>
              <Button variant='outline'>すべて見る</Button>
            </Link>
          </div>

          {recentBreweries?.length > 0 ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {recentBreweries.map(brewery => {
                const distance = userLocation
                  ? (() => {
                      const R = 6371; // Earth's radius in km
                      const dLat =
                        (brewery.latitude - userLocation.latitude) *
                        (Math.PI / 180);
                      const dLon =
                        (brewery.longitude - userLocation.longitude) *
                        (Math.PI / 180);
                      const a =
                        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(userLocation.latitude * (Math.PI / 180)) *
                          Math.cos(brewery.latitude * (Math.PI / 180)) *
                          Math.sin(dLon / 2) *
                          Math.sin(dLon / 2);
                      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                      return R * c;
                    })()
                  : undefined;

                return (
                  <BreweryCard
                    key={brewery.id}
                    brewery={brewery}
                    distance={distance}
                    onCheckin={handleCheckin}
                    onViewDetails={handleViewDetails}
                  />
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className='p-12 text-center'>
                <h3 className='text-lg font-semibold mb-2'>
                  醸造所を読み込み中...
                </h3>
                <p className='text-muted-foreground'>
                  {breweryState?.isLoading
                    ? 'データを取得しています'
                    : 'しばらくお待ちください'}
                </p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Call to Action for Non-Authenticated Users */}
        {!authState.isAuthenticated && (
          <section className='text-center py-16 bg-gray-50 rounded-lg'>
            <h2 className='text-3xl font-bold mb-4'>今すぐ始めよう</h2>
            <p className='text-xl text-muted-foreground mb-8 max-w-2xl mx-auto'>
              無料アカウントを作成して、あなたのビール体験を記録・共有しましょう。
              位置情報を使った便利なチェックイン機能で、新しい醸造所を発見できます。
            </p>

            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Button size='lg' onClick={() => router.push(ROUTES.register)}>
                無料で始める
              </Button>
              <Button
                variant='outline'
                size='lg'
                onClick={() => router.push(ROUTES.breweries)}
              >
                醸造所を見る
              </Button>
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
