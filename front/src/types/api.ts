/**
 * API Response Types
 *
 * このファイルは My Beer Log アプリケーションのAPI通信で使用される
 * 全ての型定義を提供します。
 *
 * @since v1.0.0
 */

/**
 * API エラーレスポンスの型定義
 *
 * @description APIからのエラー応答を表現する標準的な構造です。
 * 全てのAPIエラーはこの形式で返されます。
 *
 * @example
 * ```typescript
 * const error: ApiError = {
 *   error: "認証が必要です",
 *   code: "UNAUTHORIZED"
 * };
 * ```
 */
export interface ApiError {
  /** ユーザー向けのエラーメッセージ */
  error: string;
  /** システム内部で使用するエラーコード (例: "UNAUTHORIZED", "NOT_FOUND") */
  code: string;
}

/**
 * ユーザープロファイル情報の型定義
 *
 * @description Cognito認証に基づくユーザーの詳細情報を表現します。
 * AWS Cognito Subとアプリケーション内のユーザーIDを関連付けます。
 *
 * @example
 * ```typescript
 * const user: UserProfile = {
 *   id: 123,
 *   cognitoSub: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
 *   displayName: "田中太郎",
 *   iconUrl: "https://example.com/avatar.jpg",
 *   createdAt: "2024-01-15T10:30:00Z",
 *   updatedAt: "2024-01-20T15:45:00Z"
 * };
 * ```
 */
export interface UserProfile {
  /** アプリケーション内のユニークなユーザーID */
  id: number;
  /** AWS Cognito User Sub ID (UUID形式) */
  cognitoSub: string;
  /** ユーザーが設定する表示名 (任意) */
  displayName?: string;
  /** プロフィール画像のURL (任意) */
  iconUrl?: string;
  /** アカウント作成日時 (ISO 8601形式) */
  createdAt: string;
  /** 最終更新日時 (ISO 8601形式) */
  updatedAt: string;
}

/**
 * ユーザープロファイル更新用の入力データ型
 *
 * @description ユーザープロファイルの作成・更新時に送信するデータ構造です。
 * システム管理項目（id, cognitoSub, 日時）は含まれません。
 *
 * @example
 * ```typescript
 * const updateData: UserProfileInput = {
 *   displayName: "新しい表示名",
 *   iconUrl: "https://example.com/new-avatar.jpg"
 * };
 * ```
 */
export interface UserProfileInput {
  /** 更新する表示名 (任意) */
  displayName?: string;
  /** 更新するプロフィール画像URL (任意) */
  iconUrl?: string;
}

/**
 * 醸造所情報の型定義
 *
 * @description クラフトビール醸造所の詳細情報を表現します。
 * GPS座標を含み、位置ベースの機能に使用されます。
 *
 * @example
 * ```typescript
 * const brewery: Brewery = {
 *   id: 42,
 *   name: "山田醸造所",
 *   address: "東京都渋谷区恵比寿1-2-3",
 *   description: "伝統的な製法で作る地ビール専門店",
 *   latitude: 35.6462,
 *   longitude: 139.7103,
 *   createdAt: "2024-01-10T09:00:00Z",
 *   updatedAt: "2024-01-15T14:30:00Z"
 * };
 * ```
 */
export interface Brewery {
  /** 醸造所のユニークID */
  id: number;
  /** 醸造所名 */
  name: string;
  /** 住所 (任意) */
  address?: string;
  /** 醸造所の説明・特徴 (任意) */
  description?: string;
  /** GPS緯度座標 (-90.0 ～ 90.0) */
  latitude: number;
  /** GPS経度座標 (-180.0 ～ 180.0) */
  longitude: number;
  /** 登録日時 (ISO 8601形式) */
  createdAt: string;
  /** 最終更新日時 (ISO 8601形式) */
  updatedAt: string;
}

/**
 * 醸造所登録用の入力データ型
 *
 * @description 新しい醸造所の登録時に送信するデータ構造です。
 * システム管理項目（id, 日時）は含まれません。
 *
 * @example
 * ```typescript
 * const newBrewery: BreweryInput = {
 *   name: "新規醸造所",
 *   address: "大阪府大阪市北区梅田1-1-1",
 *   description: "都市型マイクロブルワリー",
 *   latitude: 34.7024,
 *   longitude: 135.4959
 * };
 * ```
 */
export interface BreweryInput {
  /** 醸造所名 (必須) */
  name: string;
  /** 住所 (任意) */
  address?: string;
  /** 醸造所の説明 (任意) */
  description?: string;
  /** GPS緯度座標 (必須) */
  latitude: number;
  /** GPS経度座標 (必須) */
  longitude: number;
}

/**
 * 醸造所訪問記録の型定義
 *
 * @description ユーザーの醸造所チェックイン履歴を表現します。
 * 位置情報ベースでの訪問証明に基づいて生成されます。
 *
 * @example
 * ```typescript
 * const visit: Visit = {
 *   id: 789,
 *   userProfileId: 123,
 *   breweryId: 42,
 *   brewery: { // 任意で醸造所詳細情報を含む
 *     id: 42,
 *     name: "山田醸造所",
 *     // ... 他の醸造所情報
 *   },
 *   visitedAt: "2024-01-20T18:30:00Z"
 * };
 * ```
 */
export interface Visit {
  /** 訪問記録のユニークID */
  id: number;
  /** 訪問者のユーザーID */
  userProfileId: number;
  /** 訪問した醸造所のID */
  breweryId: number;
  /** 醸造所の詳細情報 (リレーションデータ、任意) */
  brewery?: Brewery;
  /** 訪問日時 (ISO 8601形式) */
  visitedAt: string;
}

