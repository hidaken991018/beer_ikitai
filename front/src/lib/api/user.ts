/**
 * User Profile API Client
 *
 * ユーザープロフィール関連のAPI呼び出し機能を提供します。
 * バックエンドの `/users/profile` エンドポイントとの通信を担当します。
 *
 * @since v1.0.0
 */

import type { UserProfile, UserProfileInput } from '@/types/user';

import { apiClient } from './client';

/**
 * ユーザープロフィール API クライアント
 *
 * @description ユーザープロフィールの取得、作成、更新機能を提供します。
 * 認証が必要なエンドポイントなので、事前にAPIクライアントにJWTトークンが設定されている必要があります。
 */
export const userProfileApi = {
  /**
   * ユーザープロフィールを取得する
   *
   * @description 認証済みユーザーのプロフィール情報を取得します。
   * プロフィールが存在しない場合は404エラーが返されます。
   *
   * @returns ユーザープロフィール情報
   * @throws API呼び出しエラー（404: プロフィール未存在、401: 未認証）
   *
   * @example
   * ```typescript
   * try {
   *   const profile = await userProfileApi.getProfile();
   *   console.log('プロフィール:', profile);
   * } catch (error) {
   *   if (error.status === 404) {
   *     console.log('プロフィールが存在しません');
   *   } else {
   *     console.error('プロフィール取得エラー:', error);
   *   }
   * }
   * ```
   */
  async getProfile(): Promise<UserProfile> {
    return apiClient.get<UserProfile>('/users/profile');
  },

  /**
   * ユーザープロフィールを作成する
   *
   * @description 新規ユーザーのプロフィールを作成します。
   * プロフィールが既に存在する場合は409エラーが返されます。
   *
   * @param profileData - 作成するプロフィール情報
   * @returns 作成されたユーザープロフィール情報
   * @throws API呼び出しエラー（409: プロフィール既存在、400: 不正な入力、401: 未認証）
   *
   * @example
   * ```typescript
   * try {
   *   const newProfile = await userProfileApi.createProfile({
   *     display_name: '田中太郎'
   *   });
   *   console.log('プロフィール作成成功:', newProfile);
   * } catch (error) {
   *   if (error.status === 409) {
   *     console.log('プロフィールが既に存在します');
   *   } else {
   *     console.error('プロフィール作成エラー:', error);
   *   }
   * }
   * ```
   */
  async createProfile(profileData: UserProfileInput): Promise<UserProfile> {
    return apiClient.post<UserProfile>('/users/profile', profileData);
  },

  /**
   * ユーザープロフィールを更新する
   *
   * @description 認証済みユーザーのプロフィール情報を更新します。
   * プロフィールが存在しない場合は404エラーが返されます。
   *
   * @param profileData - 更新するプロフィール情報
   * @returns 更新されたユーザープロフィール情報
   * @throws API呼び出しエラー（404: プロフィール未存在、400: 不正な入力、401: 未認証）
   *
   * @example
   * ```typescript
   * try {
   *   const updatedProfile = await userProfileApi.updateProfile({
   *     display_name: '田中次郎',
   *     icon_url: 'https://example.com/new-avatar.jpg'
   *   });
   *   console.log('プロフィール更新成功:', updatedProfile);
   * } catch (error) {
   *   console.error('プロフィール更新エラー:', error);
   * }
   * ```
   */
  async updateProfile(profileData: UserProfileInput): Promise<UserProfile> {
    return apiClient.put<UserProfile>('/users/profile', profileData);
  },
};