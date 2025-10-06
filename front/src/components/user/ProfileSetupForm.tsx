'use client';

import { useState } from 'react';

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
import type { ProfileCreateForm } from '@/types/user';

interface ProfileSetupFormProps {
  onSubmit: (formData: ProfileCreateForm) => Promise<void>;
  isSubmitting: boolean;
  error?: string | null;
}

/**
 * プロフィール初期設定フォーム
 *
 * @description 初回ログイン時にユーザープロフィールを作成するためのフォームコンポーネントです。
 * 現在の実装では表示名（display_name）のみを入力します。
 *
 * @param props - フォームのプロパティ
 * @param props.onSubmit - フォーム送信時のハンドラー
 * @param props.isSubmitting - 送信中フラグ
 * @param props.error - エラーメッセージ
 *
 * @example
 * ```tsx
 * const handleProfileCreate = async (formData: ProfileCreateForm) => {
 *   try {
 *     await userProfileApi.createProfile(formData);
 *     router.push('/');
 *   } catch (error) {
 *     console.error('プロフィール作成エラー:', error);
 *   }
 * };
 *
 * <ProfileSetupForm
 *   onSubmit={handleProfileCreate}
 *   isSubmitting={isSubmitting}
 *   error={error}
 * />
 * ```
 */
export default function ProfileSetupForm({
  onSubmit,
  isSubmitting,
  error,
}: ProfileSetupFormProps) {
  const [formData, setFormData] = useState<ProfileCreateForm>({
    display_name: '',
  });
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof ProfileCreateForm, string>>
  >({});

  /**
   * フォーム入力の妥当性を検証する
   *
   * @returns 妥当性チェック結果（true: 妥当、false: 不正）
   */
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ProfileCreateForm, string>> = {};

    // 表示名のバリデーション
    if (!formData.display_name.trim()) {
      newErrors.display_name = '表示名は必須です';
    } else if (formData.display_name.trim().length < 1) {
      newErrors.display_name = '表示名は1文字以上で入力してください';
    } else if (formData.display_name.trim().length > 50) {
      newErrors.display_name = '表示名は50文字以内で入力してください';
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * フォーム送信ハンドラー
   *
   * @param e - フォームイベント
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        display_name: formData.display_name.trim(),
      });
    } catch (error) {
      console.error('プロフィール作成エラー:', error);
    }
  };

  /**
   * 入力フィールド変更ハンドラー
   *
   * @param e - 入力イベント
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // エラーがある場合、入力開始時にクリア
    if (formErrors[name as keyof ProfileCreateForm]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <Card>
          <CardHeader className='space-y-1'>
            <CardTitle className='text-2xl text-center'>
              プロフィール設定
            </CardTitle>
            <CardDescription className='text-center'>
              My Beer Logで使用する表示名を設定してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='display_name'>表示名</Label>
                <Input
                  id='display_name'
                  name='display_name'
                  type='text'
                  required
                  value={formData.display_name}
                  onChange={handleInputChange}
                  placeholder='例: 田中太郎'
                  className={formErrors.display_name ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                />
                {formErrors.display_name && (
                  <p className='text-sm text-red-600'>
                    {formErrors.display_name}
                  </p>
                )}
                <p className='text-sm text-gray-500'>
                  ビール記録やレビューで表示される名前です。後から変更可能です。
                </p>
              </div>

              {error && (
                <div className='bg-red-50 border border-red-200 rounded-md p-3'>
                  <p className='text-sm text-red-600'>{error}</p>
                </div>
              )}

              <Button type='submit' className='w-full' disabled={isSubmitting}>
                {isSubmitting ? 'プロフィール作成中...' : 'プロフィールを作成'}
              </Button>
            </form>

            <div className='mt-6'>
              <p className='text-center text-sm text-gray-500'>
                プロフィール作成後、My Beer Logの利用を開始できます
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}