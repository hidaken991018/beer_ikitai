/**
 * Profile Validation Schemas
 *
 * プロフィール関連のZodバリデーションスキーマを提供します。
 * React Hook Form との統合によりフォーム検証を実現します。
 *
 * @since v1.0.0
 */

import { z } from 'zod';

import { VALIDATION } from '@/lib/constants';

/**
 * プロフィール作成フォーム バリデーションスキーマ
 *
 * @description プロフィール作成時のフォーム入力検証ルールです。
 * 既存のVALIDATION.displayName設定に基づいた検証を実行します。
 *
 * @example
 * ```typescript
 * import { profileCreateSchema } from '@/lib/validations/profile';
 *
 * // フォームデータの検証
 * const result = profileCreateSchema.safeParse({
 *   displayName: "ビール太郎"
 * });
 *
 * if (result.success) {
 *   console.log("バリデーション成功:", result.data);
 * } else {
 *   console.error("バリデーションエラー:", result.error.format());
 * }
 * ```
 *
 * @example
 * ```typescript
 * // React Hook Form での使用
 * import { useForm } from 'react-hook-form';
 * import { zodResolver } from '@hookform/resolvers/zod';
 *
 * const form = useForm<ProfileCreateData>({
 *   resolver: zodResolver(profileCreateSchema),
 *   defaultValues: {
 *     displayName: ""
 *   }
 * });
 * ```
 */
export const profileCreateSchema = z.object({
  displayName: z
    .string({
      required_error: '表示名は必須です',
      invalid_type_error: '表示名は文字列で入力してください',
    })
    .min(VALIDATION.displayName.minLength, {
      message: '表示名は必須です',
    })
    .max(VALIDATION.displayName.maxLength, {
      message: `表示名は${VALIDATION.displayName.maxLength}文字以下で入力してください`,
    })
    .trim()
    .refine(value => value.length >= VALIDATION.displayName.minLength, {
      message: '表示名は必須です',
    }),
});

/**
 * プロフィール作成フォーム データ型
 *
 * @description profileCreateSchemaから推論される型定義です。
 * TypeScriptの型安全性を確保しながらZodスキーマと連携します。
 *
 * @example
 * ```typescript
 * // 自動的に型が推論される
 * const formData: ProfileCreateFormData = {
 *   displayName: "ビール太郎" // string型
 * };
 *
 * // フォームコンポーネントでの使用
 * const handleSubmit = (data: ProfileCreateFormData) => {
 *   // data.displayName は string型として推論される
 *   console.log(data.displayName);
 * };
 * ```
 */
export type ProfileCreateFormData = z.infer<typeof profileCreateSchema>;

/**
 * バリデーションエラーメッセージ定数
 *
 * @description プロフィール作成フォームのエラーメッセージ定義です。
 * 統一されたエラー表示とローカライゼーション対応を提供します。
 *
 * @example
 * ```typescript
 * // カスタムバリデーション
 * const validateDisplayName = (value: string) => {
 *   if (!value.trim()) {
 *     return PROFILE_VALIDATION_MESSAGES.DISPLAY_NAME_REQUIRED;
 *   }
 *   if (value.length > 50) {
 *     return PROFILE_VALIDATION_MESSAGES.DISPLAY_NAME_TOO_LONG;
 *   }
 *   return null;
 * };
 *
 * // エラー表示コンポーネント
 * const ErrorMessage = ({ error }: { error: string }) => {
 *   return <span className="text-red-500">{error}</span>;
 * };
 * ```
 */
export const PROFILE_VALIDATION_MESSAGES = {
  /** 表示名必須エラー */
  DISPLAY_NAME_REQUIRED: '表示名は必須です',
  /** 表示名長すぎエラー */
  DISPLAY_NAME_TOO_LONG: `表示名は${VALIDATION.displayName.maxLength}文字以下で入力してください`,
  /** 表示名型エラー */
  DISPLAY_NAME_INVALID_TYPE: '表示名は文字列で入力してください',
} as const;

/**
 * フォームフィールド設定
 *
 * @description React Hook Form のフィールド設定とバリデーションルールです。
 * フォームの動作設定と検証タイミングを定義します。
 *
 * @example
 * ```typescript
 * import { useForm } from 'react-hook-form';
 *
 * const form = useForm<ProfileCreateFormData>({
 *   resolver: zodResolver(profileCreateSchema),
 *   mode: PROFILE_FORM_CONFIG.validationMode,
 *   reValidateMode: PROFILE_FORM_CONFIG.reValidateMode,
 *   defaultValues: PROFILE_FORM_CONFIG.defaultValues
 * });
 * ```
 */
export const PROFILE_FORM_CONFIG = {
  /** バリデーションモード (初回はonBlur、エラー後はonChange) */
  validationMode: 'onBlur' as const,
  /** 再バリデーションモード */
  reValidateMode: 'onChange' as const,
  /** デフォルト値 */
  defaultValues: {
    displayName: '',
  },
  /** フォームフィールド名 */
  fieldNames: {
    displayName: 'displayName' as const,
  },
} as const;

/**
 * プロフィール作成フォーム バリデーション関数
 *
 * @description 手動でのバリデーション実行用のヘルパー関数です。
 * APIコール前の最終チェックやカスタムバリデーションで使用します。
 *
 * @param data - 検証対象のフォームデータ
 * @returns 検証結果とエラー情報
 *
 * @example
 * ```typescript
 * const handleSubmit = async (formData: ProfileCreateFormData) => {
 *   const validation = validateProfileCreateForm(formData);
 *
 *   if (!validation.success) {
 *     console.error("バリデーションエラー:", validation.errors);
 *     return;
 *   }
 *
 *   // API呼び出し
 *   await createProfile(validation.data);
 * };
 * ```
 */
export const validateProfileCreateForm = (data: unknown) => {
  const result = profileCreateSchema.safeParse(data);

  if (result.success) {
    return {
      success: true as const,
      data: result.data,
      errors: null,
    };
  }

  return {
    success: false as const,
    data: null,
    errors: result.error.format(),
  };
};