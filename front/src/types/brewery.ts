/**
 * Brewery Feature Types
 *
 * このファイルは醸造所機能に特化した型定義を提供します。
 * 位置情報、地図表示、チェックイン機能、UI コンポーネントに関する型を含みます。
 *
 * @since v1.0.0
 */

import type {
  Brewery,
  Visit,
  BreweryInput,
  CheckinInput,
  CheckinResponse,
} from './api';
export type { Brewery, Visit, BreweryInput, CheckinInput, CheckinResponse };

/**
 * Geolocation Types
 *
 * GPS位置情報とブラウザGeolocation APIに関する型定義です。
 */

/**
 * GPS座標の基本型
 *
 * @description 緯度と経度を表現する最小限の構造です。
 * 全ての位置情報機能のベースとなります。
 *
 * @example
 * ```typescript
 * // 東京駅の座標
 * const tokyoStation: Coordinates = {
 *   latitude: 35.6812,
 *   longitude: 139.7671
 * };
 *
 * // 大阪駅の座標
 * const osakaStation: Coordinates = {
 *   latitude: 34.7024,
 *   longitude: 135.4959
 * };
 * ```
 */
export interface Coordinates {
  /** 緯度（-90.0 から 90.0） */
  latitude: number;
  /** 経度（-180.0 から 180.0） */
  longitude: number;
}

/**
 * ブラウザGeolocation APIの位置情報型
 *
 * @description navigator.geolocation.getCurrentPosition() のレスポンス型に対応します。
 * GPS精度や高度などの詳細情報を含みます。
 *
 * @example
 * ```typescript
 * navigator.geolocation.getCurrentPosition((position: GeolocationPosition) => {
 *   console.log('緯度:', position.coords.latitude);
 *   console.log('経度:', position.coords.longitude);
 *   console.log('精度:', position.coords.accuracy, 'メートル');
 * });
 * ```
 */
export interface GeolocationPosition {
  /** 位置情報の詳細データ */
  coords: Coordinates & {
    /** 位置の精度（メートル単位） */
    accuracy: number;
    /** 海抜高度（メートル、利用できない場合はnull） */
    altitude: number | null;
    /** 高度の精度（メートル、利用できない場合はnull） */
    altitudeAccuracy: number | null;
    /** 進行方向（度数、北を0とした時計回り、利用できない場合はnull） */
    heading: number | null;
    /** 移動速度（メートル/秒、利用できない場合はnull） */
    speed: number | null;
  };
  /** 位置情報取得時のタイムスタンプ（UNIXエポック） */
  timestamp: number;
}

/**
 * Geolocation APIエラー情報型
 *
 * @description navigator.geolocation APIでエラーが発生した際の情報です。
 * PermissionError、PositionUnavailable、Timeoutなどを識別できます。
 *
 * @example
 * ```typescript
 * navigator.geolocation.getCurrentPosition(
 *   (position) => { 成功時の処　 },
 *   (error: GeolocationError) => {
 *     switch (error.code) {
 *       case 1: // PERMISSION_DENIED
 *         console.log('位置情報の使用が拒否されました');
 *         break;
 *       case 2: // POSITION_UNAVAILABLE
 *         console.log('位置情報を取得できません');
 *         break;
 *       case 3: // TIMEOUT
 *         console.log('位置情報の取得がタイムアウトしました');
 *         break;
 *     }
 *   }
 * );
 * ```
 */
export interface GeolocationError {
  /** エラーコード（1: PERMISSION_DENIED, 2: POSITION_UNAVAILABLE, 3: TIMEOUT） */
  code: number;
  /** エラーメッセージ */
  message: string;
}

/**
 * Brewery Feature Types
 *
 * 醸造所の拡張機能と検索に関する型定義です。
 */

