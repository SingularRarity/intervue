# ============================================================
# RDS — PostgreSQL 16 in private subnets
# ============================================================

resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id
  tags       = { Name = "${local.name_prefix}-db-subnet-group" }
}

resource "aws_db_parameter_group" "postgres16" {
  name   = "${local.name_prefix}-pg16"
  family = "postgres16"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  tags = { Name = "${local.name_prefix}-pg16" }
}

resource "aws_db_instance" "main" {
  identifier = "${local.name_prefix}-postgres"

  engine         = "postgres"
  engine_version = "16.3"
  instance_class = var.db_instance_class

  allocated_storage     = var.db_storage_gb
  max_allocated_storage = var.db_storage_gb * 5 # auto-scaling up to 5x
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  parameter_group_name   = aws_db_parameter_group.postgres16.name

  publicly_accessible  = false
  multi_az             = var.environment == "prod"
  deletion_protection  = var.environment == "prod"
  skip_final_snapshot  = var.environment != "prod"
  copy_tags_to_snapshot = true

  final_snapshot_identifier = var.environment == "prod" ? "${local.name_prefix}-final-snapshot" : null

  backup_retention_period = var.environment == "prod" ? 7 : 1
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  performance_insights_enabled = var.environment == "prod"

  tags = { Name = "${local.name_prefix}-postgres" }
}

# Connection string stored in SSM (constructed here, not from a variable)
locals {
  database_url = "postgres://${var.db_username}:${var.db_password}@${aws_db_instance.main.address}:5432/${var.db_name}?sslmode=require"
}
