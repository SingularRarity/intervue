# ============================================================
# ECS — Fargate cluster + backend service
# ============================================================

resource "aws_ecs_cluster" "main" {
  name = "${local.name_prefix}-cluster"

  setting {
    name  = "containerInsights"
    value = var.environment == "prod" ? "enabled" : "disabled"
  }

  tags = { Name = "${local.name_prefix}-cluster" }
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = "FARGATE_SPOT" # Always use SPOT — saves ~70% vs on-demand
  }
}

# ---- Task Definition ----

resource "aws_ecs_task_definition" "backend" {
  family                   = "${local.name_prefix}-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.backend_cpu
  memory                   = var.backend_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = "${aws_ecr_repository.backend.repository_url}:${var.backend_image_tag}"
      essential = true

      portMappings = [
        {
          containerPort = var.backend_port
          protocol      = "tcp"
        }
      ]

      # Non-sensitive environment variables
      environment = [
        for k, v in local.backend_env : { name = k, value = v }
      ]

      # Sensitive values pulled from SSM at container start
      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = aws_ssm_parameter.database_url.arn
        },
        {
          name      = "JWT_SECRET"
          valueFrom = aws_ssm_parameter.jwt_secret.arn
        },
        {
          name      = "REDIS_URL"
          valueFrom = aws_ssm_parameter.redis_url.arn
        },
        {
          name      = "FRONTEND_URL"
          valueFrom = aws_ssm_parameter.frontend_url.arn
        },
        {
          name      = "BACKEND_URL"
          valueFrom = aws_ssm_parameter.backend_url.arn
        },
        {
          name      = "PLATFORM_GROQ_KEY"
          valueFrom = aws_ssm_parameter.platform_groq_key.arn
        },
        {
          name      = "PLATFORM_CLAUDE_KEY"
          valueFrom = aws_ssm_parameter.platform_claude_key.arn
        },
        {
          name      = "PLATFORM_SARVAM_KEY"
          valueFrom = aws_ssm_parameter.platform_sarvam_key.arn
        },
        {
          name      = "GOOGLE_CLIENT_ID"
          valueFrom = aws_ssm_parameter.google_client_id.arn
        },
        {
          name      = "GOOGLE_CLIENT_SECRET"
          valueFrom = aws_ssm_parameter.google_client_secret.arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.backend.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "backend"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:${var.backend_port}/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = { Name = "${local.name_prefix}-backend-task" }
}

# ---- ECS Service ----

resource "aws_ecs_service" "backend" {
  name                               = "${local.name_prefix}-backend"
  cluster                            = aws_ecs_cluster.main.id
  task_definition                    = aws_ecs_task_definition.backend.arn
  desired_count                      = var.backend_desired_count
  health_check_grace_period_seconds  = 120

  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true # No NAT Gateway — tasks get public IPs, SG restricts inbound to ALB only
  }

  load_balancer {
    target_group_arn = aws_alb_target_group.backend.arn
    container_name   = "backend"
    container_port   = var.backend_port
  }

  # Deployment circuit breaker — rolls back on failure
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  deployment_controller {
    type = "ECS"
  }

  depends_on = [
    aws_alb_listener.http,
    aws_iam_role_policy_attachment.ecs_execution_managed,
  ]

  tags = { Name = "${local.name_prefix}-backend-service" }

  # Ignore task_definition changes from outside Terraform (e.g., CI/CD deploys)
  lifecycle {
    ignore_changes = [task_definition, desired_count]
  }
}

# ---- Auto-scaling ----

resource "aws_appautoscaling_target" "backend" {
  max_capacity       = 10
  min_capacity       = var.backend_desired_count
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.backend.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "backend_cpu" {
  name               = "${local.name_prefix}-backend-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.backend.resource_id
  scalable_dimension = aws_appautoscaling_target.backend.scalable_dimension
  service_namespace  = aws_appautoscaling_target.backend.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}
