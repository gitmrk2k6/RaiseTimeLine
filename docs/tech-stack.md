# 技術スタック

関連: [要件定義書](requirements.md) / [インフラ構成](infrastructure.md)

## 1. バックエンド

| 技術 | バージョン | 実装状況 | 備考 |
| --- | --- | --- | --- |
| Java | 21 (LTS) | ✅ 実装済み | Spring Boot 3.x が推奨する LTS バージョン |
| Spring Boot | 3.4.4 | ✅ 実装済み | REST API サーバー |
| Spring Security | 6.x | ✅ 実装済み | 認証・認可（JWT連携） |
| JJWT | 0.12.6 | ✅ 実装済み | JWT トークン生成・検証 |
| MyBatis | 3.0.4 | ✅ 実装済み | SQL マッパー（JPA の代わりに採用） |
| Flyway | 11.x | ✅ 実装済み | DB マイグレーション管理 |
| Gradle | 8.x | ✅ 実装済み | ビルドツール（Kotlin DSL） |
| AWS SDK for Java | 2.x | 🔲 未実装 | S3 への画像アップロード（F-05） |

## 2. フロントエンド

| 技術 | バージョン | 実装状況 | 備考 |
| --- | --- | --- | --- |
| Next.js | 14.2.35 | ✅ 実装済み | React フレームワーク（App Router） |
| React | 18.x | ✅ 実装済み | UI ライブラリ |
| TypeScript | 5.x | ✅ 実装済み | 型安全な JavaScript |
| Tailwind CSS | 3.4.1 | ✅ 実装済み | ユーティリティファーストCSSフレームワーク |
| Axios | 1.16.0 | ✅ 実装済み | HTTP クライアント（API呼び出し・自動トークンリフレッシュ） |
| React Hook Form | 7.x | ✅ 実装済み | フォーム管理 |
| Zod | 4.x | ✅ 実装済み | スキーマバリデーション |
| EventSource API | ブラウザ標準 | ✅ 実装済み | SSE によるリアルタイム更新 |
| IntersectionObserver API | ブラウザ標準 | ✅ 実装済み | 無限スクロール |

## 3. データベース

| 技術 | バージョン | 実装状況 | 備考 |
| --- | --- | --- | --- |
| PostgreSQL | 17 | ✅ 実装済み | メインデータベース（Docker + 本番は AWS RDS） |

## 4. インフラ・クラウド

| 技術 | バージョン | 実装状況 | 備考 |
| --- | --- | --- | --- |
| AWS S3 | - | 🔲 未実装 | 画像ストレージ（F-05） |
| AWS EC2 | - | 🔲 未実装 | アプリサーバー |
| AWS RDS | PostgreSQL 17 | 🔲 未実装 | マネージドDB |
| AWS ALB | - | 🔲 未実装 | ロードバランサー |

## 5. 開発ツール

| 技術 | 実装状況 | 備考 |
| --- | --- | --- |
| Docker / Docker Compose | ✅ 実装済み | ローカル開発環境（PostgreSQL コンテナ） |
| IntelliJ IDEA / VS Code | ✅ 実装済み | IDE |
| GitHub | ✅ 実装済み | ソースコード管理・Issue・PR |

## 6. プロジェクト構成（現在）

```text
RaiseTimeLine/
├── docs/                        # ドキュメント類
│
├── backend/                     # Spring Boot プロジェクト
│   └── src/main/
│       ├── java/com/raisetimeline/
│       │   ├── controller/      # AuthController, PostController, HealthController
│       │   ├── service/         # AuthService, PostService, PostSseService
│       │   ├── mapper/          # UserMapper, PostMapper（MyBatis）
│       │   ├── entity/          # User, Post
│       │   ├── dto/             # リクエスト/レスポンス DTO
│       │   ├── exception/       # ForbiddenException, DuplicateResourceException, GlobalExceptionHandler
│       │   ├── security/        # JwtUtil, JwtAuthenticationFilter, UserDetailsServiceImpl
│       │   └── config/          # SecurityConfig
│       └── resources/
│           ├── application.yml
│           ├── db/migration/    # Flyway マイグレーション（V1: users, V2: posts）
│           └── mapper/          # PostMapper.xml（MyBatis XML）
│
├── frontend/                    # Next.js プロジェクト
│   ├── app/
│   │   ├── home/page.tsx        # タイムライン（投稿一覧・SSE・無限スクロール）
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── components/
│   │       ├── PostForm.tsx     # 投稿作成フォーム
│   │       └── PostCard.tsx     # 投稿カード（編集・削除）
│   ├── lib/
│   │   ├── api.ts               # Axios インスタンス（自動トークンリフレッシュ）
│   │   ├── auth.ts              # トークン・userId 管理
│   │   └── posts.ts             # 投稿 API 関数
│   └── middleware.ts            # ルート保護（認証チェック）
│
└── docker-compose.yml           # ローカル開発用 PostgreSQL
```

## 7. 技術選定理由

- **MyBatis（JPA の代わり）**: SQL を直接記述できるため、JOIN や動的クエリ（カーソルページネーション）を明示的にコントロールできる。チームの SQL スキル向上にも寄与。
- **SSE（Server-Sent Events）**: WebSocket より軽量で Spring Boot 標準の `SseEmitter` で実装できる。タイムラインへのリアルタイム配信はサーバー→クライアントの一方向で十分なため SSE が適切。
- **カーソルベースページネーション**: `created_at` カーソルによるページネーションはオフセット方式より高速で、新着投稿が挿入されても重複・欠落が発生しない。
- **Java Spring Boot**: RaiseTech コースの主要技術スタック。型安全・DI・AOP など本番現場でも広く使われるフレームワーク。
- **Next.js (React)**: SSR/SSG に対応したモダンなフロントエンドフレームワーク。App Router により構造化した開発が可能。
- **PostgreSQL**: 本番環境（AWS RDS）でも使いやすい OSS リレーショナルDB。
- **JWT認証**: ステートレスな認証方式で、フロントエンドとバックエンドを分離した構成（SPA + REST API）に適している。
- **Tailwind CSS**: クラス名でスタイルを記述するユーティリティファーストCSS。カスタムデザインを素早く実装できる。
