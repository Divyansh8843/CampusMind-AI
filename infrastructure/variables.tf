variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (e.g., prod, staging, dev)"
  type        = string
  default     = "prod"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
  default     = "campusmind-eks-cluster"
}

variable "db_username" {
  description = "Username for the RDS PostgreSQL database"
  type        = string
  default     = "campusadmin"
}

variable "db_password" {
  description = "Password for the RDS PostgreSQL database (Use secrets manager in actual production)"
  type        = string
  sensitive   = true
  default     = "SuperSecretSecurePassword123!" 
}
