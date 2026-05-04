# インフラ構成

関連: [要件定義書](requirements.md) / [技術スタック](tech-stack.md)

> **注記**: AWS S3（画像ストレージ）は確定。EC2 + RDS + ALB 構成は前提として設計するが、AWSサーバー構築方式は実装フェーズで最終確定予定。

## アーキテクチャ概要

```text
[ブラウザ]
    |
    | HTTPS :443
    v
[ALB（Application Load Balancer）]
    |
    | HTTP :80（バックエンド）/ HTTP :3000（フロントエンド）
    v
[EC2（Amazon Linux 2023）]
    |-- Nginx
    |     |-- /* --------> Next.js :3000         (フロントエンド)
    |     `-- /api/* ----> Spring Boot :8080      (バックエンドへリバースプロキシ)
    |
    `-- Spring Boot :8080
          |
          | PostgreSQL :5432
          v
      [RDS（PostgreSQL 17）]
      ※ プライベートサブネット配置（外部から直接アクセス不可）

[別途]
EC2（Spring Boot）
    |
    | AWS SDK（S3 PutObject / GetObject）
    v
[AWS S3]（画像ファイル保存）
```

---

## AWS サービス構成

| サービス | スペック | 用途 |
| --- | --- | --- |
| EC2 | t2.micro / Amazon Linux 2023 | アプリサーバー（Spring Boot + Next.js + Nginx） |
| RDS | db.t3.micro / PostgreSQL 17 | マネージドデータベース |
| ALB | Application Load Balancer | HTTPSターミネーション・ロードバランシング |
| S3 | 標準ストレージクラス | 投稿画像・プロフィール画像の保存 |
| VPC | パブリック + プライベートサブネット | ネットワーク分離 |
| Security Group | EC2用・RDS用・ALB用 の3つ | アクセス制御 |
| ACM | AWS Certificate Manager | HTTPS用SSL証明書（ALBにアタッチ） |

---

## ネットワーク構成

```text
VPC (10.0.0.0/16)
 |
 |-- パブリックサブネット 1a (10.0.1.0/24)
 |     `-- EC2（アプリサーバー）
 |     `-- ALB（インターネット向け）
 |           Internet Gateway 経由でインターネット接続
 |
 |-- プライベートサブネット 1a (10.0.2.0/24) ──┐
 `-- プライベートサブネット 1c (10.0.3.0/24) ──┴── RDS（外部アクセス不可）
```

**セキュリティグループのルール:**

| SG | インバウンド | 許可元 |
| --- | --- | --- |
| ALB用 SG | TCP 443（HTTPS）/ TCP 80（HTTP）| 全開放（0.0.0.0/0） |
| EC2用 SG | TCP 80（HTTP）| ALB用 SG からのみ |
| EC2用 SG | TCP 22（SSH）| 開発者の特定IPのみ |
| RDS用 SG | TCP 5432（PostgreSQL）| EC2用 SG からのみ |

---

## S3 バケット設計

| バケット名（例） | 用途 | アクセス |
| --- | --- | --- |
| raisetimeline-images | 投稿画像・プロフィール画像 | パブリック読み取り可（署名なしURL） |

**S3 保存パス設計:**
```
raisetimeline-images/
├── posts/{post_id}/{filename}        # 投稿画像
└── profiles/{user_id}/{filename}     # プロフィール画像
```

---

## デプロイ手順（概要）

### 前提条件

- AWS CLI 設定済み（`aws configure`）
- SSH キーペア生成済み
- ドメイン・ACM証明書取得済み（HTTPS利用時）

### 手順

1. **インフラ構築（AWS コンソール or Terraform）**
   - VPC・サブネット・IGW・セキュリティグループを作成
   - RDS PostgreSQL インスタンスを起動（プライベートサブネット）
   - EC2 インスタンスを起動（パブリックサブネット）
   - ALB を作成し EC2 ターゲットグループを紐づけ
   - S3 バケットを作成し CORS 設定・バケットポリシーを設定

2. **アプリのビルド（ローカル）**
   ```bash
   cd backend && ./gradlew bootJar
   cd ../frontend && npm run build
   ```

3. **EC2 へ転送**
   - JAR ファイル → `/opt/raisetimeline/`
   - Next.js ビルド成果物 → `/var/www/raisetimeline/`
   - Nginx 設定ファイル → `/etc/nginx/conf.d/`

4. **EC2 上でサービス起動**
   - 環境変数ファイル（`app.env`）を EC2 上に作成
   - `systemctl enable --now raisetimeline`
   - `systemctl restart nginx`

5. **動作確認**
   - ブラウザで ALB の DNS 名（または独自ドメイン）にアクセス
   - ユーザー登録・ログイン・投稿・画像アップロードを確認

---

## アプリの環境変数

本番デプロイ時は以下の環境変数を EC2 上の `app.env` ファイルで設定する。

| 変数名 | 説明 |
| --- | --- |
| `DB_HOST` | RDS エンドポイント |
| `DB_PORT` | データベースポート（5432） |
| `DB_NAME` | データベース名 |
| `DB_USERNAME` | DB ユーザー名 |
| `DB_PASSWORD` | DB パスワード |
| `JWT_SECRET` | JWT 署名用シークレットキー |
| `JWT_EXPIRATION_MS` | JWTトークン有効期限（ミリ秒） |
| `AWS_ACCESS_KEY_ID` | AWS 認証情報（S3アクセス用） |
| `AWS_SECRET_ACCESS_KEY` | AWS 認証情報（S3アクセス用） |
| `AWS_S3_BUCKET_NAME` | S3 バケット名 |
| `AWS_REGION` | AWS リージョン（例: ap-northeast-1） |
| `CORS_ALLOWED_ORIGINS` | CORS 許可オリジン（フロントエンドURL） |
| `DDL_AUTO` | Hibernate DDL 設定（本番: `update`） |
