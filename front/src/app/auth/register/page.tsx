'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

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
import { ROUTES, VALIDATION } from '@/lib/constants';
import { useAppSelector } from '@/store/hooks';
import { selectAuth } from '@/store/slices/authSlice';
import type { RegisterCredentials, ConfirmSignUpInput } from '@/types/auth';


type RegistrationStep = 'register' | 'email-sent' | 'confirming' | 'confirmed';

export default function RegisterPage() {
  const { register, confirmSignUp } = useAuth();
  const authState = useAppSelector(selectAuth);
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('register');

  // 登録フォーム用の状態
  const [formData, setFormData] = useState<RegisterCredentials>({
    email: '',
    password: '',
    confirmPassword: '',
    givenName: '',
    familyName: '',
  });
  const [errors, setErrors] = useState<Partial<RegisterCredentials>>({});

  // 確認コード用の状態
  const [confirmationData, setConfirmationData] = useState<ConfirmSignUpInput>({
    email: '',
    confirmationCode: '',
  });
  const [confirmationErrors, setConfirmationErrors] = useState<Partial<ConfirmSignUpInput>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ページリロード時の状態復元
  useEffect(() => {
    const emailFromStorage = localStorage.getItem('pending_confirmation_email');
    if (emailFromStorage) {
      setConfirmationData(prev => ({ ...prev, email: emailFromStorage }));
      setCurrentStep('confirming');
    }
  }, []);

  const validateRegisterForm = (): boolean => {
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateConfirmationForm = (): boolean => {
    const newErrors: Partial<ConfirmSignUpInput> = {};

    // Email validation
    if (!confirmationData.email) {
      newErrors.email = 'メールアドレスは必須です';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(confirmationData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    // Code validation
    if (!confirmationData.confirmationCode) {
      newErrors.confirmationCode = '確認コードは必須です';
    } else if (!/^\d{6}$/.test(confirmationData.confirmationCode)) {
      newErrors.confirmationCode = '確認コードは6桁の数字で入力してください';
    }

    setConfirmationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateRegisterForm()) {
      return;
    }

    try {
      await register(formData);

      // 確認に必要な情報を保存
      localStorage.setItem('pending_confirmation_email', formData.email);
      setConfirmationData(prev => ({ ...prev, email: formData.email }));

      setCurrentStep('confirming');
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateConfirmationForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await confirmSignUp(confirmationData);

      // Clear stored email after successful confirmation
      localStorage.removeItem('pending_confirmation_email');

      setCurrentStep('confirmed');
    } catch (error) {
      console.error('Confirmation failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name as keyof RegisterCredentials]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleConfirmationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfirmationData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (confirmationErrors[name as keyof ConfirmSignUpInput]) {
      setConfirmationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBackToRegister = () => {
    localStorage.removeItem('pending_confirmation_email');
    setCurrentStep('register');
    setConfirmationData({ email: '', confirmationCode: '' });
    setConfirmationErrors({});
  };

  const handleResendCode = async () => {
    // TODO: Implement resend code functionality
    // This would require adding a resendConfirmationCode function to useAuth
    console.log('Resend code functionality not yet implemented');
  };

  // 確認完了画面
  if (currentStep === 'confirmed') {
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

  // 確認コード入力画面
  if (currentStep === 'confirming') {
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
              <form onSubmit={handleConfirmSubmit} className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='email'>メールアドレス</Label>
                  <Input
                    id='email'
                    name='email'
                    type='email'
                    autoComplete='email'
                    required
                    value={confirmationData.email}
                    onChange={handleConfirmationInputChange}
                    placeholder='例: user@example.com'
                    className={confirmationErrors.email ? 'border-red-500' : ''}
                    disabled
                  />
                  {confirmationErrors.email && (
                    <p className='text-sm text-red-600'>{confirmationErrors.email}</p>
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
                    value={confirmationData.confirmationCode}
                    onChange={handleConfirmationInputChange}
                    placeholder='6桁の数字を入力'
                    maxLength={6}
                    className={confirmationErrors.confirmationCode ? 'border-red-500' : ''}
                  />
                  {confirmationErrors.confirmationCode && (
                    <p className='text-sm text-red-600'>{confirmationErrors.confirmationCode}</p>
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
                    <button
                      type='button'
                      onClick={handleBackToRegister}
                      className='text-sm text-gray-600 hover:text-gray-500'
                    >
                      登録画面に戻る
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

  // 登録フォーム画面（デフォルト）
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
            <form onSubmit={handleRegisterSubmit} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='email'>メールアドレス</Label>
                <Input
                  id='email'
                  name='email'
                  type='email'
                  autoComplete='email'
                  required
                  value={formData.email}
                  onChange={handleRegisterInputChange}
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
                    onChange={handleRegisterInputChange}
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
                    onChange={handleRegisterInputChange}
                    placeholder='例: 田中'
                    className={errors.familyName ? 'border-red-500' : ''}
                  />
                  {errors.familyName && (
                    <p className='text-sm text-red-600'>{errors.familyName}</p>
                  )}
                </div>
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
                  onChange={handleRegisterInputChange}
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
                  onChange={handleRegisterInputChange}
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