/**
 * 距離情報付き醸造所型
 *
 * @description 基本の醸造所情報に、ユーザーからの距離を追加した拡張型です。
 * 近隣醸造所表示や検索結果で使用されます。
 *
 * @example
 * ```typescript
 * const nearbyBrewery: BreweryWithDistance = {
 *   id: 42,
 *   name: "山田醸造所",
 *   latitude: 35.6462,
 *   longitude: 139.7103,
 *   distance: 1.2, // ユーザーから1.2km
 *   // ... 他の醸造所情報
 * };
 * ```
 */
export interface BreweryWithDistance extends Brewery {
  /** ユーザーからの距離（キロメートル単位、任意） */
  distance?: number;
}

/**
 * 近隣醸造所検索フィルター型
 *
 * @description 指定された位置を中心とした範囲内の醸造所を検索するための条件です。
 * GPS位置情報を基にした「近くの醸造所」機能で使用されます。
 *
 * @example
 * ```typescript
 * const filter: NearbyBreweriesFilter = {
 *   latitude: 35.6762,   // 検索の中心点（緯度）
 *   longitude: 139.6503, // 検索の中心点（経度）
 *   radius: 5.0,         // 検索半径（5km以内）
 *   limit: 20            // 最大20件まで取得
 * };
 * ```
 */
export interface NearbyBreweriesFilter {
  /** 検索中心点の緯度 */
  latitude: number;
  /** 検索中心点の経度 */
  longitude: number;
  /** 検索半径（キロメートル単位） */
  radius: number;
  /** 取得する最大件数（任意、デフォルト: 50） */
  limit?: number;
}

/**
 * 醸造所検索フィルター型
 *
 * @description 複数条件による醸造所検索のパラメータです。
 * 名前検索、位置ベース検索、ページネーションを組み合わせできます。
 *
 * @example
 * ```typescript
 * // 名前で検索
 * const nameSearch: BrewerySearchFilter = {
 *   query: "クラフト",
 *   limit: 10,
 *   offset: 0
 * };
 *
 * // 位置ベース検索
 * const locationSearch: BrewerySearchFilter = {
 *   location: { latitude: 35.6762, longitude: 139.6503 },
 *   radius: 3.0,
 *   limit: 15
 * };
 *
 * // 複合検索
 * const combinedSearch: BrewerySearchFilter = {
 *   query: "ビール",
 *   location: { latitude: 35.6762, longitude: 139.6503 },
 *   radius: 10.0,
 *   limit: 25,
 *   offset: 50
 * };
 * ```
 */
export interface BrewerySearchFilter {
  /** 検索キーワード（醸造所名や説明文に対する部分一致、任意） */
  query?: string;
  /** 位置ベース検索の中心座標（任意） */
  location?: Coordinates;
  /** 位置ベース検索の半径（キロメートル単位、任意） */
  radius?: number;
  /** 取得する最大件数（任意） */
  limit?: number;
  /** スキップする件数（ページネーション用、任意） */
  offset?: number;
}

/**
 * Checkin Types
 *
 * 醸造所チェックイン機能に関する型定義です。
 */

/**
 * チェックイン試行情報型
 *
 * @description ユーザーがチェックインを試行する際の情報を記録します。
 * 位置の妥当性検証やログ記録に使用されます。
 *
 * @example
 * ```typescript
 * const attempt: CheckinAttempt = {
 *   breweryId: 42,
 *   userLocation: {
 *     latitude: 35.6462,
 *     longitude: 139.7103
 *   },
 *   timestamp: Date.now()
 * };
 * ```
 */
export interface CheckinAttempt {
  /** チェックイン対象の醸造所ID */
  breweryId: number;
  /** チェックイン時のユーザー位置 */
  userLocation: Coordinates;
  /** チェックイン試行時刻（UNIXタイムスタンプ） */
  timestamp: number;
}

