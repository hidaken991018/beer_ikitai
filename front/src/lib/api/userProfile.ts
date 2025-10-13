/**
 * User Profile API Functions
 *
 * ユーザープロフィール関連のAPI通信を担う関数群を提供します。
 * プロフィールの取得、作成、更新操作をサポートします。
 *
 * @since v1.0.0
 */

import type { UserProfile, UserProfileInput, ApiResponse } from '@/types/api';

import { apiClient } from './client';

/**
 * ユーザープロフィールの存在確認
 *
 * @description 認証済みユーザーのプロフィールが存在するかを確認します。
 * 404エラーを正常な状態として扱い、プロフィール有無をboolean値で返します。
 * 認証フローでのプロフィール自動チェックに使用されます。
 *
 * @returns プロフィール存在フラグ（true: 存在, false: 未作成）
 * @throws {Error} 401: 認証エラーの場合
 * @throws {Error} 500: サーバーエラーの場合
 *
 * @example
 * ```typescript
 * try {
 *   const hasProfile = await checkUserProfile();
 *   if (hasProfile) {
 *     console.log('プロフィールが存在します');
 *   } else {
 *     console.log('プロフィールを作成してください');
 *     // プロフィール作成画面に遷移
 *     router.push(ROUTES.profileCreate);
 *   }
 * } catch (error) {
 *   console.error('プロフィールチェックに失敗:', error);
 * }
 * ```
 */
export async function checkUserProfile(): Promise<boolean> {
  try {
    await getUserProfile();
    // プロフィール取得成功 = プロフィール存在
    return true;
  } catch (error: unknown) {
    const apiError = error as Error & { status?: number };

    // 404エラーの場合はプロフィール未作成
    if (apiError.status === 404) {
      return false;
    }

    // 404以外のエラーは再スロー
    throw error;
  }
}

/**
 * ユーザープロフィールを取得する
 *
 * @description 認証済みユーザーのプロフィール情報を取得します。
 * プロフィールが存在しない場合は404エラーがスローされます。
 *
 * @returns ユーザープロフィール情報
 * @throws {Error} 404: プロフィールが見つからない場合
 * @throws {Error} 401: 認証エラーの場合
 * @throws {Error} 500: サーバーエラーの場合
 *
 * @example
 * ```typescript
 * try {
 *   const profile = await getUserProfile();
 *   console.log('プロフィール:', profile);
 * } catch (error) {
 *   if (error.status === 404) {
 *     console.log('プロフィールが存在しません');
 *   }
 * }
 * ```
 */
export async function getUserProfile(): Promise<ApiResponse<UserProfile>> {
  return apiClient.get<ApiResponse<UserProfile>>('/users/profile');
}

/**
 * ユーザープロフィールを作成する
 *
 * @description 新しいユーザープロフィールを作成します。
 * 既にプロフィールが存在する場合は409エラーがスローされます。
 *
 * @param data - プロフィール作成用データ
 * @returns 作成されたプロフィール情報
 * @throws {Error} 400: バリデーションエラーの場合
 * @throws {Error} 401: 認証エラーの場合
 * @throws {Error} 409: プロフィールが既に存在する場合
 * @throws {Error} 500: サーバーエラーの場合
 *
 * @example
 * ```typescript
 * try {
 *   const newProfile = await createUserProfile({
 *     displayName: 'ビール太郎'
 *   });
 *   console.log('プロフィール作成成功:', newProfile);
 * } catch (error) {
 *   if (error.status === 409) {
 *     console.log('プロフィールは既に存在します');
 *   }
 * }
 * ```
 */
export async function createUserProfile(
  data: UserProfileInput
): Promise<ApiResponse<UserProfile>> {
  return apiClient.post<ApiResponse<UserProfile>>('/users/profile', data);
}

/**
 * ユーザープロフィールを更新する
 *
 * @description 既存のユーザープロフィールを更新します。
 * プロフィールが存在しない場合は404エラーがスローされます。
 *
 * @param data - プロフィール更新用データ（部分更新対応）
 * @returns 更新されたプロフィール情報
 * @throws {Error} 400: バリデーションエラーの場合
 * @throws {Error} 401: 認証エラーの場合
 * @throws {Error} 404: プロフィールが見つからない場合
 * @throws {Error} 500: サーバーエラーの場合
 *
 * @example
 * ```typescript
 * try {
 *   const updatedProfile = await updateUserProfile({
 *     displayName: '新しい表示名',
 *     iconUrl: 'https://example.com/avatar.jpg'
 *   });
 *   console.log('プロフィール更新成功:', updatedProfile);
 * } catch (error) {
 *   if (error.status === 404) {
 *     console.log('プロフィールが存在しません');
 *   }
 * }
 * ```
 */
export async function updateUserProfile(
  data: UserProfileInput
): Promise<ApiResponse<UserProfile>> {
  return apiClient.put<ApiResponse<UserProfile>>('/users/profile', data);
}
