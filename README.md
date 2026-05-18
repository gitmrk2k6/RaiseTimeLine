# RaiseTimeLine

[![CI](https://github.com/gitmrk2k6/RaiseTimeLine/actions/workflows/ci.yml/badge.svg)](https://github.com/gitmrk2k6/RaiseTimeLine/actions/workflows/ci.yml)

RaiseTech AI エンジニアコース 学習課題として開発中の X（旧Twitter）風 SNS Web アプリケーション。

## 概要

テキスト・画像を投稿してタイムラインに表示し、他ユーザーとフォロー・いいね・コメントで繋がれる SNS プラットフォーム。
バックエンドは Spring Boot の REST API、フロントエンドは Next.js（React）で構成された SPA。

詳細は [要件定義書](docs/requirements.md) を参照。

## 技術スタック

| レイヤー | 技術 | バージョン |
| --- | --- | --- |
| バックエンド | Java / Spring Boot | Java 21 / Spring Boot 3.4.4 |
| ビルドツール | Gradle | Gradle Wrapper 同梱 |
| フロントエンド | Next.js / React / TypeScript | Next.js 14.2.35 / React 18.x |
| スタイリング | Tailwind CSS | 3.4.1 |
| DB | PostgreSQL | 17（Docker） |
| SQL マッパー | MyBatis | 3.0.4 |
| 認証 | Spring Security + JWT（JJWT） | JJWT 0.12.6 |
| 画像ストレージ | AWS S3 + CloudFront | - |

詳細は [技術スタック](docs/tech-stack.md) を参照。

## 主な機能

| 機能ID | 機能名 | 概要 |
| --- | --- | --- |
| F-01 | ユーザー認証 | ユーザー登録・ログイン・ログアウト（JWT認証） |
| F-02 | タイムライン | テキスト投稿・全ユーザーの投稿を新着順で表示・削除・SSEリアルタイム更新・無限スクロール |
| F-03 | コメント | 投稿へのコメント・コメント数表示 |
| F-04 | いいね | 投稿へのいいね・いいね解除・いいね数表示 |
| F-05 | 画像投稿 | 投稿時の画像添付（JPEG/PNG/GIF, 5MB以内）・S3保存 |
| F-06 | フォロー/フォロワー | ユーザー検索・フォロー・アンフォロー・フォロワー一覧 |

詳細は [機能要件書](docs/functional-requirements.md) を参照。

## リポジトリ構成

```text
RaiseTimeLine/
├── backend/                     # Spring Boot（Gradle）
│   └── src/main/java/com/raisetimeline/
│       ├── controller/          # REST コントローラー
│       ├── service/             # ビジネスロジック
│       ├── mapper/              # データアクセス（MyBatis）
│       ├── entity/              # ドメインモデル
│       ├── dto/                 # リクエスト/レスポンス DTO
│       ├── security/            # JWT・Spring Security 設定
│       ├── filter/              # リクエストログフィルター
│       └── exception/           # 例外ハンドリング
├── frontend/                    # Next.js（App Router）
│   └── app/
│       ├── page.tsx             # / → /login リダイレクト
│       ├── login/page.tsx
│       ├── register/page.tsx
│       ├── home/page.tsx        # タイムライン（SSE・無限スクロール・フォロー中フィルター）
│       ├── search/page.tsx
│       ├── profile/[userId]/page.tsx
│       ├── profile/[userId]/follows/page.tsx
│       └── profile/edit/page.tsx
├── infra/                       # Terraform（AWS インフラ IaC）
├── .github/workflows/           # GitHub Actions（CI/CD）
├── docker-compose.yml           # ローカル開発用 PostgreSQL
└── docs/                        # 設計ドキュメント
    ├── requirements.md          # 要件定義書
    ├── functional-requirements.md # 機能要件書（機能定義書）
    ├── screen-design.md         # 画面設計書
    ├── database-design.md       # DB 設計書
    ├── tech-stack.md            # 技術スタック
    ├── infrastructure.md        # インフラ構成
    └── monitoring-and-logging.md # 監視・ログ設計書
```

## 前提条件

| ツール | バージョン |
| --- | --- |
| Java | 21（LTS） |
| Node.js | 20 |
| Docker | 最新安定版 |
| Git | 最新安定版 |

## セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/gitmrk2k6/RaiseTimeLine.git
cd RaiseTimeLine
```

### 2. フロントエンドの依存パッケージをインストール

```bash
cd frontend && npm install
```

### 3. 環境変数の設定

バックエンド用の環境変数ファイルを作成する（`.env` は Git 管理外）:

```bash
cp backend/src/main/resources/application.yml.example backend/src/main/resources/application-local.yml
```

設定が必要な主な値:

- `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USERNAME` / `DB_PASSWORD`
- `JWT_SECRET`
- `S3_BUCKET` / `AWS_REGION`

詳細は [インフラ構成](docs/infrastructure.md) を参照。

## 起動方法

> **ポート競合が発生した場合は必ず競合プロセスを停止してから指定ポートで再起動すること。**
> 別ポートへの変更は禁止。詳細は [CLAUDE.md](CLAUDE.md) を参照。

### Step 1: PostgreSQL（Docker）

```bash
docker compose up -d
```

### Step 2: バックエンド（port 8080）

```bash
cd backend
./gradlew bootRun
```

### Step 3: フロントエンド（port 3000）

```bash
cd frontend
npm run dev
```

ブラウザで <http://localhost:3000> を開く。

## API エンドポイント

| メソッド | パス | 説明 | 認証 |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | ユーザー登録 | 不要 |
| POST | `/api/auth/login` | ログイン（JWT発行） | 不要 |
| POST | `/api/auth/refresh` | アクセストークン更新 | 不要 |
| GET | `/api/posts` | 投稿一覧取得（新着順） | 必要 |
| POST | `/api/posts` | 投稿作成 | 必要 |
| PUT | `/api/posts/{id}` | 投稿編集（本人のみ） | 必要 |
| DELETE | `/api/posts/{id}` | 投稿削除（本人のみ） | 必要 |
| GET | `/api/posts/{id}/comments` | コメント一覧取得 | 必要 |
| POST | `/api/posts/{id}/comments` | コメント投稿 | 必要 |
| DELETE | `/api/posts/{id}/comments/{cid}` | コメント削除（本人のみ） | 必要 |
| POST | `/api/posts/{id}/likes` | いいね | 必要 |
| DELETE | `/api/posts/{id}/likes` | いいね解除 | 必要 |
| GET | `/api/users` | ユーザー検索（`?username=` で部分一致） | 必要 |
| GET | `/api/users/{id}` | プロフィール取得 | 必要 |
| GET | `/api/users/{id}/posts` | ユーザーの投稿一覧 | 必要 |
| PUT | `/api/users/me` | プロフィール更新（本人のみ） | 必要 |
| POST | `/api/users/{id}/follow` | フォロー | 必要 |
| DELETE | `/api/users/{id}/follow` | アンフォロー | 必要 |
| GET | `/api/users/{id}/followers` | フォロワー一覧 | 必要 |
| GET | `/api/users/{id}/following` | フォロー中一覧 | 必要 |

### 使用例

```bash
# ログイン（JWT取得）
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# 認証が必要な API の呼び出し
curl http://localhost:8080/api/posts \
  -H "Authorization: Bearer <JWT_TOKEN>"

# 投稿作成
curl -X POST http://localhost:8080/api/posts \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello, RaiseTimeLine!"}'
```

## ドキュメント

| ドキュメント | 内容 |
| --- | --- |
| [要件定義書](docs/requirements.md) | プロジェクト概要・機能一覧・非機能要件・スコープ外 |
| [機能要件書](docs/functional-requirements.md) | 機能定義（F-01〜F-06）・バリデーション・ユースケース |
| [画面設計書](docs/screen-design.md) | 画面一覧（SC-01〜SC-09）・ワイヤーフレーム・画面遷移図 |
| [DB 設計書](docs/database-design.md) | ER図・テーブル定義・インデックス・制約 |
| [技術スタック](docs/tech-stack.md) | 採用技術・プロジェクト構成・選定理由 |
| [インフラ構成](docs/infrastructure.md) | AWS 構成（ECS Fargate + CloudFront + S3 + RDS + ALB） |
| [監視・ログ設計書](docs/monitoring-and-logging.md) | 構造化ログ・監視閾値・CloudWatch 連携 |

## 開発ルール

- ブランチ戦略・コミットメッセージ規約・Claude Code の動作ルールは [CLAUDE.md](CLAUDE.md) を参照
- Issue → ブランチ → PR のフローを必ず守ること
