/**
 * User Profile Types
 *
 * ユーザープロフィール関連の型定義です。
 * バックエンドのAPIスキーマと一致する形で定義されています。
 *
 * @since v1.0.0
 */

/**
 * ユーザープロフィール型
 *
 * @description バックエンドのUserProfileスキーマに対応する型定義です。
 * API から取得されるユーザープロフィール情報を表現します。
 *
 * @example
 * ```typescript
 * const profile: UserProfile = {
 *   id: 1,
 *   cognito_sub: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
 *   display_name: "田中太郎",
 *   icon_url: "https://example.com/avatar.jpg",
 *   created_at: "2025-01-01T00:00:00Z",
 *   updated_at: "2025-01-01T00:00:00Z"
 * };
 * ```
 */
export interface UserProfile {
  /** ユーザープロフィールID */
  id: number;
  /** CognitoユーザーID */
  cognito_sub: string;
  /** 表示名 */
  display_name?: string;
  /** アイコン画像URL */
  icon_url?: string;
  /** 作成日時 */
  created_at: string;
  /** 更新日時 */
  updated_at: string;
}

/**
 * ユーザープロフィール入力型
 *
 * @description ユーザープロフィール作成・更新時に使用する入力データの型です。
 * バックエンドのUserProfileInputスキーマに対応します。
 *
 * @example
 * ```typescript
 * const profileInput: UserProfileInput = {
 *   display_name: "田中太郎",
 *   icon_url: "https://example.com/avatar.jpg"
 * };
 * ```
 */
export interface UserProfileInput {
  /** 表示名 */
  display_name?: string;
  /** アイコン画像URL */
  icon_url?: string;
}

/**
 * プロフィール作成フォーム型
 *
 * @description 初回ログイン時のプロフィール作成フォームで使用する型です。
 * 今回の実装ではdisplay_nameのみを取得します。
 *
 * @example
 * ```typescript
 * const formData: ProfileCreateForm = {
 *   display_name: "田中太郎"
 * };
 * ```
 */
export interface ProfileCreateForm {
  /** 表示名（必須） */
  display_name: string;
}