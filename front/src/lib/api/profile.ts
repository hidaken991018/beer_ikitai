/**
 * Profile API Client
 *
 * ユーザープロフィールのCRUD操作を提供するAPIクライアントです。
 * バックエンドのユーザープロフィール関連エンドポイントと連携します。
 *
 * @since v1.0.0
 */

import { apiClient } from './client';
import type { UserProfile, UserProfileInput } from '@/types/api';

/**
 * ユーザープロフィール取得
 *
 * @description 認証済みユーザーのプロフィール情報を取得します。
 * プロフィールが存在しない場合は404エラーが返されます。
 *
 * @returns ユーザープロフィール情報
 * @throws API エラー（404: プロフィール未作成、401: 未認証）
 *
 * @example
 * ```typescript
 * try {
 *   const profile = await getProfile();
 *   console.log('プロフィール:', profile);
 * } catch (error) {
 *   if (error.status === 404) {
 *     console.log('プロフィール未作成');
 *   }
 * }
 * ```
 */
export async function getProfile(): Promise<UserProfile> {
  return apiClient.get<UserProfile>('/users/profile');
}

/**
 * ユーザープロフィール作成
 *
 * @description 新規ユーザーのプロフィールを作成します。
 * 認証済みのCognito Subにプロフィールをリンクします。
 *
 * @param profileData - プロフィール作成データ（display_name, icon_url）
 * @returns 作成されたプロフィール情報
 * @throws API エラー（400: バリデーションエラー、409: 既に存在、401: 未認証）
 *
 * @example
 * ```typescript
 * try {
 *   const newProfile = await createProfile({
 *     displayName: 'ビール太郎',
 *     iconUrl: 'https://example.com/avatar.jpg'
 *   });
 *   console.log('プロフィール作成完了:', newProfile);
 * } catch (error) {
 *   if (error.status === 409) {
 *     console.log('プロフィールは既に存在します');
 *   }
 * }
 * ```
 */
export async function createProfile(
  profileData: UserProfileInput
): Promise<UserProfile> {
  return apiClient.post<UserProfile>('/users/profile', profileData);
}

/**
 * ユーザープロフィール更新
 *
 * @description 認証済みユーザーのプロフィール情報を更新します。
 * 部分更新が可能で、指定されたフィールドのみが更新されます。
 *
 * @param profileData - 更新するプロフィールデータ
 * @returns 更新されたプロフィール情報
 * @throws API エラー（400: バリデーションエラー、404: プロフィール未作成、401: 未認証）
 *
 * @example
 * ```typescript
 * try {
 *   const updatedProfile = await updateProfile({
 *     displayName: '新しい表示名'
 *   });
 *   console.log('プロフィール更新完了:', updatedProfile);
 * } catch (error) {
 *   if (error.status === 404) {
 *     console.log('プロフィールが見つかりません');
 *   }
 * }
 * ```
 */
export async function updateProfile(
  profileData: UserProfileInput
): Promise<UserProfile> {
  return apiClient.put<UserProfile>('/users/profile', profileData);
}

/**
 * プロフィール存在チェック
 *
 * @description ユーザープロフィールの存在を確認します。
 * ガード処理やUI状態管理で使用することを想定しています。
 *
 * @returns プロフィールが存在するかの真偽値
 *
 * @example
 * ```typescript
 * const profileExists = await checkProfileExists();
 * if (!profileExists) {
 *   // プロフィール作成画面にリダイレクト
 *   router.push('/profile/create');
 * }
 * ```
 */
export async function checkProfileExists(): Promise<boolean> {
  try {
    await getProfile();
    return true;
  } catch (error) {
    const apiError = error as { status?: number };
    if (apiError.status === 404) {
      return false;
    }
    // その他のエラー（401等）は再スロー
    throw error;
  }
}