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
| バックエンド | Java / Spring Boot | Java 21 / Spring Boot 3.x |
| ビルドツール | Gradle | Gradle Wrapper 同梱 |
| フロントエンド | Next.js / React / TypeScript | Next.js 14.x / React 18.x |
| スタイリング | Tailwind CSS | 3.x |
| DB | PostgreSQL | 17（Docker） |
| ORM | Spring Data JPA（Hibernate） | - |
| 認証 | Spring Security + JWT | - |
| 画像ストレージ | AWS S3 | - |

詳細は [技術スタック](docs/tech-stack.md) を参照。

## 主な機能

| 機能ID | 機能名 | 概要 |
| --- | --- | --- |
| F-01 | ユーザー認証 | ユーザー登録・ログイン・ログアウト（JWT認証） |
| F-02 | タイムライン | テキスト投稿・全ユーザーの投稿を新着順で表示・削除 |
| F-03 | コメント | 投稿へのコメント・コメント数表示 |
| F-04 | いいね | 投稿へのいいね・いいね解除・いいね数表示 |
| F-05 | 画像投稿 | 投稿時の画像添付（JPEG/PNG/GIF, 5MB以内）・S3保存 |
| F-06 | フォロー/フォロワー | ユーザー検索・フォロー・アンフォロー・フォロワー一覧 |

詳細は [機能要件書](docs/functional-requirements.md) を参照。

## リポジトリ構成

```text
RaiseTimeLine/
├── backend/                     # Spring Boot（Gradle）
│   └── src/main/java/com/raisetech/raisetimeline/
│       ├── controller/          # REST コントローラー
│       ├── service/             # ビジネスロジック
│       ├── repository/          # データアクセス（JPA）
│       ├── entity/              # JPA エンティティ
│       ├── dto/                 # リクエスト/レスポンス DTO
│       └── security/            # JWT・Spring Security 設定
├── frontend/                    # Next.js（App Router）
│   └── app/
│       ├── page.tsx             # タイムライン (/)
│       ├── login/page.tsx
│       ├── register/page.tsx
│       ├── posts/[id]/page.tsx
│       ├── users/[id]/page.tsx
│       └── search/page.tsx
├── docker-compose.yml           # ローカル開発用 PostgreSQL
├── docs/                        # 設計ドキュメント
│   ├── requirements.md          # 要件定義書
│   ├── functional-requirements.md # 機能要件書（機能定義書）
│   ├── screen-design.md         # 画面設計書
│   ├── database-design.md       # DB 設計書
│   ├── tech-stack.md            # 技術スタック
│   └── infrastructure.md        # インフラ構成
└── CLAUDE.md                    # Claude Code 開発ルール
```

## 前提条件

| ツール | バージョン |
| --- | --- |
| Java | 21（LTS） |
| Node.js | 22 |
| Docker | 最新安定版 |
| Git | 最新安定版 |
| AWS CLI | 最新安定版（S3使用時） |

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
- `JWT_SECRET` / `JWT_EXPIRATION_MS`
- `AWS_S3_BUCKET_NAME` / `AWS_REGION`

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
| GET | `/api/posts` | 投稿一覧取得（新着順） | 不要 |
| POST | `/api/posts` | 投稿作成 | 必要 |
| DELETE | `/api/posts/{id}` | 投稿削除（本人のみ） | 必要 |
| GET | `/api/posts/{id}/comments` | コメント一覧取得 | 不要 |
| POST | `/api/posts/{id}/comments` | コメント投稿 | 必要 |
| DELETE | `/api/posts/{id}/comments/{cid}` | コメント削除（本人のみ） | 必要 |
| POST | `/api/posts/{id}/likes` | いいね | 必要 |
| DELETE | `/api/posts/{id}/likes` | いいね解除 | 必要 |
| GET | `/api/users/search` | ユーザー検索 | 必要 |
| POST | `/api/users/{id}/follow` | フォロー | 必要 |
| DELETE | `/api/users/{id}/follow` | アンフォロー | 必要 |
| GET | `/api/users/{id}/followers` | フォロワー一覧 | 必要 |
| GET | `/api/users/{id}/following` | フォロー中一覧 | 必要 |

### 使用例

```bash
# 投稿一覧取得
curl http://localhost:8080/api/posts

# ログイン（JWT取得）
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# 認証が必要なAPIの呼び出し
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
| [画面設計書](docs/screen-design.md) | 画面一覧（SC-01〜SC-08）・ワイヤーフレーム・画面遷移図 |
| [DB 設計書](docs/database-design.md) | ER図・テーブル定義・インデックス・制約 |
| [技術スタック](docs/tech-stack.md) | 採用技術・プロジェクト構成・選定理由 |
| [インフラ構成](docs/infrastructure.md) | AWS構成（EC2+RDS+ALB+S3）・ネットワーク・環境変数 |

## 開発ルール

- ブランチ戦略・コミットメッセージ規約・Claude Code の動作ルールは [CLAUDE.md](CLAUDE.md) を参照
- Issue → ブランチ → PR のフローを必ず守ること
