/**
 * Profile Management Hook
 *
 * ユーザープロフィールの状態管理とCRUD操作を提供するカスタムフックです。
 * 認証状態と連携し、プロフィールデータの取得・作成・更新を管理します。
 *
 * @since v1.0.0
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

import { useAuthContext } from '@/components/auth/AuthProvider';
import {
  getProfile,
  createProfile,
  updateProfile,
  checkProfileExists,
} from '@/lib/api/profile';
import type { UserProfile, UserProfileInput } from '@/types/api';

/**
 * プロフィール状態の型定義
 */
export interface ProfileState {
  /** プロフィールデータ */
  profile: UserProfile | null;
  /** 読み込み中フラグ */
  isLoading: boolean;
  /** エラーメッセージ */
  error: string | null;
  /** プロフィールが存在するかのフラグ */
  exists: boolean;
  /** 初期化完了フラグ */
  initialized: boolean;
}

/**
 * プロフィール管理カスタムフック
 *
 * @description ユーザープロフィールの包括的な管理機能を提供します。
 * 認証状態と連携し、プロフィールの存在確認、取得、作成、更新を自動化します。
 *
 * @returns プロフィール状態と操作関数
 *
 * @example
 * ```tsx
 * const ProfileComponent = () => {
 *   const {
 *     profileState,
 *     fetchProfile,
 *     createUserProfile,
 *     updateUserProfile
 *   } = useProfile();
 *
 *   useEffect(() => {
 *     fetchProfile();
 *   }, [fetchProfile]);
 *
 *   if (profileState.isLoading) {
 *     return <div>読み込み中...</div>;
 *   }
 *
 *   if (!profileState.exists) {
 *     return <ProfileCreateForm onSubmit={createUserProfile} />;
 *   }
 *
 *   return <div>こんにちは、{profileState.profile?.displayName}さん</div>;
 * };
 * ```
 */
export function useProfile() {
  const { authState } = useAuthContext();
  
  const [profileState, setProfileState] = useState<ProfileState>({
    profile: null,
    isLoading: false,
    error: null,
    exists: false,
    initialized: false,
  });

  /**
   * プロフィール状態をリセット
   */
  const resetProfileState = useCallback(() => {
    setProfileState({
      profile: null,
      isLoading: false,
      error: null,
      exists: false,
      initialized: false,
    });
  }, []);

  /**
   * エラー状態をクリア
   */
  const clearError = useCallback(() => {
    setProfileState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  /**
   * プロフィール存在チェック
   *
   * @description 認証済みユーザーのプロフィールの存在を確認します。
   * ガード機能で使用することを想定しています。
   *
   * @returns プロフィール存在の真偽値
   */
  const checkProfile = useCallback(async (): Promise<boolean> => {
    if (!authState.isAuthenticated) {
      return false;
    }

    try {
      setProfileState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const exists = await checkProfileExists();
      
      setProfileState(prev => ({
        ...prev,
        exists,
        initialized: true,
        isLoading: false,
      }));
      
      return exists;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'プロフィール確認に失敗しました';
      setProfileState(prev => ({
        ...prev,
        error: message,
        isLoading: false,
        initialized: true,
      }));
      return false;
    }
  }, [authState.isAuthenticated]);

  /**
   * プロフィール取得
   *
   * @description 認証済みユーザーのプロフィール情報を取得します。
   * プロフィールが存在しない場合はexistsフラグがfalseになります。
   */
  const fetchProfile = useCallback(async (): Promise<void> => {
    if (!authState.isAuthenticated) {
      resetProfileState();
      return;
    }

    try {
      setProfileState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const profile = await getProfile();
      
      setProfileState(prev => ({
        ...prev,
        profile,
        exists: true,
        initialized: true,
        isLoading: false,
      }));
    } catch (error) {
      const apiError = error as { status?: number; message?: string };
      
      if (apiError.status === 404) {
        // プロフィール未作成
        setProfileState(prev => ({
          ...prev,
          profile: null,
          exists: false,
          initialized: true,
          isLoading: false,
        }));
      } else {
        // その他のエラー
        const message = apiError.message || 'プロフィール取得に失敗しました';
        setProfileState(prev => ({
          ...prev,
          error: message,
          initialized: true,
          isLoading: false,
        }));
      }
    }
  }, [authState.isAuthenticated, resetProfileState]);

  /**
   * プロフィール作成
   *
   * @description 新規ユーザーのプロフィールを作成します。
   * 作成成功後は自動的にプロフィール情報を更新します。
   *
   * @param profileData - プロフィール作成データ
   * @throws プロフィール作成失敗時にエラーをスロー
   */
  const createUserProfile = useCallback(
    async (profileData: UserProfileInput): Promise<void> => {
      if (!authState.isAuthenticated) {
        throw new Error('認証が必要です');
      }

      try {
        setProfileState(prev => ({ ...prev, isLoading: true, error: null }));
        
        const profile = await createProfile(profileData);
        
        setProfileState(prev => ({
          ...prev,
          profile,
          exists: true,
          isLoading: false,
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'プロフィール作成に失敗しました';
        setProfileState(prev => ({
          ...prev,
          error: message,
          isLoading: false,
        }));
        throw error;
      }
    },
    [authState.isAuthenticated]
  );

  /**
   * プロフィール更新
   *
   * @description 認証済みユーザーのプロフィール情報を更新します。
   * 更新成功後は自動的にプロフィール情報を更新します。
   *
   * @param profileData - 更新するプロフィールデータ
   * @throws プロフィール更新失敗時にエラーをスロー
   */
  const updateUserProfile = useCallback(
    async (profileData: UserProfileInput): Promise<void> => {
      if (!authState.isAuthenticated) {
        throw new Error('認証が必要です');
      }

      if (!profileState.exists) {
        throw new Error('プロフィールが存在しません');
      }

      try {
        setProfileState(prev => ({ ...prev, isLoading: true, error: null }));
        
        const profile = await updateProfile(profileData);
        
        setProfileState(prev => ({
          ...prev,
          profile,
          isLoading: false,
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'プロフィール更新に失敗しました';
        setProfileState(prev => ({
          ...prev,
          error: message,
          isLoading: false,
        }));
        throw error;
      }
    },
    [authState.isAuthenticated, profileState.exists]
  );

  /**
   * 認証状態変化時の処理
   */
  useEffect(() => {
    if (authState.isAuthenticated) {
      fetchProfile();
    } else {
      resetProfileState();
    }
  }, [authState.isAuthenticated, fetchProfile, resetProfileState]);

  return {
    // State
    profileState,

    // Actions
    fetchProfile,
    createUserProfile,
    updateUserProfile,
    checkProfile,
    clearError,
    resetProfileState,
  };
}