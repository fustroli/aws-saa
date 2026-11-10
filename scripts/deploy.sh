#!/usr/bin/env bash
# Builds the site and sync Lambda, deploys the CloudFormation stack, uploads the site.
#
# Usage:  npm run deploy
# Env:    STACK_NAME       (default: aws-saa)
#         AWS_REGION       (default: your CLI default region)
#         ARTIFACT_BUCKET  (default: <stack>-artifacts-<account>-<region>, created if missing)
#         AWS_PROFILE      (optional, standard AWS CLI)
set -euo pipefail

cd "$(dirname "$0")/.."

STACK_NAME="${STACK_NAME:-aws-saa}"
REGION="${AWS_REGION:-$(aws configure get region || true)}"
if [[ -z "$REGION" ]]; then
  echo "Set AWS_REGION or a default CLI region." >&2
  exit 1
fi
export AWS_REGION="$REGION"

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
ARTIFACT_BUCKET="${ARTIFACT_BUCKET:-${STACK_NAME}-artifacts-${ACCOUNT_ID}-${REGION}}"

echo "==> Stack $STACK_NAME in $REGION (account $ACCOUNT_ID)"

echo "==> Tests"
npm test --silent

echo "==> Build site and Lambda"
npm run build --silent
npm run build:lambda --silent

if ! aws s3api head-bucket --bucket "$ARTIFACT_BUCKET" 2>/dev/null; then
  echo "==> Create artifact bucket $ARTIFACT_BUCKET"
  if [[ "$REGION" == "us-east-1" ]]; then
    aws s3api create-bucket --bucket "$ARTIFACT_BUCKET" >/dev/null
  else
    aws s3api create-bucket --bucket "$ARTIFACT_BUCKET" \
      --create-bucket-configuration LocationConstraint="$REGION" >/dev/null
  fi
  aws s3api put-public-access-block --bucket "$ARTIFACT_BUCKET" --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
fi

echo "==> Package"
aws cloudformation package \
  --template-file infra/template.yaml \
  --s3-bucket "$ARTIFACT_BUCKET" \
  --s3-prefix "$STACK_NAME" \
  --output-template-file dist-infra/packaged.yaml >/dev/null

echo "==> Deploy stack (first run takes a few minutes for CloudFront)"
aws cloudformation deploy \
  --stack-name "$STACK_NAME" \
  --template-file dist-infra/packaged.yaml \
  --capabilities CAPABILITY_IAM \
  --no-fail-on-empty-changeset

output() {
  aws cloudformation describe-stacks --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text
}
SITE_BUCKET="$(output SiteBucketName)"
DISTRIBUTION_ID="$(output DistributionId)"
SITE_URL="$(output SiteUrl)"

echo "==> Upload site to $SITE_BUCKET"
# Hashed assets can be cached forever; index.html must always be revalidated.
aws s3 sync dist "s3://$SITE_BUCKET" --delete --exclude index.html \
  --cache-control "public,max-age=31536000,immutable"
aws s3 cp dist/index.html "s3://$SITE_BUCKET/index.html" \
  --cache-control "no-cache" --content-type "text/html; charset=utf-8"

echo "==> Invalidate CloudFront cache"
aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/index.html" "/" >/dev/null

echo "==> Done: $SITE_URL"
