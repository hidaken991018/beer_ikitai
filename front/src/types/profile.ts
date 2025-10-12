/**
 * Profile Type Definitions
 *
 * プロフィール関連の型定義を提供します。
 * フォーム処理、API通信、コンポーネントの型安全性を確保します。
 *
 * @since v1.0.0
 */

/**
 * プロフィール作成フォームのデータ型
 *
 * @description プロフィール作成時のフォーム入力データの型定義です。
 * display_nameのみを含み、Phase-2の要件に対応しています。
 *
 * @example
 * ```typescript
 * const formData: ProfileCreateData = {
 *   display_name: "ビール太郎"
 * };
 * ```
 */
export interface ProfileCreateData {
  /** ユーザーの表示名 (1-50文字) */
  display_name: string;
}

/**
 * プロフィール作成API レスポンス型
 *
 * @description POST /users/profile API のレスポンス型定義です。
 * 作成されたプロフィール情報を含みます。
 *
 * @example
 * ```typescript
 * const response: ProfileCreateResponse = {
 *   cognito_sub: "abc123-def456-ghi789",
 *   display_name: "ビール太郎",
 *   icon_url: null,
 *   created_at: "2023-12-01T10:00:00Z",
 *   updated_at: "2023-12-01T10:00:00Z"
 * };
 * ```
 */
export interface ProfileCreateResponse {
  /** Cognito Sub ID */
  cognito_sub: string;
  /** ユーザーの表示名 */
  display_name: string;
  /** アイコン画像URL (Phase-2では未使用) */
  icon_url: string | null;
  /** 作成日時 (ISO 8601形式) */
  created_at: string;
  /** 更新日時 (ISO 8601形式) */
  updated_at: string;
}

/**
 * プロフィール作成フォーム コンポーネントProps
 *
 * @description ProfileCreateFormコンポーネントに渡されるプロパティの型定義です。
 * フォーム状態の制御とイベントハンドリングを提供します。
 *
 * @example
 * ```typescript
 * const MyComponent = () => {
 *   const handleSubmit = async (data: ProfileCreateData) => {
 *     // API呼び出し処理
 *   };
 *
 *   const handleCancel = () => {
 *     // キャンセル処理
 *   };
 *
 *   return (
 *     <ProfileCreateForm
 *       onSubmit={handleSubmit}
 *       onCancel={handleCancel}
 *       isLoading={false}
 *       error={null}
 *     />
 *   );
 * };
 * ```
 */
export interface ProfileCreateFormProps {
  /** フォーム送信時のコールバック関数 */
  onSubmit: (data: ProfileCreateData) => Promise<void>;
  /** キャンセル時のコールバック関数 (オプション) */
  onCancel?: () => void;
  /** ローディング状態フラグ */
  isLoading?: boolean;
  /** エラーメッセージ (表示用) */
  error?: string | null;
}

/**
 * フォームフィールドエラー型
 *
 * @description React Hook Form のフィールドレベルエラーの型定義です。
 * バリデーションエラーの表示に使用されます。
 *
 * @example
 * ```typescript
 * const fieldError: ProfileFormFieldError = {
 *   type: "required",
 *   message: "表示名は必須です"
 * };
 * ```
 */
export interface ProfileFormFieldError {
  /** エラーの種類 */
  type: string;
  /** エラーメッセージ */
  message?: string;
}

/**
 * フォーム状態型
 *
 * @description React Hook Form のフォーム全体の状態を表す型定義です。
 * バリデーション状態、送信状態の管理に使用されます。
 *
 * @example
 * ```typescript
 * const formState: ProfileFormState = {
 *   isValid: true,
 *   isSubmitting: false,
 *   isDirty: true,
 *   errors: {}
 * };
 * ```
 */
export interface ProfileFormState {
  /** フォームのバリデーション状態 */
  isValid: boolean;
  /** 送信中フラグ */
  isSubmitting: boolean;
  /** 変更されているかフラグ */
  isDirty: boolean;
  /** フィールドレベルエラー */
  errors: Partial<Record<keyof ProfileCreateData, ProfileFormFieldError>>;
}