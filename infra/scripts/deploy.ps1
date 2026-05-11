# ============================================================
# deploy.ps1 — build + push backend, sync frontend, invalidate CDN
# Usage: .\infra\scripts\deploy.ps1 [image-tag]
# ============================================================
param(
    [string]$Tag = ""
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot  = Resolve-Path "$ScriptDir\..\.."
$TfDir     = "$RepoRoot\infra\terraform"

if ($Tag -eq "") {
    $Tag = git -C $RepoRoot rev-parse --short HEAD
}

Write-Host "==> Reading Terraform outputs..."
Push-Location $TfDir
$AwsRegion   = terraform output -raw aws_region
$EcrUrl      = terraform output -raw ecr_repository_url
$S3Bucket    = terraform output -raw frontend_s3_bucket
$CfId        = terraform output -raw cloudfront_distribution_id
$Cluster     = terraform output -raw ecs_cluster_name
$Service     = terraform output -raw ecs_service_name
Pop-Location

Write-Host "==> Logging into ECR..."
# Login needs the registry root only, not the full repo path
$EcrRegistry = $EcrUrl.Split('/')[0]
$LoginPw = aws ecr get-login-password --region $AwsRegion
$LoginPw | docker login --username AWS --password-stdin $EcrRegistry

Write-Host "==> Building backend Docker image (tag: $Tag)..."
docker build -t "${EcrUrl}:${Tag}" -t "${EcrUrl}:latest" -f "$RepoRoot\backend\Dockerfile" "$RepoRoot\backend"

Write-Host "==> Pushing backend image..."
docker push "${EcrUrl}:${Tag}"
docker push "${EcrUrl}:latest"

Write-Host "==> Forcing ECS service deployment..."
$TaskDef = aws ecs describe-services `
    --region $AwsRegion `
    --cluster $Cluster `
    --services $Service `
    --query "services[0].taskDefinition" `
    --output text

aws ecs update-service `
    --region $AwsRegion `
    --cluster $Cluster `
    --service $Service `
    --force-new-deployment `
    --task-definition $TaskDef | Out-Null

Write-Host "==> Building React frontend..."
Push-Location "$RepoRoot\frontend"
npm install
npx tsc --noEmit
npx vite build
Pop-Location

Write-Host "==> Syncing frontend to S3..."
aws s3 sync "$RepoRoot\frontend\dist\" "s3://$S3Bucket/" `
    --delete `
    --cache-control "public,max-age=31536000,immutable" `
    --exclude "index.html"

aws s3 cp "$RepoRoot\frontend\dist\index.html" "s3://$S3Bucket/index.html" `
    --cache-control "no-cache,no-store,must-revalidate"

Write-Host "==> Invalidating CloudFront cache..."
aws cloudfront create-invalidation `
    --distribution-id $CfId `
    --paths "/*" | Out-Null

Write-Host ""
Write-Host "Deploy complete -- tag: $Tag"
Write-Host "  URL: https://intervue.singularraritylabs.com"
