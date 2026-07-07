# Generate a unique bucket name since S3 bucket names must be globally unique
resource "random_string" "bucket_suffix" {
  length  = 6
  special = false
  upper   = false
}

# 1. Private S3 Bucket to hold the React SPA files
resource "aws_s3_bucket" "frontend_bucket" {
  bucket        = "campusmind-frontend-${random_string.bucket_suffix.result}"
  force_destroy = true # Allows terraform destroy to delete the bucket even if it has files
}

# Block all public access at the bucket level (CloudFront will bypass this securely via OAC)
resource "aws_s3_bucket_public_access_block" "frontend_bucket_pab" {
  bucket                  = aws_s3_bucket.frontend_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# 2. CloudFront Origin Access Control (The modern, secure way to connect CF to S3)
resource "aws_cloudfront_origin_access_control" "frontend_oac" {
  name                              = "campusmind-frontend-oac"
  description                       = "OAC for CampusMind React Frontend"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# 3. CloudFront Distribution (The Global CDN)
resource "aws_cloudfront_distribution" "frontend_cdn" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100" # Use only NA and Europe edges to save costs for a beginner

  origin {
    domain_name              = aws_s3_bucket.frontend_bucket.bucket_regional_domain_name
    origin_id                = aws_s3_bucket.frontend_bucket.id
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend_oac.id
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = aws_s3_bucket.frontend_bucket.id

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  # React SPA Routing Rule: If a user visits /dashboard directly, S3 throws a 403 or 404. 
  # We must catch these and return index.html with a 200 OK so React Router can handle the route.
  custom_error_response {
    error_caching_min_ttl = 300
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
  }
  
  custom_error_response {
    error_caching_min_ttl = 300
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

# 4. S3 Bucket Policy allowing ONLY the CloudFront distribution to read files
data "aws_iam_policy_document" "frontend_bucket_policy" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.frontend_bucket.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.frontend_cdn.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "frontend_bucket_policy_attachment" {
  bucket = aws_s3_bucket.frontend_bucket.id
  policy = data.aws_iam_policy_document.frontend_bucket_policy.json
}
