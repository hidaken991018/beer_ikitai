/**
 * Application Constants
 *
 * このファイルはアプリケーション全体で使用される定数値を定義します。
 * 設定値、API エンドポイント、メッセージ、バリデーションルールなどを含みます。
 *
 * @since v1.0.0
 */

/**
 * アプリケーション基本設定
 *
 * @description アプリケーションの基本情報と環境設定です。
 * 環境変数から値を取得し、フォールバック値を提供します。
 *
 * @example
 * ```typescript
 * console.log(APP_CONFIG.name);    // "My Beer Log"
 * console.log(APP_CONFIG.env);     // "development" | "staging" | "production"
 * console.log(APP_CONFIG.version); // "1.0.0"
 * ```
 */
export const APP_CONFIG = {
  /** アプリケーション名（環境変数: NEXT_PUBLIC_APP_NAME） */
  name: process.env.NEXT_PUBLIC_APP_NAME || 'My Beer Log',
  /** 実行環境（環境変数: NEXT_PUBLIC_APP_ENV） */
  env: process.env.NEXT_PUBLIC_APP_ENV || 'development',
  /** アプリケーションバージョン */
  version: '1.0.0',
} as const;

/**
 * API通信設定
 *
 * @description バックエンドAPIとの通信に関する設定値です。
 * タイムアウト、リトライ回数、ベースURLなどを定義します。
 *
 * @example
 * ```typescript
 * const response = await fetch(`${API_CONFIG.baseUrl}/breweries`);
 * // タイムアウト設定: 10秒
 * // リトライ回数: 3回
 * ```
 */
export const API_CONFIG = {
  /** APIのベースURL（環境変数: NEXT_PUBLIC_API_BASE_URL） */
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080',
  /** リクエストタイムアウト時間（ミリ秒） */
  timeout: 10000,
  /** 失敗時のリトライ回数 */
  retryAttempts: 3,
} as const;

/**
 * AWS Cognito認証設定
 *
 * @description AWS Cognitoユーザープールの接続情報です。
 * 認証システムの初期化とユーザー管理に使用されます。
 *
 * @example
 * ```typescript
 * import { Amplify } from 'aws-amplify';
 *
 * Amplify.configure({
 *   Auth: {
 *     Cognito: {
 *       region: COGNITO_CONFIG.region,
 *       userPoolId: COGNITO_CONFIG.userPoolId,
 *       userPoolClientId: COGNITO_CONFIG.userPoolWebClientId
 *     }
 *   }
 * });
 * ```
 */
export const COGNITO_CONFIG = {
  /** AWSリージョン（環境変数: NEXT_PUBLIC_AWS_REGION） */
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'ap-northeast-1',
  /** CognitoユーザープールID（環境変数: NEXT_PUBLIC_USER_POOL_ID） */
  userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || '',
  /** CognitoユーザープールWebクライアントID（環境変数: NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID） */
  userPoolWebClientId: process.env.NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID || '',
} as const;

/**
 * 位置情報取得設定
 *
 * @description GPS位置情報の取得とチェックイン機能の設定値です。
 * ブラウザのGeolocation APIの動作を制御します。
 *
 * @example
 * ```typescript
 * navigator.geolocation.getCurrentPosition(
 *   success,
 *   error,
 *   {
 *     timeout: GEOLOCATION_CONFIG.timeout,
 *     maximumAge: GEOLOCATION_CONFIG.maximumAge,
 *     enableHighAccuracy: GEOLOCATION_CONFIG.enableHighAccuracy
 *   }
 * );
 * ```
 */
export const GEOLOCATION_CONFIG = {
  /** 位置情報取得のタイムアウト時間（ミリ秒） */
  timeout: 10000,
  /** キャッシュされた位置情報の有効期限（ミリ秒、10分） */
  maximumAge: 600000, // 10 minutes
  /** 高精度GPS使用フラグ */
  enableHighAccuracy: true,
  /** チェックイン可能な醸造所からの半径（キロメートル、100m） */
  checkinRadius: 0.1, // 100m in kilometers
} as const;

