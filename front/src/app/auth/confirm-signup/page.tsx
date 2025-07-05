'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
import { ROUTES } from '@/lib/constants';
import type { ConfirmSignUpInput } from '@/types/auth';

export default function ConfirmSignupPage() {
  const searchParams = useSearchParams();
  const { confirmSignUp, authState } = useAuthContext();
  const [formData, setFormData] = useState<ConfirmSignUpInput>({
    email: '',
    confirmationCode: '',
  });
  const [errors, setErrors] = useState<Partial<ConfirmSignUpInput>>({});
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-populate email from URL params or localStorage
  useEffect(() => {
    const emailFromUrl = searchParams.get('email');
    const emailFromStorage = localStorage.getItem('pending_confirmation_email');
    
    if (emailFromUrl) {
      setFormData(prev => ({ ...prev, email: emailFromUrl }));
    } else if (emailFromStorage) {
      setFormData(prev => ({ ...prev, email: emailFromStorage }));
    }
  }, [searchParams]);

  const validateForm = (): boolean => {
    const newErrors: Partial<ConfirmSignUpInput> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'メールアドレスは必須です';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    // Code validation
    if (!formData.confirmationCode) {
      newErrors.confirmationCode = '確認コードは必須です';
    } else if (!/^\d{6}$/.test(formData.confirmationCode)) {
      newErrors.confirmationCode = '確認コードは6桁の数字で入力してください';
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
    try {
      await confirmSignUp(formData);
      
      // Clear stored email after successful confirmation
      localStorage.removeItem('pending_confirmation_email');
      
      setIsConfirmed(true);
    } catch (error) {
      console.error('Confirmation failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name as keyof ConfirmSignUpInput]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleResendCode = async () => {
    // TODO: Implement resend code functionality
    // This would require adding a resendConfirmationCode function to useAuth
    console.log('Resend code functionality not yet implemented');
  };

  if (isConfirmed) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-md w-full space-y-8'>
          <Card>
            <CardHeader className='space-y-1'>
              <CardTitle className='text-2xl text-center'>
                アカウントが確認されました
              </CardTitle>
              <CardDescription className='text-center'>
                アカウントの確認が完了しました
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <p className='text-sm text-gray-600 text-center'>
                  My Beer Logへようこそ！
                  <br />
                  ログインしてビール記録を始めましょう。
                </p>

                <div className='text-center'>
                  <Link href={ROUTES.login}>
                    <Button className='w-full'>ログインページに移動</Button>
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
              アカウント確認
            </CardTitle>
            <CardDescription className='text-center'>
              メールに送信された確認コードを入力してください
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
                <Label htmlFor='confirmationCode'>確認コード</Label>
                <Input
                  id='confirmationCode'
                  name='confirmationCode'
                  type='text'
                  autoComplete='one-time-code'
                  required
                  value={formData.confirmationCode}
                  onChange={handleInputChange}
                  placeholder='6桁の数字を入力'
                  maxLength={6}
                  className={errors.confirmationCode ? 'border-red-500' : ''}
                />
                {errors.confirmationCode && (
                  <p className='text-sm text-red-600'>{errors.confirmationCode}</p>
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
                disabled={isSubmitting}
              >
                {isSubmitting ? 'アカウント確認中...' : 'アカウントを確認'}
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

              <div className='mt-6 space-y-3'>
                <div className='text-center'>
                  <button
                    type='button'
                    onClick={handleResendCode}
                    className='text-sm text-blue-600 hover:text-blue-500'
                  >
                    確認コードを再送信
                  </button>
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}