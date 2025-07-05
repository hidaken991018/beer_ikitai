/**
 * Geolocation Hook
 *
 * ブラウザのGeolocation APIを使用してGPS位置情報を取得するカスタムフックです。
 * 位置情報の取得、追跡、距離計算、チェックイン判定機能を提供します。
 *
 * @since v1.0.0
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

import { GEOLOCATION_CONFIG, ERROR_MESSAGES } from '@/lib/constants';
import type { Coordinates, GeolocationPosition } from '@/types/brewery';

/**
 * Geolocationフックのオプション設定
 *
 * @description GPS位置情報取得の動作をカスタマイズするための設定です。
 */
interface UseGeolocationOptions {
  /** 高精度GPSを使用するかどうか（デフォルト: true） */
  enableHighAccuracy?: boolean;
  /** 位置情報取得のタイムアウト時間（ミリ秒、デフォルト: 10000） */
  timeout?: number;
  /** キャッシュされた位置情報の最大年齢（ミリ秒、デフォルト: 600000） */
  maximumAge?: number;
  /** 位置情報の継続監視を有効にするかどうか（デフォルト: false） */
  watch?: boolean;
}

/**
 * Geolocationフックの状態
 *
 * @description 位置情報取得の現在の状態を表すオブジェクトです。
 */
interface GeolocationState {
  /** 取得した位置情報（緯度・経度） */
  position: Coordinates | null;
  /** エラーメッセージ（エラーがない場合はnull） */
  error: string | null;
  /** 位置情報取得中かどうか */
  isLoading: boolean;
  /** ブラウザがGeolocation APIをサポートしているかどうか */
  isSupported: boolean;
}

/**
 * 位置情報取得カスタムフック
 *
 * @description ブラウザのGeolocation APIをラップし、ユーザーの位置情報を
 * 簡単に取得・監視できる機能を提供します。
 *
 * @param options - 位置情報取得のオプション設定
 * @returns 位置情報状態と操作関数群
 *
 * @example
 * ```tsx
 * const LocationDisplay = () => {
 *   const {
 *     position,
 *     error,
 *     isLoading,
 *     isSupported,
 *     getCurrentPosition,
 *     clearError
 *   } = useGeolocation({
 *     enableHighAccuracy: true,
 *     timeout: 10000
 *   });
 *
 *   const handleGetLocation = () => {
 *     getCurrentPosition();
 *   };
 *
 *   if (!isSupported) {
 *     return <div>位置情報がサポートされていません</div>;
 *   }
 *
 *   if (isLoading) {
 *     return <div>位置情報を取得中...</div>;
 *   }
 *
 *   if (error) {
 *     return (
 *       <div>
 *         <p>エラー: {error}</p>
 *         <button onClick={clearError}>エラーをクリア</button>
 *       </div>
 *     );
 *   }
 *
 *   return (
 *     <div>
 *       {position ? (
 *         <p>
 *           緯度: {position.latitude.toFixed(6)}<br />
 *           経度: {position.longitude.toFixed(6)}
 *         </p>
 *       ) : (
 *         <button onClick={handleGetLocation}>位置情報を取得</button>
 *       )}
 *     </div>
 *   );
 * };
 * ```
 */