/**
 * 地図表示設定
 *
 * @description 地図コンポーネントのデフォルト表示設定です。
 * 初期表示位置、ズームレベルの制限を定義します。
 *
 * @example
 * ```typescript
 * const initialViewport = {
 *   latitude: MAP_CONFIG.defaultCenter.latitude,
 *   longitude: MAP_CONFIG.defaultCenter.longitude,
 *   zoom: MAP_CONFIG.defaultZoom
 * };
 * ```
 */
export const MAP_CONFIG = {
  /** 地図の初期表示中心点（東京） */
  defaultCenter: {
    /** 初期表示緯度（東京駅付近） */
    latitude: 35.6762,
    /** 初期表示経度（東京駅付近） */
    longitude: 139.6503, // Tokyo
  },
  /** デフォルトズームレベル */
  defaultZoom: 12,
  /** 最大ズームレベル（最も詳細） */
  maxZoom: 18,
  /** 最小ズームレベル（最も広域） */
  minZoom: 5,
} as const;

/**
 * UI動作設定
 *
 * @description ユーザーインターフェースの動作に関する設定値です。
 * アニメーション、通知、ページング機能の制御に使用されます。
 *
 * @example
 * ```typescript
 * // 検索入力のデバウンス
 * const debouncedSearch = debounce(searchFunction, UI_CONFIG.debounceDelay);
 *
 * // トースト通知の表示
 * showToast(message, { duration: UI_CONFIG.toastDuration });
 *
 * // ページネーション
 * const { limit } = UI_CONFIG.pagination;
 * ```
 */
export const UI_CONFIG = {
  /** 入力フィールドのデバウンス遅延時間（ミリ秒） */
  debounceDelay: 300,
  /** トースト通知の表示時間（ミリ秒） */
  toastDuration: 3000,
  /** ローディング表示の最小時間（ミリ秒） */
  loadingMinDuration: 500,
  /** ページネーション設定 */
  pagination: {
    /** デフォルトの1ページあたりの表示件数 */
    defaultLimit: 20,
    /** 1ページあたりの最大表示件数 */
    maxLimit: 100,
  },
} as const;

/**
 * ローカルストレージキー定数
 *
 * @description ブラウザのローカルストレージで使用するキー名の定義です。
 * 認証情報、ユーザーデータ、設定情報の保存に使用されます。
 *
 * @example
 * ```typescript
 * // 認証トークンの保存
 * localStorage.setItem(STORAGE_KEYS.authToken, token);
 *
 * // ユーザープロファイルの取得
 * const profile = localStorage.getItem(STORAGE_KEYS.userProfile);
 *
 * // 最後の位置情報の保存
 * localStorage.setItem(STORAGE_KEYS.lastLocation, JSON.stringify(location));
 * ```
 */
export const STORAGE_KEYS = {
  /** 認証アクセストークンのキー */
  authToken: 'auth_token',
  /** リフレッシュトークンのキー */
  refreshToken: 'refresh_token',
  /** ユーザープロファイル情報のキー */
  userProfile: 'user_profile',
  /** 最後に取得した位置情報のキー */
  lastLocation: 'last_location',
  /** 地図表示設定のキー */
  mapViewport: 'map_viewport',
} as const;

// Route Paths
export const ROUTES = {
  home: '/',
  login: '/auth/login',
  register: '/auth/register',
  profile: '/profile',
  breweries: '/brewery',
  breweryDetail: (id: number) => `/brewery/${id}`,
  nearbyBreweries: '/brewery/nearby',
  visits: '/visits',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  networkError: 'ネットワークエラーが発生しました',
  unauthorizedError: '認証が必要です',
  forbiddenError: 'アクセス権限がありません',
  notFoundError: 'データが見つかりません',
  validationError: '入力内容を確認してください',
  geolocationDenied: '位置情報の取得が拒否されました',
  geolocationUnavailable: '位置情報が利用できません',
  geolocationTimeout: '位置情報の取得がタイムアウトしました',
  checkinTooFar: '醸造所から離れすぎています',
  unknownError: '不明なエラーが発生しました',
} as const;

/**
 * 成功メッセージ定数
 *
 * @description 操作成功時に表示するメッセージの日本語テキストです。
 * ユーザーにポジティブなフィードバックを提供します。
 *
 * @example
 * ```typescript
 * // ログイン成功時
 * showSuccessToast(SUCCESS_MESSAGES.loginSuccess);
 *
 * // チェックイン成功時
 * setNotification({
 *   type: 'success',
 *   message: SUCCESS_MESSAGES.checkinSuccess
 * });
 *
 * // プロフィール更新成功時
 * toast.success(SUCCESS_MESSAGES.profileUpdated);
 * ```
 */
