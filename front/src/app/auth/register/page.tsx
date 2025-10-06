'use client';

import Link from 'next/link';
import { useState } from 'react';

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
import { apiClient } from '@/lib/api/client';
import { cognitoAuthService } from '@/lib/auth/cognito';
import { ROUTES, VALIDATION } from '@/lib/constants';
import type { RegisterCredentials } from '@/types/auth';
import type { UserProfileInput } from '@/types/api';

export default function RegisterPage() {
  const { register, authState } = useAuthContext();
  const [formData, setFormData] = useState<RegisterCredentials>({
    email: '',
    password: '',
    confirmPassword: '',
    givenName: '',
    familyName: '',
    displayName: '',
  });
  const [errors, setErrors] = useState<Partial<RegisterCredentials>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterCredentials> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'メールアドレスは必須です';
    } else if (!VALIDATION.email.pattern.test(formData.email)) {
      newErrors.email = VALIDATION.email.message;
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'パスワードは必須です';
    } else if (formData.password.length < VALIDATION.password.minLength) {
      newErrors.password = VALIDATION.password.message;
    } else if (!VALIDATION.password.pattern.test(formData.password)) {
      newErrors.password = VALIDATION.password.message;
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'パスワードの確認は必須です';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'パスワードが一致しません';
    }

    // Given name validation (optional)
    if (formData.givenName && formData.givenName.length > 50) {
      newErrors.givenName = '名前は50文字以下で入力してください';
    }

    // Family name validation (optional)
    if (formData.familyName && formData.familyName.length > 50) {
      newErrors.familyName = '姓は50文字以下で入力してください';
    }

    // Display name validation (optional)
    if (formData.displayName && formData.displayName.length > 50) {
      newErrors.displayName = '表示名は50文字以下で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateDisplayName = (givenName?: string, familyName?: string, displayName?: string): string => {
    // displayNameが指定されている場合はそれを使用
    if (displayName && displayName.trim()) {
      return displayName.trim();
    }
    
    // displayNameが未指定の場合は、姓名から生成
    const names = [familyName, givenName].filter(name => name && name.trim());
    if (names.length > 0) {
      return names.join('');
    }
    
    // 姓名も未指定の場合はメールアドレスのローカル部を使用
    return formData.email.split('@')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // 1. Cognito ユーザー登録
      await register(formData);
      
      // 2. 登録成功後、JWTトークンを取得してプロフィール作成
      try {
        const tokens = await cognitoAuthService.getTokens();
        
        if (tokens.idToken) {
          // APIクライアントにトークンを設定
          apiClient.setIdToken(tokens.idToken);
          
          // プロフィール作成API呼び出し
          const displayName = generateDisplayName(
            formData.givenName,
            formData.familyName,
            formData.displayName
          );
          
          const profileData: UserProfileInput = {
            displayName: displayName,
          };
          
          await apiClient.post('/users/profile', profileData);
          console.log('ユーザープロフィールが作成されました');
        }
      } catch (profileError) {
        // プロフィール作成エラーは警告として扱う
        console.warn('プロフィール作成に失敗しましたが、アカウント登録は完了しています:', profileError);
      }
      
      setIsSubmitted(true);
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name as keyof RegisterCredentials]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (isSubmitted) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-md w-full space-y-8'>
          <Card>
            <CardHeader className='space-y-1'>
              <CardTitle className='text-2xl text-center'>
                確認メールを送信しました
              </CardTitle>
              <CardDescription className='text-center'>
                {formData.email} に確認メールを送信しました
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <p className='text-sm text-gray-600 text-center'>
                  メールに記載されている確認コードを使用してアカウントを有効化してください。
                </p>

                <div className='text-center'>
                  <Link
                    href={ROUTES.confirmSignup}
                    className='text-blue-600 hover:text-blue-500'
                  >
                    <Button>確認コードを入力</Button>
                  </Link>
                </div>

                <div className='text-center'>
                  <Link
                    href={ROUTES.login}
                    className='text-sm text-gray-600 hover:text-gray-500'
                  >
                    ログインページに戻る
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <Card>
          <CardHeader className='space-y-1'>
            <CardTitle className='text-2xl text-center'>
              アカウント作成
            </CardTitle>
            <CardDescription className='text-center'>
              My Beer Logのアカウントを作成してビール記録を始めましょう
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

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='givenName'>名前（任意）</Label>
                  <Input
                    id='givenName'
                    name='givenName'
                    type='text'
                    autoComplete='given-name'
                    value={formData.givenName}
                    onChange={handleInputChange}
                    placeholder='例: 太郎'
                    className={errors.givenName ? 'border-red-500' : ''}
                  />
                  {errors.givenName && (
                    <p className='text-sm text-red-600'>{errors.givenName}</p>
                  )}
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='familyName'>姓（任意）</Label>
                  <Input
                    id='familyName'
                    name='familyName'
                    type='text'
                    autoComplete='family-name'
                    value={formData.familyName}
                    onChange={handleInputChange}
                    placeholder='例: 田中'
                    className={errors.familyName ? 'border-red-500' : ''}
                  />
                  {errors.familyName && (
                    <p className='text-sm text-red-600'>{errors.familyName}</p>
                  )}
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='displayName'>表示名（任意）</Label>
                <Input
                  id='displayName'
                  name='displayName'
                  type='text'
                  value={formData.displayName}
                  onChange={handleInputChange}
                  placeholder='例: ビールタロウ（未入力の場合は姓名から自動生成）'
                  className={errors.displayName ? 'border-red-500' : ''}
                />
                {errors.displayName && (
                  <p className='text-sm text-red-600'>{errors.displayName}</p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='password'>パスワード</Label>
                <Input
                  id='password'
                  name='password'
                  type='password'
                  autoComplete='new-password'
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder='8文字以上、大文字・小文字・数字を含む'
                  className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && (
                  <p className='text-sm text-red-600'>{errors.password}</p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='confirmPassword'>パスワード確認</Label>
                <Input
                  id='confirmPassword'
                  name='confirmPassword'
                  type='password'
                  autoComplete='new-password'
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder='上記と同じパスワードを入力'
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                />
                {errors.confirmPassword && (
                  <p className='text-sm text-red-600'>
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {authState.error && (
                <div className='bg-red-50 border border-red-200 rounded-md p-3'>
                  <p className='text-sm text-red-600'>{authState.error}</p>
                </div>
              )}

              <Button
                type='submit'
                className='w-full'
                disabled={authState.isLoading}
              >
                {authState.isLoading ? 'アカウント作成中...' : 'アカウント作成'}
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

              <div className='mt-6 text-center'>
                <Link
                  href={ROUTES.login}
                  className='text-sm text-blue-600 hover:text-blue-500'
                >
                  既にアカウントをお持ちの方はこちら
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}