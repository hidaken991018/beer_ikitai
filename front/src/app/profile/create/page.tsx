'use client';

/**
 * Profile Create Page
 *
 * ユーザープロフィール作成ページです。
 * 新規ユーザーが初回プロフィールを作成するためのページです。
 *
 * @since v1.0.0
 */

import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { AppLayout } from '@/components/layout/AppLayout';
import { ProfileCreateForm } from '@/components/profile/ProfileCreateForm';
import { createUserProfile } from '@/lib/api/userProfile';
import { ROUTES, ERROR_MESSAGES } from '@/lib/constants';
import type { ProfileCreateFormData } from '@/lib/validations/profile';
import { UserProfileInput } from '@/types/api';


// Force client-side rendering for this page
export const dynamic = 'force-dynamic';

/**
 * プロフィール作成ページ コンポーネント
 *
 * @description 新規ユーザーがプロフィールを作成するためのページです。
 * 認証済みユーザーのみアクセス可能で、プロフィール作成後は
 * メインのプロフィールページにリダイレクトします。
 */
export default function ProfileCreatePage() {
  const router = useRouter();
  const { authState } = useSelector((state: any) => state.auth);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authState.isAuthenticated) {
      router.push(ROUTES.login);
    }
  }, [authState.isAuthenticated, router]);

  /**
   * プロフィール作成処理
   *
   * @description フォームから送信されたデータを使用してプロフィールを作成します。
   * 成功時はプロフィールページにリダイレクト、失敗時はエラーメッセージを表示します。
   *
   * @param data - フォームから送信されたプロフィール作成データ
   */
  const handleSubmit = async (data: ProfileCreateFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // フォームデータをAPIタイプに直接使用
      const profileData: UserProfileInput = {
        display_name: data.displayName,
        icon_url: "", // 現状、アイコンURLは空で送信
      };

      await createUserProfile(profileData);

      // プロフィール作成成功
      router.push(ROUTES.profile);
    } catch (err) {
      console.error('Profile creation failed:', err);

      // エラータイプに応じたメッセージ設定
      const apiError = err as Error & { status?: number };

      if (apiError.status === 409) {
        setError('プロフィールは既に存在します');
      } else if (apiError.status === 400) {
        setError(ERROR_MESSAGES.validationError);
      } else if (apiError.status === 401) {
        setError(ERROR_MESSAGES.unauthorizedError);
        // 認証エラーの場合はログインページにリダイレクト
        setTimeout(() => router.push(ROUTES.login), 2000);
      } else {
        setError('プロフィールの作成に失敗しました。もう一度お試しください。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * キャンセル処理
   *
   * @description プロフィール作成をキャンセルしてホームページに戻ります。
   */
  const handleCancel = () => {
    router.push(ROUTES.home);
  };

  // 未認証時は何も表示しない（リダイレクト処理中）
  if (!authState.isAuthenticated) {
    return null;
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            プロフィールの作成
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 max-w">
            My Beer Log へようこそ！
            <br />
            表示名を設定してアカウントの準備を完了しましょう。
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <ProfileCreateForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={isLoading}
              error={error}
            />
          </div>
        </div>

        {/* 説明テキスト */}
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <p className="text-xs text-gray-500">
              表示名はいつでも変更できます。
              <br />
              他のユーザーからはこの名前で表示されます。
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}