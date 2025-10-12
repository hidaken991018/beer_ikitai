# My Beer Log - フロントエンド画面遷移設計書

## 概要

My Beer Log アプリケーションのフロントエンド画面遷移について、実装されたソースコードをベースに整理した設計書です。Next.js App Router を使用したクライアントサイドレンダリング（CSR）により構築されています。

## 画面一覧

### 認証系画面

| 画面名         | パス                   | コンポーネント      | 認証必要 | 説明                   |
| -------------- | ---------------------- | ------------------- | -------- | ---------------------- |
| ログイン       | `/auth/login`          | `LoginPage`         | ❌       | ユーザーのログイン     |
| アカウント登録 | `/auth/register`       | `RegisterPage`      | ❌       | 新規アカウント作成     |
| アカウント確認 | `/auth/confirm-signup` | `ConfirmSignupPage` | ❌       | Cognito 確認コード入力 |

### メイン画面

| 画面名 | パス | コンポーネント | 認証必要 | 説明                         |
| ------ | ---- | -------------- | -------- | ---------------------------- |
| ホーム | `/`  | `HomePage`     | ❌       | トップページ・ダッシュボード |

### 醸造所系画面

| 画面名     | パス              | コンポーネント        | 認証必要 | 説明                           |
| ---------- | ----------------- | --------------------- | -------- | ------------------------------ |
| 醸造所一覧 | `/brewery`        | `BreweryPage`         | ❌       | 全醸造所の検索・一覧表示       |
| 醸造所詳細 | `/brewery/[id]`   | `BreweryDetailPage`   | ❌       | 醸造所の詳細情報・チェックイン |
| 近隣醸造所 | `/brewery/nearby` | `NearbyBreweriesPage` | ❌       | GPS 位置情報による近隣検索     |

### ユーザー系画面

| 画面名           | パス              | コンポーネント        | 認証必要 | 説明                       |
| ---------------- | ----------------- | --------------------- | -------- | -------------------------- |
| 訪問履歴         | `/visits`         | `VisitsPage`          | ✅       | ユーザーのチェックイン履歴 |
| プロフィール     | `/profile`        | `ProfilePage`         | ✅       | ユーザー情報・統計・設定   |
| プロフィール作成 | `/profile/create` | `ProfileCreatePage`   | ✅       | 初回プロフィール作成       |

### 共通画面

| 画面名           | パス | コンポーネント     | 認証必要 | 説明                         |
| ---------------- | ---- | ------------------ | -------- | ---------------------------- |
| 404 エラー       | `*`  | `not-found.tsx`    | ❌       | ページが見つからない         |
| グローバルエラー | `*`  | `global-error.tsx` | ❌       | アプリケーション全体のエラー |
| ローディング     | `*`  | `loading.tsx`      | ❌       | 各画面のローディング状態     |

## 画面遷移フロー詳細

### 認証・プロフィールチェック統合フロー

```mermaid
flowchart TD
    START([アプリケーション開始]) --> AUTH_CHECK{認証状態チェック}
    
    %% 認証状態別分岐
    AUTH_CHECK --> |未認証| UNAUTH_PAGES[未認証画面]
    AUTH_CHECK --> |認証済み| PROFILE_CHECK[プロフィール存在チェック]
    
    %% 未認証ページ群
    UNAUTH_PAGES --> LOGIN[ログイン画面]
    UNAUTH_PAGES --> REGISTER[アカウント登録]
    UNAUTH_PAGES --> HOME[ホーム画面]
    UNAUTH_PAGES --> BREWERY_LIST[醸造所一覧]
    UNAUTH_PAGES --> BREWERY_DETAIL[醸造所詳細]
    
    %% 認証フロー
    REGISTER --> |登録成功| CONFIRM[アカウント確認]
    CONFIRM --> |確認完了| LOGIN
    LOGIN --> |ログイン成功| PROFILE_CHECK
    
    %% プロフィール存在チェック
    PROFILE_CHECK --> API_CALL[GET /users/profile API呼び出し]
    API_CALL --> API_RESPONSE{APIレスポンス}
    
    %% APIレスポンス別処理
    API_RESPONSE --> |200 OK| PROFILE_EXISTS[プロフィール存在]
    API_RESPONSE --> |404 Not Found| PROFILE_NOT_EXISTS[プロフィール未作成]
    API_RESPONSE --> |401 Unauthorized| AUTH_ERROR[認証エラー]
    API_RESPONSE --> |500 Server Error| SERVER_ERROR[サーバーエラー]
    API_RESPONSE --> |Network Error| NETWORK_ERROR[ネットワークエラー]
    
    %% 正常フロー
    PROFILE_EXISTS --> AUTH_PAGES[認証済み画面群]
    PROFILE_NOT_EXISTS --> PROFILE_CREATE[プロフィール作成画面]
    PROFILE_CREATE --> CREATE_API[POST /users/profile API]
    CREATE_API --> CREATE_RESPONSE{作成APIレスポンス}
    
    %% プロフィール作成レスポンス
    CREATE_RESPONSE --> |201 Created| PROFILE_CREATED[作成成功]
    CREATE_RESPONSE --> |400 Bad Request| VALIDATION_ERROR[入力検証エラー]
    CREATE_RESPONSE --> |401 Unauthorized| AUTH_ERROR
    CREATE_RESPONSE --> |409 Conflict| CONFLICT_ERROR[重複エラー]
    CREATE_RESPONSE --> |500 Server Error| SERVER_ERROR
    
    PROFILE_CREATED --> AUTH_PAGES
    
    %% 認証済み画面群
    AUTH_PAGES --> VISITS[訪問履歴]
    AUTH_PAGES --> PROFILE[プロフィール]
    AUTH_PAGES --> CHECKIN[チェックイン機能]
    
    %% エラー処理フロー
    AUTH_ERROR --> LOGOUT[自動ログアウト]
    LOGOUT --> LOGIN
    
    SERVER_ERROR --> RETRY_DIALOG[リトライ確認]
    NETWORK_ERROR --> RETRY_DIALOG
    
    RETRY_DIALOG --> |リトライ| API_CALL
    RETRY_DIALOG --> |キャンセル| ERROR_FALLBACK[エラー画面]
    
    VALIDATION_ERROR --> PROFILE_CREATE
    CONFLICT_ERROR --> PROFILE_CHECK
```

