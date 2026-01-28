#!/bin/bash

# Build script for deploying to AWS S3 + CloudFront
# Prerequisites: AWS CLI installed and configured

# Build the application
echo "Building application..."
npm run build

# Set your S3 bucket name and CloudFront distribution ID
S3_BUCKET="your-bucket-name"
CLOUDFRONT_DIST_ID="your-distribution-id"

# Sync to S3
echo "Deploying to S3..."
aws s3 sync dist/ s3://$S3_BUCKET --delete

# Invalidate CloudFront cache
echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DIST_ID --paths "/*"

echo "Deployment complete!"