/**
 * チェックイン妥当性検証結果型
 *
 * @description チェックイン可否の判定結果と詳細情報です。
 * 距離チェックやビジネスルール検証の結果を含みます。
 *
 * @example
 * ```typescript
 * // 成功例
 * const validResult: CheckinValidation = {
 *   isValid: true,
 *   distance: 0.08 // 80メートル以内
 * };
 *
 * // 失敗例
 * const invalidResult: CheckinValidation = {
 *   isValid: false,
 *   distance: 0.25, // 250メートル
 *   error: "醸造所から100メートル以内でのチェックインが必要です"
 * };
 * ```
 */
export interface CheckinValidation {
  /** チェックイン可否の判定結果 */
  isValid: boolean;
  /** 醸造所からの距離（キロメートル単位、任意） */
  distance?: number;
  /** 無効な場合のエラーメッセージ（任意） */
  error?: string;
}

/**
 * Visit History Types
 *
 * 訪問履歴と統計情報に関する型定義です。
 */

/**
 * 醸造所詳細情報付き訪問記録型
 *
 * @description 基本の訪問記録に醸造所の詳細情報を含めた拡張型です。
 * 訪問履歴一覧表示で醸造所名や住所を表示する際に使用されます。
 *
 * @example
 * ```typescript
 * const visitHistory: VisitWithBrewery = {
 *   id: 789,
 *   userProfileId: 123,
 *   breweryId: 42,
 *   visitedAt: "2024-01-20T18:30:00Z",
 *   brewery: {
 *     id: 42,
 *     name: "山田醸造所",
 *     address: "東京都渋谷区...",
 *     // ... 他の醸造所情報
 *   }
 * };
 * ```
 */
export interface VisitWithBrewery extends Visit {
  /** 訪問した醸造所の詳細情報（必須） */
  brewery: Brewery;
}

/**
 * ユーザー訪問統計情報型
 *
 * @description ユーザーの醸造所訪問活動に関する統計データです。
 * プロフィール画面やダッシュボードでの活動サマリー表示に使用されます。
 *
 * @example
 * ```typescript
 * const stats: VisitStats = {
 *   totalVisits: 25,        // 総訪問回数
 *   uniqueBreweries: 18,    // 訪問した醸造所数
 *   favoriteBrewery: {      // 最も訪問回数が多い醸造所
 *     id: 42,
 *     name: "山田醸造所",
 *     // ... 醸造所詳細
 *   },
 *   recentVisits: [         // 最近の訪問履歴（最大5件）
 *     { id: 789, brewery: {...}, visitedAt: "2024-01-20T18:30:00Z" },
 *     // ...
 *   ]
 * };
 * ```
 */
export interface VisitStats {
  /** 総訪問回数 */
  totalVisits: number;
  /** 訪問したユニークな醸造所数 */
  uniqueBreweries: number;
  /** 最も多く訪問した醸造所（任意） */
  favoriteBrewery?: Brewery;
  /** 最近の訪問履歴（最大5件程度） */
  recentVisits: VisitWithBrewery[];
}

/**
 * Map Types
 *
 * 地図表示機能に関する型定義です。
 */

/**
 * 地図ビューポート型
 *
 * @description 地図の表示範囲と拡大レベルを定義します。
 * 地図コンポーネントの表示状態管理に使用されます。
 *
 * @example
 * ```typescript
 * // 東京駅周辺を表示
 * const viewport: MapViewport = {
 *   latitude: 35.6812,  // 中心点の緯度
 *   longitude: 139.7671, // 中心点の経度
 *   zoom: 15            // ズームレベル（1-20程度）
 * };
 * ```
 */
export interface MapViewport {
  /** 地図中心点の緯度 */
  latitude: number;
  /** 地図中心点の経度 */
  longitude: number;
  /** ズームレベル（数値が大きいほど詳細表示） */
  zoom: number;
}

