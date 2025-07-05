/**
 * Authentication Hook
 *
 * AWS Cognito認証機能を提供するカスタムフックです。
 * ユーザーログイン、登録、パスワード管理、プロフィール更新などの機能を統一的に管理します。
 *
 * @since v1.0.0
 */

'use client';

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { apiClient } from '@/lib/api/client';
import { cognitoAuthService } from '@/lib/auth/cognito';
import {
  authStart,
  loginSuccess,
  logout as logoutAction,
  authError,
  updateUser,
  updateTokens,
  clearError,
  setLoading,
  selectAuth,
} from '@/store/slices/authSlice';
import type {
  LoginCredentials,
  RegisterCredentials,
  ConfirmSignUpInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
  UpdateProfileInput,
} from '@/types/auth';

/**
 * 認証機能カスタムフック
 *
 * @description AWS Cognitoを使用した包括的な認証機能を提供します。
 * Reduxストアと連携し、認証状態を自動管理します。
 *
 * @returns 認証状態と認証関連の関数群
 *
 * @example
 * ```tsx
 * const LoginForm = () => {
 *   const { authState, login, logout } = useAuth();
 *
 *   const handleLogin = async () => {
 *     try {
 *       await login({
 *         email: 'user@example.com',
 *         password: 'password123'
 *       });
 *       console.log('ログイン成功');
 *     } catch (error) {
 *       console.error('ログイン失敗:', error);
 *     }
 *   };
 *
 *   if (authState.isLoading) {
 *     return <div>認証中...</div>;
 *   }
 *
 *   if (authState.isAuthenticated) {
 *     return (
 *       <div>
 *         <p>こんにちは、{authState.user?.given_name}さん</p>
 *         <button onClick={logout}>ログアウト</button>
 *       </div>
 *     );
 *   }
 *
 *   return <button onClick={handleLogin}>ログイン</button>;
 * };
 * ```
 */
