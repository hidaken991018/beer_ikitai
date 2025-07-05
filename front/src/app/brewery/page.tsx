'use client';

import { Search, Filter, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import {
  BreweryCard,
  BreweryCardCompact,
} from '@/components/brewery/BreweryCard';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useBreweries } from '@/hooks/useBreweries';
import { useGeolocation } from '@/hooks/useGeolocation';
import { ROUTES } from '@/lib/constants';

type ViewMode = 'grid' | 'list';

// Force client-side rendering for this page
export const dynamic = 'force-dynamic';

export default function BreweryPage() {
  const router = useRouter();
  const {
    breweryState,
    fetchBreweries,
    searchBreweries,
    setSearch,
    resetSearch,
    clearErrors,
    checkin,
  } = useBreweries();

  const { position: userLocation, getCurrentPosition } = useGeolocation();

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchInput, setSearchInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Load breweries on component mount
  useEffect(() => {
    fetchBreweries({ limit: breweryState?.filters?.limit });
  }, [fetchBreweries, breweryState?.filters?.limit]);

  // Get user location on mount
  useEffect(() => {
    getCurrentPosition();
  }, [getCurrentPosition]);

  const handleSearch = async () => {
    if (!searchInput.trim()) {
      await fetchBreweries({ limit: breweryState?.filters.limit });
      setSearch('');
      return;
    }

    setIsSearching(true);
    try {
      await searchBreweries({
        query: searchInput,
        location: userLocation || undefined,
        radius: breweryState?.filters.radius,
        limit: breweryState?.filters.limit,
      });
      setSearch(searchInput);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleReset = async () => {
    setSearchInput('');
    resetSearch();
    await fetchBreweries({ limit: breweryState?.filters.limit });
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

  const filteredBreweries = breweryState?.breweries.filter(brewery => {
    if (!breweryState?.searchQuery) return true;
    const query = breweryState?.searchQuery.toLowerCase();
    return (
      brewery.name.toLowerCase().includes(query) ||
      brewery.address?.toLowerCase().includes(query) ||
      brewery.description?.toLowerCase().includes(query)
    );
  });

  return (
    <div className='container mx-auto px-4 py-6'>
      {/* Header */}
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-6'>
        <div>
          <h1 className='text-3xl font-bold mb-2'>醸造所一覧</h1>
          <p className='text-muted-foreground'>
            {filteredBreweries?.length}件の醸造所が見つかりました
          </p>
        </div>

        <div className='flex space-x-2 mt-4 md:mt-0'>
          <Button
            variant='outline'
            onClick={() => router.push(ROUTES.nearbyBreweries)}
          >
            <MapPin className='h-4 w-4 mr-2' />
            近隣の醸造所
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className='mb-6'>
        <CardHeader>
          <CardTitle className='text-lg'>検索・フィルター</CardTitle>
          <CardDescription>醸造所名、住所、説明で検索できます</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4'>
            <div className='flex-1'>
              <div className='flex space-x-2'>
                <Input
                  placeholder='醸造所を検索...'
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  className='flex-1'
                />
                <Button
                  onClick={handleSearch}
                  disabled={isSearching || breweryState?.isLoading}
                >
                  <Search className='h-4 w-4 mr-2' />
                  {isSearching ? '検索中...' : '検索'}
                </Button>
                <Button
                  variant='outline'
                  onClick={handleReset}
                  disabled={breweryState?.isLoading}
                >
                  リセット
                </Button>
              </div>
            </div>

            <div className='flex items-center space-x-2'>
              <Filter className='h-4 w-4' />
              <select
                className='px-3 py-2 border rounded-md'
                value={viewMode}
                onChange={e => setViewMode(e.target.value as ViewMode)}
              >
                <option value='grid'>グリッド表示</option>
                <option value='list'>リスト表示</option>
              </select>
            </div>
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

      {/* Loading State */}
      {breweryState?.isLoading && (
        <div className='flex justify-center items-center py-12'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4'></div>
            <p className='text-muted-foreground'>醸造所を読み込み中...</p>
          </div>
        </div>
      )}

      {/* Brewery Grid/List */}
      {!breweryState?.isLoading && (
        <>
          {filteredBreweries?.length === 0 ? (
            <Card>
              <CardContent className='p-12 text-center'>
                <h3 className='text-lg font-semibold mb-2'>
                  醸造所が見つかりませんでした
                </h3>
                <p className='text-muted-foreground mb-4'>
                  検索条件を変更するか、新しい醸造所を追加してください。
                </p>
                <Button onClick={handleReset}>検索をリセット</Button>
              </CardContent>
            </Card>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                  : 'space-y-4'
              }
            >
              {filteredBreweries?.map(brewery => {
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

                return viewMode === 'grid' ? (
                  <BreweryCard
                    key={brewery.id}
                    brewery={brewery}
                    distance={distance}
                    onCheckin={handleCheckin}
                    onViewDetails={handleViewDetails}
                  />
                ) : (
                  <BreweryCardCompact
                    key={brewery.id}
                    brewery={brewery}
                    distance={distance}
                    onCheckin={handleCheckin}
                    onViewDetails={handleViewDetails}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Load More Button */}
      {!breweryState?.isLoading && filteredBreweries?.length > 0 && (
        <div className='flex justify-center mt-8'>
          <Button
            variant='outline'
            onClick={() =>
              fetchBreweries({
                limit: breweryState?.filters.limit + 20,
              })
            }
            disabled={breweryState?.isLoading}
          >
            さらに読み込む
          </Button>
        </div>
      )}
    </div>
  );
}
