/**
 * API Client Module
 *
 * このファイルはバックエンドAPIとの通信を担う統一クライアントを提供します。
 * 認証、エラーハンドリング、レスポンス変換などの共通処理を実装します。
 *
 * @since v1.0.0
 */

import type { ApiClientConfig, RequestConfig, ApiError } from '@/types/api';

import { API_CONFIG, HTTP_STATUS, ERROR_MESSAGES } from '../constants';

/**
 * API通信クライアントクラス
 *
 * @description バックエンドAPIとの通信を統一的に処理するクライアントです。
 * JWT認証、エラーハンドリング、レスポンス変換を自動化します。
 *
 * @example
 * ```typescript
 * // 基本的な使用方法
 * const client = new ApiClient({
 *   baseUrl: 'https://api.mybeerlog.com'
 * });
 *
 * // 認証トークンの設定
 * client.setAccessToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
 *
 * // GET リクエスト
 * const breweries = await client.get<Brewery[]>('/breweries');
 *
 * // POST リクエスト
 * const newBrewery = await client.post<Brewery>('/breweries', {
 *   name: '新しい醸造所',
 *   latitude: 35.6762,
 *   longitude: 139.6503
 * });
 *
 * // パラメータ付きGETリクエスト
 * const nearbyBreweries = await client.get<Brewery[]>('/breweries/nearby', {
 *   latitude: 35.6762,
 *   longitude: 139.6503,
 *   radius: 5
 * });
 * ```
 */
export class ApiClient {
  private config: ApiClientConfig;

  /**
   * ApiClient のコンストラクタ
   *
   * @param config - API クライアントの設定（部分的な設定も可能）
   *
   * @example
   * ```typescript
   * // デフォルト設定でクライアントを作成
   * const client = new ApiClient();
   *
   * // カスタム設定でクライアントを作成
   * const client = new ApiClient({
   *   baseUrl: 'https://api.example.com',
   *   accessToken: 'your-jwt-token'
   * });
   * ```
   */
  constructor(config?: Partial<ApiClientConfig>) {
    this.config = {
      baseUrl: API_CONFIG.baseUrl,
      ...config,
    };
  }

  /**
   * 認証トークンを設定する
   *
   * @description 以降のすべてのAPIリクエストでJWT認証ヘッダーとして使用されます。
   *
   * @param token - JWT アクセストークン（null の場合は認証ヘッダーを削除）
   *
   * @example
   * ```typescript
   * // トークンを設定
   * client.setAccessToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
   *
   * // トークンを削除（ログアウト時など）
   * client.setAccessToken(null);
   * ```
   */
  setAccessToken(token: string | null) {
    this.config.accessToken = token || undefined;
  }