/**
 * チェックイン実行用の入力データ型
 *
 * @description 醸造所でのチェックイン時に送信する位置情報データです。
 * サーバー側で位置の妥当性（醸造所からの距離）が検証されます。
 *
 * @example
 * ```typescript
 * const checkinData: CheckinInput = {
 *   breweryId: 42,
 *   latitude: 35.6462,  // ユーザーの現在位置
 *   longitude: 139.7103
 * };
 * ```
 */
export interface CheckinInput {
  /** チェックイン対象の醸造所ID */
  breweryId: number;
  /** ユーザーの現在位置（緯度） */
  latitude: number;
  /** ユーザーの現在位置（経度） */
  longitude: number;
}

/**
 * チェックイン処理の結果型
 *
 * @description チェックイン実行後のレスポンスデータです。
 * 成功時は新しく作成された訪問記録が含まれます。
 *
 * @example
 * ```typescript
 * const result: CheckinResponse = {
 *   success: true,
 *   visit: {
 *     id: 789,
 *     userProfileId: 123,
 *     breweryId: 42,
 *     visitedAt: "2024-01-20T18:30:00Z"
 *   }
 * };
 * ```
 */
export interface CheckinResponse {
  /** チェックイン処理の成功/失敗 */
  success: boolean;
  /** 作成された訪問記録（成功時のみ） */
  visit: Visit;
}

/**
 * API Response Wrappers
 *
 * API通信の統一されたレスポンス形式を定義します。
 */

/**
 * 標準的なAPIレスポンス型
 *
 * @description 全てのAPIエンドポイントで使用される統一レスポンス形式です。
 * 実際のデータは data プロパティに格納され、オプションでメッセージが含まれます。
 *
 * @template T レスポンスデータの型
 *
 * @example
 * ```typescript
 * // ユーザー情報取得の例
 * const response: ApiResponse<UserProfile> = {
 *   data: {
 *     id: 123,
 *     cognitoSub: "...",
 *     displayName: "田中太郎"
 *   },
 *   message: "ユーザー情報を取得しました"
 * };
 *
 * // 醸造所リストの例
 * const breweries: ApiResponse<Brewery[]> = {
 *   data: [
 *     { id: 1, name: "醸造所A", ... },
 *     { id: 2, name: "醸造所B", ... }
 *   ]
 * };
 * ```
 */
export interface ApiResponse<T> {
  /** 実際のレスポンスデータ */
  data: T;
  /** 追加のメッセージ（任意） */
  message?: string;
}

/**
 * ページネーション対応のAPIレスポンス型
 *
 * @description 大量のデータを分割して取得する際のレスポンス形式です。
 * データの配列とページネーション情報を含みます。
 *
 * @template T 配列要素の型
 *
 * @example
 * ```typescript
 * const response: PaginatedResponse<Brewery> = {
 *   data: [
 *     { id: 1, name: "醸造所A", ... },
 *     { id: 2, name: "醸造所B", ... }
 *   ],
 *   pagination: {
 *     page: 1,      // 現在のページ番号
 *     limit: 20,    // 1ページあたりの件数
 *     total: 150,   // 全体の件数
 *     totalPages: 8 // 総ページ数
 *   }
 * };
 * ```
 */
export interface PaginatedResponse<T> {
  /** ページ分割されたデータの配列 */
  data: T[];
  /** ページネーション情報 */
  pagination: {
    /** 現在のページ番号（1から開始） */
    page: number;
    /** 1ページあたりの最大件数 */
    limit: number;
    /** データの総件数 */
    total: number;
    /** 総ページ数 */
    totalPages: number;
  };
}

/**
 * API Client Configuration Types
 *
 * APIクライアントの設定と通信に関する型定義です。
 */

/**
 * APIクライアントの設定型
 *
 * @description APIクライアントインスタンスの設定情報を定義します。
 * ベースURLと認証トークンを管理します。
 *
 * @example
 * ```typescript
 * const config: ApiClientConfig = {
 *   baseUrl: "https://api.mybeerlog.com",
 *   accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * };
 * ```
 */
export interface ApiClientConfig {
  /** APIのベースURL（例: "https://api.mybeerlog.com"） */
  baseUrl: string;
  /** 認証用のアクセストークン（JWT形式、任意） */
  accessToken?: string;
}

/**
 * HTTP リクエスト設定型
 *
 * @description 個別のAPIリクエストで使用される設定情報です。
 * HTTPメソッド、URL、データ、パラメータを指定できます。
 *
 * @example
 * ```typescript
 * // GET リクエストの例
 * const getConfig: RequestConfig = {
 *   method: 'GET',
 *   url: '/breweries',
 *   params: { page: 1, limit: 20 }
 * };
 *
 * // POST リクエストの例
 * const postConfig: RequestConfig = {
 *   method: 'POST',
 *   url: '/breweries',
 *   data: {
 *     name: "新しい醸造所",
 *     latitude: 35.6762,
 *     longitude: 139.6503
 *   },
 *   headers: {
 *     'Content-Type': 'application/json'
 *   }
 * };
 * ```
 */
export interface RequestConfig {
  /** HTTPメソッド */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** エンドポイントのURL（ベースURLからの相対パス） */
  url: string;
  /** リクエストボディのデータ（POST/PUT時に使用） */
  data?: unknown;
  /** URLクエリパラメータ */
  params?: Record<string, string | number>;
  /** カスタムHTTPヘッダー */
  headers?: Record<string, string>;
}