export function useAuth() {
  const dispatch = useDispatch();
  const authState = useSelector(selectAuth);

  /**
   * ユーザーログイン関数
   *
   * @description メールアドレスとパスワードでユーザーを認証します。
   * 成功時はJWTトークンを取得し、APIクライアントに設定します。
   *
   * @param credentials - ログイン認証情報
   * @throws ログイン失敗時にエラーをスロー
   */
  const login = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        dispatch(authStart());

        const { user } = await cognitoAuthService.login(credentials);

        if (user) {
          const tokens = await cognitoAuthService.getTokens();

          if (tokens.accessToken && tokens.idToken && tokens.refreshToken) {
            // Set API client token
            apiClient.setAccessToken(tokens.accessToken);

            dispatch(
              loginSuccess({
                user,
                accessToken: tokens.accessToken,
                idToken: tokens.idToken,
                refreshToken: tokens.refreshToken,
              })
            );
          } else {
            throw new Error('Failed to retrieve tokens');
          }
        } else {
          throw new Error('Login failed');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Login failed';
        dispatch(authError(message));
        throw error;
      }
    },
    [dispatch]
  );

  /**
   * ユーザー新規登録関数
   *
   * @description 新しいユーザーアカウントを作成します。
   * 登録後はメール認証が必要です。
   *
   * @param credentials - ユーザー登録情報
   * @returns 登録結果オブジェクト
   * @throws 登録失敗時にエラーをスロー
   */
  const register = useCallback(
    async (credentials: RegisterCredentials) => {
      try {
        dispatch(authStart());

        const result = await cognitoAuthService.register(credentials);

        // Registration successful, but user needs to confirm
        dispatch(clearError());
        return result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Registration failed';
        dispatch(authError(message));
        throw error;
      }
    },
    [dispatch]
  );

  /**
   * ユーザー登録確認関数
   *
   * @description メールで送信された確認コードでユーザー登録を完了します。
   *
   * @param input - 確認コードとメールアドレス
   * @returns 確認結果オブジェクト
   * @throws 確認失敗時にエラーをスロー
   */
  const confirmSignUp = useCallback(
    async (input: ConfirmSignUpInput) => {
      try {
        dispatch(authStart());

        const result = await cognitoAuthService.confirmSignUp(input);

        dispatch(clearError());
        dispatch(setLoading(false)); // 成功時にローディング状態を明示的にリセット
        return result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Confirmation failed';
        dispatch(authError(message));
        throw error;
      }
    },
    [dispatch]
  );

  /**
   * パスワードリセットメール送信関数
   *
   * @description パスワードリセット用の確認コードをメールで送信します。
   *
   * @param input - パスワードリセット対象のメールアドレス
   * @returns リセットメール送信結果
   * @throws メール送信失敗時にエラーをスロー
   */
  const forgotPassword = useCallback(
    async (input: ForgotPasswordInput) => {
      try {
        dispatch(authStart());

        const result = await cognitoAuthService.forgotPassword(input);

        dispatch(clearError());
        return result;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Password reset request failed';
        dispatch(authError(message));
        throw error;
      }
    },
    [dispatch]
  );

  /**
   * パスワードリセット実行関数
   *
   * @description 確認コードを使用してパスワードを新しいものに変更します。
   *
   * @param input - メールアドレス、確認コード、新しいパスワード
   * @throws パスワードリセット失敗時にエラーをスロー
   */
  const resetPassword = useCallback(
    async (input: ResetPasswordInput) => {
      try {
        dispatch(authStart());

        await cognitoAuthService.resetPassword(input);

        dispatch(clearError());
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Password reset failed';
        dispatch(authError(message));
        throw error;
      }
    },
    [dispatch]
  );

  /**
   * パスワード変更関数
   *
   * @description ログイン済みユーザーのパスワードを変更します。
   * 現在のパスワードでの認証が必要です。
   *
   * @param input - 現在のパスワードと新しいパスワード
   * @throws パスワード変更失敗時にエラーをスロー
   */
  const changePassword = useCallback(
    async (input: ChangePasswordInput) => {
      try {
        dispatch(authStart());

        await cognitoAuthService.changePassword(input);

        dispatch(clearError());
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Password change failed';
        dispatch(authError(message));
        throw error;
      }
    },
    [dispatch]
  );

  /**
   * ユーザープロフィール更新関数
   *
   * @description ユーザーのプロフィール情報（名前、アイコンなど）を更新します。
   * Reduxストアのユーザー情報も同時に更新されます。
   *
   * @param input - 更新するプロフィール情報
   * @throws プロフィール更新失敗時にエラーをスロー
   */
  const updateProfile = useCallback(
    async (input: UpdateProfileInput) => {
      try {
        dispatch(authStart());

        await cognitoAuthService.updateProfile(input);

        // Update user in state
        dispatch(updateUser(input));
        dispatch(clearError());
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Profile update failed';
        dispatch(authError(message));
        throw error;
      }
    },
    [dispatch]
  );

  /**
   * ユーザーログアウト関数
   *
   * @description ユーザーをログアウトし、ローカル状態をクリアします。
   * APIクライアントのトークンも削除されます。
   *
   * @throws ログアウト失敗時にエラーをスロー（ローカル状態はクリアされる）
   */
  const logout = useCallback(async () => {
    try {
      await cognitoAuthService.logout();

      // Clear API client token
      apiClient.setAccessToken(null);

      dispatch(logoutAction());
    } catch (error) {
      // Even if logout fails, clear local state
      dispatch(logoutAction());
      throw error;
    }
  }, [dispatch]);

  /**
   * 認証状態リフレッシュ関数
   *
   * @description Cognitoから最新のユーザー情報とトークンを取得し、
   * ローカル状態を更新します。アプリ起動時の認証状態復元に使用します。
   *
   * @throws 認証情報取得失敗時にエラーをスロー（ユーザーはログアウト状態になる）
   */
  const refreshAuth = useCallback(async () => {
    try {
      dispatch(authStart());

      const user = await cognitoAuthService.getCurrentUser();

      if (user) {
        const tokens = await cognitoAuthService.getTokens();

        if (tokens.accessToken && tokens.idToken) {
          // Set API client token
          apiClient.setAccessToken(tokens.accessToken);

          dispatch(
            updateTokens({
              accessToken: tokens.accessToken,
              idToken: tokens.idToken,
              refreshToken:
                tokens.refreshToken || authState.refreshToken || undefined,
            })
          );

          dispatch(updateUser(user));
        } else {
          dispatch(logoutAction());
        }
      } else {
        dispatch(logoutAction());
      }
    } catch (error) {
      dispatch(logoutAction());
      throw error;
    }
  }, [dispatch, authState.refreshToken]);

  /**
   * 認証エラークリア関数
   *
   * @description 認証エラー状態をクリアします。
   * エラーメッセージを非表示にする際に使用します。
   */
  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    // State
    authState,

    // Actions
    login,
    register,
    confirmSignUp,
    forgotPassword,
    resetPassword,
    changePassword,
    updateProfile,
    logout,
    refreshAuth,
    clearError: clearAuthError,
  };
}
