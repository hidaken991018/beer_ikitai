/**
 * User Profile Hook
 *
 * ユーザープロフィール管理のカスタムフックです。
 * useSWRベースでプロフィールの取得、作成、更新、存在確認機能を提供します。
 * 404エラーを活用したプロフィール有無判定に対応しています。
 *
 * @since v1.0.0
 */

'use client';

import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

import {
  getUserProfile,
  createUserProfile,
  updateUserProfile,
} from '@/lib/api/userProfile';
import { selectAuth } from '@/store/slices/authSlice';
import type { UserProfile, UserProfileInput } from '@/types/api';

/**
 * プロフィール取得用フェッチャー関数
 *
 * @description SWR用のフェッチャー関数です。404エラーを適切に処理し、
 * プロフィールが存在しない状態を正常な状態として扱います。
 *
 * @returns プロフィール情報またはnull（プロフィール未作成時）
 * @throws 404以外のAPIエラー時にエラーをスロー
 */
const profileFetcher = async (): Promise<UserProfile | null> => {
  try {
    const response = await getUserProfile();
    return response.data;
  } catch (error: unknown) {
    const apiError = error as Error & { status?: number };

    // 404エラーの場合はプロフィール未作成として null を返す
    if (apiError.status === 404) {
      return null;
    }

    // 404以外のエラーは再スローして SWR のエラーハンドリングに委ねる
    throw error;
  }
};

/**
 * プロフィール作成用ミューテーション関数
 *
 * @description useSWRMutation用の作成関数です。
 *
 * @param key - SWRキー（使用されない）
 * @param options - ミューテーションオプション（引数として作成データを受け取る）
 * @returns 作成されたプロフィール情報
 */
const createProfileMutator = async (
  key: string,
  { arg }: { arg: UserProfileInput }
): Promise<UserProfile> => {
  const response = await createUserProfile(arg);
  return response.data;
};

/**
 * プロフィール更新用ミューテーション関数
 *
 * @description useSWRMutation用の更新関数です。
 *
 * @param key - SWRキー（使用されない）
 * @param options - ミューテーションオプション（引数として更新データを受け取る）
 * @returns 更新されたプロフィール情報
 */
const updateProfileMutator = async (
  key: string,
  { arg }: { arg: UserProfileInput }
): Promise<UserProfile> => {
  const response = await updateUserProfile(arg);
  return response.data;
};

/**
 * ユーザープロフィール管理カスタムフック
 *
 * @description ユーザープロフィールのCRUD操作、存在確認、ローディング状態管理を
 * 統一的に提供します。useSWRによる自動キャッシュ、重複排除、再検証機能を活用します。
 *
 * @returns プロフィール状態とプロフィール関連の操作関数群
 *
 * @example
 * ```tsx
 * const ProfileManager = () => {
 *   const {
 *     profile,
 *     hasProfile,
 *     isLoading,
 *     error,
 *     createProfile,
 *     updateProfile,
 *     refreshProfile
 *   } = useUserProfile();
 *
 *   // プロフィール作成
 *   const handleCreateProfile = async () => {
 *     try {
 *       await createProfile({ displayName: 'ビール太郎' });
 *       alert('プロフィール作成成功！');
 *     } catch (error) {
 *       alert('プロフィール作成に失敗しました');
 *     }
 *   };
 *
 *   // プロフィール更新
 *   const handleUpdateProfile = async () => {
 *     try {
 *       await updateProfile({ displayName: '新しい表示名' });
 *       alert('プロフィール更新成功！');
 *     } catch (error) {
 *       alert('プロフィール更新に失敗しました');
 *     }
 *   };
 *
 *   if (isLoading) {
 *     return <div>プロフィール読み込み中...</div>;
 *   }
 *
 *   if (error && error.status !== 404) {
 *     return <div>プロフィール取得エラー: {error.message}</div>;
 *   }
 *
 *   if (!hasProfile) {
 *     return (
 *       <div>
 *         <p>プロフィールが作成されていません</p>
 *         <button onClick={handleCreateProfile}>プロフィール作成</button>
 *       </div>
 *     );
 *   }
 *
 *   return (
 *     <div>
 *       <h2>プロフィール</h2>
 *       <p>表示名: {profile?.displayName}</p>
 *       <button onClick={handleUpdateProfile}>プロフィール更新</button>
 *     </div>
 *   );
 * };
 * ```
 */
