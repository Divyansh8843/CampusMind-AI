module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = var.cluster_name
  cluster_version = "1.30"

  vpc_id                         = module.vpc.vpc_id
  subnet_ids                     = module.vpc.private_subnets
  cluster_endpoint_public_access = true

  # Managed Node Groups
  eks_managed_node_groups = {
    # Standard node group for the Node.js server
    standard_nodes = {
      min_size     = 2
      max_size     = 10
      desired_size = 2
      
      instance_types = ["m5.large", "m5a.large"]
      capacity_type  = "ON_DEMAND"
    }

    # Optional: GPU node group specifically for AI workloads
    # ai_gpu_nodes = {
    #   min_size     = 1
    #   max_size     = 5
    #   desired_size = 1
    #   instance_types = ["g4dn.xlarge"]
    #   capacity_type  = "SPOT" # Save costs on GPUs using Spot instances
    #   taints = {
    #     dedicated = {
    #       key    = "dedicated"
    #       value  = "gpu"
    #       effect = "NO_SCHEDULE"
    #     }
    #   }
    # }
  }

  manage_aws_auth_configmap = true

  tags = {
    Environment = var.environment
  }
}
