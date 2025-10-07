/**
 * Profile Create Page
 *
 * ユーザープロフィール作成ページです。
 * issue #33の要件に基づき、display_nameのみの入力によるプロフィール作成機能を提供します。
 * プロフィール作成完了後は、元のページまたはホームページにリダイレクトします。
 *
 * @since v1.0.0
 */

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuthContext } from '@/components/auth/AuthProvider';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProfileCreateForm } from '@/components/profile/ProfileCreateForm';
import { useProfile } from '@/hooks/useProfile';
import { getAndClearReturnPath } from '@/hooks/useProfileGuard';
import type { UserProfileInput } from '@/types/api';

// Force client-side rendering for this page
export const dynamic = 'force-dynamic';

/**
 * プロフィール作成ページコンポーネント
 *
 * @description 認証済みユーザーの初回プロフィール作成に使用されるページです。
 * issue #33の要件に従い、以下の機能を提供します：
 * 
 * - 認証状態の確認（未認証の場合はログインページにリダイレクト）
 * - プロフィール作成フォームの表示
 * - display_nameの入力とバリデーション
 * - POST /users/profile APIへの送信
 * - 作成完了後の適切なページへのリダイレクト
 * - エラーハンドリングとユーザーフィードバック
 *
 * @returns プロフィール作成ページ
 */
export default function ProfileCreatePage() {
  const router = useRouter();
  const { authState } = useAuthContext();
  const { profileState, createUserProfile } = useProfile();
  
  const [isInitializing, setIsInitializing] = useState(true);

  /**
   * 認証状態チェックとプロフィール存在確認
   */
  useEffect(() => {
    const initializePage = async () => {
      // 認証状態が確定するまで待機
      if (authState.isAuthenticated === undefined) {
        return;
      }

      // 未認証の場合はログインページにリダイレクト
      if (!authState.isAuthenticated) {
        router.push('/auth/login');
        return;
      }

      // プロフィールが既に存在する場合はホームまたは元のページにリダイレクト
      if (profileState.initialized && profileState.exists) {
        const returnPath = getAndClearReturnPath();
        router.push(returnPath || '/');
        return;
      }

      setIsInitializing(false);
    };

    initializePage();
  }, [
    authState.isAuthenticated,
    profileState.initialized,
    profileState.exists,
    router,
  ]);

  /**
   * プロフィール作成処理
   */
  const handleProfileCreate = async (profileData: UserProfileInput) => {
    try {
      await createUserProfile(profileData);
      
      // 作成成功後のリダイレクト処理
      const returnPath = getAndClearReturnPath();
      router.push(returnPath || '/');
    } catch (error) {
      // エラーはuseProfileとProfileCreateFormで処理される
      console.error('Profile creation failed:', error);
    }
  };

  /**
   * キャンセル処理（通常は使用されないが、将来的な拡張のため）
   */
  const handleCancel = () => {
    // ログアウト処理やホームへのリダイレクトなど
    router.push('/');
  };

  // 初期化中のローディング表示
  if (isInitializing || authState.isAuthenticated === undefined) {
    return (
      <AppLayout>
        <div className='flex justify-center items-center min-h-[60vh]'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4'></div>
            <p className='text-muted-foreground'>ページを準備中...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // 認証エラーの場合（通常は上記のuseEffectでリダイレクトされる）
  if (!authState.isAuthenticated) {
    return (
      <AppLayout>
        <div className='flex justify-center items-center min-h-[60vh]'>
          <div className='text-center'>
            <p className='text-red-600 mb-4'>認証が必要です</p>
            <button
              onClick={() => router.push('/auth/login')}
              className='text-blue-600 hover:underline'
            >
              ログインページに移動
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className='container mx-auto px-4 py-8'>
        {/* ページヘッダー */}
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold mb-2'>My Beer Logへようこそ</h1>
          <p className='text-muted-foreground max-w-2xl mx-auto'>
            クラフトビールの素晴らしい世界を記録しましょう。
            まずはあなたのプロフィールを作成して、ビールの旅を始めませんか？
          </p>
        </div>

        {/* プロフィール作成フォーム */}
        <div className='max-w-lg mx-auto'>
          <ProfileCreateForm
            onSubmit={handleProfileCreate}
            isSubmitting={profileState.isLoading}
            error={profileState.error}
            showCancel={false} // 初回作成時はキャンセル不可
            onCancel={handleCancel}
          />
        </div>

        {/* 補足説明 */}
        <div className='mt-12 max-w-2xl mx-auto'>
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-6'>
            <h3 className='font-semibold text-blue-900 mb-3'>
              My Beer Logでできること
            </h3>
            <ul className='space-y-2 text-sm text-blue-700'>
              <li className='flex items-start'>
                <span className='mr-2'>🍺</span>
                <span>GPS位置情報を使った醸造所でのチェックイン</span>
              </li>
              <li className='flex items-start'>
                <span className='mr-2'>📍</span>
                <span>近くの醸造所の検索と情報閲覧</span>
              </li>
              <li className='flex items-start'>
                <span className='mr-2'>📊</span>
                <span>あなたのビール体験の記録と統計</span>
              </li>
              <li className='flex items-start'>
                <span className='mr-2'>🏆</span>
                <span>訪問実績に基づくバッジの獲得（今後追加予定）</span>
              </li>
            </ul>
          </div>
          
          <div className='mt-6 text-center'>
            <p className='text-xs text-muted-foreground'>
              プロフィール作成後も、設定ページでいつでも表示名を変更できます。
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}