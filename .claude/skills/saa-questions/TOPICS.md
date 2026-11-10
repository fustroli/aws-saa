# Task statements and quotas

Quotas target a 350-question bank weighted like SAA-C03 (Secure 30%, Resilient 26%, High-performing 24%, Cost 20%). File stem in brackets.

## Design Secure Architectures: 105

- **1.1 Secure access to AWS resources** [`secure-1.1`]: 35
  IAM users, groups, roles and policies; least privilege; permission boundaries; MFA; root user protection; cross-account roles; resource-based policies (S3 bucket policies, KMS key policies); AWS Organizations, SCPs, Control Tower; IAM Identity Center and federation (SAML, OIDC); Amazon Cognito user pools vs identity pools; AWS STS.
- **1.2 Secure workloads and applications** [`secure-1.2`]: 40
  Security groups vs NACLs; public/private subnets; NAT gateways; VPC endpoints (gateway vs interface) and PrivateLink; AWS WAF; AWS Shield Standard/Advanced; AWS Network Firewall; Amazon GuardDuty, Inspector, Macie, Security Hub, Detective; Secrets Manager vs SSM Parameter Store; API Gateway authorizers; CloudFront origin access control; Systems Manager Session Manager instead of bastion hosts.
- **1.3 Data security controls** [`secure-1.3`]: 30
  KMS (AWS managed vs customer managed keys, key policies, rotation, multi-Region keys); CloudHSM; encryption at rest for S3, EBS, RDS (incl. encrypting an existing unencrypted DB), DynamoDB; encryption in transit and ACM; S3 Object Lock, Glacier Vault Lock; S3 Block Public Access; CloudTrail, AWS Config for compliance; AWS Backup vault lock; data classification and retention.

## Design Resilient Architectures: 91

- **2.1 Scalable and loosely coupled architectures** [`resilient-2.1`]: 46
  SQS (standard vs FIFO, visibility timeout, DLQ, long polling); SNS fan-out; EventBridge; Step Functions; API Gateway; Lambda (concurrency, async invocation, destinations); ECS/EKS on Fargate vs EC2; Auto Scaling (target tracking, step, scheduled, predictive, queue-based); ELB types (ALB, NLB, GWLB); stateless design with ElastiCache/DynamoDB sessions; Amazon MQ for lift-and-shift messaging; microservices decomposition.
- **2.2 Highly available and fault-tolerant architectures** [`resilient-2.2`]: 45
  Multi-AZ RDS vs read replicas; Aurora replicas, Aurora Global Database; DynamoDB global tables; RDS Proxy; Route 53 routing policies and health checks (failover, latency, weighted, geolocation); DR strategies (backup and restore, pilot light, warm standby, multi-site active-active) with RPO/RTO; S3 Cross-Region Replication; AWS Backup cross-Region; Elastic Disaster Recovery; EFS vs EBS for multi-AZ; immutable infrastructure; ASG across AZs.

## Design High-Performing Architectures: 84

- **3.1 High-performing storage** [`performant-3.1`]: 17
  S3 performance (prefixes, multipart upload, Transfer Acceleration, byte-range fetch); EBS gp3 vs io2 vs st1/sc1; instance store; EFS performance/throughput modes; FSx for Lustre (with S3), FSx for Windows File Server, FSx for NetApp ONTAP, FSx for OpenZFS; Storage Gateway types.
- **3.2 High-performing compute** [`performant-3.2`]: 17
  EC2 instance families; placement groups (cluster, spread, partition); Auto Scaling warm pools; Lambda memory/provisioned concurrency/SnapStart; Fargate vs EC2 for containers; AWS Batch; Amazon EMR; HPC with Elastic Fabric Adapter; Graviton.
- **3.3 High-performing databases** [`performant-3.3`]: 17
  RDS read replicas; Aurora (reader endpoint, Auto Scaling replicas, Serverless v2); DynamoDB (partition key design, DAX, on-demand vs provisioned); ElastiCache Redis vs Memcached, caching strategies (lazy loading, write-through); RDS Proxy connection pooling; choosing purpose-built databases (Neptune, Timestream, Keyspaces, DocumentDB, Redshift for OLAP).
- **3.4 High-performing network architectures** [`performant-3.4`]: 17
  CloudFront (caching, origins, Lambda@Edge/CloudFront Functions); Global Accelerator; Route 53 latency routing; Direct Connect (LAGs, Direct Connect gateway) vs Site-to-Site VPN, VPN over Direct Connect; Transit Gateway vs VPC peering; PrivateLink; enhanced networking and ENA.
- **3.5 Data ingestion and transformation** [`performant-3.5`]: 16
  Kinesis Data Streams vs Amazon Data Firehose; Amazon MSK; AWS Glue (crawlers, ETL, Data Catalog); Athena; Lake Formation; EMR; Redshift and Redshift Spectrum; QuickSight; DataSync vs Transfer Family vs Snow Family vs S3 Transfer Acceleration for migration; OpenSearch Service.

## Design Cost-Optimized Architectures: 70

- **4.1 Cost-optimized storage** [`cost-4.1`]: 18
  S3 storage classes and minimum durations; lifecycle policies; S3 Intelligent-Tiering; Glacier Instant/Flexible/Deep Archive retrieval options; EBS gp2→gp3, snapshot lifecycle (Data Lifecycle Manager), snapshot archive; EFS Infrequent Access; S3 Storage Lens; Requester Pays.
- **4.2 Cost-optimized compute** [`cost-4.2`]: 18
  On-Demand vs Reserved Instances vs Compute/EC2 Instance Savings Plans vs Spot (interruption handling, Spot Fleet, mixed-instances ASG); Dedicated Hosts vs Dedicated Instances (licensing); right-sizing with Compute Optimizer; Graviton; Lambda vs containers vs EC2 for intermittent load; Instance Scheduler for non-production.
- **4.3 Cost-optimized databases** [`cost-4.3`]: 17
  Aurora Serverless v2 vs provisioned; reserved DB instances; DynamoDB on-demand vs provisioned with auto scaling, Standard-IA table class, TTL; caching to cut read cost; RDS stop/start for dev; migrating commercial engines with DMS/SCT; Redshift pause/resume and RA3.
- **4.4 Cost-optimized network architectures** [`cost-4.4`]: 17
  NAT gateway vs gateway endpoints for S3/DynamoDB; inter-AZ and inter-Region data transfer; CloudFront to cut origin egress; Direct Connect vs VPN cost trade-off; Transit Gateway vs peering cost; VPC sharing; cost tools (Cost Explorer, Budgets, Cost and Usage Report, cost allocation tags, Trusted Advisor).
