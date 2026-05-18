# RaiseTimeLine

X（旧Twitter）風 SNS Web アプリケーション。Spring Boot REST API と Next.js SPA で構成し、ユーザー認証・タイムライン・いいね・コメント・フォロー・画像投稿の 6 機能を実装。AWS ECS Fargate + CloudFront + S3 の本番インフラを Terraform で IaC 化し、GitHub Actions による CI/CD パイプラインも整備。

---

## 技術スタック

![Java](https://img.shields.io/badge/Java-21-ED8B00?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.4.4-6DB33F?logo=spring-boot&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791?logo=postgresql&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-ECS_Fargate-FF9900?logo=amazon-aws&logoColor=white)
![Terraform](https://img.shields.io/badge/Terraform-IaC-7B42BC?logo=terraform&logoColor=white)
[![CI](https://github.com/gitmrk2k6/RaiseTimeLine/actions/workflows/ci.yml/badge.svg)](https://github.com/gitmrk2k6/RaiseTimeLine/actions/workflows/ci.yml)

---

## 機能一覧

| 機能 | 概要 |
| --- | --- |
| F-01 ユーザー認証 | 登録・ログイン・ログアウト。JWT（アクセストークン 15 分 / リフレッシュトークン 7 日）で認証 |
| F-02 タイムライン | 全ユーザーの投稿を新着順で表示。SSE によるリアルタイム更新・カーソルベース無限スクロール・フォロー中フィルター |
| F-03 コメント | 投稿へのコメント投稿・一覧表示・削除・コメント数表示 |
| F-04 いいね | 投稿へのいいね・いいね解除・いいね数表示 |
| F-05 画像投稿 | 投稿・プロフィール画像の添付（JPEG/PNG/GIF, 5MB 以内）。AWS S3 保存・CloudFront 経由で配信 |
| F-06 フォロー | ユーザー名部分一致検索・フォロー・アンフォロー・フォロー中/フォロワー一覧 |

---

## 実装のハイライト

### リアルタイム更新（Server-Sent Events）

WebSocket より軽量な SSE を採用。Spring Boot 標準の `SseEmitter` でサーバー側を実装し、フロントエンドはブラウザ標準の `EventSource API` で接続。新着投稿があった際にサーバーから全クライアントへプッシュ配信することで、ページリロードなしにタイムラインが更新される。

### カーソルベースのページネーション

`created_at` をカーソルとしたカーソルベースページネーション（MyBatis で実装）を採用。オフセット方式は大量データで遅くなり、新着投稿挿入時に表示ズレが発生するが、カーソル方式はこれを解消。無限スクロールと組み合わせて UX を向上させている。

### JWT 二重トークン方式

アクセストークン（有効期限 15 分）とリフレッシュトークン（7 日）の 2 種類を発行。フロントエンドの Axios インターセプターがアクセストークンの期限切れを検知して自動でリフレッシュすることで、ユーザーの操作を中断させない。

### MyBatis による SQL の可視化

JPA/Hibernate の代わりに MyBatis を採用。JOIN を含む複雑なクエリや動的 SQL を XML マッパーで明示的に記述でき、SQL のチューニングとデバッグが容易。`PostResponse` では投稿者情報・いいね数・コメント数・いいね済みフラグを単一クエリで取得している。

### インフラの IaC 化（Terraform）

ECS Fargate・RDS・ALB・CloudFront・S3・Secrets Manager・ECR など本番に必要な全 AWS リソースを Terraform で管理。環境差異をコードで管理し、再現性を担保。

### GitHub Actions OIDC 認証

CI/CD パイプラインの AWS 認証は OIDC（OpenID Connect）方式を採用。AWS アクセスキーを GitHub Secrets に保存せずに IAM ロールを一時取得するため、クレデンシャルの漏洩リスクを最小化している。

---

## アーキテクチャ

```text
[ブラウザ]
    │
    │ HTTPS
    ▼
[CloudFront（メイン）]
    │
    ├── /api/* ──────────────► [ALB] ──► [ECS Fargate（Spring Boot :8080）]
    │                                              │
    │                                              ▼
    │                                    [RDS PostgreSQL 17]
    │                                    （プライベートサブネット）
    │
    └── /* ─────────────────► [S3（Next.js 静的ビルド）]

[CloudFront（メディア）] ─────► [S3（投稿・プロフィール画像）]
```

**設計のポイント**:

- CloudFront が `/api/*` と `/*` を振り分けることでフロントエンド・バックエンドを単一ドメインに統合
- S3 はパブリックアクセスを完全ブロック。OAC（Origin Access Control）でのみ CloudFront からアクセスを許可
- 秘匿情報（DB パスワード・JWT シークレット）は Secrets Manager で管理し、ECS タスク起動時に注入
- ECS タスクは IAM タスクロールで S3 へアクセス。アクセスキーは一切使用しない

---

## 技術スタック詳細

### バックエンド

| 技術 | バージョン | 採用理由 |
| --- | --- | --- |
| Java | 21（LTS） | Spring Boot 3.x 推奨の LTS バージョン |
| Spring Boot | 3.4.4 | 本番で広く使われる Java エコシステムの中心 |
| Spring Security + JJWT | 6.x / 0.12.6 | ステートレス JWT 認証（SPA + REST API 構成に最適） |
| MyBatis | 3.0.4 | JOIN・動的クエリを SQL で明示的にコントロール |
| Flyway | 11.x | DB スキーマのバージョン管理 |
| AWS SDK for Java | 2.25.27 | S3 画像アップロード |
| SpringDoc OpenAPI | 2.8.6 | Swagger UI による API ドキュメント自動生成 |

### フロントエンド

| 技術 | バージョン | 採用理由 |
| --- | --- | --- |
| Next.js (App Router) | 14.2.35 | SSR/SSG 対応・構造化開発・静的エクスポートで S3 配信 |
| TypeScript | 5.x | 型安全性による品質向上 |
| Tailwind CSS | 3.4.1 | ユーティリティファーストで素早くカスタムデザイン実装 |
| Axios | 1.16.0 | インターセプターで JWT 自動リフレッシュを実装 |
| React Hook Form + Zod | 7.x / 4.x | 型安全なフォームバリデーション |
| EventSource API | ブラウザ標準 | SSE リアルタイム更新 |
| IntersectionObserver API | ブラウザ標準 | 無限スクロール |

### インフラ・クラウド

| 技術 | 用途 |
| --- | --- |
| AWS ECS Fargate | バックエンドコンテナ実行（サーバー管理不要） |
| AWS ECR | Docker イメージ管理 |
| AWS RDS（PostgreSQL 17） | マネージドデータベース |
| AWS ALB | ロードバランサー |
| AWS S3 + CloudFront | フロントエンド静的配信・メディア画像 CDN |
| AWS Secrets Manager | DB パスワード・JWT シークレットの秘匿情報管理 |
| AWS CloudWatch Logs | ECS コンテナログ収集・構造化 JSON ログ |
| Terraform | 全 AWS リソースの IaC 管理 |

---

## CI/CD パイプライン

GitHub Actions による自動化を実装（OIDC 認証で AWS アクセスキー不要）。

| ワークフロー | トリガー | 内容 |
| --- | --- | --- |
| `ci.yml` | 全ブランチへの push / main への PR | フロントエンド: ESLint・TypeScript・Vitest ／ バックエンド: Checkstyle・JUnit ／ E2E: Playwright |
| `deploy.yml` | main への push | Docker ビルド → ECR push → ECS 強制デプロイ ／ Next.js ビルド → S3 sync → CloudFront 無効化 |

---

## テスト

| レイヤー | ツール | 対象 |
| --- | --- | --- |
| フロントエンド ユニットテスト | Vitest + MSW | コンポーネント・lib 関数・API モック |
| バックエンド テスト | JUnit 5 + Spring Boot Test | コントローラー・サービス・マッパー |
| コード品質 | Checkstyle | Java コーディング規約チェック |
| E2E テスト | Playwright | 認証・投稿・コメント・いいね・フォロー・プロフィール（6 シナリオ） |

---

## ローカル開発セットアップ

### 前提条件

| ツール | バージョン |
| --- | --- |
| Java | 21 |
| Node.js | 20 |
| Docker | 最新安定版 |

### 起動手順

```bash
# 1. PostgreSQL 起動（Docker）
docker compose up -d

# 2. バックエンド起動（port 8080）
cd backend && ./gradlew bootRun

# 3. フロントエンド起動（port 3000）
cd frontend && npm install && npm run dev
```

ブラウザで <http://localhost:3000> を開く。

### 環境変数（バックエンド）

```bash
cp backend/src/main/resources/application.yml.example backend/src/main/resources/application-local.yml
```

`application-local.yml` に以下を設定:

| 変数 | 説明 |
| --- | --- |
| `DB_HOST` / `DB_PORT` / `DB_NAME` | PostgreSQL 接続情報 |
| `DB_USERNAME` / `DB_PASSWORD` | DB 認証情報 |
| `JWT_SECRET` | JWT 署名シークレット（64 文字以上推奨） |
| `S3_BUCKET` / `AWS_REGION` | S3 バケット名・リージョン（画像投稿時のみ必要） |

---

## API エンドポイント一覧

| メソッド | パス | 説明 | 認証 |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | ユーザー登録 | 不要 |
| POST | `/api/auth/login` | ログイン（JWT 発行） | 不要 |
| POST | `/api/auth/refresh` | アクセストークン更新 | 不要 |
| GET | `/api/posts` | 投稿一覧取得 | 必要 |
| POST | `/api/posts` | 投稿作成 | 必要 |
| PUT | `/api/posts/{id}` | 投稿編集（本人のみ） | 必要 |
| DELETE | `/api/posts/{id}` | 投稿削除（本人のみ） | 必要 |
| GET | `/api/posts/{id}/comments` | コメント一覧取得 | 必要 |
| POST | `/api/posts/{id}/comments` | コメント投稿 | 必要 |
| DELETE | `/api/posts/{id}/comments/{cid}` | コメント削除（本人のみ） | 必要 |
| POST | `/api/posts/{id}/likes` | いいね | 必要 |
| DELETE | `/api/posts/{id}/likes` | いいね解除 | 必要 |
| GET | `/api/users` | ユーザー検索（`?username=`） | 必要 |
| GET | `/api/users/{id}` | プロフィール取得 | 必要 |
| GET | `/api/users/{id}/posts` | ユーザーの投稿一覧 | 必要 |
| PUT | `/api/users/me` | プロフィール更新 | 必要 |
| POST | `/api/users/{id}/follow` | フォロー | 必要 |
| DELETE | `/api/users/{id}/follow` | アンフォロー | 必要 |
| GET | `/api/users/{id}/followers` | フォロワー一覧 | 必要 |
| GET | `/api/users/{id}/following` | フォロー中一覧 | 必要 |

---

## ドキュメント

| ドキュメント | 内容 |
| --- | --- |
| [要件定義書](docs/requirements.md) | プロジェクト概要・機能一覧・非機能要件 |
| [機能要件書](docs/functional-requirements.md) | 機能定義（F-01〜F-06）・バリデーション・ユースケース |
| [画面設計書](docs/screen-design.md) | 画面一覧（SC-01〜SC-09）・ワイヤーフレーム・画面遷移図 |
| [DB 設計書](docs/database-design.md) | ER 図・テーブル定義・インデックス・制約 |
| [技術スタック](docs/tech-stack.md) | 採用技術・プロジェクト構成・選定理由 |
| [インフラ構成](docs/infrastructure.md) | AWS 構成・ネットワーク・デプロイフロー・環境変数 |
| [監視・ログ設計書](docs/monitoring-and-logging.md) | 構造化ログ・監視閾値・CloudWatch 連携・障害対応フロー |

---

## 開発ルール

ブランチ戦略・コミットメッセージ規約は [CLAUDE.md](CLAUDE.md) を参照。`Issue → ブランチ → PR` のフローで開発。
