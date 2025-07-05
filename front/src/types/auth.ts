/**
 * Authentication Types
 *
 * このファイルはAWS Cognito認証システムに関する型定義を提供します。
 * ユーザー情報、認証状態、各種認証操作のインターフェースを含みます。
 *
 * @since v1.0.0
 */

/**
 * AWS Cognito User Types
 *
 * AWS Cognitoユーザープールで管理されるユーザー情報の型定義です。
 */

/**
 * Cognitoユーザー情報型
 *
 * @description AWS Cognito JWTトークンから取得されるユーザー属性です。
 * IDトークンのペイロードに含まれる標準的なOpenID Connect属性に基づきます。
 *
 * @example
 * ```typescript
 * const user: CognitoUser = {
 *   sub: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
 *   email: "user@example.com",
 *   email_verified: true,
 *   given_name: "太郎",
 *   family_name: "田中",
 *   picture: "https://example.com/avatar.jpg"
 * };
 * ```
 */
export interface CognitoUser {
  /** Cognito User Sub ID (UUID形式、不変のユーザー識別子) */
  sub: string;
  /** ユーザー名（任意、Cognitoでのユーザー名設定時のみ） */
  username?: string;
  /** メールアドレス (必須、ログインに使用) */
  email: string;
  /** メールアドレス検証済みフラグ */
  email_verified: boolean;
  /** 優先ユーザー名（任意、表示名に使用） */
  preferred_username?: string;
  /** 名前（任意） */
  given_name?: string;
  /** 姓（任意） */
  family_name?: string;
  /** プロフィール画像URL（任意） */
  picture?: string;
}

/**
 * 認証状態管理型
 *
 * @description アプリケーション全体の認証状態を管理する Redux state です。
 * ログイン状態、トークン、エラー情報を含みます。
 *
 * @example
 * ```typescript
 * // ログイン済み状態
 * const loggedInState: AuthState = {
 *   isAuthenticated: true,
 *   isLoading: false,
 *   user: { sub: "...", email: "user@example.com", ... },
 *   accessToken: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   idToken: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   refreshToken: "eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ...",
 *   error: null
 * };
 *
 * // 未ログイン状態
 * const loggedOutState: AuthState = {
 *   isAuthenticated: false,
 *   isLoading: false,
 *   user: null,
 *   accessToken: null,
 *   idToken: null,
 *   refreshToken: null,
 *   error: null
 * };
 * ```
 */
export interface AuthState {
  /** ログイン状態 */
  isAuthenticated: boolean;
  /** 認証処理の実行中フラグ */
  isLoading: boolean;
  /** 認証済みユーザー情報（未ログイン時はnull） */
  user: CognitoUser | null;
  /** API呼び出し用のアクセストークン（JWT形式） */
  accessToken: string | null;
  /** ユーザー情報を含むIDトークン（JWT形式） */
  idToken: string | null;
  /** トークン更新用のリフレッシュトークン */
  refreshToken: string | null;
  /** 認証エラーメッセージ（エラーなしの場合はnull） */
  error: string | null;
}

/**
 * Authentication Input Types
 *
 * 各種認証操作で使用される入力データの型定義です。
 */

/**
 * ログイン認証情報型
 *
 * @description ユーザーログイン時に必要な認証情報です。
 *
 * @example
 * ```typescript
 * const credentials: LoginCredentials = {
 *   email: "user@example.com",
 *   password: "securePassword123"
 * };
 * ```
 */
export interface LoginCredentials {
  /** ログイン用メールアドレス */
  email: string;
  /** パスワード */
  password: string;
}

/**
 * ユーザー登録情報型
 *
 * @description 新規ユーザー登録時に必要な情報です。
 * ログイン認証情報を拡張し、確認パスワードと名前情報を追加します。
 *
 * @example
 * ```typescript
 * const registerData: RegisterCredentials = {
 *   email: "newuser@example.com",
 *   password: "securePassword123",
 *   confirmPassword: "securePassword123",
 *   givenName: "太郎",
 *   familyName: "田中"
 * };
 * ```
 */