export function useUserProfile() {
  const authState = useSelector(selectAuth);

  /**
   * プロフィール情報の取得
   *
   * @description コンディショナルフェッチを使用し、認証状態でのみリクエストを実行します。
   * 404エラーはプロフィール未作成として正常に処理されます。
   */
  const {
    data: profile,
    error,
    isLoading,
    mutate: refreshProfile,
  } = useSWR<UserProfile | null, Error & { status?: number }>(
    // 認証済みの場合のみリクエストを実行（コンディショナルフェッチ）
    authState.isAuthenticated ? '/api/profile' : null,
    profileFetcher,
    {
      // エラー時の再試行設定
      shouldRetryOnError: error => {
        const apiError = error as Error & { status?: number };
        // 404エラーの場合は再試行しない（プロフィール未作成は正常状態）
        return apiError.status !== 404;
      },
      // キャッシュ時間の設定
      dedupingInterval: 10000, // 10秒間は重複リクエストを排除
      revalidateOnFocus: false, // フォーカス時の再検証を無効化
    }
  );

  /**
   * プロフィール作成のミューテーション
   *
   * @description useSWRMutationを使用してプロフィール作成を実行し、
   * 成功時に自動的にキャッシュを更新します。
   */
  const {
    trigger: createProfile,
    isMutating: isCreating,
    error: createError,
  } = useSWRMutation('/api/profile/create', createProfileMutator, {
    onSuccess: createdProfile => {
      // 作成成功時にプロフィールキャッシュを更新
      refreshProfile(createdProfile, { revalidate: false });
    },
  });

  /**
   * プロフィール更新のミューテーション
   *
   * @description useSWRMutationを使用してプロフィール更新を実行し、
   * 成功時に自動的にキャッシュを更新します。
   */
  const {
    trigger: updateProfile,
    isMutating: isUpdating,
    error: updateError,
  } = useSWRMutation('/api/profile/update', updateProfileMutator, {
    onSuccess: updatedProfile => {
      // 更新成功時にプロフィールキャッシュを更新
      refreshProfile(updatedProfile, { revalidate: false });
    },
  });

  /**
   * プロフィール存在確認
   *
   * @description プロフィールが存在するかどうかを判定します。
   * ローディング中や404エラー以外のエラー時は null を返します。
   */
  const hasProfile = useCallback((): boolean | null => {
    // ローディング中は判定不可
    if (isLoading) return null;

    // 404以外のエラーがある場合は判定不可
    if (error && error.status !== 404) return null;

    // プロフィールデータの存在を判定
    return profile !== null;
  }, [profile, isLoading, error]);

  /**
   * プロフィール読み込み状態の判定
   *
   * @description 初回読み込み、作成、更新のいずれかの処理中かを判定します。
   */
  const isLoadingProfile = useCallback((): boolean => {
    return isLoading || isCreating || isUpdating;
  }, [isLoading, isCreating, isUpdating]);

  /**
   * 統合エラー状態の取得
   *
   * @description 取得、作成、更新のいずれかでエラーが発生している場合に
   * 該当のエラーオブジェクトを返します。404エラーは除外されます。
   */
  const getError = useCallback((): (Error & { status?: number }) | null => {
    // 404エラー以外の取得エラー
    if (error && error.status !== 404) return error;

    // 作成エラー
    if (createError) return createError as Error & { status?: number };

    // 更新エラー
    if (updateError) return updateError as Error & { status?: number };

    return null;
  }, [error, createError, updateError]);

  /**
   * プロフィール強制再取得
   *
   * @description キャッシュを無視してサーバーから最新のプロフィール情報を取得します。
   * プロフィール更新後の確認などで使用します。
   */
  const forceRefresh = useCallback(async () => {
    await refreshProfile(undefined, { revalidate: true });
  }, [refreshProfile]);

  return {
    // プロフィールデータ
    profile,

    // 状態フラグ
    hasProfile: hasProfile(),
    isLoading: isLoadingProfile(),
    error: getError(),

    // プロフィール操作
    createProfile,
    updateProfile,
    refreshProfile: forceRefresh,

    // 個別状態（詳細制御用）
    isCreating,
    isUpdating,
    createError,
    updateError,
    fetchError: error && error.status !== 404 ? error : null,
  };
}
