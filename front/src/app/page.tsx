'use client';

import { MapPin, Navigation } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useBreweries } from '@/hooks/useBreweries';
import { useGeolocation } from '@/hooks/useGeolocation';
import { ROUTES, APP_CONFIG } from '@/lib/constants';


// Force client-side rendering for this page
export const dynamic = 'force-dynamic';

export default function HomePage() {
  const router = useRouter();
  const authState = useSelector((state: any) => state.auth);
  const {
    fetchBreweries,
    fetchNearbyBreweries,
    fetchVisits,
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
    </AppLayout>
  );
}