export interface RegisterCredentials extends LoginCredentials {
  /** パスワード確認入力 */
  confirmPassword: string;
  /** 名前（任意） */
  givenName?: string;
  /** 姓（任意） */
  familyName?: string;
}

/**
 * サインアップ確認情報型
 *
 * @description ユーザー登録後のメール確認に必要な情報です。
 *
 * @example
 * ```typescript
 * const confirmData: ConfirmSignUpInput = {
 *   email: "user@example.com",
 *   confirmationCode: "123456"
 * };
 * ```
 */
export interface ConfirmSignUpInput {
  /** 登録時のメールアドレス */
  email: string;
  /** メールで送信された6桁の確認コード */
  confirmationCode: string;
}

/**
 * パスワードリセット要求情報型
 *
 * @description パスワードリセットメール送信時に必要な情報です。
 *
 * @example
 * ```typescript
 * const forgotData: ForgotPasswordInput = {
 *   email: "user@example.com"
 * };
 * ```
 */
export interface ForgotPasswordInput {
  /** パスワードリセット対象のメールアドレス */
  email: string;
}

/**
 * パスワードリセット実行情報型
 *
 * @description 確認コードを使用したパスワード変更に必要な情報です。
 *
 * @example
 * ```typescript
 * const resetData: ResetPasswordInput = {
 *   email: "user@example.com",
 *   confirmationCode: "123456",
 *   newPassword: "newSecurePassword123"
 * };
 * ```
 */
export interface ResetPasswordInput {
  /** パスワードリセット対象のメールアドレス */
  email: string;
  /** メールで送信された確認コード */
  confirmationCode: string;
  /** 新しいパスワード */
  newPassword: string;
}

/**
 * パスワード変更情報型
 *
 * @description ログイン済みユーザーのパスワード変更に必要な情報です。
 *
 * @example
 * ```typescript
 * const changeData: ChangePasswordInput = {
 *   oldPassword: "currentPassword123",
 *   newPassword: "newSecurePassword123"
 * };
 * ```
 */
export interface ChangePasswordInput {
  /** 現在のパスワード */
  oldPassword: string;
  /** 新しいパスワード */
  newPassword: string;
}

/**
 * プロフィール更新情報型
 *
 * @description ユーザープロフィール情報の更新に使用する情報です。
 *
 * @example
 * ```typescript
 * const updateData: UpdateProfileInput = {
 *   givenName: "新太郎",
 *   familyName: "田中",
 *   picture: "https://example.com/new-avatar.jpg"
 * };
 * ```
 */
export interface UpdateProfileInput {
  /** 更新する名前（任意） */
  givenName?: string;
  /** 更新する姓（任意） */
  familyName?: string;
  /** 更新するプロフィール画像URL（任意） */
  picture?: string;
}

/**
 * Auth Context Types
 *
 * React Context APIで提供される認証機能のインターフェース定義です。
 */

/**
 * 認証コンテキスト型
 *
 * @description アプリケーション全体で使用される認証機能の統一インターフェースです。
 * AuthProviderから提供され、useAuthContext()フックで取得できます。
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const { authState, login, logout } = useAuthContext();
 *
 *   const handleLogin = async () => {
 *     try {
 *       await login({ email: "user@example.com", password: "password" });
 *     } catch (error) {
 *       console.error("ログインに失敗しました:", error);
 *     }
 *   };
 *
 *   if (authState.isLoading) return <div>認証処理中...</div>;
 *   if (authState.isAuthenticated) return <div>ログイン済み</div>;
 *   return <button onClick={handleLogin}>ログイン</button>;
 * };
 * ```
 */