/**
 * 地図マーカー型
 *
 * @description 地図上に表示するマーカーの情報です。
 * 醸造所、ユーザー位置、訪問済み地点などを区別して表示できます。
 *
 * @example
 * ```typescript
 * // 醸造所マーカー
 * const breweryMarker: MapMarker = {
 *   id: 42,
 *   latitude: 35.6462,
 *   longitude: 139.7103,
 *   name: "山田醸造所",
 *   type: "brewery"
 * };
 *
 * // ユーザー位置マーカー
 * const userMarker: MapMarker = {
 *   id: 0,
 *   latitude: 35.6762,
 *   longitude: 139.6503,
 *   name: "現在地",
 *   type: "user"
 * };
 * ```
 */
export interface MapMarker {
  /** マーカーのユニークID */
  id: number;
  /** マーカー位置の緯度 */
  latitude: number;
  /** マーカー位置の経度 */
  longitude: number;
  /** マーカーに表示する名前 */
  name: string;
  /** マーカーの種類（表示アイコンの判定に使用） */
  type: 'brewery' | 'user' | 'visit';
}

/**
 * UI Component Types
 *
 * React コンポーネントのプロパティ型定義です。
 */

/**
 * BreweryCard コンポーネントのプロパティ型
 *
 * @description 醸造所情報カードコンポーネントの props 定義です。
 * 醸造所一覧や検索結果での個別カード表示に使用されます。
 *
 * @example
 * ```tsx
 * <BreweryCard
 *   brewery={brewery}
 *   distance={1.2}
 *   onCheckin={(id) => handleCheckin(id)}
 *   onViewDetails={(id) => router.push(`/brewery/${id}`)}
 * />
 * ```
 */
export interface BreweryCardProps {
  /** 表示する醸造所情報 */
  brewery: Brewery;
  /** ユーザーからの距離（キロメートル単位、任意） */
  distance?: number;
  /** チェックインボタンクリック時のコールバック（任意） */
  onCheckin?: (breweryId: number) => void;
  /** 詳細表示ボタンクリック時のコールバック（任意） */
  onViewDetails?: (breweryId: number) => void;
}

/**
 * CheckinButton コンポーネントのプロパティ型
 *
 * @description チェックインボタンコンポーネントの props 定義です。
 * 位置情報に基づくチェックイン可否判定と実行機能を提供します。
 *
 * @example
 * ```tsx
 * <CheckinButton
 *   brewery={brewery}
 *   userLocation={userLocation}
 *   onCheckin={async (id) => await performCheckin(id)}
 *   disabled={isLoading}
 * />
 * ```
 */
export interface CheckinButtonProps {
  /** チェックイン対象の醸造所 */
  brewery: Brewery;
  /** ユーザーの現在位置（任意、未提供時は位置取得を試行） */
  userLocation?: Coordinates;
  /** チェックイン実行時のコールバック（非同期処理） */
  onCheckin: (breweryId: number) => Promise<void>;
  /** ボタンの無効化状態（任意、デフォルト: false） */
  disabled?: boolean;
}

/**
 * BreweryMap コンポーネントのプロパティ型
 *
 * @description 醸造所地図コンポーネントの props 定義です。
 * 複数の醸造所を地図上にマーカーで表示し、インタラクション機能を提供します。
 *
 * @example
 * ```tsx
 * <BreweryMap
 *   breweries={nearbyBreweries}
 *   userLocation={userLocation}
 *   viewport={mapViewport}
 *   onBrewerySelect={(brewery) => setSelectedBrewery(brewery)}
 *   onMapMove={(viewport) => setMapViewport(viewport)}
 * />
 * ```
 */
export interface BreweryMapProps {
  /** 地図上に表示する醸造所の配列 */
  breweries: Brewery[];
  /** ユーザーの現在位置（任意、表示時は特別なマーカーで表示） */
  userLocation?: Coordinates;
  /** 地図の初期表示範囲（任意） */
  viewport?: MapViewport;
  /** 醸造所マーカークリック時のコールバック（任意） */
  onBrewerySelect?: (brewery: Brewery) => void;
  /** 地図移動時のコールバック（任意） */
  onMapMove?: (viewport: MapViewport) => void;
}