export const SUCCESS_MESSAGES = {
  /** ユーザーログイン成功 */
  loginSuccess: 'ログインしました',
  /** ユーザーログアウト成功 */
  logoutSuccess: 'ログアウトしました',
  /** ユーザーアカウント作成成功 */
  registerSuccess: 'アカウントを作成しました',
  /** ユーザープロフィール更新成功 */
  profileUpdated: 'プロフィールを更新しました',
  /** 醸造所チェックイン成功 */
  checkinSuccess: 'チェックインしました',
} as const;

/**
 * HTTPステータスコード定数
 *
 * @description APIレスポンスのステータス判定に使用する定数です。
 * ハードコーディングを防ぎ、可読性を向上させます。
 *
 * @example
 * ```typescript
 * // APIレスポンスのステータスチェック
 * if (response.status === HTTP_STATUS.OK) {
 *   // 成功処理
 * } else if (response.status === HTTP_STATUS.UNAUTHORIZED) {
 *   // 認証エラー処理
 * } else if (response.status === HTTP_STATUS.NOT_FOUND) {
 *   // リソース不存在エラー処理
 * }
 *
 * // エラーハンドリングでの使用
 * switch (error.status) {
 *   case HTTP_STATUS.BAD_REQUEST:
 *     return ERROR_MESSAGES.validationError;
 *   case HTTP_STATUS.FORBIDDEN:
 *     return ERROR_MESSAGES.forbiddenError;
 * }
 * ```
 */
export const HTTP_STATUS = {
  /** 200 OK - リクエスト成功 */
  OK: 200,
  /** 201 Created - リソース作成成功 */
  CREATED: 201,
  /** 400 Bad Request - 不正なリクエスト */
  BAD_REQUEST: 400,
  /** 401 Unauthorized - 認証エラー */
  UNAUTHORIZED: 401,
  /** 403 Forbidden - アクセス権限エラー */
  FORBIDDEN: 403,
  /** 404 Not Found - リソース不存在 */
  NOT_FOUND: 404,
  /** 500 Internal Server Error - サーバー内部エラー */
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * フォーム入力検証ルール
 *
 * @description ユーザー入力の検証に使用するパターンとメッセージの定義です。
 * 統一された検証ロジックとエラーメッセージを提供します。
 *
 * @example
 * ```typescript
 * // メールアドレス検証
 * const validateEmail = (email: string) => {
 *   if (!VALIDATION.email.pattern.test(email)) {
 *     return VALIDATION.email.message;
 *   }
 *   return null;
 * };
 *
 * // パスワード検証
 * const validatePassword = (password: string) => {
 *   if (password.length < VALIDATION.password.minLength) {
 *     return VALIDATION.password.message;
 *   }
 *   if (!VALIDATION.password.pattern.test(password)) {
 *     return VALIDATION.password.message;
 *   }
 *   return null;
 * };
 *
 * // 表示名検証
 * const validateDisplayName = (name: string) => {
 *   const { minLength, maxLength, message } = VALIDATION.displayName;
 *   if (name.length < minLength || name.length > maxLength) {
 *     return message;
 *   }
 *   return null;
 * };
 * ```
 */
export const VALIDATION = {
  /** メールアドレス検証ルール */
  email: {
    /** メールアドレス形式の正規表現パターン */
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    /** 検証失敗時のエラーメッセージ */
    message: '有効なメールアドレスを入力してください',
  },
  /** パスワード検証ルール */
  password: {
    /** パスワードの最小文字数 */
    minLength: 8,
    /** パスワード強度の正規表現パターン（大文字・小文字・数字を含む） */
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    /** 検証失敗時のエラーメッセージ */
    message: 'パスワードは8文字以上で、大文字・小文字・数字を含めてください',
  },
  /** 表示名検証ルール */
  displayName: {
    /** 表示名の最小文字数 */
    minLength: 1,
    /** 表示名の最大文字数 */
    maxLength: 50,
    /** 検証失敗時のエラーメッセージ */
    message: '表示名は1文字以上50文字以下で入力してください',
  },
} as const;
