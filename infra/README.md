# Intervue AWS Infrastructure

Terraform configs for deploying Intervue to AWS. Estimated cost: **~$51/month** at minimal load.

## Architecture

```
Users → CloudFront (PriceClass_100) → /api/* + /ws/* → ALB → ECS Fargate SPOT
                                    → /*             → S3 (React SPA)
ECS tasks → RDS PostgreSQL (private subnet)
          → ElastiCache Redis (private subnet)
          → Anthropic / Sarvam APIs (public internet via task public IP)
```

**Cost optimizations applied:**
- No NAT Gateway (saves ~$32/month) — ECS tasks in public subnets with restricted SG
- FARGATE_SPOT always — saves ~70% vs on-demand
- CloudFront PriceClass_100 (US + Europe PoPs only)
- Single RDS AZ (not multi-AZ)
- Smallest viable instance sizes (db.t3.micro, cache.t3.micro)

**Region:** ap-south-1 (Mumbai) — good latency for India. ACM certificate must be in us-east-1 (CloudFront hard requirement — AWS mandates this globally).

## Prerequisites

- AWS CLI configured (`aws configure`)
- Terraform >= 1.5
- Docker
- Node.js >= 18

## First-time setup

### 1. Bootstrap remote state

```bash
chmod +x infra/scripts/bootstrap-state.sh
./infra/scripts/bootstrap-state.sh
```

Then uncomment the `backend "s3"` block in `infra/terraform/main.tf` and fill in the bucket name from the script output.

### 2. Create terraform.tfvars

```bash
cp infra/terraform/terraform.tfvars.example infra/terraform/terraform.tfvars
# edit infra/terraform/terraform.tfvars with your secrets
```

Minimum required variables:
```hcl
db_password         = "a-very-strong-password"
jwt_secret          = "at-least-32-random-characters-here"
platform_claude_key = "sk-ant-..."        # your Anthropic key
google_client_id    = "xxx.apps.googleusercontent.com"
google_client_secret = "GOCSPX-..."
```

### 3. Apply Terraform

```bash
cd infra/terraform
terraform init
terraform plan
terraform apply
```

First apply takes ~10-15 minutes (RDS, ElastiCache, CloudFront distribution).

### 4. Deploy the app

```bash
chmod +x infra/scripts/deploy.sh
./infra/scripts/deploy.sh
```

The deploy script:
1. Builds the Rust backend Docker image
2. Pushes to ECR
3. Forces a new ECS deployment
4. Builds the React frontend (`npm run build`)
5. Syncs to S3 with correct cache headers
6. Invalidates CloudFront

## Subsequent deployments

```bash
./infra/scripts/deploy.sh              # uses git short SHA as tag
./infra/scripts/deploy.sh v1.2.3       # explicit tag
```

## Custom domain (GoDaddy)

Domain: `intervue.singularraritylabs.com`

`terraform.tfvars` already has `domain_name = "singularraritylabs.com"` and `subdomain = "intervue"`.

**Two-step deploy for the first time:**

**Step 1** — apply without cert validation completing:
```bash
terraform apply -target=aws_acm_certificate.frontend -target=aws_cloudfront_distribution.frontend
terraform output dns_records_for_godaddy
```

**Step 2** — add both CNAMEs shown in output to GoDaddy:
- Go to GoDaddy → DNS → singularraritylabs.com → Add Record
- Record 1: CNAME for ACM validation (long `_xxxx` name)
- Record 2: CNAME `intervue` → CloudFront domain

Wait 5–15 minutes for propagation, then:
```bash
terraform apply   # ACM validation completes, CloudFront alias activates
```

After that, `./infra/scripts/deploy.sh` handles all future deploys with no DNS changes needed.

## Estimated monthly cost

| Service | Spec | Cost |
|---------|------|------|
| ALB | 1 ALB | ~$16 |
| ECS Fargate SPOT | 512 CPU / 1024 MB, 1 task | ~$5 |
| RDS PostgreSQL | db.t3.micro, single AZ | ~$15 |
| ElastiCache Redis | cache.t3.micro | ~$13 |
| CloudFront | PriceClass_100, low traffic | ~$1 |
| S3 + ECR | minimal storage | ~$1 |
| **Total** | | **~$51/month** |

Scales linearly — 3 ECS tasks adds ~$10/month on SPOT.

## Tearing down

```bash
cd infra/terraform
terraform destroy
```

Note: RDS final snapshot is disabled for non-prod (set `skip_final_snapshot = false` to keep a backup).
