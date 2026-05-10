# ============================================================
# ElastiCache — Redis 7 in private subnets
# ============================================================

resource "aws_elasticache_subnet_group" "main" {
  name       = "${local.name_prefix}-redis-subnet-group"
  subnet_ids = aws_subnet.private[*].id
  tags       = { Name = "${local.name_prefix}-redis-subnet-group" }
}

resource "aws_elasticache_parameter_group" "redis7" {
  name   = "${local.name_prefix}-redis7"
  family = "redis7"

  tags = { Name = "${local.name_prefix}-redis7" }
}

resource "aws_elasticache_cluster" "main" {
  cluster_id           = "${local.name_prefix}-redis"
  engine               = "redis"
  engine_version       = "7.1"
  node_type            = var.redis_node_type
  num_cache_nodes      = 1
  parameter_group_name = aws_elasticache_parameter_group.redis7.name
  port                 = 6379

  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]

  snapshot_retention_limit = var.environment == "prod" ? 1 : 0
  snapshot_window          = "02:00-03:00"

  tags = { Name = "${local.name_prefix}-redis" }
}

locals {
  redis_url = "redis://${aws_elasticache_cluster.main.cache_nodes[0].address}:6379"
}