### 実装ガイド用詳細フロー

```mermaid
sequenceDiagram
    participant User
    participant AuthProvider
    participant ProfileAPI
    participant Router
    
    User->>AuthProvider: アプリケーション開始
    AuthProvider->>AuthProvider: 認証状態確認
    
    alt 未認証の場合
        AuthProvider->>User: 未認証画面表示
    else 認証済みの場合
        AuthProvider->>ProfileAPI: GET /users/profile
        
        alt プロフィール存在 (200 OK)
            ProfileAPI->>AuthProvider: プロフィールデータ
            AuthProvider->>User: メイン画面へ
            
        else プロフィール未作成 (404)
            ProfileAPI->>AuthProvider: 404 Not Found
            AuthProvider->>Router: /profile/create へリダイレクト
            Router->>User: プロフィール作成画面表示
            
            User->>ProfileAPI: POST /users/profile (display_name)
            
            alt 作成成功 (201)
                ProfileAPI->>AuthProvider: 作成成功
                AuthProvider->>Router: メイン画面へリダイレクト
                
            else 入力エラー (400)
                ProfileAPI->>User: バリデーションエラー表示
                
            else 認証エラー (401)
                ProfileAPI->>AuthProvider: 認証失効
                AuthProvider->>Router: ログイン画面へリダイレクト
                
            else サーバーエラー (500)
                ProfileAPI->>User: エラーメッセージ + リトライボタン
            end
            
        else 認証エラー (401)
            ProfileAPI->>AuthProvider: 認証失効
            AuthProvider->>Router: ログイン画面へリダイレクト
            
        else サーバーエラー (500/Network)
            ProfileAPI->>User: エラーメッセージ + リトライボタン
        end
    end
```

## 包括的エラーハンドリング戦略

### HTTPステータスコード別処理方針

#### 認証関連エラー
- **401 Unauthorized**
  - 自動処理: セッション情報クリア → ログイン画面リダイレクト
  - ユーザー表示: "セッションが無効です。再度ログインしてください。"

#### プロフィール取得エラー
- **404 Not Found**
  - 自動処理: プロフィール作成画面 (`/profile/create`) へリダイレクト
  - ユーザー表示: "プロフィールを作成してください"

#### バリデーションエラー
- **400 Bad Request**
  - 自動処理: フォーム入力状態維持
  - ユーザー表示: 詳細なフィールド別エラーメッセージ
  - 復旧方法: 入力修正後に再送信

#### 重複・競合エラー
- **409 Conflict**
  - 自動処理: 最新状態の再取得
  - ユーザー表示: "データが更新されています。最新情報で再試行してください。"
  - 復旧方法: 自動リトライ（最大3回）

#### サーバーエラー
- **500 Internal Server Error**
  - 自動処理: 指数バックオフによる自動リトライ（1秒、2秒、4秒間隔）
  - ユーザー表示: "一時的な問題が発生しました。しばらくお待ちください。"
  - 手動復旧: リトライボタン表示

