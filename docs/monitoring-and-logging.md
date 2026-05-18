# 監視・ログ設計書

## 1. 概要

### 目的

- 障害発生時に **原因を素早く特定できる** トレーサビリティを確保する
- 将来の **DataLog 等のログ基盤** との連携を見据えた構造化ログを実装する
- AWS 本番環境（ECS Fargate + RDS + ALB + CloudFront）での **安定運用** を支援する

### スコープ

| 対象 | 内容 |
| --- | --- |
| バックエンド（Spring Boot） | 構造化 JSON ログ、リクエストログ、例外ログ |
| AWS CloudWatch Logs | ログ収集・検索・アラーム（ECS awslogs ドライバー経由） |
| Actuator | ヘルスチェック（ALB / CloudFront 用） |

Prometheus / Grafana 等の監視ツール導入は本ドキュメントのスコープ外。

---

## 2. ログ設計

### 2.1 ログフォーマット

#### 開発環境（`SPRING_PROFILES_ACTIVE` が `prod` 以外）

テキスト形式でコンソールに出力。視認性を優先。

```
10:23:45.123 INFO  [a3f2c1d4-...] [uid=42] c.r.filter.RequestLoggingFilter - HTTP POST /api/posts 245ms status=201
```

#### 本番環境（`SPRING_PROFILES_ACTIVE=prod`）

JSON 形式でコンソール（標準出力）に出力。ECS Fargate では awslogs ドライバーが自動的に CloudWatch Logs へ収集する（ファイル出力は不要）。

```json
{
  "@timestamp": "2026-05-08T10:23:45.123Z",
  "level": "INFO",
  "message": "HTTP POST /api/posts 245ms status=201",
  "logger": "com.raisetimeline.filter.RequestLoggingFilter",
  "thread": "http-nio-8080-exec-1",
  "service": "raisetimeline-backend",
  "env": "prod",
  "correlationId": "a3f2c1d4-8b3e-4f2a-9c1d-e5f6a7b8c9d0",
  "userId": "42",
  "method": "POST",
  "path": "/api/posts",
  "clientIp": "203.0.113.1"
}
```

### 2.2 ログレベル定義

| レベル | 出力基準 | 代表的なケース |
| --- | --- | --- |
| **ERROR** | 即時調査が必要な障害 | 5xx レスポンス、DB 接続エラー、S3 アップロード失敗、未捕捉例外 |
| **WARN** | 問題の予兆・異常な利用パターン | 4xx レスポンス、JWT 認証失敗、権限エラー、重複登録、ユーザー不在 |
| **INFO** | 正常な業務イベント | リクエスト完了（2xx/3xx）、ファイル保存成功 |
| **DEBUG** | 開発時のみ（本番では出力しない） | JWT 認証成功詳細、バリデーションエラー詳細、SQL クエリ |

### 2.3 MDC フィールド定義

すべてのログに自動付与されるフィールド（`RequestLoggingFilter` が設定）:

| フィールド | 設定タイミング | 内容 | 例 |
| --- | --- | --- | --- |
| `correlationId` | リクエスト受信時 | リクエスト追跡 UUID。フロントから `X-Correlation-ID` ヘッダーが来た場合はその値を使用 | `a3f2c1d4-...` |
| `method` | リクエスト受信時 | HTTP メソッド | `POST` |
| `path` | リクエスト受信時 | リクエストパス | `/api/posts` |
| `clientIp` | リクエスト受信時 | ALB の `X-Forwarded-For` から取得した実クライアント IP | `203.0.113.1` |
| `userId` | レスポンス返却後 | 認証済みユーザーの ID（未認証リクエストでは付与されない） | `42` |

`correlationId` はレスポンスヘッダー `X-Correlation-ID` にも付与する。フロントエンドのエラーログとバックエンドのアクセスログを同じ ID で突き合わせることができる。

### 2.4 機密情報の取り扱い

以下の情報は **絶対にログに出力しない**:

- パスワード・パスワードハッシュ
- JWT トークン（アクセストークン・リフレッシュトークン）
- AWS アクセスキー・シークレットキー
- メールアドレス（認証失敗時も含む）

---

## 3. 監視設計

### 3.1 監視閾値