export interface AuthContextType {
  /** 現在の認証状態 */
  authState: AuthState;
  /** ユーザーログイン */
  login: (credentials: LoginCredentials) => Promise<void>;
  /** 新規ユーザー登録 */
  register: (credentials: RegisterCredentials) => Promise<RegisterResponse>;
  /** サインアップの確認（メール認証） */
  confirmSignUp: (input: ConfirmSignUpInput) => Promise<ConfirmSignUpResponse>;
  /** パスワードリセット要求 */
  forgotPassword: (
    input: ForgotPasswordInput
  ) => Promise<ForgotPasswordResponse>;
  /** パスワードリセット実行 */
  resetPassword: (input: ResetPasswordInput) => Promise<void>;
  /** パスワード変更 */
  changePassword: (input: ChangePasswordInput) => Promise<void>;
  /** プロフィール更新 */
  updateProfile: (input: UpdateProfileInput) => Promise<void>;
  /** ログアウト */
  logout: () => Promise<void>;
  /** 認証状態の更新（トークンリフレッシュ） */
  refreshAuth: () => Promise<void>;
  /** エラー状態のクリア */
  clearError: () => void;
}

/**
 * AWS Cognito Response Types
 *
 * AWS Cognito認証操作の戻り値型定義です。
 */

/**
 * ユーザー登録レスポンス型
 *
 * @description AWS Cognito SignUp操作の戻り値です。
 * ユーザー登録後の確認状態と次のステップ情報を含みます。
 */
export interface RegisterResponse {
  /** サインアップ完了フラグ */
  isSignUpComplete: boolean;
  /** ユーザーID */
  userId: string | undefined;
  /** 次のステップ情報（AWS Amplifyの型に準拠） */
  nextStep: any; //disable-line @typescript-eslint/no-explicit-any
}

/**
 * サインアップ確認レスポンス型
 *
 * @description AWS Cognito ConfirmSignUp操作の戻り値です。
 * メール確認完了後のユーザー状態を含みます。
 */
export interface ConfirmSignUpResponse {
  /** 確認完了フラグ */
  isSignUpComplete: boolean;
  /** 次のステップ（AWS Amplifyの型に準拠） */
  nextStep: any; //disable-line @typescript-eslint/no-explicit-any
}

/**
 * パスワードリセット要求レスポンス型
 *
 * @description AWS Cognito ResetPassword操作の戻り値です。
 * パスワードリセット用確認コードの配信情報を含みます。
 */
export interface ForgotPasswordResponse {
  /** 次のステップ情報（AWS Amplifyの型に準拠） */
  nextStep: any; //disable-line @typescript-eslint/no-explicit-any
}

/**
 * AWS Amplify Config Types
 *
 * AWS Amplifyの設定に関する型定義です。
 */

/**
 * AWS Cognito設定型
 *
 * @description AWS Cognitoユーザープールの接続設定です。
 * 環境変数から取得される設定値を構造化します。
 *
 * @example
 * ```typescript
 * const cognitoConfig: CognitoConfig = {
 *   region: "ap-northeast-1",
 *   userPoolId: "ap-northeast-1_XXXXXXXXX",
 *   userPoolClientId: "1234567890abcdefghijk"
 * };
 * ```
 */
export interface CognitoConfig {
  /** AWSリージョン（例: "ap-northeast-1"） */
  region: string;
  /** CognitoユーザープールID（例: "ap-northeast-1_XXXXXXXXX"） */
  userPoolId: string;
  /** CognitoユーザープールクライアントID */
  userPoolClientId: string;
}

/**
 * AWS Amplify統合設定型
 *
 * @description AWS Amplifyライブラリの設定構造です。
 * Amplify.configure()で使用される設定オブジェクトの型です。
 *
 * @example
 * ```typescript
 * const amplifyConfig: AmplifyConfig = {
 *   Auth: {
 *     Cognito: {
 *       region: "ap-northeast-1",
 *       userPoolId: "ap-northeast-1_XXXXXXXXX",
 *       userPoolClientId: "1234567890abcdefghijk"
 *     }
 *   }
 * };
 *
 * Amplify.configure(amplifyConfig);
 * ```
 */
export interface AmplifyConfig {
  /** 認証設定 */
  Auth: {
    /** Cognito認証設定 */
    Cognito: CognitoConfig;
  };
}
