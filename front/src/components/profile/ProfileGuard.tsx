/**
 * Profile Guard Component
 *
 * プロフィール存在確認とページアクセス制御を行うガードコンポーネントです。
 * issue #33の要件「ログイン済みの状態で画面へ訪問した際にユーザプロフィールの有無を確認し、
 * ない場合プロフィール作成画面へ遷移」を実装します。
 *
 * @since v1.0.0
 */

'use client';

import React, { ReactNode } from 'react';

import { useAuthContext } from '@/components/auth/AuthProvider';
import { Loading } from '@/components/ui/loading';
import { useProfileGuard, ProfileGuardOptions } from '@/hooks/useProfileGuard';

/**
 * ProfileGuardコンポーネントのプロパティ
 */
export interface ProfileGuardProps extends ProfileGuardOptions {
  /** 保護対象の子コンポーネント */
  children: ReactNode;
  /** カスタムローディングコンポーネント */
  loadingComponent?: ReactNode;
  /** ガード機能を無効にするかのフラグ */
  disabled?: boolean;
}

/**
 * プロフィールガードコンポーネント
 *
 * @description 認証済みユーザーに対してプロフィール存在確認を自動実行し、
 * 以下の制御を行います：
 * 
 * 1. **未認証ユーザー**: ログインページにリダイレクト
 * 2. **認証済み + プロフィール未作成**: プロフィール作成ページにリダイレクト  
 * 3. **認証済み + プロフィール存在**: 子コンポーネントを表示
 * 
 * issue #33の要件に基づき、状態変化に応じてページ遷移を行います。
 *
 * @param props - ガードコンポーネントのプロパティ
 * @returns ガード制御された子コンポーネントまたはローディング状態
 *
 * @example
 * ```tsx
 * // 基本的な使用方法
 * const ProtectedPage = () => {
 *   return (
 *     <ProfileGuard>
 *       <div>プロフィール必須のコンテンツ</div>
 *     </ProfileGuard>
 *   );
 * };
 * 
 * // カスタマイズした使用方法
 * const CustomProtectedPage = () => {
 *   return (
 *     <ProfileGuard
 *       saveReturnPath={true}
 *       createProfilePath="/profile/setup"
 *       loadingComponent={<CustomLoader />}
 *     >
 *       <div>カスタム設定のコンテンツ</div>
 *     </ProfileGuard>
 *   );
 * };
 * ```
 */
export function ProfileGuard({
  children,
  loadingComponent,
  disabled = false,
  ...guardOptions
}: ProfileGuardProps) {
  const { authState } = useAuthContext();
  const {
    guardState,
    profileExists,
    profileLoading,
    profileError,
  } = useProfileGuard({
    disabled,
    ...guardOptions,
  });

  // ガード機能が無効の場合は子コンポーネントをそのまま表示
  if (disabled) {
    return <>{children}</>;
  }

  // 認証状態が確定していない場合はローディング表示
  if (authState.isAuthenticated === undefined) {
    return loadingComponent || <DefaultLoadingComponent message='認証状態を確認中...' />;
  }

  // プロフィール確認中の場合はローディング表示
  if (guardState.isGuarding || profileLoading) {
    return loadingComponent || <DefaultLoadingComponent message='プロフィールを確認中...' />;
  }

  // リダイレクト実行済みの場合はローディング表示
  if (guardState.hasRedirected) {
    return loadingComponent || <DefaultLoadingComponent message='ページを切り替え中...' />;
  }

  // プロフィールエラーがある場合はエラー表示
  if (profileError && !guardState.isChecked) {
    return (
      <div className='flex justify-center items-center min-h-[50vh]'>
        <div className='text-center'>
          <p className='text-red-600 mb-2'>プロフィール確認でエラーが発生しました</p>
          <p className='text-sm text-muted-foreground mb-4'>{profileError}</p>
          <button
            onClick={() => window.location.reload()}
            className='px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors'
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  // プロフィール確認が完了していない場合はローディング表示
  if (!guardState.isChecked) {
    return loadingComponent || <DefaultLoadingComponent message='アクセス権限を確認中...' />;
  }

  // 認証済み + プロフィール存在する場合のみ子コンポーネントを表示
  if (authState.isAuthenticated && profileExists) {
    return <>{children}</>;
  }

  // その他のケース（基本的に到達しないはず）
  return loadingComponent || <DefaultLoadingComponent message='ページを準備中...' />;
}

/**
 * デフォルトローディングコンポーネント
 */
interface DefaultLoadingComponentProps {
  message?: string;
}

function DefaultLoadingComponent({ 
  message = 'ページを読み込み中...' 
}: DefaultLoadingComponentProps) {
  return (
    <div className='flex justify-center items-center min-h-[50vh]'>
      <div className='text-center'>
        <Loading size='lg' className='mx-auto mb-4' />
        <p className='text-muted-foreground'>{message}</p>
      </div>
    </div>
  );
}

/**
 * ページ全体をプロフィールガードで保護するHOC
 *
 * @description ページコンポーネント全体をプロフィールガードでラップする
 * 高次コンポーネント（HOC）です。Next.jsのページコンポーネントで使用することを想定しています。
 *
 * @param WrappedComponent - 保護対象のページコンポーネント
 * @param guardOptions - ガード設定オプション
 * @returns プロフィールガードで保護されたページコンポーネント
 *
 * @example
 * ```tsx
 * // ページコンポーネントをガードで保護
 * const MyProtectedPage = () => {
 *   return (
 *     <div>
 *       <h1>プロフィール必須のページ</h1>
 *       <p>このコンテンツはプロフィール作成後にのみ表示されます</p>
 *     </div>
 *   );
 * };
 * 
 * // HOCを使用してガード付きページとしてエクスポート
 * export default withProfileGuard(MyProtectedPage, {
 *   saveReturnPath: true
 * });
 * ```
 */
export function withProfileGuard<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  guardOptions: ProfileGuardOptions = {}
) {
  const GuardedComponent = (props: P) => {
    return (
      <ProfileGuard {...guardOptions}>
        <WrappedComponent {...props} />
      </ProfileGuard>
    );
  };

  // 開発時のデバッグ用にコンポーネント名を設定
  GuardedComponent.displayName = `withProfileGuard(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return GuardedComponent;
}