| 監視項目 | 警告（WARN） | 危険（CRITICAL） | 測定元 |
| --- | --- | --- | --- |
| API レスポンスタイム（p95） | > 1,000ms | > 3,000ms | `RequestLoggingFilter` の `durationMs` |
| 5xx エラー率（5分間） | > 1% | > 5% | ERROR ログ件数 / 全リクエスト件数 |
| JWT 認証失敗数 | > 10件/分 | > 50件/分 | WARN ログ `Authentication failed - bad credentials` |
| DB 接続エラー | > 1件/5分 | 3件連続 | ERROR ログの `DataAccessException` 件数 |
| S3 アップロード失敗 | > 3件/10分 | > 10件/10分 | ERROR ログ `Failed to upload to S3` |
| JVM ヒープ使用率 | > 80% | > 90% | Actuator `/actuator/metrics/jvm.memory.used` |
| RDS CPU 使用率 | > 70% | > 90% | CloudWatch RDS メトリクス |
| ECS タスク CPU 使用率 | > 70% | > 90% | CloudWatch ECS メトリクス（CPUUtilization） |
| ECS タスクメモリ使用率 | > 80% | > 90% | CloudWatch ECS メトリクス（MemoryUtilization） |

### 3.2 アラート優先度

| 優先度 | 対象 | 対応目安 |
| --- | --- | --- |
| P1 (即時対応) | 5xx エラー率 CRITICAL / DB 接続失敗 3件連続 | 15分以内 |
| P2 (1時間以内) | JWT 認証失敗 CRITICAL / S3 失敗 CRITICAL | 1時間以内 |
| P3 (翌営業日) | WARN レベルの各閾値超過 | 翌営業日中 |

---

## 4. 障害対応フロー

### 4.1 検知

CloudWatch アラーム → SNS トピック → メール通知

アラームメールには以下が含まれる:
- アラーム名（例: `RaiseTimeLine-5xx-Error-Rate-Critical`）
- 状態変更時刻
- CloudWatch コンソールへのリンク

### 4.2 初期確認（5分以内）

**Step 1: アプリの死活確認**

```bash
curl -s https://api.example.com/actuator/health | jq .
# 期待値: {"status":"UP"}
# 異常時: {"status":"DOWN", "components": {...}}
```

**Step 2: エラーログの確認（CloudWatch Logs Insights）**

```
fields @timestamp, message, correlationId, path, userId
| filter level = "ERROR"
| sort @timestamp desc
| limit 20
```

### 4.3 切り分け

| パターン | 症状 | 次のアクション |
| --- | --- | --- |
| A | 5xx + `DataAccessException` ログ | RDS コンソールでエラーログ・接続数を確認 |
| B | 5xx + `Failed to upload to S3` ログ | AWS Service Health Dashboard で S3 障害を確認 |
| C | 5xx + その他の未捕捉例外 | `correlationId` でログを追跡しスタックトレースを確認 |
| D | レスポンスタイム悪化のみ | ECS タスク / RDS の CPU・メモリ使用率を確認 |
| E | JWT 認証失敗の急増 | 特定 IP からのブルートフォース攻撃の可能性。IP ごとの件数を確認 |

### 4.4 対応

**ログレベルの動的変更**（障害調査中に一時的に DEBUG に変更する場合）:

> ⚠️ **注意**: `loggers` エンドポイントを使用するには `application.yml` の `management.endpoints.web.exposure.include` に `loggers` を追加して再デプロイが必要。

```bash
# DEBUG に変更
curl -X POST https://api.example.com/actuator/loggers/com.raisetimeline \
     -H "Content-Type: application/json" \
     -d '{"configuredLevel":"DEBUG"}'

# 調査後 INFO に戻す
curl -X POST https://api.example.com/actuator/loggers/com.raisetimeline \
     -H "Content-Type: application/json" \
     -d '{"configuredLevel":"INFO"}'
```

**ECS タスク強制再起動**（コンテナ再起動が必要な場合）:

```bash
aws ecs update-service \
  --cluster raisetimeline-cluster \
  --service raisetimeline-backend \
  --force-new-deployment \
  --region ap-northeast-1
```

### 4.5 復旧確認

1. エラー率が正常値（< 0.1%）に戻ることを確認
2. レスポンスタイムが正常値（p95 < 500ms）に戻ることを確認
3. CloudWatch アラームが `OK` 状態に移行することを確認
4. `/actuator/health` が `{"status":"UP"}` を返すことを確認

### 4.6 振り返り（インシデント発生後 48時間以内）