#### ネットワークエラー
- **Network Timeout/Connection Error**
  - 自動処理: 3回まで自動リトライ（2秒間隔）
  - ユーザー表示: "ネットワーク接続を確認してください。"
  - 手動復旧: リトライボタン + オフライン対応案内

### 自動復旧戦略

#### リトライ仕様
```typescript
interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // ミリ秒
  backoffMultiplier: number;
  retryableStatuses: number[];
}

const defaultRetryConfig: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  backoffMultiplier: 2,
  retryableStatuses: [500, 502, 503, 504, 408, 429]
};
```

#### リトライ対象判定
- **自動リトライ対象**: 500系エラー、ネットワークタイムアウト
- **手動リトライ対象**: 400系エラー（バリデーション除く）
- **リトライ非対象**: 401（認証）、400（バリデーション）、404（リソース不存在）

### 手動復旧オプション

#### リトライボタン機能
- エラー画面での明示的リトライ操作
- リトライ実行中のローディング状態表示
- リトライ失敗時の代替手段提示

#### フォールバック画面設計
- **軽量版機能**: サーバー依存機能の簡略版提供
- **オフライン対応**: ローカルストレージ活用の代替UI
- **問題報告**: サポート連絡手段の提供

#### ユーザーガイダンス
- **自己解決案内**: よくある問題と解決方法
- **代替アクション**: 同等機能への誘導
- **状況説明**: エラーの原因と復旧見込み時間

### エラー報告・監視機能

#### ユーザー向けエラー情報
- **エラーID**: 一意な問題識別子生成
- **発生時刻**: タイムスタンプ記録
- **操作コンテキスト**: エラー直前のユーザー操作

#### 開発者向けログ情報
- **スタックトレース**: エラー詳細情報
- **APIレスポンス**: サーバーからの完全なエラーレスポンス
- **環境情報**: ブラウザ、OS、ネットワーク状態

## 主要ユーザージャーニー

### 1. 新規ユーザー登録〜初回チェックイン

```
ホーム → アカウント登録 → アカウント確認 → ログイン → プロフィール作成 → ホーム → 近隣醸造所検索 → 醸造所詳細 → チェックイン
```

### 2. 既存ユーザーのログイン〜醸造所探索

```
ホーム → ログイン → ホーム → 醸造所一覧 → 検索・フィルター → 醸造所詳細 → チェックイン
```

### 3. 訪問履歴の確認(認証済み)

```
ホーム → 訪問履歴 → フィルター・検索 → 醸造所詳細 → 再チェックイン
```

### 4. プロフィール管理(認証済み)

```
ホーム → プロフィール → 基本情報編集 → 統計確認 → 各種機能へのショートカット
```

## ナビゲーション設計

### Header (AppLayout)

- **表示**: 全画面共通
- **要素**: アプリ名、ナビゲーション、ユーザーメニュー
- **認証状態**: ログイン状態に応じたメニュー表示

### Navigation

- **ホーム**: 常に表示
- **醸造所**: 醸造所一覧・近隣検索へのリンク
- **認証状態別表示**:
  - 未認証: ログイン・登録ボタン
  - 認証済み: 訪問履歴・プロフィール・ログアウト

### Footer

- **表示**: 全画面共通
- **要素**: アプリ情報、利用規約、プライバシーポリシー等

## ローディング状態

### 画面レベル

- 各ルートに専用の `loading.tsx` を配置
- Suspense 境界による段階的ローディング

### コンポーネントレベル

- API 通信中のスピナー表示
- ボタンの無効化・ローディングテキスト表示

## 外部連携・共有機能

### Web Share API

- 醸造所詳細の共有機能
- フォールバック: クリップボードコピー

### メール連携

- プロフィールからサポート連絡
- `mailto:` プロトコルによる外部メーラー起動

## 実装優先度とフェーズ計画

### Phase 1: 設計詳細化（今回実装）
- ✅ 画面遷移設計文書更新
- ✅ 認証・プロフィールチェックフロー詳細化
- ✅ エラーハンドリング戦略策定

### Phase 2: UIコンポーネント実装
- ProfileCreateForm.tsx + Storybook
- バリデーション実装 (React Hook Form + zod)
- エラー表示コンポーネント

### Phase 3: APIクライアント拡張
- userProfile.ts API関数
- useUserProfile.ts カスタムhook
- エラーリトライ機能

### Phase 4: 認証フロー実装
- AuthProvider.tsx 拡張
- useAuth.ts プロフィールチェック機能追加
- 自動リダイレクト機能

### Phase 5: プロフィール作成画面実装
- page.tsx 実装
- コンポーネント統合・API連携
- エラーハンドリング統合

この設計書により、開発チームはユーザープロフィール機能の包括的な実装指針を得ることができます。