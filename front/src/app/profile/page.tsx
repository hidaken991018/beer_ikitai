'use client';

import {
  User,
  Mail,
  Calendar,
  MapPin,
  Star,
  TrendingUp,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { useAuthContext } from '@/components/auth/AuthProvider';
import { AppLayout } from '@/components/layout/AppLayout';
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
import { Separator } from '@/components/ui/separator';
import { useBreweries } from '@/hooks/useBreweries';
import { ROUTES } from '@/lib/constants';

// Force client-side rendering for this page
export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  const router = useRouter();
  const { authState, logout } = useAuthContext();
  const { breweryState, fetchVisits, fetchBreweries } = useBreweries();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authState.isAuthenticated) {
      router.push(ROUTES.login);
    }
  }, [authState.isAuthenticated, router]);

  // Load user data
  useEffect(() => {
    if (authState.user) {
      setDisplayName(
        authState.user?.username || authState.user?.preferred_username || ''
      );
      setEmail(authState.user?.email || '');
    }
  }, [authState.user]);

  // Load user visits and breweries for statistics
  useEffect(() => {
    if (authState.isAuthenticated) {
      fetchVisits();
      fetchBreweries();
    }
  }, [authState.isAuthenticated, fetchVisits, fetchBreweries]);

  // Calculate user statistics
  const userStats = React.useMemo(() => {
    const totalVisits = breweryState?.visits?.length;
    const uniqueBreweries = new Set(breweryState?.visits.map(v => v.breweryId))
      .size;

    // Calculate favorite brewery
    const breweryVisitCounts: Record<number, number> = {};
    breweryState?.visits.forEach(visit => {
      breweryVisitCounts[visit.breweryId] =
        (breweryVisitCounts[visit.breweryId] || 0) + 1;
    });

    const favoriteBreweryId = Object.entries(breweryVisitCounts).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0];
    const favoriteBrewery = favoriteBreweryId
      ? breweryState?.breweries?.find(b => b.id === parseInt(favoriteBreweryId))
      : null;

    // Calculate recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentVisits = breweryState?.visits?.filter(
      visit => new Date(visit.visitedAt) >= thirtyDaysAgo
    )?.length;

    // Calculate join date (using first visit as approximation)
    const joinDate =
      breweryState?.visits?.length > 0
        ? new Date(
            Math.min(
              ...breweryState?.visits.map(v => new Date(v.visitedAt).getTime())
            )
          )
        : null;

    return {
      totalVisits,
      uniqueBreweries,
      favoriteBrewery,
      favoriteBreweryVisits: favoriteBreweryId
        ? breweryVisitCounts[parseInt(favoriteBreweryId)]
        : 0,
      recentVisits,
      joinDate,
      averageVisitsPerBrewery:
        uniqueBreweries > 0
          ? Math.round((totalVisits / uniqueBreweries) * 10) / 10
          : 0,
    };
  }, [breweryState?.visits, breweryState?.breweries]);

  const handleSaveProfile = async () => {
    // TODO: Implement profile update API call
    console.log('Profile update:', { displayName, email });
    setIsEditing(false);
    // In a real implementation, you would call an API to update the user profile
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push(ROUTES.home);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!authState.isAuthenticated) {
    return null; // Will redirect to login
  }

  if (breweryState?.isLoading) {
    return (
      <AppLayout>
        <div className='flex justify-center items-center py-12'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4'></div>
            <p className='text-muted-foreground'>
              プロフィール情報を読み込み中...
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className='max-w-4xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold mb-2'>プロフィール</h1>
          <p className='text-muted-foreground'>
            アカウント情報とあなたのビール体験の統計を確認できます
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Profile Information */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <div className='flex justify-between items-center'>
                  <div>
                    <CardTitle className='flex items-center'>
                      <User className='h-5 w-5 mr-2' />
                      基本情報
                    </CardTitle>
                    <CardDescription>
                      アカウントの基本情報を確認・編集できます
                    </CardDescription>
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Settings className='h-4 w-4 mr-2' />
                    {isEditing ? 'キャンセル' : '編集'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <Label htmlFor='displayName'>表示名</Label>
                    {isEditing ? (
                      <Input
                        id='displayName'
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        placeholder='表示名を入力'
                      />
                    ) : (
                      <p className='text-sm bg-gray-50 p-2 rounded border'>
                        {displayName || '未設定'}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor='email'>メールアドレス</Label>
                    <p className='text-sm bg-gray-50 p-2 rounded border flex items-center'>
                      <Mail className='h-4 w-4 mr-2 text-muted-foreground' />
                      {email || '未設定'}
                    </p>
                  </div>
                </div>

                {isEditing && (
                  <div className='flex gap-2 pt-4'>
                    <Button onClick={handleSaveProfile}>保存</Button>
                    <Button
                      variant='outline'
                      onClick={() => setIsEditing(false)}
                    >
                      キャンセル
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center'>
                  <TrendingUp className='h-5 w-5 mr-2' />
                  活動統計
                </CardTitle>
                <CardDescription>
                  あなたのビール体験の詳細な統計情報
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                  <div className='text-center p-4 bg-blue-50 rounded-lg'>
                    <Star className='h-6 w-6 mx-auto mb-2 text-blue-600' />
                    <p className='text-2xl font-bold text-blue-600'>
                      {userStats.totalVisits}
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      総チェックイン
                    </p>
                  </div>

                  <div className='text-center p-4 bg-green-50 rounded-lg'>
                    <MapPin className='h-6 w-6 mx-auto mb-2 text-green-600' />
                    <p className='text-2xl font-bold text-green-600'>
                      {userStats.uniqueBreweries}
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      訪問醸造所数
                    </p>
                  </div>

                  <div className='text-center p-4 bg-purple-50 rounded-lg'>
                    <TrendingUp className='h-6 w-6 mx-auto mb-2 text-purple-600' />
                    <p className='text-2xl font-bold text-purple-600'>
                      {userStats.averageVisitsPerBrewery}
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      平均訪問回数
                    </p>
                  </div>

                  <div className='text-center p-4 bg-orange-50 rounded-lg'>
                    <Calendar className='h-6 w-6 mx-auto mb-2 text-orange-600' />
                    <p className='text-2xl font-bold text-orange-600'>
                      {userStats.recentVisits}
                    </p>
                    <p className='text-sm text-muted-foreground'>過去30日</p>
                  </div>
                </div>

                <Separator className='my-6' />

                <div className='space-y-3'>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm font-medium'>
                      お気に入り醸造所:
                    </span>
                    <span className='text-sm'>
                      {userStats.favoriteBrewery?.name || 'なし'}
                      {userStats.favoriteBreweryVisits > 0 && (
                        <span className='text-muted-foreground ml-1'>
                          ({userStats.favoriteBreweryVisits}回)
                        </span>
                      )}
                    </span>
                  </div>

                  {userStats.joinDate && (
                    <div className='flex justify-between items-center'>
                      <span className='text-sm font-medium'>
                        初回チェックイン:
                      </span>
                      <span className='text-sm'>
                        {formatDate(userStats.joinDate)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>クイックアクション</CardTitle>
                <CardDescription>
                  よく使用する機能へのショートカット
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <Button
                    variant='outline'
                    className='w-full justify-start'
                    onClick={() => router.push(ROUTES.visits)}
                  >
                    <Calendar className='h-4 w-4 mr-2' />
                    訪問履歴を見る
                  </Button>

                  <Button
                    variant='outline'
                    className='w-full justify-start'
                    onClick={() => router.push(ROUTES.nearbyBreweries)}
                  >
                    <MapPin className='h-4 w-4 mr-2' />
                    近隣の醸造所を探す
                  </Button>

                  <Button
                    variant='outline'
                    className='w-full justify-start'
                    onClick={() => router.push(ROUTES.breweries)}
                  >
                    <Star className='h-4 w-4 mr-2' />
                    醸造所一覧を見る
                  </Button>

                  <Button
                    variant='outline'
                    className='w-full justify-start'
                    onClick={() =>
                      window.open('mailto:support@mybeerlog.com', '_blank')
                    }
                  >
                    <Mail className='h-4 w-4 mr-2' />
                    サポートに連絡
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Account Status */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center'>
                  <Shield className='h-5 w-5 mr-2' />
                  アカウント状態
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm'>ステータス:</span>
                    <span className='text-sm font-medium text-green-600'>
                      アクティブ
                    </span>
                  </div>

                  <div className='flex items-center justify-between'>
                    <span className='text-sm'>メール認証:</span>
                    <span className='text-sm font-medium text-green-600'>
                      完了
                    </span>
                  </div>

                  <div className='flex items-center justify-between'>
                    <span className='text-sm'>プラン:</span>
                    <span className='text-sm font-medium'>無料</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center'>
                  <Star className='h-5 w-5 mr-2' />
                  最近の成果
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {userStats.totalVisits >= 1 && (
                    <div className='flex items-center p-2 bg-yellow-50 rounded'>
                      <Star className='h-4 w-4 mr-2 text-yellow-600' />
                      <span className='text-sm'>初回チェックイン達成！</span>
                    </div>
                  )}

                  {userStats.uniqueBreweries >= 5 && (
                    <div className='flex items-center p-2 bg-blue-50 rounded'>
                      <MapPin className='h-4 w-4 mr-2 text-blue-600' />
                      <span className='text-sm'>5つの醸造所を制覇！</span>
                    </div>
                  )}

                  {userStats.totalVisits >= 10 && (
                    <div className='flex items-center p-2 bg-purple-50 rounded'>
                      <TrendingUp className='h-4 w-4 mr-2 text-purple-600' />
                      <span className='text-sm'>10回チェックイン達成！</span>
                    </div>
                  )}

                  {userStats.totalVisits === 0 && (
                    <p className='text-sm text-muted-foreground text-center'>
                      醸造所をチェックインして
                      <br />
                      最初の成果を獲得しよう！
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card>
              <CardHeader>
                <CardTitle>アカウント操作</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <Button
                  variant='outline'
                  className='w-full justify-start'
                  onClick={() => {
                    // TODO: Implement password change
                    alert('パスワード変更機能は準備中です');
                  }}
                >
                  <Shield className='h-4 w-4 mr-2' />
                  パスワード変更
                </Button>

                <Button
                  variant='destructive'
                  className='w-full justify-start'
                  onClick={handleLogout}
                >
                  <LogOut className='h-4 w-4 mr-2' />
                  ログアウト
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
