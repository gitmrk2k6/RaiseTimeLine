output "cloudfront_domain" {
  value       = aws_cloudfront_distribution.main.domain_name
  description = "CloudFront ドメイン名（フロントエンド公開 URL）"
}

output "cloudfront_media_domain" {
  value       = aws_cloudfront_distribution.media.domain_name
  description = "CloudFront メディア配信ドメイン"
}

output "alb_dns_name" {
  value       = aws_lb.main.dns_name
  description = "ALB の DNS 名"
}

output "ecr_repository_url" {
  value       = aws_ecr_repository.backend.repository_url
  description = "ECR リポジトリ URL（backend イメージプッシュ先）"
}

output "rds_endpoint" {
  value       = aws_db_instance.main.address
  description = "RDS エンドポイント"
  sensitive   = true
}

output "frontend_bucket_name" {
  value       = aws_s3_bucket.frontend.bucket
  description = "フロントエンド静的ファイル用 S3 バケット名"
}

output "media_bucket_name" {
  value       = aws_s3_bucket.media.bucket
  description = "画像アップロード用 S3 バケット名"
}
