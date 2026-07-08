output "eks_cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_security_group_id" {
  description = "Security group ids attached to the cluster control plane"
  value       = module.eks.cluster_security_group_id
}

output "region" {
  description = "AWS region"
  value       = var.aws_region
}

output "docdb_endpoint" {
  description = "Connection endpoint for the Amazon DocumentDB (MongoDB compatible) cluster"
  value       = aws_docdb_cluster.campusmind_db.endpoint
}

output "docdb_port" {
  description = "Port for the Amazon DocumentDB cluster"
  value       = aws_docdb_cluster.campusmind_db.port
}

output "frontend_s3_bucket" {
  description = "The name of the S3 bucket holding the React frontend"
  value       = aws_s3_bucket.frontend_bucket.bucket
}

output "frontend_cloudfront_url" {
  description = "The global CloudFront CDN URL for the React frontend"
  value       = "https://${aws_cloudfront_distribution.frontend_cdn.domain_name}"
}

output "frontend_cloudfront_id" {
  description = "The exact ID of the CloudFront Distribution (Need this for GitHub Secrets AWS_CLOUDFRONT_ID)"
  value       = aws_cloudfront_distribution.frontend_cdn.id
}
