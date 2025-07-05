'use client';

import { Calendar, MapPin, Search, Filter, Clock, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { useAuthContext } from '@/components/auth/AuthProvider';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBreweries } from '@/hooks/useBreweries';
import { ROUTES } from '@/lib/constants';

// Force client-side rendering for this page
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default function VisitsPage() {
  const router = useRouter();
  const { authState } = useAuthContext();
  const { breweryState, fetchVisits, fetchBreweries } = useBreweries();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'brewery'>('date');
  const [filterPeriod, setFilterPeriod] = useState<
    'all' | 'week' | 'month' | 'year'
  >('all');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authState.isAuthenticated) {
      router.push(ROUTES.login);
    }
  }, [authState.isAuthenticated, router]);

  // Load visits and breweries
  useEffect(() => {
    if (authState.isAuthenticated) {
      fetchVisits();
      fetchBreweries();
    }
  }, [authState.isAuthenticated, fetchVisits, fetchBreweries]);

  // Filter and sort visits
  const filteredAndSortedVisits = React.useMemo(() => {
    let filtered = [...(breweryState?.visits ?? [])];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(visit => {
        const brewery = breweryState?.breweries.find(
          b => b.id === visit.breweryId
        );
        return (
          brewery?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          brewery?.address?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }

    // Filter by time period
    if (filterPeriod !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (filterPeriod) {
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      filtered = filtered.filter(
        visit => new Date(visit.visitedAt) >= filterDate
      );
    }

    // Sort visits
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return (
          new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime()
        );
      } else {
        const breweryA = breweryState?.breweries.find(
          br => br.id === a.breweryId
        );
        const breweryB = breweryState?.breweries.find(
          br => br.id === b.breweryId
        );
        return (breweryA?.name || '').localeCompare(breweryB?.name || '');
      }
    });

    return filtered;
  }, [
    breweryState?.visits,
    breweryState?.breweries,
    searchQuery,
    sortBy,
    filterPeriod,
  ]);

  // Group visits by brewery for statistics
  const visitStats = React.useMemo(() => {
    const breweryVisitCounts: Record<number, number> = {};
    breweryState?.visits.forEach(visit => {
      breweryVisitCounts[visit.breweryId] =
        (breweryVisitCounts[visit.breweryId] || 0) + 1;
    });

    const uniqueBreweries = Object.keys(breweryVisitCounts).length;
    const totalVisits = breweryState?.visits.length;
    const favoriteBreweryId = Object.entries(breweryVisitCounts).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0];
    const favoriteBrewery = favoriteBreweryId
      ? breweryState?.breweries.find(b => b.id === parseInt(favoriteBreweryId))
      : null;

    return {
      uniqueBreweries,
      totalVisits,
      favoriteBrewery,
      favoriteBreweryVisits: favoriteBreweryId
        ? breweryVisitCounts[parseInt(favoriteBreweryId)]
        : 0,
    };
  }, [breweryState?.visits, breweryState?.breweries]);

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

  const getBreweryName = (breweryId: number): string => {
    const brewery = breweryState?.breweries.find(b => b.id === breweryId);
    return brewery?.name || `醸造所 ID: ${breweryId}`;
  };

  const getBreweryAddress = (breweryId: number): string | undefined => {
    const brewery = breweryState?.breweries.find(b => b.id === breweryId);
    return brewery?.address;
  };

  const handleViewBrewery = (breweryId: number) => {
    router.push(ROUTES.breweryDetail(breweryId));
  };

  if (!authState.isAuthenticated) {
    return null; // Will redirect to login
  }

  if (breweryState.isLoading) {
    return (
      <AppLayout>
        <div className='flex justify-center items-center py-12'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4'></div>
            <p className='text-muted-foreground'>訪問履歴を読み込み中...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className='max-w-6xl mx-auto'>
        Header
        <div className='mb-8'>
          <h1 className='text-3xl font-bold mb-2'>訪問履歴</h1>
          <p className='text-muted-foreground'>
            あなたの醸造所チェックイン記録を確認できます
          </p>
        </div>
        {/* Statistics Cards */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
          <Card>
            <CardContent className='p-6 text-center'>
              <Star className='h-8 w-8 mx-auto mb-2 text-yellow-600' />
              <h3 className='text-2xl font-bold'>{visitStats.totalVisits}</h3>
              <p className='text-muted-foreground'>総チェックイン数</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6 text-center'>
              <MapPin className='h-8 w-8 mx-auto mb-2 text-blue-600' />
              <h3 className='text-2xl font-bold'>
                {visitStats.uniqueBreweries}
              </h3>
              <p className='text-muted-foreground'>訪問醸造所数</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6 text-center'>
              <Clock className='h-8 w-8 mx-auto mb-2 text-green-600' />
              <h3 className='text-2xl font-bold'>
                {visitStats.totalVisits > 0
                  ? Math.round(
                      (visitStats.totalVisits / visitStats.uniqueBreweries) * 10
                    ) / 10
                  : 0}
              </h3>
              <p className='text-muted-foreground'>平均訪問回数</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6 text-center'>
              <Calendar className='h-8 w-8 mx-auto mb-2 text-purple-600' />
              <h3
                className='text-lg font-bold truncate'
                title={visitStats.favoriteBrewery?.name}
              >
                {visitStats.favoriteBrewery?.name?.substring(0, 10) || 'なし'}
                {(visitStats.favoriteBrewery?.name?.length || 0) > 10
                  ? '...'
                  : ''}
              </h3>
              <p className='text-muted-foreground'>
                お気に入り ({visitStats.favoriteBreweryVisits}回)
              </p>
            </CardContent>
          </Card>
        </div>
        {/* Filters and Search */}
        <Card className='mb-6'>
          <CardHeader>
            <CardTitle className='flex items-center'>
              <Filter className='h-5 w-5 mr-2' />
              フィルター・検索
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <label className='text-sm font-medium mb-2 block'>検索</label>
                <div className='relative'>
                  <Search className='h-4 w-4 absolute left-3 top-3 text-muted-foreground' />
                  <Input
                    placeholder='醸造所名で検索...'
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className='pl-10'
                  />
                </div>
              </div>

              <div>
                <label className='text-sm font-medium mb-2 block'>並び順</label>
                <Select
                  value={sortBy}
                  onValueChange={(value: 'date' | 'brewery') =>
                    setSortBy(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='date'>日付順</SelectItem>
                    <SelectItem value='brewery'>醸造所名順</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className='text-sm font-medium mb-2 block'>期間</label>
                <Select
                  value={filterPeriod}
                  onValueChange={(value: 'all' | 'week' | 'month' | 'year') =>
                    setFilterPeriod(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>すべて</SelectItem>
                    <SelectItem value='week'>過去1週間</SelectItem>
                    <SelectItem value='month'>過去1ヶ月</SelectItem>
                    <SelectItem value='year'>過去1年</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Visits List */}
        {filteredAndSortedVisits.length > 0 ? (
          <div className='space-y-4'>
            {filteredAndSortedVisits.map(visit => (
              <Card
                key={visit.id}
                className='hover:shadow-md transition-shadow'
              >
                <CardContent className='p-6'>
                  <div className='flex justify-between items-start'>
                    <div className='flex-1'>
                      <div className='flex items-start justify-between mb-2'>
                        <h3 className='text-lg font-semibold'>
                          {getBreweryName(visit.breweryId)}
                        </h3>
                        <span className='text-sm text-muted-foreground'>
                          #{visit.id}
                        </span>
                      </div>

                      {getBreweryAddress(visit.breweryId) && (
                        <p className='text-sm text-muted-foreground mb-2 flex items-center'>
                          <MapPin className='h-4 w-4 mr-1' />
                          {getBreweryAddress(visit.breweryId)}
                        </p>
                      )}

                      <div className='flex items-center text-sm text-muted-foreground'>
                        <Clock className='h-4 w-4 mr-1' />
                        {formatDate(visit.visitedAt)}
                      </div>
                    </div>

                    <div className='ml-4'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleViewBrewery(visit.breweryId)}
                      >
                        詳細を見る
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className='p-12 text-center'>
              <Calendar className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
              <h3 className='text-lg font-semibold mb-2'>
                {searchQuery || filterPeriod !== 'all'
                  ? '該当する訪問履歴がありません'
                  : 'まだ訪問履歴がありません'}
              </h3>
              <p className='text-muted-foreground mb-4'>
                {searchQuery || filterPeriod !== 'all'
                  ? '検索条件を変更して再度お試しください'
                  : '醸造所をチェックインして記録を始めましょう'}
              </p>
              <div className='space-x-2'>
                {searchQuery || filterPeriod !== 'all' ? (
                  <Button
                    variant='outline'
                    onClick={() => {
                      setSearchQuery('');
                      setFilterPeriod('all');
                    }}
                  >
                    フィルターをクリア
                  </Button>
                ) : null}
                <Button onClick={() => router.push(ROUTES.breweries)}>
                  醸造所を探す
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