  /**
   * HTTP リクエストを実行する内部メソッド
   *
   * @description すべてのAPIリクエストの共通処理を行います。
   * URL構築、ヘッダー設定、エラーハンドリングを自動化します。
   *
   * @param config - リクエスト設定オブジェクト
   * @returns レスポンスデータ
   * @throws API エラーまたはネットワークエラー
   *
   * @internal
   */
  private async makeRequest<T>(config: RequestConfig): Promise<T> {
    const url = new URL(config.url, this.config.baseUrl);

    if (config.params) {
      Object.entries(config.params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    if (this.config.accessToken) {
      headers.Authorization = `Bearer ${this.config.accessToken}`;
    }

    const requestInit: RequestInit = {
      method: config.method,
      headers,
    };

    if (config.data && config.method !== 'GET') {
      requestInit.body = JSON.stringify(config.data);
    }

    try {
      const response = await fetch(url.toString(), requestInit);

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      // Handle empty responses (e.g., 204 No Content)
      if (response.status === 204) {
        return {} as T;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(ERROR_MESSAGES.networkError);
    }
  }

  /**
   * API エラーレスポンスを処理する内部メソッド
   *
   * @description HTTPエラーステータスを適切なエラーメッセージに変換し、
   * エラーコードと共に例外をスローします。
   *
   * @param response - エラーを含むレスポンスオブジェクト
   * @throws 詳細なエラー情報を含む Error オブジェクト
   *
   * @internal
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage: string = ERROR_MESSAGES.unknownError;
    let errorCode = 'UNKNOWN_ERROR';

    try {
      const errorData: ApiError = await response.json();
      errorMessage = errorData?.error || errorMessage;
      errorCode = errorData?.code || errorCode;
    } catch {
      // If response body is not valid JSON, use status-based messages
      switch (response.status) {
        case HTTP_STATUS.UNAUTHORIZED:
          errorMessage = ERROR_MESSAGES.unauthorizedError;
          errorCode = 'UNAUTHORIZED';
          break;
        case HTTP_STATUS.FORBIDDEN:
          errorMessage = ERROR_MESSAGES.forbiddenError;
          errorCode = 'FORBIDDEN';
          break;
        case HTTP_STATUS.NOT_FOUND:
          errorMessage = ERROR_MESSAGES.notFoundError;
          errorCode = 'NOT_FOUND';
          break;
        case HTTP_STATUS.BAD_REQUEST:
          errorMessage = ERROR_MESSAGES.validationError;
          errorCode = 'VALIDATION_ERROR';
          break;
        default:
          errorMessage = ERROR_MESSAGES.networkError;
          errorCode = 'NETWORK_ERROR';
      }
    }

    const error = new Error(errorMessage) as Error & {
      code: string;
      status: number;
    };
    error.code = errorCode;
    error.status = response.status;
    throw error;
  }

  /**
   * GET リクエストを実行する
   *
   * @description 指定されたエンドポイントに対してGETリクエストを送信します。
   *
   * @param url - リクエスト先のURL（ベースURLからの相対パス）
   * @param params - URLクエリパラメータ（任意）
   * @returns レスポンスデータ
   *
   * @example
   * ```typescript
   * // 基本的なGETリクエスト
   * const breweries = await client.get<Brewery[]>('/breweries');
   *
   * // パラメータ付きGETリクエスト
   * const brewery = await client.get<Brewery>('/breweries/42');
   *
   * // クエリパラメータ付きリクエスト
   * const results = await client.get<Brewery[]>('/breweries/search', {
   *   query: 'クラフト',
   *   limit: 20
   * });
   * ```
   */
  async get<T>(
    url: string,
    params?: Record<string, string | number>
  ): Promise<T> {
    return this.makeRequest<T>({ method: 'GET', url, params });
  }

  /**
   * POST リクエストを実行する
   *
   * @description 指定されたエンドポイントに対してPOSTリクエストを送信します。
   * データはJSON形式で送信されます。
   *
   * @param url - リクエスト先のURL（ベースURLからの相対パス）
   * @param data - 送信するデータ（任意、JSON形式で送信される）
   * @returns レスポンスデータ
   *
   * @example
   * ```typescript
   * // 新しい醸造所を作成
   * const newBrewery = await client.post<Brewery>('/breweries', {
   *   name: '新しい醸造所',
   *   address: '東京都渋谷区...',
   *   latitude: 35.6762,
   *   longitude: 139.6503
   * });
   *
   * // チェックインを実行
   * const visit = await client.post<CheckinResponse>('/visits/checkin', {
   *   breweryId: 42,
   *   latitude: 35.6462,
   *   longitude: 139.7103
   * });
   * ```
   */
  async post<T>(url: string, data?: unknown): Promise<T> {
    return this.makeRequest<T>({ method: 'POST', url, data });
  }

  /**
   * PUT リクエストを実行する
   *
   * @description 指定されたエンドポイントに対してPUTリクエストを送信します。
   * 既存リソースの更新に使用されます。
   *
   * @param url - リクエスト先のURL（ベースURLからの相対パス）
   * @param data - 更新するデータ（任意、JSON形式で送信される）
   * @returns レスポンスデータ
   *
   * @example
   * ```typescript
   * // 醸造所情報を更新
   * const updatedBrewery = await client.put<Brewery>('/breweries/42', {
   *   name: '更新された醸造所名',
   *   description: '新しい説明文'
   * });
   *
   * // ユーザープロフィールを更新
   * const profile = await client.put<UserProfile>('/profile', {
   *   displayName: '新しい表示名',
   *   iconUrl: 'https://example.com/avatar.jpg'
   * });
   * ```
   */
  async put<T>(url: string, data?: unknown): Promise<T> {
    return this.makeRequest<T>({ method: 'PUT', url, data });
  }

  /**
   * DELETE リクエストを実行する
   *
   * @description 指定されたエンドポイントに対してDELETEリクエストを送信します。
   * リソースの削除に使用されます。
   *
   * @param url - リクエスト先のURL（ベースURLからの相対パス）
   * @returns レスポンスデータ（通常は空または削除確認メッセージ）
   *
   * @example
   * ```typescript
   * // 醸造所を削除
   * await client.delete('/breweries/42');
   *
   * // 訪問記録を削除
   * await client.delete('/visits/123');
   *
   * // ユーザーアカウントを削除
   * await client.delete('/profile');
   * ```
   */
  async delete<T>(url: string): Promise<T> {
    return this.makeRequest<T>({ method: 'DELETE', url });
  }
}

/**
 * デフォルトAPIクライアントインスタンス
 *
 * @description アプリケーション全体で共有されるAPIクライアントのインスタンスです。
 * 通常の用途では、このインスタンスを使用することを推奨します。
 *
 * @example
 * ```typescript
 * import { apiClient } from '@/lib/api/client';
 *
 * // デフォルトクライアントを使用したAPIコール
 * const breweries = await apiClient.get<Brewery[]>('/breweries');
 *
 * // 認証が必要な場合はトークンを設定
 * apiClient.setAccessToken(accessToken);
 * const profile = await apiClient.get<UserProfile>('/profile');
 * ```
 */
export const apiClient = new ApiClient();
