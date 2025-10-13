'use client';

/**
 * ProfileCreateForm Component
 *
 * ユーザープロフィール作成フォームコンポーネントです。
 * React Hook Form + Zod による型安全なフォーム処理を提供します。
 *
 * @since v1.0.0
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import type { ProfileCreateFormProps } from '@/types/profile';
import { profileCreateSchema, type ProfileCreateFormData, PROFILE_FORM_CONFIG } from '@/lib/validations/profile';

/**
 * プロフィール作成フォーム コンポーネント
 *
 * @description ユーザーがプロフィールを作成するためのフォームです。
 * display_nameの入力とバリデーションを行い、外部コンポーネントに
 * 送信処理を委譲します。
 *
 * @param props - コンポーネントプロパティ
 * @param props.onSubmit - フォーム送信時のコールバック関数
 * @param props.onCancel - キャンセル時のコールバック関数 (オプション)
 * @param props.isLoading - ローディング状態フラグ
 * @param props.error - エラーメッセージ
 *
 * @example
 * ```tsx
 * const MyPage = () => {
 *   const [isLoading, setIsLoading] = useState(false);
 *   const [error, setError] = useState<string | null>(null);
 *
 *   const handleSubmit = async (data: ProfileCreateData) => {
 *     setIsLoading(true);
 *     setError(null);
 *
 *     try {
 *       await createProfile(data);
 *       router.push('/profile');
 *     } catch (err) {
 *       setError('プロフィールの作成に失敗しました');
 *     } finally {
 *       setIsLoading(false);
 *     }
 *   };
 *
 *   const handleCancel = () => {
 *     router.back();
 *   };
 *
 *   return (
 *     <ProfileCreateForm
 *       onSubmit={handleSubmit}
 *       onCancel={handleCancel}
 *       isLoading={isLoading}
 *       error={error}
 *     />
 *   );
 * };
 * ```
 */
export const ProfileCreateForm: React.FC<ProfileCreateFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
  error = null,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileCreateFormData>({
    resolver: zodResolver(profileCreateSchema),
    mode: PROFILE_FORM_CONFIG.validationMode,
    reValidateMode: PROFILE_FORM_CONFIG.reValidateMode,
    defaultValues: PROFILE_FORM_CONFIG.defaultValues,
  });

  /**
   * フォーム送信ハンドラー
   *
   * @description バリデーション成功時に外部のonSubmitコールバックを呼び出します。
   * エラーハンドリングは呼び出し元で行われます。
   *
   * @param data - バリデーション済みフォームデータ
   */
  const handleFormSubmit = async (data: ProfileCreateFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      // エラーハンドリングは親コンポーネントで行う
      console.error('Form submission error:', error);
    }
  };

  // ローディング中またはsubmit中の状態
  const isFormDisabled = isLoading || isSubmitting;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">プロフィール作成</CardTitle>
        <CardDescription className="text-center">
          アカウントを完了するために表示名を入力してください
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* 表示名入力フィールド */}
          <div className="space-y-2">
            <Label htmlFor={PROFILE_FORM_CONFIG.fieldNames.displayName} className="text-sm font-medium">
              表示名 <span className="text-red-500">*</span>
            </Label>
            <Input
              id={PROFILE_FORM_CONFIG.fieldNames.displayName}
              type="text"
              placeholder="ビール太郎"
              disabled={isFormDisabled}
              aria-invalid={!!errors.display_name}
              aria-describedby={
                errors.display_name ? `${PROFILE_FORM_CONFIG.fieldNames.displayName}-error` : undefined
              }
              {...register(PROFILE_FORM_CONFIG.fieldNames.displayName)}
              className={errors.display_name ? 'border-red-500 focus:border-red-500' : ''}
            />
            {errors.display_name && (
              <p
                id={`${PROFILE_FORM_CONFIG.fieldNames.displayName}-error`}
                className="text-sm text-red-500"
                role="alert"
              >
                {errors.display_name.message}
              </p>
            )}
          </div>

          {/* API エラー表示 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex flex-col space-y-2 pt-4">
            <Button
              type="submit"
              disabled={isFormDisabled}
              className="w-full"
              aria-describedby={isFormDisabled ? 'submit-loading' : undefined}
            >
              {isFormDisabled ? (
                <>
                  <span className="mr-2">作成中...</span>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                </>
              ) : (
                'プロフィールを作成'
              )}
            </Button>

            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isFormDisabled}
                className="w-full"
              >
                キャンセル
              </Button>
            )}
          </div>
        </form>

        {/* ローディング状態のアクセシビリティサポート */}
        {isFormDisabled && (
          <div id="submit-loading" className="sr-only">
            プロフィールを作成中です。しばらくお待ちください。
          </div>
        )}

        {/* フォーム状態デバッグ情報 (開発環境のみ) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 p-2 bg-gray-50 rounded text-xs">
            <summary className="cursor-pointer">デバッグ情報</summary>
            <pre className="mt-2 whitespace-pre-wrap">
              {JSON.stringify(
                {
                  errors: errors.display_name ? {
                    display_name: {
                      type: errors.display_name.type,
                      message: errors.display_name.message,
                    }
                  } : {},
                  isSubmitting,
                  isDirty,
                  isLoading,
                  error,
                },
                null,
                2
              )}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileCreateForm;