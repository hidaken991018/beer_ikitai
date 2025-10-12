/**
 * Profile Guard Hook
 *
 * プロフィール存在確認とリダイレクト制御を提供するカスタムフックです。
 * 認証済みユーザーに対してプロフィールの存在を確認し、
 * 未作成の場合は自動的にプロフィール作成画面へリダイレクトします。
 *
 * @since v1.0.0
 */

'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { useAuthContext } from '@/components/auth/AuthProvider';
import { useProfile } from './useProfile';

/**
 * プロフィールガード状態の型定義
 */
export interface ProfileGuardState {
  /** ガード処理中フラグ */
  isGuarding: boolean;
  /** プロフィール存在チェック完了フラグ */
  isChecked: boolean;
  /** リダイレクト実行済みフラグ */
  hasRedirected: boolean;
  /** エラーメッセージ */
  error: string | null;
}

/**
 * プロフィールガード設定
 */
export interface ProfileGuardOptions {
  /** プロフィール作成ページのパス（デフォルト: '/profile/create'） */
  createProfilePath?: string;
  /** 認証ページのパス（デフォルト: '/auth/login'） */
  loginPath?: string;
  /** ガード機能を無効にするかのフラグ */
  disabled?: boolean;
  /** リダイレクト後の戻り先を保存するかのフラグ */
  saveReturnPath?: boolean;
}

/**
 * プロフィールガードカスタムフック
 *
 * @description 認証済みユーザーのプロフィール存在確認を自動実行し、
 * 未作成の場合はプロフィール作成画面へのリダイレクトを行います。
 * issueの要件「ログイン状態やプロフィールの有無が変わる場合、ページを遷移する必要がある」
 * に対応した制御を提供します。
 *
 * @param options - ガード設定オプション
 * @returns ガード状態とガード実行関数
 *
 * @example
 * ```tsx
 * const ProtectedPage = () => {
 *   const { guardState, executeGuard } = useProfileGuard({
 *     saveReturnPath: true
 *   });
 *
 *   useEffect(() => {
 *     executeGuard();
 *   }, [executeGuard]);
 *
 *   if (guardState.isGuarding) {
 *     return <div>プロフィール確認中...</div>;
 *   }
 *
 *   if (!guardState.isChecked) {
 *     return <div>読み込み中...</div>;
 *   }
 *
 *   return <div>メインコンテンツ</div>;
 * };
 * ```
 */
export function useProfileGuard(options: ProfileGuardOptions = {}) {
  const router = useRouter();
  const { authState } = useAuthContext();
  const { profileState, checkProfile } = useProfile();
  
  const {
    createProfilePath = '/profile/create',
    loginPath = '/auth/login',
    disabled = false,
    saveReturnPath = false,
  } = options;

  const [guardState, setGuardState] = useState<ProfileGuardState>({
    isGuarding: false,
    isChecked: false,
    hasRedirected: false,
    error: null,
  });

  /**
   * 戻り先パスを保存
   */
  const saveCurrentPath = useCallback(() => {
    if (saveReturnPath && typeof window !== 'undefined') {
      const currentPath = window.location.pathname + window.location.search;
      sessionStorage.setItem('profileGuardReturnPath', currentPath);
    }
  }, [saveReturnPath]);

  /**
   * エラー状態をクリア
   */
  const clearError = useCallback(() => {
    setGuardState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  /**
   * ガード状態をリセット
   */
  const resetGuardState = useCallback(() => {
    setGuardState({
      isGuarding: false,
      isChecked: false,
      hasRedirected: false,
      error: null,
    });
  }, []);

  /**
   * プロフィールガード実行
   *
   * @description プロフィールの存在確認を実行し、必要に応じてリダイレクトを行います。
   * 以下のケースでリダイレクトが発生します：
   * - 未認証の場合 → ログインページ
   * - 認証済みでプロフィール未作成の場合 → プロフィール作成ページ
   */
  const executeGuard = useCallback(async (): Promise<void> => {
    if (disabled || guardState.hasRedirected) {
      return;
    }

    try {
      setGuardState(prev => ({
        ...prev,
        isGuarding: true,
        error: null,
      }));

      // 未認証の場合はログインページにリダイレクト
      if (!authState.isAuthenticated) {
        if (saveReturnPath) {
          saveCurrentPath();
        }
        setGuardState(prev => ({
          ...prev,
          hasRedirected: true,
          isGuarding: false,
        }));
        router.push(loginPath);
        return;
      }

      // プロフィール存在確認
      const profileExists = await checkProfile();
      
      if (!profileExists) {
        // プロフィール未作成の場合はプロフィール作成画面にリダイレクト
        if (saveReturnPath) {
          saveCurrentPath();
        }
        setGuardState(prev => ({
          ...prev,
          hasRedirected: true,
          isGuarding: false,
        }));
        router.push(createProfilePath);
        return;
      }

      // プロフィール存在する場合はガード処理完了
      setGuardState(prev => ({
        ...prev,
        isChecked: true,
        isGuarding: false,
      }));

    } catch (error) {
      const message = error instanceof Error ? error.message : 'プロフィール確認中にエラーが発生しました';
      setGuardState(prev => ({
        ...prev,
        error: message,
        isGuarding: false,
      }));
    }
  }, [
    disabled,
    guardState.hasRedirected,
    authState.isAuthenticated,
    checkProfile,
    saveReturnPath,
    saveCurrentPath,
    router,
    loginPath,
    createProfilePath,
  ]);

  /**
   * 認証状態変化時の自動ガード実行
   */
  useEffect(() => {
    if (!disabled && authState.isAuthenticated !== undefined) {
      executeGuard();
    }
  }, [authState.isAuthenticated, executeGuard, disabled]);

  /**
   * 認証状態が未認証になった場合のリセット
   */
  useEffect(() => {
    if (!authState.isAuthenticated) {
      resetGuardState();
    }
  }, [authState.isAuthenticated, resetGuardState]);

  /**
   * プロフィール状態変化の監視
   */
  useEffect(() => {
    if (
      !disabled &&
      authState.isAuthenticated &&
      profileState.initialized &&
      !profileState.exists &&
      !guardState.hasRedirected
    ) {
      // プロフィール未作成が確認された場合のリダイレクト
      if (saveReturnPath) {
        saveCurrentPath();
      }
      setGuardState(prev => ({
        ...prev,
        hasRedirected: true,
      }));
      router.push(createProfilePath);
    }
  }, [
    disabled,
    authState.isAuthenticated,
    profileState.initialized,
    profileState.exists,
    guardState.hasRedirected,
    saveReturnPath,
    saveCurrentPath,
    router,
    createProfilePath,
  ]);

  return {
    // State
    guardState,
    
    // Profile state from useProfile for convenience
    profileExists: profileState.exists,
    profileLoading: profileState.isLoading,
    profileError: profileState.error,

    // Actions
    executeGuard,
    clearError,
    resetGuardState,
  };
}

/**
 * 保存された戻り先パスを取得・削除
 *
 * @description プロフィール作成完了後などに、元のページに戻るために使用します。
 * 
 * @returns 保存されていた戻り先パス（存在しない場合はnull）
 *
 * @example
 * ```typescript
 * const ProfileCreatePage = () => {
 *   const router = useRouter();
 *   
 *   const handleProfileCreated = () => {
 *     const returnPath = getAndClearReturnPath();
 *     router.push(returnPath || '/');
 *   };
 * };
 * ```
 */
export function getAndClearReturnPath(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const returnPath = sessionStorage.getItem('profileGuardReturnPath');
  if (returnPath) {
    sessionStorage.removeItem('profileGuardReturnPath');
    return returnPath;
  }
  
  return null;
}