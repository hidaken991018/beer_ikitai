/**
 * Profile Create Form Component
 *
 * ユーザープロフィール作成用のフォームコンポーネントです。
 * display_nameの入力とバリデーション、API連携を提供します。
 * issue #33の要件に基づき、アイコンアップロード機能は含まれていません。
 *
 * @since v1.0.0
 */

'use client';

import { User, Loader2 } from 'lucide-react';
import React, { useState } from 'react';

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
import type { UserProfileInput } from '@/types/api';

/**
 * プロフィール作成フォームのプロパティ
 */
export interface ProfileCreateFormProps {
  /** フォーム送信時のコールバック関数 */
  onSubmit: (profileData: UserProfileInput) => Promise<void>;
  /** フォーム送信中フラグ */
  isSubmitting?: boolean;
  /** エラーメッセージ */
  error?: string | null;
  /** キャンセルボタンの表示フラグ */
  showCancel?: boolean;
  /** キャンセル時のコールバック関数 */
  onCancel?: () => void;
}

/**
 * プロフィール作成フォームコンポーネント
 *
 * @description 新規ユーザーのプロフィール作成に使用するフォームです。
 * display_nameの入力とバリデーションを提供し、issue #33の要件に従って
 * アイコンアップロード機能は含まれていません。
 *
 * @param props - フォームのプロパティ
 * @returns プロフィール作成フォーム
 *
 * @example
 * ```tsx
 * const ProfileCreatePage = () => {
 *   const { createUserProfile, profileState } = useProfile();
 *   
 *   const handleSubmit = async (data: UserProfileInput) => {
 *     try {
 *       await createUserProfile(data);
 *       router.push('/');
 *     } catch (error) {
 *       console.error('プロフィール作成失敗:', error);
 *     }
 *   };
 *
 *   return (
 *     <ProfileCreateForm
 *       onSubmit={handleSubmit}
 *       isSubmitting={profileState.isLoading}
 *       error={profileState.error}
 *     />
 *   );
 * };
 * ```
 */
export function ProfileCreateForm({
  onSubmit,
  isSubmitting = false,
  error = null,
  showCancel = false,
  onCancel,
}: ProfileCreateFormProps) {
  const [displayName, setDisplayName] = useState('');
  const [validationError, setValidationError] = useState('');

  /**
   * バリデーション実行
   */
  const validateForm = (): boolean => {
    if (!displayName.trim()) {
      setValidationError('表示名を入力してください');
      return false;
    }

    if (displayName.trim().length < 1) {
      setValidationError('表示名は1文字以上入力してください');
      return false;
    }

    if (displayName.trim().length > 50) {
      setValidationError('表示名は50文字以内で入力してください');
      return false;
    }

    // 基本的な文字チェック（絵文字やHTMLタグを含む場合の警告）
    const hasUnsafeChars = /<[^>]*>/.test(displayName);
    if (hasUnsafeChars) {
      setValidationError('表示名にHTMLタグを含めることはできません');
      return false;
    }

    setValidationError('');
    return true;
  };

  /**
   * フォーム送信処理
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        displayName: displayName.trim(),
      });
    } catch (error) {
      // エラーハンドリングは親コンポーネントで行う
      console.error('Profile creation failed:', error);
    }
  };

  /**
   * 入力値変更時の処理
   */
  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayName(e.target.value);
    // リアルタイムバリデーション用にエラーをクリア
    if (validationError) {
      setValidationError('');
    }
  };

  return (
    <div className='max-w-md mx-auto'>
      <Card>
        <CardHeader className='text-center'>
          <div className='mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4'>
            <User className='w-8 h-8 text-primary' />
          </div>
          <CardTitle className='text-2xl'>プロフィール作成</CardTitle>
          <CardDescription>
            My Beer Logへようこそ！
            <br />
            まずはあなたの表示名を設定しましょう
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            {/* 表示名入力 */}
            <div className='space-y-2'>
              <Label htmlFor='displayName' className='text-sm font-medium'>
                表示名 <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='displayName'
                type='text'
                value={displayName}
                onChange={handleDisplayNameChange}
                placeholder='例: ビール太郎'
                maxLength={50}
                disabled={isSubmitting}
                className='w-full'
                aria-describedby={
                  validationError || error ? 'form-error' : 'form-hint'
                }
              />
              <p id='form-hint' className='text-xs text-muted-foreground'>
                他のユーザーに表示される名前です（1-50文字）
              </p>
            </div>

            {/* エラー表示 */}
            {(validationError || error) && (
              <div
                id='form-error'
                className='p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md'
                role='alert'
                aria-live='polite'
              >
                {validationError || error}
              </div>
            )}

            {/* フォームアクション */}
            <div className='flex gap-3 pt-4'>
              <Button
                type='submit'
                disabled={isSubmitting || !displayName.trim()}
                className='flex-1'
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    作成中...
                  </>
                ) : (
                  'プロフィールを作成'
                )}
              </Button>
              
              {showCancel && (
                <Button
                  type='button'
                  variant='outline'
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className='px-6'
                >
                  キャンセル
                </Button>
              )}
            </div>
          </form>

          {/* 補足情報 */}
          <div className='mt-6 pt-6 border-t'>
            <div className='text-xs text-muted-foreground space-y-2'>
              <p>
                <strong>注意:</strong> プロフィール作成後も設定画面で表示名を変更できます。
              </p>
              <p>
                アイコン画像の設定は今後のアップデートで追加予定です。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}