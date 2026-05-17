terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Uncomment after bootstrapping state backend (see scripts/bootstrap-state.sh):
  # backend "s3" {
  #   bucket         = "intervue-terraform-state-<account-id>"
  #   key            = "production/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "intervue-terraform-locks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

# CloudFront requires ACM certs in us-east-1 regardless of main region
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = local.common_tags
  }
}

locals {
  name_prefix = "${var.app_name}-${var.environment}"

  common_tags = {
    Project     = var.app_name
    Environment = var.environment
    ManagedBy   = "terraform"
    Repository  = "SingularRarityLabs/AI-Interview-Platform"
  }

  # Backend container env — non-sensitive values only; secrets come from SSM
  backend_env = {
    PORT         = tostring(var.backend_port)
    APP_ENV      = var.environment == "prod" ? "production" : "development"
    RUST_LOG     = var.environment == "prod" ? "ai_interview_platform=info,tower_http=warn" : "ai_interview_platform=debug,tower_http=debug"
    LLM_PROVIDER = "groq"
    # CORS allowlist — REQUIRED in production (the backend blocks all CORS if unset
    # when APP_ENV=production). Covers the CloudFront domain and, when configured,
    # the custom domain.
    CORS_ALLOWED_ORIGINS = join(",", compact([
      "https://${aws_cloudfront_distribution.frontend.domain_name}",
      var.domain_name != "" ? "https://${var.subdomain}.${var.domain_name}" : "",
    ]))
  }
}

# 256-bit master key for field-level encryption of tenant API keys (C3).
# Generated once and stored in TF state + SSM. Rotating it requires re-saving
# every tenant's keys, so treat it as durable.
resource "random_id" "encryption_key" {
  byte_length = 32
}
