'use client';

import {
  User,
  Mail,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { MobileLayout } from '@/components/layout/MobileLayout';
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
import { useAuth } from '@/hooks/useAuth';
import { useBreweries } from '@/hooks/useBreweries';
import { ROUTES } from '@/lib/constants';
import { AuthState } from '@/types/auth';

// Force client-side rendering for this page
export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  const router = useRouter();
  const { logout } = useAuth()
  const authState: AuthState = useSelector((state: any) => state.auth);
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

  if (!authState?.isAuthenticated) {
    return null; // Will redirect to login
  }

  if (breweryState?.isLoading) {
    return (
      <MobileLayout showBottomNav>
        <div className='flex justify-center items-center py-12'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4'></div>
            <p className='text-muted-foreground'>
              プロフィール情報を読み込み中...
            </p>
          </div>
        </div>
        <BottomNavigation />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout showBottomNav>
      <div className='p-4 pb-20'>
        {/* Header */}
        <div className='mb-6'>
          <h1 className='text-2xl font-bold mb-2'>プロフィール</h1>
          <p className='text-sm text-gray-600'>
            アカウント情報とあなたのビール体験の統計を確認できます
          </p>
        </div>

        <div className='space-y-6'>
          {/* Basic Information */}
          <div>
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
          </div>

          {/* Account Status & Actions */}
          <div>
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

            {/* Recent Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center'>
                  問い合わせ
                </CardTitle>
              </CardHeader>
              <CardContent>
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

              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <BottomNavigation />
    </MobileLayout>
  );
}
