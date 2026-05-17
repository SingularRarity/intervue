# ============================================================
# SSM Parameter Store — secrets injected into ECS at runtime
# ============================================================

locals {
  ssm_prefix = "/intervue/${var.environment}"
}

resource "aws_ssm_parameter" "database_url" {
  name        = "${local.ssm_prefix}/database_url"
  description = "PostgreSQL connection string"
  type        = "SecureString"
  value       = local.database_url
  tags        = { Name = "database_url" }
}

resource "aws_ssm_parameter" "jwt_secret" {
  name        = "${local.ssm_prefix}/jwt_secret"
  description = "JWT signing secret"
  type        = "SecureString"
  value       = var.jwt_secret
  tags        = { Name = "jwt_secret" }
}

resource "aws_ssm_parameter" "redis_url" {
  name        = "${local.ssm_prefix}/redis_url"
  description = "Redis connection URL"
  type        = "String"
  value       = local.redis_url
  tags        = { Name = "redis_url" }
}

resource "aws_ssm_parameter" "frontend_url" {
  name        = "${local.ssm_prefix}/frontend_url"
  description = "Public frontend URL (CloudFront or custom domain)"
  type        = "String"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
  tags        = { Name = "frontend_url" }
}

resource "aws_ssm_parameter" "backend_url" {
  name        = "${local.ssm_prefix}/backend_url"
  description = "Internal ALB URL (used by the backend for self-reference)"
  type        = "String"
  value       = "http://${aws_alb.backend.dns_name}"
  tags        = { Name = "backend_url" }
}

resource "aws_ssm_parameter" "platform_groq_key" {
  name        = "${local.ssm_prefix}/platform_groq_key"
  description = "Groq API key - platform managed tenants (default LLM)"
  type        = "SecureString"
  value       = var.platform_groq_key != "" ? var.platform_groq_key : "REPLACE_ME"
  tags        = { Name = "platform_groq_key" }
}

resource "aws_ssm_parameter" "platform_claude_key" {
  name        = "${local.ssm_prefix}/platform_claude_key"
  description = "Anthropic API key - platform managed tenants (fallback)"
  type        = "SecureString"
  value       = var.platform_claude_key != "" ? var.platform_claude_key : "REPLACE_ME"
  tags        = { Name = "platform_claude_key" }
}

resource "aws_ssm_parameter" "platform_sarvam_key" {
  name        = "${local.ssm_prefix}/platform_sarvam_key"
  description = "Sarvam AI key — platform managed tenants"
  type        = "SecureString"
  value       = var.platform_sarvam_key != "" ? var.platform_sarvam_key : "REPLACE_ME"
  tags        = { Name = "platform_sarvam_key" }
}

resource "aws_ssm_parameter" "google_client_id" {
  name        = "${local.ssm_prefix}/google_client_id"
  description = "Google OAuth client ID"
  type        = "String"
  value       = var.google_client_id != "" ? var.google_client_id : "REPLACE_ME"
  tags        = { Name = "google_client_id" }
}

resource "aws_ssm_parameter" "google_client_secret" {
  name        = "${local.ssm_prefix}/google_client_secret"
  description = "Google OAuth client secret"
  type        = "SecureString"
  value       = var.google_client_secret != "" ? var.google_client_secret : "REPLACE_ME"
  tags        = { Name = "google_client_secret" }
}

resource "aws_ssm_parameter" "encryption_key" {
  name        = "${local.ssm_prefix}/encryption_key"
  description = "AES-256-GCM master key for tenant API key encryption at rest (C3)"
  type        = "SecureString"
  value       = random_id.encryption_key.hex
  tags        = { Name = "encryption_key" }

  # Never overwrite a live key — rotating it orphans every encrypted value.
  lifecycle {
    ignore_changes = [value]
  }
}
