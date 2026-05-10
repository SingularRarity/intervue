#!/usr/bin/env bash
# ============================================================
# deploy.sh — build + push backend, sync frontend, invalidate CDN
# Usage: ./infra/scripts/deploy.sh [image-tag]
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TF_DIR="$REPO_ROOT/infra/terraform"

TAG="${1:-$(git -C "$REPO_ROOT" rev-parse --short HEAD)}"

echo "==> Reading Terraform outputs..."
cd "$TF_DIR"
AWS_REGION=$(terraform output -raw aws_region)
ECR_URL=$(terraform output -raw ecr_repository_url)
S3_BUCKET=$(terraform output -raw frontend_s3_bucket)
CF_ID=$(terraform output -raw cloudfront_distribution_id)
CLUSTER=$(terraform output -raw ecs_cluster_name)
SERVICE=$(terraform output -raw ecs_service_name)

echo "==> Logging into ECR..."
aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin "$ECR_URL"

echo "==> Building backend Docker image..."
cd "$REPO_ROOT"
docker build -t "$ECR_URL:$TAG" -t "$ECR_URL:latest" -f backend/Dockerfile backend/

echo "==> Pushing backend image ($TAG)..."
docker push "$ECR_URL:$TAG"
docker push "$ECR_URL:latest"

echo "==> Updating ECS task definition image tag in SSM..."
# ECS picks up the new image on the next deployment
aws ssm put-parameter \
  --region "$AWS_REGION" \
  --name "/intervue/prod/backend_image_tag" \
  --value "$TAG" \
  --type String \
  --overwrite || true

echo "==> Forcing ECS service deployment..."
aws ecs update-service \
  --region "$AWS_REGION" \
  --cluster "$CLUSTER" \
  --service "$SERVICE" \
  --force-new-deployment \
  --task-definition "$(aws ecs describe-services \
    --region "$AWS_REGION" \
    --cluster "$CLUSTER" \
    --services "$SERVICE" \
    --query 'services[0].taskDefinition' \
    --output text)" \
  > /dev/null

echo "==> Building React frontend..."
cd "$REPO_ROOT/frontend"
npm ci
npm run build

echo "==> Syncing frontend to S3..."
aws s3 sync dist/ "s3://$S3_BUCKET/" \
  --delete \
  --cache-control "public,max-age=31536000,immutable" \
  --exclude "index.html"

# index.html must not be cached so browsers always get the latest
aws s3 cp dist/index.html "s3://$S3_BUCKET/index.html" \
  --cache-control "no-cache,no-store,must-revalidate"

echo "==> Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id "$CF_ID" \
  --paths "/*" \
  > /dev/null

echo ""
echo "✓ Deploy complete — tag: $TAG"
echo "  Frontend: https://$(cd "$TF_DIR" && terraform output -raw cloudfront_url | sed 's|https://||')"
