# 技術スタック

関連: [要件定義書](requirements.md) / [インフラ構成](infrastructure.md)

## 1. バックエンド

| 技術 | バージョン | 実装状況 | 備考 |
| --- | --- | --- | --- |
| Java | 21 (LTS) | 🔲 未実装 | Spring Boot 3.x が推奨する LTS バージョン |
| Spring Boot | 3.x | 🔲 未実装 | REST API サーバー |
| Spring Security | 6.x | 🔲 未実装 | 認証・認可（JWT連携） |
| JJWT | 0.12.x | 🔲 未実装 | JWT トークン生成・検証 |
| Spring Data JPA | 3.x | 🔲 未実装 | ORM（Hibernate） |
| Gradle | 8.x | 🔲 未実装 | ビルドツール |
| AWS SDK for Java | 2.x | 🔲 未実装 | S3 への画像アップロード |

## 2. フロントエンド

| 技術 | バージョン | 実装状況 | 備考 |
| --- | --- | --- | --- |
| Next.js | 14.x | 🔲 未実装 | React フレームワーク（App Router） |
| React | 18.x | 🔲 未実装 | UI ライブラリ |
| TypeScript | 5.x | 🔲 未実装 | 型安全な JavaScript |
| Tailwind CSS | 3.x | 🔲 未実装 | ユーティリティファーストCSSフレームワーク |
| Axios | 1.x | 🔲 未実装 | HTTP クライアント（API呼び出し） |

## 3. データベース

| 技術 | バージョン | 実装状況 | 備考 |
| --- | --- | --- | --- |
| PostgreSQL | 17 | 🔲 未実装 | メインデータベース |

## 4. インフラ・クラウド

| 技術 | バージョン | 実装状況 | 備考 |
| --- | --- | --- | --- |
| AWS S3 | - | 🔲 未実装 | 画像ストレージ（確定） |
| AWS EC2 | - | 🔲 未実装 | アプリサーバー（前提） |
| AWS RDS | PostgreSQL 17 | 🔲 未実装 | マネージドDB（前提） |
| AWS ALB | - | 🔲 未実装 | ロードバランサー（前提） |

## 5. 開発ツール

| 技術 | 実装状況 | 備考 |
| --- | --- | --- |
| Docker / Docker Compose | 🔲 未実装 | ローカル開発環境（PostgreSQL コンテナ） |
| IntelliJ IDEA / VS Code | 🔲 未実装 | IDE |
| GitHub | 🔲 未実装 | ソースコード管理 |

## 6. プロジェクト構成（予定）

```
RaiseTimeLine/
├── docs/                        # ドキュメント類
│   ├── requirements.md
│   ├── functional-requirements.md
│   ├── screen-design.md
│   ├── database-design.md
│   ├── tech-stack.md
│   └── infrastructure.md
│
├── backend/                     # Spring Boot プロジェクト
│   ├── src/
│   │   └── main/
│   │       ├── java/com/raisetech/raisetimeline/
│   │       │   ├── controller/  # REST コントローラー
│   │       │   ├── service/     # ビジネスロジック
│   │       │   ├── repository/  # データアクセス（JPA）
│   │       │   ├── entity/      # JPA エンティティ
│   │       │   ├── dto/         # リクエスト/レスポンス DTO
│   │       │   └── security/    # JWT・Spring Security 設定
│   │       └── resources/
│   │           └── application.yml
│   └── build.gradle
│
├── frontend/                    # Next.js プロジェクト
│   ├── app/                     # App Router
│   │   ├── page.tsx             # タイムライン (/)
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── posts/[id]/page.tsx
│   │   ├── users/[id]/page.tsx
│   │   └── search/page.tsx
│   ├── components/              # 再利用コンポーネント
│   ├── lib/                     # API クライアント・ユーティリティ
│   └── package.json
│
├── docker-compose.yml           # ローカル開発用 PostgreSQL
└── README.md
```

## 7. 技術選定理由

- **Java Spring Boot**: RaiseTech コースの主要技術スタック。型安全・DI・AOP など本番現場でも広く使われるフレームワーク。
- **Next.js (React)**: SSR/SSG に対応したモダンなフロントエンドフレームワーク。API Routes や App Router により構造化した開発が可能。
- **PostgreSQL**: 本番環境（AWS RDS）でも使いやすいOSSリレーショナルDB。Spring Data JPA との親和性が高い。
- **JWT認証**: ステートレスな認証方式で、フロントエンドとバックエンドを分離した構成（SPA + REST API）に適している。
- **AWS S3**: 画像ストレージとして高可用・低コスト。アプリサーバーにファイルを持たないことでスケールしやすい設計となる。
- **Tailwind CSS**: クラス名でスタイルを記述するユーティリティファーストCSS。カスタムデザインを素早く実装できる。