export function useGeolocation(options?: UseGeolocationOptions) {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    isLoading: false,
    isSupported: false,
  });

  /**
   * Geolocation APIの設定オプション
   * プロパティからの設定とデフォルト設定を結合します。
   */
  const config: PositionOptions = useMemo(() => {
    return {
      enableHighAccuracy:
        options?.enableHighAccuracy ?? GEOLOCATION_CONFIG.enableHighAccuracy,
      timeout: options?.timeout ?? GEOLOCATION_CONFIG.timeout,
      maximumAge: options?.maximumAge ?? GEOLOCATION_CONFIG.maximumAge,
    };
  }, [options]);

  /**
   * 位置情報取得成功時のハンドラー
   *
   * @param position - ブラウザから取得した位置情報
   */
  const handleSuccess = useCallback((position: GeolocationPosition) => {
    setState(prevState => ({
      ...prevState,
      position: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      error: null,
      isLoading: false,
    }));
  }, []);

  /**
   * 位置情報取得エラー時のハンドラー
   *
   * @description エラーコードに応じて適切なメッセージを設定します。
   * @param error - Geolocation APIのエラーオブジェクト
   */
  const handleError = useCallback((error: GeolocationPositionError) => {
    let errorMessage: string;

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = ERROR_MESSAGES.geolocationDenied;
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = ERROR_MESSAGES.geolocationUnavailable;
        break;
      case error.TIMEOUT:
        errorMessage = ERROR_MESSAGES.geolocationTimeout;
        break;
      default:
        errorMessage = ERROR_MESSAGES.unknownError;
    }

    setState(prevState => ({
      ...prevState,
      position: null,
      error: errorMessage,
      isLoading: false,
    }));
  }, []);

  /**
   * 現在の位置情報を一度だけ取得する関数
   *
   * @description ユーザーの現在位置を取得し、状態を更新します。
   * ブラウザがGeolocation APIをサポートしていない場合はエラーを設定します。
   */
  const getCurrentPosition = useCallback(() => {
    if (!navigator?.geolocation) {
      setState(prevState => ({
        ...prevState,
        error: ERROR_MESSAGES.geolocationUnavailable,
        isLoading: false,
      }));
      return;
    }

    setState(prevState => ({
      ...prevState,
      isLoading: true,
      error: null,
    }));

    navigator?.geolocation?.getCurrentPosition(
      handleSuccess,
      handleError,
      config
    );
  }, [handleSuccess, handleError, config]);

  /**
   * 位置情報の継続監視を開始する関数
   *
   * @description ユーザーの位置情報の変化を継続的に監視します。
   * 移動中のユーザーの位置をリアルタイムで追跡したい場合に使用します。
   *
   * @returns 監視用のID（clearWatchで使用）またはnull（サポートされていない場合）
   */
  const watchPosition = useCallback(() => {
    if (!navigator?.geolocation) {
      setState(prevState => ({
        ...prevState,
        error: ERROR_MESSAGES.geolocationUnavailable,
        isLoading: false,
      }));
      return null;
    }

    setState(prevState => ({
      ...prevState,
      isLoading: true,
      error: null,
    }));

    const watchId = navigator?.geolocation?.watchPosition(
      handleSuccess,
      handleError,
      config
    );

    return watchId;
  }, [handleSuccess, handleError, config]);

  /**
   * 位置情報の監視を停止する関数
   *
   * @description watchPositionで開始した位置監視を停止します。
   * @param watchId - watchPositionから返された監視ID
   */
  const clearWatch = useCallback((watchId: number) => {
    if (navigator?.geolocation) {
      navigator?.geolocation?.clearWatch(watchId);
    }
  }, []);

  /**
   * エラー状態をクリアする関数
   *
   * @description 現在のエラーメッセージを削除し、エラー状態をリセットします。
   */
  const clearError = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      error: null,
    }));
  }, []);

  /**
   * watchオプションが有効な場合、マウント時に自動で位置監視を開始
   */
  useEffect(() => {
    if (options?.watch) {
      const watchId = watchPosition();
      return () => {
        if (watchId !== null) {
          clearWatch(watchId);
        }
      };
    }
  }, [options?.watch, watchPosition, clearWatch]);

  useEffect(() => {
    setState(prevState => ({
      ...prevState,
      isSupported: !!navigator?.geolocation,
    }));
  }, []);

  return {
    ...state,
    getCurrentPosition,
    watchPosition,
    clearWatch,
    clearError,
  };
}

/**
 * 2点間の距離を計算するユーティリティ関数
 *
 * @description Haversine公式を使用して、緯度・経度から地球上の2点間の
 * 直線距離をキロメートル単位で計算します。
 *
 * @param coord1 - 起点の座標（緯度・経度）
 * @param coord2 - 終点の座標（緯度・経度）
 * @returns 距離（キロメートル、小数点以下3桁で丸め）
 *
 * @example
 * ```typescript
 * const tokyo = { latitude: 35.6762, longitude: 139.6503 };
 * const osaka = { latitude: 34.6937, longitude: 135.5023 };
 *
 * const distance = calculateDistance(tokyo, osaka);
 * console.log(distance); // 約403.43 (キロメートル)
 *
 * // 醸造所からの距離を計算
 * const breweryLocation = { latitude: 35.6462, longitude: 139.7103 };
 * const userLocation = { latitude: 35.6465, longitude: 139.7100 };
 * const distanceToBrewery = calculateDistance(userLocation, breweryLocation);
 *
 * if (distanceToBrewery < 0.1) { // 100m以内
 *   console.log('チェックイン可能な距離です');
 * }
 * ```
 */
export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (coord2.latitude - coord1.latitude) * (Math.PI / 180);
  const dLon = (coord2.longitude - coord1.longitude) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.latitude * (Math.PI / 180)) *
      Math.cos(coord2.latitude * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 1000) / 1000; // Round to 3 decimal places
}

/**
 * ユーザーがチェックイン可能な範囲内にいるかどうかを判定する関数
 *
 * @description ユーザーの位置とターゲット位置（醸造所など）との距離を計算し、
 * 指定された半径内にいるかどうかを判定します。
 * チェックイン機能で使用されます。
 *
 * @param userLocation - ユーザーの現在位置
 * @param targetLocation - ターゲット位置（醸造所など）
 * @param radiusKm - チェックイン可能な半径（キロメートル、デフォルト: 0.1km = 100m）
 * @returns チェックイン可能な範囲内にいる場合はtrue
 *
 * @example
 * ```typescript
 * const userPos = { latitude: 35.6762, longitude: 139.6503 };
 * const breweryPos = { latitude: 35.6765, longitude: 139.6505 };
 *
 * // デフォルトの100m半径でチェック
 * const canCheckin = isWithinCheckinRadius(userPos, breweryPos);
 *
 * if (canCheckin) {
 *   console.log('チェックイン可能です！');
 *   // チェックイン処理を実行
 * } else {
 *   console.log('醸造所に近づいてからチェックインしてください');
 * }
 *
 * // カスタム半径でチェックイン範囲を変更
 * const canCheckinExtended = isWithinCheckinRadius(
 *   userPos,
 *   breweryPos,
 *   0.5 // 500m半径
 * );
 * ```
 */
export function isWithinCheckinRadius(
  userLocation: Coordinates,
  targetLocation: Coordinates,
  radiusKm: number = GEOLOCATION_CONFIG.checkinRadius
): boolean {
  const distance = calculateDistance(userLocation, targetLocation);
  return distance <= radiusKm;
}
