# ============================================================
# Outputs — key values needed for deployment scripts
# ============================================================

output "cloudfront_url" {
  description = "Frontend URL — share this until you have a custom domain"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "app_url" {
  description = "Final app URL (custom domain if set, otherwise CloudFront)"
  value       = var.domain_name != "" ? "https://${var.subdomain}.${var.domain_name}" : "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "alb_dns" {
  description = "ALB DNS name (internal — accessed via CloudFront)"
  value       = aws_alb.backend.dns_name
}

output "ecr_repository_url" {
  description = "ECR repo URL — use this in your CI/CD pipeline"
  value       = aws_ecr_repository.backend.repository_url
}

output "frontend_s3_bucket" {
  description = "S3 bucket for React SPA — sync build output here"
  value       = aws_s3_bucket.frontend.bucket
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID — needed for cache invalidation"
  value       = aws_cloudfront_distribution.frontend.id
}

output "ecs_cluster_name" {
  description = "ECS cluster name — used by deploy script to force new deployment"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.backend.name
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint (VPC-internal only)"
  value       = aws_db_instance.main.address
  sensitive   = true
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint (VPC-internal only)"
  value       = aws_elasticache_cluster.main.cache_nodes[0].address
  sensitive   = true
}

output "aws_region" {
  description = "AWS region in use"
  value       = var.aws_region
}

output "dns_records_for_godaddy" {
  description = "Add these two records in GoDaddy DNS after first apply, then re-run terraform apply"
  value = var.domain_name != "" ? {
    step1_acm_validation = {
      type  = "CNAME"
      name  = tolist(aws_acm_certificate.frontend[0].domain_validation_options)[0].resource_record_name
      value = tolist(aws_acm_certificate.frontend[0].domain_validation_options)[0].resource_record_value
      ttl   = "600"
      note  = "Required for SSL certificate — add this first"
    }
    step2_app_subdomain = {
      type  = "CNAME"
      name  = "${var.subdomain}"
      value = aws_cloudfront_distribution.frontend.domain_name
      ttl   = "600"
      note  = "Points intervue.singularraritylabs.com → CloudFront"
    }
  } : null
}

output "estimated_monthly_cost" {
  description = "Rough cost estimate at minimal load (no NAT Gateway, FARGATE_SPOT)"
  value       = <<-EOT
    Estimated monthly cost (ap-south-1, 1 task, low traffic):
      ALB:                   ~$16
      ECS Fargate SPOT:      ~$5  (512 CPU / 1024 MB)
      RDS db.t3.micro:       ~$15
      ElastiCache t3.micro:  ~$13
      CloudFront:            ~$1  (low traffic)
      S3 + ECR:              ~$1
      ─────────────────────────────
      Total:                 ~$51/month
  EOT
}
