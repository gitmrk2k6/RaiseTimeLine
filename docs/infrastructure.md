# インフラ構成

関連: [要件定義書](requirements.md) / [技術スタック](tech-stack.md)

## アーキテクチャ概要

```text
[ブラウザ]
    |
    | HTTPS
    v
[CloudFront（メイン）]
    |
    |-- /api/*  ──────────────> [ALB（Application Load Balancer）]
    |                                      |
    |                                      | HTTP :8080
    |                                      v
    |                           [ECS Fargate（Spring Boot）]
    |                           （パブリックサブネット、パブリック IP 付き）
    |                                      |
    |                                      | PostgreSQL :5432
    |                                      v
    |                           [RDS（PostgreSQL 17）]
    |                           （プライベートサブネット）
    |
    `-- /* (静的ファイル) ──> [S3 frontend バケット]（OAC アクセス）

[CloudFront（メディア）]
    |
    `-- /* ────────────────> [S3 media バケット]（OAC アクセス）

[ECS Fargate（Spring Boot）]
    |
    | S3 PutObject/GetObject（IAM タスクロール経由）
    v
[S3 media バケット]（投稿・プロフィール画像保存）
```

---

## AWS サービス構成

| サービス | スペック | 用途 |
| --- | --- | --- |
| ECS Fargate | 512 CPU / 1024 MB メモリ | バックエンドコンテナ実行（Spring Boot） |
| ECR | - | Docker イメージレポジトリ |
| RDS | db.t3.micro / PostgreSQL 17 | マネージドデータベース（プライベートサブネット） |
| ALB | Application Load Balancer | ECS へのルーティング（CloudFront → ALB → ECS） |
| S3（frontend） | `{app}-frontend-{env}` | Next.js 静的ビルド成果物の配信 |
| S3（media） | `{app}-media-{env}` | 投稿・プロフィール画像の保存 |
| CloudFront（メイン） | PriceClass_200 | フロントエンド + API のエンドポイント統合（`/api/*` は ALB へ） |
| CloudFront（メディア） | PriceClass_200 | メディア画像の CDN 配信 |
| Secrets Manager | - | DB パスワード・JWT シークレットの秘匿情報管理 |
| CloudWatch Logs | 30 日保持 | ECS コンテナログ収集（`/ecs/{app}-backend`） |
| VPC | パブリック + プライベートサブネット | ネットワーク分離 |
| Security Group | ECS用・RDS用・ALB用 の3つ | アクセス制御 |

---

## ネットワーク構成

```text
VPC (10.0.0.0/16)
 |
 |-- パブリックサブネット 1a (10.0.1.0/24)
 |     `-- ALB（インターネット向け）
 |     `-- ECS Fargate（パブリック IP 付き）
 |           Internet Gateway 経由でインターネット接続
 |
 |-- プライベートサブネット 1a (10.0.2.0/24) ──┐
 `-- プライベートサブネット 1c (10.0.3.0/24) ──┴── RDS（外部アクセス不可）
```

**セキュリティグループのルール:**

| SG | インバウンド | 許可元 |
| --- | --- | --- |
| ALB用 SG | TCP 80（HTTP）| 全開放（CloudFront 向け） |
| ECS用 SG | TCP 8080（HTTP）| ALB用 SG からのみ |
| RDS用 SG | TCP 5432（PostgreSQL）| ECS用 SG からのみ |

> **注記**: HTTPS ターミネーションは CloudFront 側で行う。ALB-ECS 間は HTTP 通信。S3 はパブリックアクセスブロックを有効にし、CloudFront OAC（Origin Access Control）経由でのみアクセスを許可。

---

## S3 バケット設計

| バケット名（例） | 用途 | アクセス方式 |
| --- | --- | --- |
| raisetimeline-frontend-prod | Next.js 静的ビルド成果物 | CloudFront（メイン）OAC 経由のみ |
| raisetimeline-media-prod | 投稿・プロフィール画像 | CloudFront（メディア）OAC 経由のみ |

**メディア S3 保存パス設計:**

```text
raisetimeline-media-prod/
├── posts/{post_id}/{filename}        # 投稿画像
└── profiles/{user_id}/{filename}     # プロフィール画像
```

---

## デプロイフロー（GitHub Actions）

main ブランチへのプッシュで自動実行される。

### バックエンド（ECS Fargate）

```bash
# GitHub Actions (deploy.yml) が自動実行
1. OIDC 認証（アクセスキー不要）
2. ECR ログイン
3. Docker build & push → ECR
   docker build -t {ECR_REPO}:{SHA} backend/
   docker push {ECR_REPO}:{SHA}
4. ECS サービス強制更新
   aws ecs update-service --force-new-deployment
5. ECS サービス安定待機
   aws ecs wait services-stable
```

### フロントエンド（S3 + CloudFront）

```bash
# GitHub Actions (deploy.yml) が自動実行
1. OIDC 認証（アクセスキー不要）
2. npm ci && npm run build（Next.js 静的エクスポート → frontend/out/）
3. S3 同期（HTML: no-cache / 静的アセット: 1年キャッシュ）
   aws s3 sync frontend/out/ s3://{FRONTEND_BUCKET}/
4. CloudFront キャッシュ無効化
   aws cloudfront create-invalidation --paths "/*"
```

> **GitHub Actions 認証**: OIDC（`id-token: write`）を使用。AWS アクセスキーを GitHub Secrets に保存せず、`github-actions-deploy` IAM ロールを引き受ける方式。

---

## アプリの環境変数（ECS タスク定義）

本番環境の環境変数は Terraform の ECS タスク定義で管理する。

### 通常の環境変数（平文）

| 変数名 | 説明 | 設定値の例 |
| --- | --- | --- |
| `SPRING_PROFILES_ACTIVE` | Spring プロファイル | `prod` |
| `DB_HOST` | RDS エンドポイント | Terraform 自動設定 |
| `DB_PORT` | データベースポート | `5432` |
| `DB_NAME` | データベース名 | `raisetimeline` |
| `DB_USERNAME` | DB ユーザー名 | Terraform 変数 |
| `AWS_REGION` | AWS リージョン | `ap-northeast-1` |
| `S3_BUCKET` | メディア用 S3 バケット名 | Terraform 自動設定 |
| `CLOUDFRONT_MEDIA_URL` | メディア CloudFront URL | Terraform 自動設定 |
| `CORS_ALLOWED_ORIGINS` | CORS 許可オリジン | CloudFront メインドメイン |

### Secrets Manager 管理（秘匿情報）

| 変数名 | Secrets Manager パス | 説明 |
| --- | --- | --- |
| `DB_PASSWORD` | `/{app}/{env}/db-password` | RDS パスワード |
| `JWT_SECRET` | `/{app}/{env}/jwt-secret` | JWT 署名シークレット |

> **注記**: ECS タスクは IAM タスクロールによって S3 への PutObject/GetObject/DeleteObject 権限を持つ。アクセスキーは一切使用しない。

---

## CI/CD パイプライン（GitHub Actions）

| ワークフロー | トリガー | 内容 |
| --- | --- | --- |
| `ci.yml` | 全ブランチへの push / main への PR | フロントエンド（ESLint・TypeScript・Vitest）+ バックエンド（Checkstyle・JUnit）+ E2E（Playwright） |
| `deploy.yml` | main ブランチへの push | バックエンド ECR push → ECS デプロイ + フロントエンド S3 sync → CloudFront 無効化 |
