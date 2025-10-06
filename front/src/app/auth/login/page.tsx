'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { useAuthContext } from '@/components/auth/AuthProvider';
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
import ProfileSetupForm from '@/components/user/ProfileSetupForm';
import { userProfileApi } from '@/lib/api/user';
import { ROUTES, VALIDATION } from '@/lib/constants';
import type { LoginCredentials } from '@/types/auth';
import type { ProfileCreateForm } from '@/types/user';

type PageState = 'login' | 'profile-setup' | 'redirecting';

export default function LoginPage() {
  const router = useRouter();
  const { login, authState } = useAuthContext();
  const [pageState, setPageState] = useState<PageState>('login');
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<LoginCredentials>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Redirect to home if already logged in
  useEffect(() => {
    if (authState.isAuthenticated && !authState.isLoading) {
      router.push(ROUTES.home);
    }
  }, [authState, router]);

  /**
   * プロフィール存在確認処理
   *
   * @description ログイン成功後にプロフィールの存在を確認し、
   * 存在しない場合はプロフィール作成画面を表示する
   */
  const checkUserProfile = async (): Promise<void> => {
    try {
      // プロフィール存在確認
      await userProfileApi.getProfile();
      
      // プロフィールが存在する場合はホームページへリダイレクト
      setPageState('redirecting');
      router.push(ROUTES.home);
    } catch (error: any) {
      if (error?.status === 404) {
        // プロフィールが存在しない場合はプロフィール作成画面へ
        setPageState('profile-setup');
      } else {
        // その他のエラーの場合
        console.error('プロフィール確認エラー:', error);
        setProfileError(
          'プロフィール情報の確認に失敗しました。再度ログインしてください。'
        );
        // エラー時はログイン画面に戻る
        setPageState('login');
      }
    }
  };

  /**
   * プロフィール作成処理
   *
   * @param profileData - 作成するプロフィールデータ
   */
  const handleProfileCreate = async (
    profileData: ProfileCreateForm
  ): Promise<void> => {
    try {
      setProfileError(null);
      
      // プロフィール作成
      await userProfileApi.createProfile(profileData);
      
      // 作成成功後、ホームページへリダイレクト
      setPageState('redirecting');
      router.push(ROUTES.home);
    } catch (error: any) {
      console.error('プロフィール作成エラー:', error);
      
      if (error?.status === 409) {
        setProfileError('プロフィールが既に存在します。');
        // 既存の場合はホームページへリダイレクト
        setPageState('redirecting');
        router.push(ROUTES.home);
      } else {
        setProfileError(
          error?.message || 'プロフィールの作成に失敗しました。'
        );
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginCredentials> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'メールアドレスは必須です';
    } else if (!VALIDATION.email.pattern.test(formData.email)) {
      newErrors.email = VALIDATION.email.message;
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'パスワードは必須です';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setProfileError(null);
    
    try {
      // ログイン実行
      await login(formData);
      
      // ログイン成功後、プロフィール存在確認
      await checkUserProfile();
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name as keyof LoginCredentials]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // プロフィール作成画面を表示
  if (pageState === 'profile-setup') {
    return (
      <ProfileSetupForm
        onSubmit={handleProfileCreate}
        isSubmitting={isSubmitting}
        error={profileError}
      />
    );
  }

  // リダイレクト中の表示
  if (pageState === 'redirecting' || (authState.isAuthenticated && !authState.isLoading)) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-md w-full space-y-8'>
          <Card>
            <CardContent className='pt-6'>
              <div className='text-center'>
                <p className='text-sm text-gray-600'>
                  ホームページへリダイレクトしています...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ログイン画面の表示
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <Card>
          <CardHeader className='space-y-1'>
            <CardTitle className='text-2xl text-center'>ログイン</CardTitle>
            <CardDescription className='text-center'>
              My Beer Logにログインしてビール記録を始めましょう
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='email'>メールアドレス</Label>
                <Input
                  id='email'
                  name='email'
                  type='email'
                  autoComplete='email'
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder='例: user@example.com'
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className='text-sm text-red-600'>{errors.email}</p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='password'>パスワード</Label>
                <Input
                  id='password'
                  name='password'
                  type='password'
                  autoComplete='current-password'
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder='パスワードを入力'
                  className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && (
                  <p className='text-sm text-red-600'>{errors.password}</p>
                )}
              </div>

              {(authState.error || profileError) && (
                <div className='bg-red-50 border border-red-200 rounded-md p-3'>
                  <p className='text-sm text-red-600'>
                    {authState.error || profileError}
                  </p>
                </div>
              )}

              <Button
                type='submit'
                className='w-full'
                disabled={isSubmitting}
              >
                {isSubmitting ? 'ログイン中...' : 'ログイン'}
              </Button>
            </form>

            <div className='mt-6'>
              <div className='relative'>
                <div className='absolute inset-0 flex items-center'>
                  <div className='w-full border-t border-gray-300' />
                </div>
                <div className='relative flex justify-center text-sm'>
                  <span className='px-2 bg-white text-gray-500'>または</span>
                </div>
              </div>

              <div className='mt-6 space-y-4'>
                <div className='text-center'>
                  <Link
                    href={ROUTES.register}
                    className='text-sm text-blue-600 hover:text-blue-500'
                  >
                    アカウントをお持ちでない方はこちら
                  </Link>
                </div>

                <div className='text-center'>
                  <Link
                    href='/auth/forgot-password'
                    className='text-sm text-gray-600 hover:text-gray-500'
                  >
                    パスワードを忘れた方
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}