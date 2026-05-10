#!/usr/bin/env bash
# ============================================================
# bootstrap-state.sh — create S3 + DynamoDB for Terraform remote state
# Run ONCE before the first terraform init with remote backend.
# ============================================================
set -euo pipefail

REGION="${AWS_DEFAULT_REGION:-ap-south-1}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUCKET="intervue-tf-state-$ACCOUNT_ID"
TABLE="intervue-tf-locks"

echo "==> Creating Terraform state bucket: $BUCKET"
if aws s3api head-bucket --bucket "$BUCKET" 2>/dev/null; then
  echo "    Bucket already exists — skipping"
else
  aws s3api create-bucket \
    --bucket "$BUCKET" \
    --region "$REGION" \
    --create-bucket-configuration LocationConstraint="$REGION"

  aws s3api put-bucket-versioning \
    --bucket "$BUCKET" \
    --versioning-configuration Status=Enabled

  aws s3api put-bucket-encryption \
    --bucket "$BUCKET" \
    --server-side-encryption-configuration '{
      "Rules": [{
        "ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}
      }]
    }'

  aws s3api put-public-access-block \
    --bucket "$BUCKET" \
    --public-access-block-configuration \
      BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

  echo "    Bucket created"
fi

echo "==> Creating DynamoDB lock table: $TABLE"
if aws dynamodb describe-table --table-name "$TABLE" --region "$REGION" 2>/dev/null; then
  echo "    Table already exists — skipping"
else
  aws dynamodb create-table \
    --region "$REGION" \
    --table-name "$TABLE" \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    > /dev/null
  echo "    Table created"
fi

echo ""
echo "✓ Bootstrap complete. Add this backend block to main.tf:"
echo ""
echo '  backend "s3" {'
echo "    bucket         = \"$BUCKET\""
echo "    key            = \"prod/terraform.tfstate\""
echo "    region         = \"$REGION\""
echo "    dynamodb_table = \"$TABLE\""
echo "    encrypt        = true"
echo "  }"