以下を記録してドキュメントに残す:

- **影響範囲**: 発生時刻・復旧時刻・エラー件数・影響ユーザー数
- **根本原因**: 何が起きたか（技術的な詳細）
- **一時対応**: 復旧のためにとった行動
- **再発防止策**: 担当者・期日付きのアクションアイテム

---

## 5. AWS CloudWatch Logs 連携

### 5.1 ログ収集設定

ECS Fargate では `awslogs` ドライバーがコンテナの標準出力を直接 CloudWatch Logs へ転送する。EC2 の CloudWatch Agent は不要。

Terraform の ECS タスク定義（`infra/ecs.tf`）で以下のように設定済み:

```json
{
  "logConfiguration": {
    "logDriver": "awslogs",
    "options": {
      "awslogs-group": "/ecs/raisetimeline-backend",
      "awslogs-region": "ap-northeast-1",
      "awslogs-stream-prefix": "ecs"
    }
  }
}
```

ロググループ: `/ecs/raisetimeline-backend`（30日保持）

### 5.2 CloudWatch Logs Insights クエリ集

**5xx エラー一覧**:

```
fields @timestamp, message, correlationId, path, userId
| filter level = "ERROR" and message like /HTTP .* status=5/
| sort @timestamp desc
| limit 50
```

**JWT 認証失敗の IP 別集計**（ブルートフォース攻撃の検知）:

```
fields @timestamp, clientIp
| filter message like /Authentication failed/
| stats count() as failCount by clientIp
| sort failCount desc
| limit 10
```

**レスポンスタイム 3秒超のリクエスト**:

```
fields @timestamp, method, path, userId, message
| filter message like /HTTP / and message like /[3-9][0-9]{3,}ms/
| sort @timestamp desc
| limit 20
```

**correlationId によるリクエスト全体追跡**:

```
fields @timestamp, level, message, logger
| filter correlationId = "対象のcorrelationId"
| sort @timestamp asc
```

---

## 6. Actuator エンドポイント活用

| エンドポイント | 用途 | 認証 |
| --- | --- | --- |
| `GET /actuator/health` | 全体の死活確認 | 不要 |
| `GET /actuator/health/liveness` | JVM 生存確認 | 不要 |
| `GET /actuator/health/readiness` | DB 接続含む受付可否（ALB ヘルスチェックパスに設定） | 不要 |
| `GET /actuator/loggers/com.raisetimeline` | 現在のログレベル確認 | 要認証 |
| `POST /actuator/loggers/com.raisetimeline` | 動的ログレベル変更（障害調査時に使用） | 要認証 |

ALB ターゲットグループのヘルスチェックパス: `/actuator/health/readiness`

---

## 7. ローカル開発での確認方法

### correlationId の確認

```bash
curl -i http://localhost:8080/api/posts

# レスポンスヘッダーに X-Correlation-ID が付いていること
# X-Correlation-ID: a3f2c1d4-8b3e-4f2a-9c1d-e5f6a7b8c9d0
```

コンソールログに `[a3f2c1d4-...]` が付いていることを確認。

### WARN ログの確認

```bash
# 無効なトークンでアクセス（JWT 処理失敗の WARN が出る）
curl -H "Authorization: Bearer invalid.token.here" http://localhost:8080/api/posts

# 認証なしでアクセス（Unauthorized の WARN が出る）
curl http://localhost:8080/api/posts
```

### Actuator ヘルスチェックの確認

```bash
curl http://localhost:8080/actuator/health
# {"status":"UP"}

curl http://localhost:8080/actuator/health/readiness
# {"status":"UP"}
```

### 動的ログレベル変更の確認

> ⚠️ **前提**: `application.yml` で `management.endpoints.web.exposure.include` に `loggers` を追加している場合のみ有効。

```bash
# DEBUG に変更
curl -X POST http://localhost:8080/actuator/loggers/com.raisetimeline \
     -H "Content-Type: application/json" \
     -d '{"configuredLevel":"DEBUG"}'

# 変更後のリクエストで DEBUG ログが増えることを確認
curl -H "Authorization: Bearer <JWT_TOKEN>" http://localhost:8080/api/posts

# INFO に戻す
curl -X POST http://localhost:8080/actuator/loggers/com.raisetimeline \
     -H "Content-Type: application/json" \
     -d '{"configuredLevel":"INFO"}'
```
