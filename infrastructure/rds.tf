# We are provisioning Amazon DocumentDB (MongoDB-compatible) instead of traditional RDS
# because the CampusMind server is built on MongoDB (Mongoose).

resource "aws_docdb_cluster" "campusmind_db" {
  cluster_identifier      = "campusmind-docdb-cluster"
  engine                  = "docdb"
  master_username         = var.db_username
  master_password         = var.db_password
  backup_retention_period = 7
  preferred_backup_window = "07:00-09:00"
  skip_final_snapshot     = true
  
  # Deploy into the isolated database subnets created in vpc.tf
  db_subnet_group_name    = module.vpc.database_subnet_group
  vpc_security_group_ids  = [aws_security_group.db_sg.id]
}

resource "aws_docdb_cluster_instance" "campusmind_db_instances" {
  count              = 2 # One primary, one read replica for high availability
  identifier         = "campusmind-docdb-instance-${count.index}"
  cluster_identifier = aws_docdb_cluster.campusmind_db.id
  instance_class     = "db.r5.large"
}

# Security group to only allow traffic from the EKS nodes
resource "aws_security_group" "db_sg" {
  name        = "campusmind-db-sg"
  description = "Allow inbound traffic from EKS worker nodes"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description     = "MongoDB access from EKS Private Subnets"
    from_port       = 27017
    to_port         = 27017
    protocol        = "tcp"
    cidr_blocks     = module.vpc.private_subnets_cidr_blocks
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
