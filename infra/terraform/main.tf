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
  }
}
