/**
 * Breweries Hook
 *
 * 醸造所情報の管理、検索、チェックイン機能を提供するカスタムフックです。
 * GPS位置情報を基にした近隣醸造所検索、訪問記録管理などの機能を統一管理します。
 *
 * @since v1.0.0
 */

'use client';

import { useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { calculateDistance } from '@/hooks/useGeolocation';
import { apiClient } from '@/lib/api/client';
import {
  setLoading,
  setError,
  clearError,
  setBreweries,
  addBrewery,
  updateBrewery,
  removeBrewery,
  setCurrentBrewery,
  setNearbyBreweries,
  updateBreweryDistance,
  setLastLocation,
  setSearchQuery,
  setFilters,
  resetFilters,
  setVisits,
  checkinStart,
  checkinSuccess,
  checkinFailure,
  clearBreweryData,
  selectBrewery,
} from '@/store/slices/brewerySlice';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type {
  Brewery,
  BreweryInput,
  BreweryWithDistance,
  BrewerySearchFilter,
  NearbyBreweriesFilter,
  CheckinInput,
  CheckinResponse,
  Visit,
  Coordinates,
} from '@/types/brewery';

/**
 * 醸造所管理カスタムフック
 *
 * @description 醸造所情報のCRUD操作、位置ベースの検索、チェックイン機能、
 * 訪問履歴管理などを統一的に提供します。Reduxストアと連携して状態管理を自動化します。
 *
 * @returns 醸造所状態と醸造所関連の操作関数群
 *
 * @example
 * ```tsx
 * const BreweryList = () => {
 *   const {
 *     breweryState,
 *     fetchBreweries,
 *     fetchNearbyBreweries,
 *     searchBreweries,
 *     checkin
 *   } = useBreweries();
 *   const { position } = useGeolocation();
 *
 *   // 近隣醸造所を取得
 *   useEffect(() => {
 *     if (position) {
 *       fetchNearbyBreweries(position, { radius: 5, limit: 20 });
 *     }
 *   }, [position, fetchNearbyBreweries]);
 *
 *   // チェックイン処理
 *   const handleCheckin = async (breweryId: number) => {
 *     if (position) {
 *       try {
 *         await checkin({
 *           breweryId,
 *           latitude: position.latitude,
 *           longitude: position.longitude
 *         });
 *         alert('チェックイン成功！');
 *       } catch (error) {
 *         alert('チェックインに失敗しました');
 *       }
 *     }
 *   };
 *
 *   if (breweryState.isLoading) {
 *     return <div>読み込み中...</div>;
 *   }
 *
 *   return (
 *     <div>
 *       {breweryState.nearbyBreweries.map(brewery => (
 *         <BreweryCard
 *           key={brewery.id}
 *           brewery={brewery}
 *           distance={brewery.distance}
 *           onCheckin={() => handleCheckin(brewery.id)}
 *         />
 *       ))}
 *     </div>
 *   );
 * };
 * ```
 */
export function useBreweries() {
  const dispatch = useDispatch();
  const breweryState = useSelector(selectBrewery);
  const apiClientRef = useRef(apiClient);

  /**
   * 全醸造所情報を取得する関数
   *
   * @description ページネーションと検索機能をサポートした醸造所一覧を取得します。
   *
   * @param params - 取得パラメータ（ページ番号、件数、検索キーワード）
   * @throws API通信エラー時にエラーをスロー
   */
  const fetchBreweries = useCallback(
    async (params?: { page?: number; limit?: number; search?: string }) => {
      try {
        dispatch(setLoading(true));
        dispatch(clearError());

        const queryParams: Record<string, string | number> = {};
        if (params?.page) queryParams.page = params.page;
        if (params?.limit) queryParams.limit = params.limit;
        if (params?.search) queryParams.search = params.search;

        const response = await apiClientRef.current.get<
          PaginatedResponse<Brewery>
        >('/api/breweries', queryParams);

        dispatch(setBreweries(response.data));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to fetch breweries';
        dispatch(setError(message));
      }
    },
    [dispatch]
  );

  /**
   * 近隣醸造所情報を取得する関数
   *
   * @description ユーザーの位置を中心として指定半径内の醸造所を取得し、
   * 距離を計算して近い順にソートします。
   *
   * @param userLocation - ユーザーの現在位置（緯度・経度）
   * @param options - 検索オプション（半径、件数など）
   * @throws API通信エラー時にエラーをスロー
   */
  const fetchNearbyBreweries = useCallback(
    async (
      userLocation: Coordinates,
      options?: Partial<NearbyBreweriesFilter>
    ) => {
      try {
        dispatch(setLoading(true));
        dispatch(clearError());

        const params: Record<string, string | number> = {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radius: options?.radius || breweryState?.filters?.radius || 5,
          limit: options?.limit || breweryState?.filters?.limit || 20,
        };

        const response = await apiClientRef.current.get<ApiResponse<Brewery[]>>(
          '/api/breweries/nearby',
          params
        );

        // Calculate distances and sort by distance
        const breweriesWithDistance: BreweryWithDistance[] = response.data
          .map((brewery: Brewery) => ({
            ...brewery,
            distance: calculateDistance(userLocation, {
              latitude: brewery.latitude,
              longitude: brewery.longitude,
            }),
          }))
          .sort(
            (a: BreweryWithDistance, b: BreweryWithDistance) =>
              (a.distance || 0) - (b.distance || 0)
          );

        dispatch(setNearbyBreweries(breweriesWithDistance));
        dispatch(setLastLocation(userLocation));
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to fetch nearby breweries';
        dispatch(setError(message));
      }
    },
    [dispatch, breweryState?.filters?.radius, breweryState?.filters?.limit]
  );

  /**
   * 指定IDの醸造所情報を取得する関数
   *
   * @description 特定の醸造所の詳細情報を取得し、現在の醸造所として設定します。
   *
   * @param id - 取得する醸造所のID
   * @throws API通信エラー時にエラーをスロー
   */
  const fetchBreweryById = useCallback(
    async (id: number) => {
      try {
        dispatch(setLoading(true));
        dispatch(clearError());

        const response = await apiClientRef.current.get<ApiResponse<Brewery>>(
          `/api/breweries/${id}`
        );
        dispatch(setCurrentBrewery(response.data));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to fetch brewery';
        dispatch(setError(message));
      }
    },
    [dispatch]
  );

  /**
   * 新しい醸造所を作成する関数
   *
   * @description 醸造所情報をサーバーに送信し、新しい醸造所を作成します。
   * 作成成功時はローカル状態にも追加されます。
   *
   * @param breweryData - 作成する醸造所の情報
   * @returns 作成された醸造所情報
   * @throws API通信エラー時にエラーをスロー
   */
  const createBrewery = useCallback(
    async (breweryData: BreweryInput) => {
      try {
        dispatch(setLoading(true));
        dispatch(clearError());

        const response = await apiClientRef.current.post<ApiResponse<Brewery>>(
          '/api/breweries',
          breweryData
        );
        dispatch(addBrewery(response.data));
        return response.data;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to create brewery';
        dispatch(setError(message));
        throw error;
      }
    },
    [dispatch]
  );

  /**
   * 醸造所情報を更新する関数
   *
   * @description 指定IDの醸造所情報を更新します。
   * 部分的な情報の更新が可能です。
   *
   * @param id - 更新する醸造所のID
   * @param breweryData - 更新する醸造所情報（部分更新可能）
   * @returns 更新された醸造所情報
   * @throws API通信エラー時にエラーをスロー
   */
  const updateBreweryById = useCallback(
    async (id: number, breweryData: Partial<BreweryInput>) => {
      try {
        dispatch(setLoading(true));
        dispatch(clearError());

        const response = await apiClientRef.current.put<ApiResponse<Brewery>>(
          `/api/breweries/${id}`,
          breweryData
        );
        dispatch(updateBrewery(response.data));
        return response.data;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to update brewery';
        dispatch(setError(message));
        throw error;
      }
    },
    [dispatch]
  );

  /**
   * 醸造所を削除する関数
   *
   * @description 指定IDの醸造所をサーバーから削除し、
   * ローカル状態からも除去します。
   *
   * @param id - 削除する醸造所のID
   * @throws API通信エラー時にエラーをスロー
   */
  const deleteBrewery = useCallback(
    async (id: number) => {
      try {
        dispatch(setLoading(true));
        dispatch(clearError());

        await apiClientRef.current.delete(`/api/breweries/${id}`);
        dispatch(removeBrewery(id));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to delete brewery';
        dispatch(setError(message));
        throw error;
      }
    },
    [dispatch]
  );

  /**
   * 醸造所を検索する関数
   *
   * @description キーワード、位置、半径などの条件で醸造所を検索します。
   * 位置情報が提供された場合は距離も計算します。
   *
   * @param filter - 検索条件（キーワード、位置、半径など）
   * @returns 検索結果の醸造所配列
   * @throws API通信エラー時にエラーをスロー
   */
  const searchBreweries = useCallback(
    async (filter: BrewerySearchFilter) => {
      try {
        dispatch(setLoading(true));
        dispatch(clearError());

        const params: Record<string, string | number> = {};
        if (filter.query) params.query = filter.query;
        if (filter.location) {
          params.latitude = filter.location.latitude;
          params.longitude = filter.location.longitude;
        }
        if (filter.radius) params.radius = filter.radius;
        if (filter.limit) params.limit = filter.limit;
        if (filter.offset) params.offset = filter.offset;

        const response = await apiClientRef.current.get<
          PaginatedResponse<Brewery>
        >('/api/breweries/search', params);

        // If location is provided, calculate distances
        if (filter.location) {
          const breweriesWithDistance: BreweryWithDistance[] =
            response.data.map((brewery: Brewery) => ({
              ...brewery,
              distance: calculateDistance(filter.location!, {
                latitude: brewery.latitude,
                longitude: brewery.longitude,
              }),
            }));
          dispatch(setNearbyBreweries(breweriesWithDistance));
        } else {
          dispatch(setBreweries(response.data));
        }

        return response.data;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to search breweries';
        dispatch(setError(message));
        throw error;
      }
    },
    [dispatch]
  );

  /**
   * ユーザーの訪問履歴を取得する関数
   *
   * @description ログイン中のユーザーの醸造所訪問履歴を取得します。
   *
   * @param params - 取得パラメータ（ページ番号、件数）
   * @throws API通信エラー時にエラーをスロー
   */
  const fetchVisits = useCallback(
    async (params?: { page?: number; limit?: number }) => {
      try {
        dispatch(setLoading(true));
        dispatch(clearError());

        const queryParams: Record<string, string | number> = {};
        if (params?.page) queryParams.page = params.page;
        if (params?.limit) queryParams.limit = params.limit;

        const response = await apiClientRef.current.get<
          PaginatedResponse<Visit>
        >('/api/visits', queryParams);
        dispatch(setVisits(response.data));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to fetch visits';
        dispatch(setError(message));
      }
    },
    [dispatch]
  );

  /**
   * 醸造所チェックイン関数
   *
   * @description ユーザーの位置情報を使用して醸造所へのチェックインを実行します。
   * サーバー側で位置の妥当性が検証されます。
   *
   * @param checkinData - チェックイン情報（醸造所ID、緯度、経度）
   * @returns 作成された訪問記録
   * @throws チェックイン失敗時にエラーをスロー
   */
  const checkin = useCallback(
    async (checkinData: CheckinInput) => {
      try {
        dispatch(
          checkinStart({
            breweryId: checkinData.breweryId,
            userLocation: {
              latitude: checkinData.latitude,
              longitude: checkinData.longitude,
            },
            timestamp: Date.now(),
          })
        );

        const response = await apiClientRef.current.post<CheckinResponse>(
          '/api/visits/checkin',
          checkinData
        );

        if (response.success) {
          dispatch(checkinSuccess(response.visit));
          return response.visit;
        } else {
          throw new Error('Checkin failed');
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Checkin failed';
        dispatch(checkinFailure(message));
        throw error;
      }
    },
    [dispatch]
  );

  /**
   * 醸造所までの距離を更新する関数
   *
   * @description ユーザーの位置変化に応じて、特定の醸造所までの距離を
   * リアルタイムで更新します。位置監視機能と組み合わせて使用します。
   *
   * @param breweryId - 距離を更新する醸造所のID
   * @param userLocation - ユーザーの現在位置
   */
  const updateDistance = useCallback(
    (breweryId: number, userLocation: Coordinates) => {
      const brewery =
        breweryState?.breweries.find((b: Brewery) => b.id === breweryId) ||
        breweryState?.nearbyBreweries.find(
          (b: BreweryWithDistance) => b.id === breweryId
        );

      if (brewery) {
        const distance = calculateDistance(userLocation, {
          latitude: brewery.latitude,
          longitude: brewery.longitude,
        });
        dispatch(updateBreweryDistance({ breweryId, distance }));
      }
    },
    [dispatch, breweryState?.breweries, breweryState?.nearbyBreweries]
  );

  /**
   * 検索キーワードを設定する関数
   *
   * @description 醸造所検索用のキーワードをローカル状態に設定します。
   *
   * @param query - 検索キーワード
   */
  const setSearch = useCallback(
    (query: string) => {
      dispatch(setSearchQuery(query));
    },
    [dispatch]
  );

  /**
   * 検索フィルターを更新する関数
   *
   * @description 醸造所検索のフィルター条件（半径、件数など）を更新します。
   *
   * @param filters - 更新するフィルター設定（部分更新可能）
   */
  const updateFilters = useCallback(
    (filters: Partial<typeof breweryState.filters>) => {
      dispatch(setFilters(filters));
    },
    [dispatch, breweryState]
  );

  /**
   * 検索条件をリセットする関数
   *
   * @description 検索キーワードやフィルター条件を初期状態に戻します。
   */
  const resetSearch = useCallback(() => {
    dispatch(resetFilters());
  }, [dispatch]);

  /**
   * エラー状態をクリアする関数
   *
   * @description 現在のエラーメッセージを削除し、エラー状態をリセットします。
   */
  const clearErrors = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  /**
   * 醸造所データをクリアする関数
   *
   * @description ローカルにキャッシュされた醸造所データをすべて削除します。
   * メモリ節約やログアウト時のデータクリアに使用します。
   */
  const clearData = useCallback(() => {
    dispatch(clearBreweryData());
  }, [dispatch]);

  return {
    // State
    breweryState,

    // Brewery operations
    fetchBreweries,
    fetchNearbyBreweries,
    fetchBreweryById,
    createBrewery,
    updateBreweryById,
    deleteBrewery,
    searchBreweries,

    // Visit operations
    fetchVisits,
    checkin,

    // Utility functions
    updateDistance,

    // Local state management
    setSearch,
    updateFilters,
    resetSearch,
    clearErrors,
    clearData,
  };
}
