variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "ap-south-1" # Mumbai — good latency for India-based HR teams
}

variable "app_name" {
  description = "Application name used in resource naming"
  type        = string
  default     = "intervue"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "prod"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod"
  }
}

# ---- Networking ----

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "AZs to use — must be in the chosen region"
  type        = list(string)
  default     = ["ap-south-1a", "ap-south-1b"]
}

variable "public_subnet_cidrs" {
  description = "Public subnet CIDRs (one per AZ)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "Private subnet CIDRs (one per AZ)"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

# ---- Application ----

variable "backend_port" {
  description = "Port the Rust backend listens on"
  type        = number
  default     = 8080
}

variable "backend_cpu" {
  description = "ECS task CPU units (1024 = 1 vCPU)"
  type        = number
  default     = 512
}

variable "backend_memory" {
  description = "ECS task memory in MB"
  type        = number
  default     = 1024
}

variable "backend_desired_count" {
  description = "Number of ECS backend task replicas"
  type        = number
  default     = 1
}

variable "backend_image_tag" {
  description = "Docker image tag to deploy (updated by CI/CD)"
  type        = string
  default     = "latest"
}

# ---- Database ----

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "ai_interview"
}

variable "db_username" {
  description = "PostgreSQL master username"
  type        = string
  default     = "intervue"
}

variable "db_password" {
  description = "PostgreSQL master password — store in tfvars, never commit"
  type        = string
  sensitive   = true
}

variable "db_storage_gb" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

# ---- Cache ----

variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t3.micro"
}

# ---- Secrets (stored in SSM, injected into ECS) ----

variable "jwt_secret" {
  description = "JWT signing secret — at least 32 random characters"
  type        = string
  sensitive   = true
}

variable "platform_claude_key" {
  description = "Anthropic API key for platform-managed tenants (free/individual plan)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "platform_sarvam_key" {
  description = "Sarvam AI API key for platform-managed tenants"
  type        = string
  sensitive   = true
  default     = ""
}

variable "google_client_id" {
  description = "Google OAuth client ID"
  type        = string
  default     = ""
}

variable "google_client_secret" {
  description = "Google OAuth client secret"
  type        = string
  sensitive   = true
  default     = ""
}

# ---- Domain (optional) ----

variable "domain_name" {
  description = "Custom domain name e.g. intervue.ai — leave empty to use CloudFront default"
  type        = string
  default     = ""
}
