# Design Cost-Optimized Architectures

70 questions.

## Task 4.1

### cost-4.1-01

_Amazon S3, S3 Intelligent-Tiering_

A company stores 400 TB of user-generated media in Amazon S3 Standard. Most objects are larger than 1 MB. Analysis shows that some objects are popular for years while others are never read again after the first week, and the company cannot predict which objects will become popular. When an object is requested, it must be returned in milliseconds. The company wants to reduce storage cost without adding retrieval charges for popular objects.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Create an S3 Lifecycle rule that transitions all objects to S3 Standard-Infrequent Access 30 days after creation.
- **B.** Create an S3 Lifecycle rule that transitions all objects to S3 Glacier Flexible Retrieval 30 days after creation.
- **C.** Create an S3 Lifecycle rule that transitions all objects to S3 Intelligent-Tiering 0 days after creation.
- **D.** Create an S3 Lifecycle rule that transitions all objects to S3 One Zone-Infrequent Access 30 days after creation.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Standard-IA lowers storage cost, but every read incurs a per-GB retrieval charge. Objects that stay popular for years would generate ongoing retrieval fees, which the company wants to avoid.
- **B** ❌ Glacier Flexible Retrieval has low storage cost, but objects must be restored before they can be read, which takes minutes to hours. This does not meet the millisecond access requirement.
- **C** ✅ S3 Intelligent-Tiering moves each object between frequent, infrequent, and archive instant access tiers based on its own access pattern, with millisecond access and no retrieval charges. It suits unknown or changing access patterns.
- **D** ❌ One Zone-IA is cheaper than Standard-IA, but it charges retrieval fees on every read and stores data in a single Availability Zone, which reduces resilience for the user media.

S3 Intelligent-Tiering is the answer for unknown or unpredictable access patterns: it tiers each object automatically and charges no retrieval fees, only a small per-object monitoring fee. Standard-IA is cheaper only when you know objects will be read rarely.

</details>

### cost-4.1-02

_Amazon S3, S3 Lifecycle_

A data processing application writes about 5 TB of intermediate files to an Amazon S3 bucket every day. Downstream jobs read each file several times during the first 2 days. After 7 days, the files are never read again and are no longer needed. The company wants to minimize storage cost for the bucket.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Store the files in S3 Standard. Create an S3 Lifecycle rule that expires the objects 7 days after creation.
- **B.** Store the files in S3 Standard-Infrequent Access. Create an S3 Lifecycle rule that expires the objects 7 days after creation.
- **C.** Store the files in S3 Standard. Create an S3 Lifecycle rule that transitions the objects to S3 Glacier Instant Retrieval after 2 days and expires them after 7 days.
- **D.** Store the files in S3 Intelligent-Tiering. Create an S3 Lifecycle rule that expires the objects 7 days after creation.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ S3 Standard has no minimum storage duration and no retrieval fees, which suits files read several times in a short window. Expiring them at 7 days removes them as soon as they are no longer needed.
- **B** ❌ Standard-IA has a 30-day minimum storage duration, so objects deleted at 7 days are still billed for 30 days. Its retrieval fees also apply to the repeated reads in the first 2 days.
- **C** ❌ Glacier Instant Retrieval has a 90-day minimum storage duration. Objects deleted after 7 days are billed for the full 90 days, plus transition request charges, which costs more than keeping them in Standard.
- **D** ❌ Intelligent-Tiering moves objects to its infrequent tier only after 30 days without access, so it saves nothing for 7-day objects and adds a per-object monitoring fee.

Minimum storage durations matter for short-lived data: 30 days for Standard-IA and One Zone-IA, 90 days for Glacier Instant and Flexible Retrieval, and 180 days for Deep Archive. Data that lives only a few days is cheapest in S3 Standard with an expiration rule.

</details>

### cost-4.1-03

_Amazon S3, S3 Glacier Deep Archive, S3 Lifecycle_

An insurance company must retain scanned claim documents for 10 years after a claim closes. Closed-claim documents are read only when a regulator requests them, which happens a few times each year. The company has up to 5 business days to respond to each request. New documents are uploaded to Amazon S3 Standard and are actively used for 90 days.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Create an S3 Lifecycle rule that transitions the objects to S3 Standard-Infrequent Access after 90 days and expires them after 10 years.
- **B.** Create an S3 Lifecycle rule that transitions the objects to S3 Glacier Instant Retrieval after 90 days and expires them after 10 years.
- **C.** Create an S3 Lifecycle rule that transitions the objects to S3 Glacier Flexible Retrieval after 90 days and expires them after 10 years.
- **D.** Create an S3 Lifecycle rule that transitions the objects to S3 Glacier Deep Archive after 90 days and expires them after 10 years.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ Standard-IA provides millisecond access, which the company does not need, and its storage cost is many times that of the archive classes. It is not the most cost-effective option for a 5-day response window.
- **B** ❌ Glacier Instant Retrieval suits archives that need millisecond access. With days available to respond, the company pays more for storage than necessary.
- **C** ❌ Glacier Flexible Retrieval is cheaper than the instant-access classes, but its storage cost is higher than Deep Archive. Its faster retrieval options are not needed for a 5-day response window.
- **D** ✅ Glacier Deep Archive is the lowest-cost S3 storage class. Standard retrievals complete within 12 hours and bulk retrievals within 48 hours, both well within the 5-day window.

Match the archive class to the retrieval deadline: Glacier Instant Retrieval for milliseconds, Flexible Retrieval for minutes to hours, Deep Archive for 12 to 48 hours. When days are acceptable and data is kept for years, Deep Archive is the cheapest.

</details>

### cost-4.1-04

_Amazon S3, S3 Glacier Flexible Retrieval_

A research institute stores 200 TB of satellite imagery in the S3 Glacier Flexible Retrieval storage class. A new project needs the entire dataset available in Amazon S3 to start processing in 2 days. The institute wants to minimize the cost of the restore.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Restore the objects by using the Expedited retrieval option and purchase provisioned retrieval capacity.
- **B.** Restore the objects by using the Bulk retrieval option with S3 Batch Operations.
- **C.** Restore the objects by using the Standard retrieval option with S3 Batch Operations.
- **D.** Create an S3 Lifecycle rule that transitions the objects to S3 Glacier Instant Retrieval, then read them directly.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ Expedited retrievals return data in minutes but have the highest per-GB and per-request charges, and provisioned capacity adds a fixed cost. The 2-day deadline does not require this speed.
- **B** ✅ Bulk retrievals from Glacier Flexible Retrieval typically complete within 5 to 12 hours and have no per-GB retrieval charge. S3 Batch Operations can submit restore requests for every object, and the data is ready well within 2 days.
- **C** ❌ Standard retrievals finish in 3 to 5 hours (when started through S3 Batch Operations they begin within minutes), which also meets the deadline. However, they incur per-GB retrieval charges, so they cost more than free Bulk retrievals for 200 TB.
- **D** ❌ S3 Lifecycle cannot transition objects from Glacier Flexible Retrieval to Glacier Instant Retrieval. Objects in Flexible Retrieval must be restored before they can be accessed.

Glacier Flexible Retrieval offers Expedited (1 to 5 minutes), Standard (3 to 5 hours), and Bulk (5 to 12 hours, no per-GB retrieval fee). When the deadline allows hours, Bulk is the cheapest way to restore large datasets.

</details>

### cost-4.1-05

_Amazon EBS, Amazon EC2_

A company runs 300 Amazon EC2 instances, each with a 1 TB General Purpose SSD (gp2) EBS volume. Monitoring shows that each volume uses about 2,000 IOPS and 100 MiB/s of throughput at peak. The company wants to reduce EBS costs without reducing performance or stopping the instances.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Create a snapshot of each volume, create a gp3 volume from the snapshot, stop each instance, and swap the volumes.
- **B.** Modify each volume to Throughput Optimized HDD (st1) by using Elastic Volumes.
- **C.** Modify each volume to General Purpose SSD (gp3) by using Elastic Volumes while the instances keep running.
- **D.** Modify each volume to Provisioned IOPS SSD (io2) with 2,000 provisioned IOPS by using Elastic Volumes.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ This results in gp3 volumes, but it requires stopping each instance and managing snapshots and volume swaps for 300 instances. It has more operational overhead and causes downtime.
- **B** ❌ st1 is cheaper per GB but is designed for large sequential throughput and delivers low IOPS for small random I/O. It cannot be used as a boot volume and would reduce performance for these workloads.
- **C** ✅ gp3 costs about 20% less per GB than gp2 and includes a baseline of 3,000 IOPS and 125 MiB/s regardless of size, which covers the measured peaks. Elastic Volumes changes the type in place without detaching volumes or stopping instances.
- **D** ❌ io2 provides consistent IOPS with high durability, but it charges for both storage and provisioned IOPS. It costs more than gp2 and does not meet the cost-reduction goal.

Migrating gp2 to gp3 is a standard cost optimization: gp3 is cheaper per GB and decouples IOPS and throughput from volume size. Elastic Volumes performs the change online, so no snapshots or downtime are needed.

</details>

### cost-4.1-06

_Amazon EBS, Amazon Data Lifecycle Manager_

A company takes daily snapshots of 50 Amazon EBS volumes and must keep each daily snapshot for 14 days. For compliance, the company must also keep one snapshot of each volume per month for 7 years. Monthly snapshots are restored only during rare audits, and a restore time of up to 3 days is acceptable. The company wants to automate snapshot management and minimize storage cost.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Create an Amazon Data Lifecycle Manager policy with a daily schedule that retains 14 snapshots and a monthly schedule that moves snapshots to the EBS Snapshots Archive tier and retains them for 7 years.
- **B.** Create an Amazon Data Lifecycle Manager policy with a daily schedule that retains 14 snapshots and a monthly schedule that keeps snapshots in the standard tier for 7 years.
- **C.** Create an Amazon Data Lifecycle Manager policy for the daily snapshots. Export the monthly snapshots to an Amazon S3 bucket and use an S3 Lifecycle rule to transition them to S3 Glacier Deep Archive.
- **D.** Use a cron job on an Amazon EC2 instance that calls the EBS API to create snapshots and delete expired snapshots based on tags.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ Data Lifecycle Manager automates creation and deletion of snapshots on multiple schedules. EBS Snapshots Archive stores full snapshots at about 75% lower cost than the standard tier with restores within 72 hours, which fits rarely restored 7-year snapshots.
- **B** ❌ This automates retention, but monthly snapshots kept for 7 years in the standard snapshot tier cost more than in the archive tier. It is not the most cost-effective option given the 3-day restore tolerance.
- **C** ❌ EBS snapshots are stored by AWS and are not exposed as objects in a customer bucket, so they cannot be transitioned with S3 Lifecycle rules. Exporting volume data to S3 would require custom tooling and manual restores.
- **D** ❌ A custom script can manage snapshots, but the company must maintain the instance and code, and the snapshots remain in the standard tier. It is neither automated with a managed service nor the lowest cost.

Amazon Data Lifecycle Manager automates EBS snapshot schedules and retention, and it can move snapshots to EBS Snapshots Archive. The archive tier suits snapshots kept 90 days or more that are rarely restored and can tolerate a 24 to 72 hour restore.

</details>

### cost-4.1-07

_Amazon EFS_

A company uses an Amazon EFS file system that uses the Regional (multi-AZ) file system type to share 30 TB of project files across Amazon EC2 instances. Most files are not opened again 30 days after they are created. When an old project is reopened, its files are read repeatedly for several weeks. The files must remain accessible through the same file system paths and must stay resilient to the loss of an Availability Zone.

Which combination of steps will meet these requirements MOST cost-effectively? (Choose TWO.)

- **A.** Create a new EFS file system with the One Zone file system type and copy the project files to it.
- **B.** Configure an EFS lifecycle policy that transitions files to the Infrequent Access storage class after 30 days without access.
- **C.** Use AWS DataSync to move files older than 30 days to an S3 bucket in S3 Glacier Flexible Retrieval and delete them from the file system.
- **D.** Configure the EFS lifecycle policy to transition files back to the Standard storage class on their first access.
- **E.** Change the file system throughput mode from Bursting to Provisioned Throughput.

<details><summary>Answer</summary>

**Correct: B, D**

- **A** ❌ EFS One Zone stores data in a single Availability Zone. It reduces cost but does not meet the requirement to stay resilient to the loss of an Availability Zone.
- **B** ✅ EFS lifecycle management moves files that have not been accessed for the set period to the lower-cost Infrequent Access class. The files remain at the same paths and keep multi-AZ resilience.
- **C** ❌ This lowers storage cost, but the files would no longer be available through the file system paths, and reading them would require a restore. It changes how the application accesses data.
- **D** ✅ Moving a file back to Standard on first access stops repeated reads of a reopened project from incurring Infrequent Access per-GB read charges for weeks. This keeps cost low for both cold and reactivated files.
- **E** ❌ Provisioned Throughput adds a charge for throughput above the baseline. It does not reduce storage cost and does not address the access pattern.

EFS lifecycle management tiers files to Infrequent Access (and Archive) after a period without access, and can move them back to Standard on first access. Together these work like Intelligent-Tiering for EFS while keeping the Regional file system type.

</details>

### cost-4.1-08

_Amazon S3 Storage Lens, AWS Organizations, Amazon S3_

A company has 250 AWS accounts in AWS Organizations with more than 4,000 Amazon S3 buckets. The FinOps team wants a single view that shows storage growth trends, buckets that hold large amounts of incomplete multipart upload data or noncurrent versions, and buckets without lifecycle rules, across all accounts and Regions. The team wants to avoid building a custom reporting pipeline.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Enable S3 Inventory on every bucket in every account. Deliver the reports to a central bucket and query them with Amazon Athena.
- **B.** Use AWS Cost Explorer in the management account. Group S3 costs by linked account and usage type.
- **C.** Review the Amazon S3 checks in AWS Trusted Advisor for each account.
- **D.** Create an organization-level Amazon S3 Storage Lens dashboard from the management account or a delegated administrator account and enable advanced metrics.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ S3 Inventory lists objects and their metadata, but configuring it on 4,000 buckets and writing Athena queries and dashboards is a custom reporting pipeline. It has much more operational overhead.
- **B** ❌ Cost Explorer shows spending by account, service, and usage type. It does not show bucket-level details such as incomplete multipart upload bytes, noncurrent versions, or missing lifecycle rules.
- **C** ❌ Trusted Advisor includes a check for buckets without an incomplete multipart upload abort rule, but it does not report storage growth trends, noncurrent version bytes, or lifecycle rule coverage per bucket across the organization.
- **D** ✅ S3 Storage Lens aggregates storage usage and activity metrics across all accounts and Regions in an organization. It reports items such as incomplete multipart upload and noncurrent version bytes and gives cost optimization recommendations without custom tooling.

S3 Storage Lens is the organization-wide visibility tool for S3 storage usage and cost efficiency. Cost Explorer shows spend, and S3 Inventory lists objects per bucket; neither gives bucket-level optimization insight across an organization without extra work.

</details>

### cost-4.1-09

_Amazon S3, S3 Requester Pays_

A genomics research institute shares a 2 PB reference dataset in an Amazon S3 bucket with hundreds of research groups at other organizations. Every research group has its own AWS account. Today the groups download the data by assuming an IAM role in the institute's account that grants read access to the bucket. Data transfer and request charges for the downloads now exceed the institute's storage cost.

The institute wants to keep a single copy of the dataset and stop paying for the downloads.

Which solution will meet these requirements?

- **A.** Enable Requester Pays on the bucket. Keep the existing cross-account IAM role and require the research groups to include the x-amz-request-payer header.
- **B.** Enable Requester Pays on the bucket. Grant the research groups' own AWS accounts read access in the bucket policy and remove the shared IAM role.
- **C.** Create an Amazon CloudFront distribution in the institute's account in front of the bucket. Give each research group signed URLs for the objects it needs.
- **D.** Grant the research groups' AWS accounts read access in the bucket policy. Have each group copy the objects it needs into a bucket in its own account.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ With Requester Pays, the account that makes the request pays. When a requester assumes an IAM role, the account that owns the role is charged, so downloads through the institute's role are still billed to the institute.
- **B** ✅ Requests signed with each group's own credentials are billed to that group's account for requests and data transfer, while the institute pays only for storage. The data stays in one bucket.
- **C** ❌ CloudFront with signed URLs controls who can download, but the distribution owner pays for the data that CloudFront delivers. The institute would still pay for the downloads.
- **D** ❌ Without Requester Pays, the bucket owner still pays for the GET requests and any data transfer out of its bucket. The copies also create hundreds of extra copies of the dataset, which breaks the single-copy requirement.

S3 Requester Pays shifts request and download charges to the requester's AWS account, but the charge follows the credentials: if requesters assume a role owned by the bucket owner, the bucket owner still pays. Requesters must authenticate with their own accounts and acknowledge the charges with the x-amz-request-payer header; anonymous access is not supported.

</details>

### cost-4.1-10

_Amazon S3, S3 Lifecycle, S3 Versioning_

A company has an S3 Versioning-enabled bucket that stores application uploads. The application reads current objects frequently and needs millisecond access to them. S3 Storage Lens shows that 35% of the bucket's billed bytes are incomplete multipart uploads from clients that disconnect mid-upload, and another 40% are noncurrent object versions, some several years old. The company must keep the ability to recover an overwritten or deleted object for 30 days.

Which combination of actions will reduce storage cost the MOST while meeting this requirement? (Choose TWO.)

- **A.** Add an S3 Lifecycle rule that aborts incomplete multipart uploads 7 days after they are initiated.
- **B.** Suspend S3 Versioning on the bucket.
- **C.** Add an S3 Lifecycle rule that transitions current object versions to S3 Glacier Deep Archive after 1 day.
- **D.** Enable S3 Object Lock in governance mode with a 30-day default retention period.
- **E.** Add an S3 Lifecycle rule that permanently deletes noncurrent versions 30 days after they become noncurrent.

<details><summary>Answer</summary>

**Correct: A, E**

- **A** ✅ Parts of incomplete multipart uploads are billed as storage until the upload is completed or aborted. A lifecycle abort rule deletes these parts automatically and does not affect recovery of objects.
- **B** ❌ Suspending versioning keeps all existing noncurrent versions, so it does not remove the stored bytes. Later overwrites and deletes replace the null version permanently, so the 30-day recovery requirement would no longer be met.
- **C** ❌ This lowers storage price for current versions, but the application needs millisecond access to current objects, and Deep Archive objects must be restored over hours. It also does nothing about incomplete uploads or old noncurrent versions.
- **D** ❌ Object Lock prevents deletion or overwrite of versions during retention. It adds protection but does not remove any existing bytes, so it does not reduce storage cost.
- **E** ✅ A NoncurrentVersionExpiration action removes old versions after the 30-day recovery window. This deletes years of noncurrent bytes while preserving the required recovery period.

Two hidden S3 cost drivers are incomplete multipart upload parts and noncurrent versions in versioned buckets. Lifecycle rules handle both: AbortIncompleteMultipartUpload and NoncurrentVersionExpiration set to the required recovery window.

</details>

### cost-4.1-11

_Amazon S3, S3 One Zone-IA_

A photo sharing application stores original images in S3 Standard. The application also generates resized thumbnails of about 300 KB each, which it can regenerate from the originals at any time. Each thumbnail is requested about once a month, and it must be served in milliseconds when requested. The company wants to minimize the storage cost of the thumbnails.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Store the thumbnails in S3 Standard-Infrequent Access.
- **B.** Store the thumbnails in S3 Glacier Flexible Retrieval.
- **C.** Store the thumbnails in S3 One Zone-Infrequent Access.
- **D.** Store the thumbnails in S3 Intelligent-Tiering.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Standard-IA provides millisecond access for infrequently accessed data across multiple Availability Zones. It meets the access requirement but costs more than a single-AZ class, and the extra resilience is unnecessary for re-creatable data.
- **B** ❌ Glacier Flexible Retrieval has very low storage cost, but objects must be restored before access, which takes minutes to hours. It does not meet the millisecond requirement.
- **C** ✅ One Zone-IA costs about 20% less than Standard-IA and still provides millisecond access. Data is stored in one Availability Zone, which is acceptable because the thumbnails can be regenerated from the originals.
- **D** ❌ Intelligent-Tiering suits unknown access patterns. Here the pattern is known, and with monthly access the objects stay in tiers priced like Standard or Standard-IA while also incurring a per-object monitoring fee.

S3 One Zone-IA is the cheapest instant-access class for infrequently accessed data that is easy to re-create, such as thumbnails or transcoded media. Choose Standard-IA when the data must survive the loss of an Availability Zone.

</details>

### cost-4.1-12

_Amazon S3, S3 Glacier Instant Retrieval, S3 Lifecycle_

A hospital stores medical images in Amazon S3 Standard. Images are viewed frequently for 60 days after a scan. After that, each image is viewed about once each quarter, when a physician opens a patient's history, and the image must load in milliseconds. Images must be kept for 10 years.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Create an S3 Lifecycle rule that transitions images to S3 Glacier Instant Retrieval after 60 days and expires them after 10 years.
- **B.** Create an S3 Lifecycle rule that transitions images to S3 Standard-Infrequent Access after 60 days and expires them after 10 years.
- **C.** Create an S3 Lifecycle rule that transitions images to S3 Glacier Flexible Retrieval after 60 days and use Expedited retrievals when physicians open an image.
- **D.** Create an S3 Lifecycle rule that transitions images to S3 Glacier Deep Archive after 60 days and expires them after 10 years.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ Glacier Instant Retrieval offers millisecond access at a lower storage price than Standard-IA. It is designed for long-lived data that is accessed about once a quarter, which matches this pattern.
- **B** ❌ Standard-IA provides millisecond access, but its storage price is higher than Glacier Instant Retrieval. For data read about once a quarter, Glacier Instant Retrieval costs less overall.
- **C** ❌ Expedited retrievals take 1 to 5 minutes and add per-request and per-GB charges. They do not provide millisecond access.
- **D** ❌ Deep Archive has the lowest storage price, but retrievals take up to 12 hours or more. It cannot meet the millisecond access requirement.

S3 Glacier Instant Retrieval is for archive data that still needs millisecond access, typically read about once a quarter. Compared with Standard-IA it has lower storage cost and higher retrieval cost, so it wins when access is rare.

</details>

### cost-4.1-13

_Amazon S3, S3 Lifecycle_

A company stores application logs in Amazon S3 Standard. Logs are queried frequently for the first 30 days. Until they are 90 days old, they are then queried a few times for incident reviews, and those queries need millisecond access. After 90 days, logs are kept only for compliance until they are 7 years old, and retrieval within 48 hours is acceptable. Logs must then be deleted.

The company wants to manage the logs with a single S3 Lifecycle rule.

Which S3 Lifecycle rule will meet these requirements MOST cost-effectively?

- **A.** Transition objects to S3 Glacier Instant Retrieval after 30 days, to S3 Glacier Deep Archive after 90 days, and expire them after 2,555 days.
- **B.** Transition objects to S3 Glacier Flexible Retrieval after 30 days, to S3 Glacier Deep Archive after 90 days, and expire them after 2,555 days.
- **C.** Transition objects to S3 Standard-Infrequent Access after 30 days, to S3 Glacier Flexible Retrieval after 90 days, and expire them after 2,555 days.
- **D.** Transition objects to S3 Standard-Infrequent Access after 30 days, to S3 Glacier Deep Archive after 90 days, and expire them after 2,555 days.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ Glacier Instant Retrieval has a 90-day minimum storage duration, and a single lifecycle rule cannot transition objects out of a class before that minimum has passed. The Deep Archive transition would have to be at day 120 or later, so this rule is rejected as configured.
- **B** ❌ Glacier Flexible Retrieval requires a restore before objects can be read, which takes minutes to hours. It does not meet the millisecond access requirement for incident reviews before day 90.
- **C** ❌ This rule is valid and meets the access requirements, but Glacier Flexible Retrieval costs more to store than Deep Archive. The 48-hour retrieval tolerance allows the cheaper class for the 7-year compliance period.
- **D** ✅ Standard-IA keeps millisecond access for occasional reviews and satisfies its 30-day minimum before the day-90 transition. Deep Archive is the cheapest class for compliance data that can wait up to 48 hours, and the rule deletes the logs after 7 years.

Within one lifecycle rule, objects must stay in a class for its minimum storage duration before the next transition: 30 days for Standard-IA, 90 days for Glacier Instant Retrieval and Flexible Retrieval. A 60-day stay fits Standard-IA but not Glacier Instant Retrieval. Then choose the cheapest class whose retrieval time fits each phase: Deep Archive for 48-hour compliance retrieval.

</details>

### cost-4.1-14

_AWS Storage Gateway, Amazon S3, S3 Glacier Deep Archive_

A company backs up its on-premises servers with commercial backup software that writes to a physical tape library. Tapes are shipped weekly to an offsite vault, and the company must keep backups for 7 years. Restores of backups older than 1 month are rare and can take up to 2 days. The company wants to stop using physical tapes without changing its backup software workflow and wants to minimize storage cost.

Which solution will meet these requirements?

- **A.** Deploy an AWS Storage Gateway S3 File Gateway. Reconfigure the backup software to write backup files to an SMB share stored in S3 Standard.
- **B.** Deploy an AWS Storage Gateway Tape Gateway. Have the backup software write to virtual tapes and archive the tapes to S3 Glacier Deep Archive.
- **C.** Deploy an AWS Storage Gateway Volume Gateway in stored mode. Back up to the iSCSI volumes and keep EBS snapshots of the volumes for 7 years.
- **D.** Order an AWS Snowball Edge device each week. Copy the backups to the device and ship it to AWS for import into S3 Glacier Deep Archive.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ S3 File Gateway presents an NFS or SMB file share, so the backup jobs must be reconfigured from tape to disk targets. S3 Standard is also not the lowest-cost class for 7-year retention.
- **B** ✅ Tape Gateway presents a virtual tape library that existing backup software uses without workflow changes. Archived virtual tapes in S3 Glacier Deep Archive have the lowest storage cost and are retrieved within hours, which fits the 2-day restore window.
- **C** ❌ Volume Gateway presents iSCSI block volumes, so the backup jobs must be reconfigured away from tape, and snapshots kept for 7 years cost more than archived tapes in Deep Archive.
- **D** ❌ This still relies on weekly physical shipping and requires changing the backup workflow to copy data onto devices. It does not eliminate the physical media process.

Tape Gateway replaces physical tape libraries with virtual tapes that existing backup software recognizes, archiving them to S3 Glacier Flexible Retrieval or Deep Archive. Choose File Gateway for file shares and Volume Gateway for iSCSI block storage.

</details>

### cost-4.1-15

_Amazon EBS, Amazon EC2_

A company runs a log analytics cluster of Amazon EC2 instances. Each instance has a 14 TB data volume that the application reads and writes in large sequential blocks at a sustained 450 MiB/s. The volumes are not boot volumes, and the workload is not sensitive to I/O latency. The company currently uses General Purpose SSD (gp3) volumes with provisioned throughput and wants to reduce cost.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Keep the gp3 volumes and lower the provisioned IOPS to the 3,000 IOPS baseline.
- **B.** Change the data volumes to Cold HDD (sc1).
- **C.** Change the data volumes to Throughput Optimized HDD (st1).
- **D.** Change the data volumes to Provisioned IOPS SSD (io2) with enough IOPS for the workload.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ This can trim the IOPS charge, but gp3 storage still costs much more per GB than HDD volumes for 14 TB of sequential data. It is not the most cost-effective option.
- **B** ❌ sc1 has the lowest price per GB, but its throughput is capped at 250 MiB/s per volume. It cannot sustain the required 450 MiB/s.
- **C** ✅ st1 is designed for large sequential workloads such as log processing and supports up to 500 MiB/s per volume. A 14 TB volume has enough baseline throughput, and st1 costs far less per GB than gp3.
- **D** ❌ io2 is for latency-sensitive, IOPS-heavy workloads and charges for storage and provisioned IOPS. It costs more than gp3, not less.

For large, sequential, throughput-bound data that is not a boot volume, st1 is the cost-effective EBS choice. sc1 is cheaper but caps at 250 MiB/s and suits cold data; SSD types pay for IOPS performance the workload does not need.

</details>

### cost-4.1-16

_Amazon EFS_

A software company gives each development team an Amazon EFS file system that uses the Regional (multi-AZ) file system type. The development environments run in a single Availability Zone, the files are read and written throughout every workday, and all data can be re-created from source control and CI pipelines. The applications require a POSIX-compliant NFS file system. The company wants to reduce storage cost for these environments.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Create EFS One Zone file systems in the Availability Zone where the development environments run, and move the team data to them.
- **B.** Keep the Regional file systems and add a lifecycle policy that transitions files to Infrequent Access after 7 days without access.
- **C.** Replace the file systems with io2 EBS volumes that use Multi-Attach to share data between instances.
- **D.** Move the data to Amazon S3 Standard and mount the buckets on the instances with Mountpoint for Amazon S3.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ EFS One Zone stores data in a single Availability Zone at a significantly lower price than Regional file systems. Single-AZ resilience is acceptable because the data is re-creatable and the environments run in one AZ.
- **B** ❌ Files that are used every workday rarely go 7 days without access, so few would transition, and any reads from Infrequent Access add per-GB access charges. This saves little.
- **C** ❌ EBS Multi-Attach requires a cluster-aware file system and works only within one AZ for io1 and io2 volumes. io2 volumes are expensive, and this does not provide an NFS file system.
- **D** ❌ Mountpoint for Amazon S3 does not provide full POSIX semantics, such as in-place file edits and renames. It does not meet the requirement for a POSIX-compliant NFS file system.

EFS One Zone trades multi-AZ durability for a much lower price and fits dev/test or re-creatable data used in one AZ. EFS lifecycle tiering to Infrequent Access only helps data that is actually cold.

</details>

### cost-4.1-17

_Amazon S3, S3 Replication, S3 Glacier Deep Archive_

A financial company stores write-once trade records in an S3 bucket in us-east-1. A regulator requires a copy of every new record in a second AWS Region. The copy will be read only if us-east-1 becomes unavailable, and in that case the company may take up to 24 hours to access it. The company wants to minimize the cost of the second copy.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Configure S3 Same-Region Replication to a second bucket and set the destination storage class to S3 Glacier Deep Archive.
- **B.** Configure S3 Cross-Region Replication to a bucket in us-west-2 and set the destination storage class to S3 Standard-Infrequent Access.
- **C.** Run a nightly S3 Batch Operations job that copies new objects to a bucket in us-west-2 in S3 Standard.
- **D.** Configure S3 Cross-Region Replication to a bucket in us-west-2 and set the destination storage class to S3 Glacier Deep Archive.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ Same-Region Replication copies objects to a bucket in the same Region. It does not satisfy the regulatory requirement for a copy in a second Region.
- **B** ❌ This creates the required copy with instant access, but Standard-IA storage costs far more than an archive class. Instant access is not needed given the 24-hour tolerance.
- **C** ❌ Batch Operations can copy objects across Regions, but the company must manage the nightly job and its manifests, and S3 Standard is the most expensive storage class for a copy that is rarely read.
- **D** ✅ Cross-Region Replication can write replicas directly in a specified storage class. Deep Archive has the lowest storage cost, and standard retrievals complete within 12 hours, which fits the 24-hour tolerance.

S3 Replication lets you choose the destination storage class, so a rarely read DR or compliance copy can land directly in an archive class. Match the class to the access tolerance: here 24 hours allows Deep Archive.

</details>

### cost-4.1-18

_AWS Storage Gateway, Amazon S3_

A company's branch office has an on-premises NAS that serves an SMB file share to 200 Windows users. The share holds 80 TB and grows by 2 TB each month, and the NAS is almost full. Files older than 6 months are rarely opened, but users must still be able to open any file from the same share. Recently used files must open with low latency. The company wants to avoid buying more on-premises storage and to minimize cost.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Deploy an Amazon FSx for Windows File Server Multi-AZ file system with 100 TB of SSD storage, join it to the company's domain, and have users map the share over the WAN.
- **B.** Deploy an Amazon S3 File Gateway with an SMB share and a local cache. Add an S3 Lifecycle rule that transitions objects to S3 Standard-IA after 6 months.
- **C.** Deploy an AWS Storage Gateway Volume Gateway in cached mode and present iSCSI volumes to the users' workstations.
- **D.** Use AWS DataSync to move files older than 6 months to S3 Glacier Deep Archive and delete them from the NAS.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ FSx for Windows File Server provides a native SMB share, but 100 TB of SSD storage in a Multi-AZ file system costs much more than object storage for mostly cold files, and every access crosses the WAN without a local cache.
- **B** ✅ S3 File Gateway serves an SMB share backed by Amazon S3 and caches recently used data locally for low latency. Lifecycle tiering to Standard-IA lowers the cost of older files while they remain accessible through the share.
- **C** ❌ Volume Gateway presents iSCSI block volumes, not an SMB file share. Users could not keep using the same shared folder without adding and managing a Windows file server.
- **D** ❌ This frees NAS space cheaply, but moved files disappear from the share and must be restored over hours before use. Users could no longer open any file from the same share.

S3 File Gateway extends an on-premises SMB or NFS share into Amazon S3, with a local cache for hot data and S3 Lifecycle for cold data. Avoid lifecycle transitions to Glacier Flexible Retrieval or Deep Archive behind a file gateway, because those objects must be restored before the gateway can read them.

</details>

## Task 4.2

### cost-4.2-01

_EC2, Savings Plans, Fargate_

A company runs a steady 24/7 workload on 60 Amazon EC2 m6i instances in us-east-1. The usage will stay constant for at least 3 years. During the next 12 months, the company plans to move part of the workload to eu-west-1 and to migrate several services from EC2 to Amazon ECS on AWS Fargate.

The company wants to commit to a discount now without having to exchange or resell the commitment later.

Which purchasing option will meet these requirements MOST cost-effectively?

- **A.** Purchase EC2 Instance Savings Plans for the m6i instance family in us-east-1 with a 3-year term.
- **B.** Purchase Standard Reserved Instances for m6i instances in us-east-1 with a 3-year term.
- **C.** Purchase Compute Savings Plans with a 3-year term for the committed hourly spend.
- **D.** Purchase Convertible Reserved Instances for m6i instances in us-east-1 with a 3-year term.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ EC2 Instance Savings Plans give the deepest Savings Plans discount but are locked to one instance family in one Region. Usage that moves to eu-west-1 or to Fargate would no longer be covered.
- **B** ❌ Standard Reserved Instances apply only to EC2 in the purchased Region and cannot cover Fargate. The company would have to sell them on the Reserved Instance Marketplace after the move, which the company wants to avoid.
- **C** ✅ Compute Savings Plans apply automatically across instance families, Regions, operating systems, and to Fargate and Lambda usage. The commitment keeps applying after the Region and Fargate moves without any exchange.
- **D** ❌ Convertible Reserved Instances can be exchanged for other instance families, but only for EC2 in the same Region. They cannot cover Fargate, and changing them requires manual exchanges.

Compute Savings Plans are the only commitment that follows usage across Regions, instance families, and from EC2 to Fargate or Lambda. EC2 Instance Savings Plans and Reserved Instances give a higher or similar discount but are tied to one Region and to EC2. Remember: Compute Savings Plans trade a slightly smaller discount for the widest flexibility.

</details>

### cost-4.2-02

_EC2, Savings Plans, Reserved Instances_

A company runs 40 Amazon EC2 instances from the r6i family in a single AWS Region. The instances will run 24/7 for the next 3 years, and the company will stay in this Region and on this instance family. Over the term, the company will resize some instances within the family and will migrate several instances from Windows Server to Linux.

The company wants the largest discount that will continue to apply automatically after these changes.

Which purchasing option will meet these requirements MOST cost-effectively?

- **A.** Purchase EC2 Instance Savings Plans for the r6i family in the Region with a 3-year term.
- **B.** Purchase Compute Savings Plans with a 3-year term for the committed hourly spend.
- **C.** Purchase Regional Standard Reserved Instances for r6i Windows instances with a 3-year term.
- **D.** Purchase Zonal Standard Reserved Instances for r6i instances in each Availability Zone with a 3-year term.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ EC2 Instance Savings Plans apply automatically to any size, operating system, and tenancy within the chosen family and Region, and they give a larger discount than Compute Savings Plans. They meet every stated requirement.
- **B** ❌ Compute Savings Plans would cover all the changes, but they give a smaller discount than EC2 Instance Savings Plans. The company does not need cross-family or cross-Region flexibility, so it would pay for flexibility it will not use.
- **C** ❌ Regional Reserved Instances have size flexibility only for Linux/UNIX with default tenancy, and a Standard Reserved Instance cannot change its platform. After the migration to Linux, the Windows reservations would no longer apply.
- **D** ❌ Zonal Reserved Instances are tied to one instance size, platform, and Availability Zone, with no size flexibility. Resizing or changing the operating system would leave the reservations unused.

When the family and Region are fixed, EC2 Instance Savings Plans give the highest Savings Plans discount and still adjust automatically for size, OS, and tenancy changes. Compute Savings Plans cost more for flexibility that is not needed, and Reserved Instances do not follow an OS change. Match the commitment's flexibility to the changes the scenario actually describes.

</details>

### cost-4.2-03

_EC2, EC2 Auto Scaling, Spot Instances_

A company runs a nightly genomics batch workload that processes 20,000 independent samples. Each sample takes about 8 minutes on 4 vCPUs. The application writes results for each sample to Amazon S3 when it completes, and a failed sample can be retried. The full batch must finish by 6:00 AM, but the start time is flexible.

The workload runs well on any current-generation compute optimized or general purpose instance.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Create an Auto Scaling group that uses Spot Instances of a single instance type, c6i.xlarge, in one Availability Zone with the lowest-price allocation strategy.
- **B.** Create an Auto Scaling group of On-Demand c6i.xlarge Instances in multiple Availability Zones. Purchase a 1-year Compute Savings Plan that covers the group's peak usage.
- **C.** Run the workload on Dedicated Instances in an Auto Scaling group that scales on the number of remaining samples.
- **D.** Use a mixed instances policy with Spot Instances across c6i, c7i, m6i, and m7i sizes in multiple Availability Zones and the price-capacity-optimized strategy.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ Spot Instances are the cheapest fit for retryable work, but a single instance type in one Availability Zone is one capacity pool. A capacity shortage or wave of interruptions in that pool could stop the batch and miss the 6:00 AM deadline.
- **B** ❌ On-Demand capacity is reliable, but a Savings Plan sized for the nightly peak is billed every hour of the day, and the discounted rate is still far higher than Spot for retryable batch work.
- **C** ❌ Dedicated Instances run on single-tenant hardware and add a per-Region dedicated fee. Nothing in the scenario requires hardware isolation, so this adds cost without any benefit.
- **D** ✅ Diversifying across many instance types and Availability Zones gives Spot access to many capacity pools, and price-capacity-optimized picks pools that are both cheap and unlikely to be interrupted. Retryable per-sample work tolerates the occasional interruption.

Short, retryable batch tasks are the textbook Spot workload. The key to meeting a deadline on Spot is diversification across instance types and Availability Zones with an allocation strategy that weighs capacity. A single Spot pool is cheaper on paper but is the design that fails under interruptions.

</details>

### cost-4.2-04

_EC2 Auto Scaling, Spot Instances, Savings Plans_

A company runs a stateless web application on Amazon EC2 instances in an Auto Scaling group behind an Application Load Balancer. At least 6 instances are needed at all times to serve the minimum traffic level, and that minimum must never be interrupted. During business hours, the group scales up to 30 instances. The application can tolerate the loss of any instance above the minimum because the load balancer redistributes requests.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Purchase a Compute Savings Plan for all 30 instances. Use only On-Demand Instances in the Auto Scaling group.
- **B.** Configure a mixed instances policy with an On-Demand base capacity of 6 and 0% On-Demand above the base. Purchase a Savings Plan that covers the 6 base instances.
- **C.** Configure a mixed instances policy that uses Spot Instances for all capacity, including the minimum of 6 instances, across multiple instance types.
- **D.** Configure a mixed instances policy with an On-Demand base capacity of 6 and 100% On-Demand above the base. Purchase a Savings Plan that covers the 6 base instances.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ A Savings Plan sized for 30 instances is paid for every hour, but 24 of those instances run only during business hours. The commitment would be wasted for most of the day.
- **B** ✅ The 6 always-on instances are On-Demand and discounted by the Savings Plan, so the required minimum is never interrupted. Capacity above the base uses Spot, which suits interruption-tolerant scale-out capacity.
- **C** ❌ Using Spot for every instance is the cheapest option, but the 6 base instances could be interrupted. That breaks the requirement that the minimum capacity must never be interrupted.
- **D** ❌ This design protects the base capacity, but scale-out capacity stays On-Demand. Spot would cover the interruption-tolerant extra capacity at a much lower price.

A mixed instances policy separates the always-needed base, which gets On-Demand plus a commitment discount, from the elastic top, which gets Spot. Buy commitments only for the baseline that runs all the time, never for peak capacity. Options c and d differ from b only in how the base and the scale-out capacity are purchased.

</details>

### cost-4.2-05

_EC2 Auto Scaling, Spot Instances_

A company runs a fleet of stateless queue workers on Spot Instances in an Auto Scaling group that uses several instance types. When a Spot Instance is interrupted, the group launches a replacement only after the instance is terminated, so throughput drops for several minutes. Each worker needs about 90 seconds to finish its current message and stop cleanly.

The company wants to reduce the impact of interruptions without moving to On-Demand Instances.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Install a script on each instance that polls the instance metadata service every 5 seconds for an interruption notice and then launches a replacement instance by calling the EC2 API.
- **B.** Create an Amazon CloudWatch alarm on the CPUUtilization metric of the group. Add a step scaling policy that adds instances when CPU drops below 10%.
- **C.** Enable Capacity Rebalancing on the Auto Scaling group. Add a termination lifecycle hook so that each worker can finish its current message before the instance is terminated.
- **D.** Increase the group's desired capacity by 30% so that spare Spot Instances absorb interruptions.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Polling the metadata service does detect the 2-minute interruption notice. However, the company would have to build, deploy, and maintain custom replacement logic that Auto Scaling already provides.
- **B** ❌ Low CPU does not reliably indicate a Spot interruption, and the alarm would react only after capacity is lost. This approach does not launch replacements before interruptions happen.
- **C** ✅ Capacity Rebalancing launches a replacement Spot Instance when EC2 signals an elevated interruption risk, often before the 2-minute notice. The lifecycle hook gives each worker time to finish cleanly. Both are managed Auto Scaling features.
- **D** ❌ Permanent over-provisioning absorbs some interruptions but pays for 30% extra capacity all the time. It also does not let workers finish their messages cleanly.

Capacity Rebalancing reacts to the EC2 rebalance recommendation and launches a replacement proactively, and a lifecycle hook gives in-flight work time to drain. Custom metadata polling works but is undifferentiated operational work. Know the managed Spot features of Auto Scaling: mixed instances policy, allocation strategies, and Capacity Rebalancing.

</details>

### cost-4.2-06

_EC2, Dedicated Hosts, License Manager_

A company is migrating 25 Windows Server virtual machines that run Microsoft SQL Server to Amazon EC2. The company already owns SQL Server licenses that are licensed per physical core and are not covered by License Mobility. The company wants to bring these licenses to AWS and must be able to report the physical cores and sockets that the licenses are used on.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Launch the instances on Dedicated Instances. Use AWS License Manager to track license usage.
- **B.** Launch the instances with default tenancy by using license-included SQL Server AMIs. Purchase a Compute Savings Plan.
- **C.** Launch the instances with default tenancy by using Windows Server AMIs. Install SQL Server with the company's existing licenses.
- **D.** Allocate EC2 Dedicated Hosts and launch the instances on them. Use AWS License Manager to track the cores and sockets that the licenses use.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ Dedicated Instances run on single-tenant hardware, but they do not expose the physical sockets and cores or give placement control on a specific host. They do not support the per-core bring-your-own-license model that requires host-level visibility.
- **B** ❌ License-included AMIs bundle the SQL Server license into the hourly price. The company would pay again for licenses it already owns.
- **C** ❌ Shared-tenancy instances can run on any physical server, so the company cannot see or control the sockets and cores. Licenses without License Mobility cannot be used on shared tenancy.
- **D** ✅ Dedicated Hosts give visibility into the physical sockets and cores and keep instances on the same physical server. This is the option that supports per-core and per-socket bring-your-own-license software.

Per-socket or per-core licenses brought to AWS need Dedicated Hosts, which expose the physical hardware and support host affinity. Dedicated Instances are single-tenant too, but they do not give host-level visibility. This Dedicated Hosts versus Dedicated Instances split is a frequent exam close pair.

</details>

### cost-4.2-07

_EC2, Dedicated Instances, Dedicated Hosts_

A healthcare company must run 8 Amazon EC2 instances on hardware that is not shared with other AWS customers. The instances use five different instance types across the c6i, m6i, and r6i families. The application uses only Linux and open-source software, so there are no per-socket or per-core license requirements. The company does not need control over instance placement on specific servers.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Launch the instances as Dedicated Instances.
- **B.** Allocate EC2 Dedicated Hosts for each instance family and launch the instances on them.
- **C.** Launch the instances with default tenancy and purchase EC2 Instance Savings Plans.
- **D.** Launch the instances with default tenancy in a cluster placement group.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ Dedicated Instances run on hardware dedicated to a single customer. The company pays per instance plus a flat per-Region dedicated fee, not for entire hosts, which suits a small number of mixed instance types.
- **B** ❌ Dedicated Hosts also give single-tenant hardware, but the company pays for each entire host regardless of how many instances run on it. With 8 instances across three families, at least three hosts would be mostly idle. Host-level control is not required.
- **C** ❌ Savings Plans reduce cost, but default tenancy places instances on shared hardware. This breaks the requirement that hardware is not shared with other customers.
- **D** ❌ A cluster placement group places instances close together for network performance. It does not provide single-tenant hardware.

When the only need is hardware isolation, Dedicated Instances are the cheaper single-tenant option because they are billed per instance (plus a flat per-Region fee) rather than per host. Dedicated Hosts are justified by bring-your-own-license software or a need for host-level visibility and placement control. Placement groups and Savings Plans do not change tenancy.

</details>

### cost-4.2-08

_Compute Optimizer, EC2, EBS, Lambda_

A company has 300 Amazon EC2 instances, 900 Amazon EBS volumes, and 150 AWS Lambda functions across 12 AWS accounts in AWS Organizations. The company suspects that many of these resources are overprovisioned. Memory use on the EC2 instances must be considered in any recommendation.

A solutions architect needs to produce right-sizing recommendations for all three resource types across all accounts.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Enable rightsizing recommendations in AWS Cost Explorer from the management account. Install the Amazon CloudWatch agent on the EC2 instances to publish memory metrics.
- **B.** Opt in to AWS Compute Optimizer for all accounts in the organization from the management account. Install the Amazon CloudWatch agent on the EC2 instances to publish memory metrics.
- **C.** Install the Amazon CloudWatch agent on the EC2 instances. Build CloudWatch dashboards for each account and review the utilization metrics monthly to choose new sizes.
- **D.** Create AWS Budgets for each account with alerts at 80% of the expected spend. Resize resources in accounts whose alerts fire.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ Cost Explorer rightsizing recommendations cover EC2 instances only. They do not produce recommendations for EBS volumes or Lambda function memory.
- **B** ✅ Compute Optimizer produces right-sizing recommendations for EC2 instances, EBS volumes, and Lambda functions across an organization. Memory utilization is included in EC2 recommendations when the CloudWatch agent publishes it.
- **C** ❌ Dashboards show utilization, but engineers would have to analyze 1,350 resources manually and decide on new sizes. This is far more operational effort than a managed recommendation service.
- **D** ❌ AWS Budgets tracks spend against a threshold. It does not identify which resources are overprovisioned or what size they should be.

AWS Compute Optimizer covers EC2, Auto Scaling groups, EBS, Lambda, and more, and it can run organization-wide. EC2 memory data requires the CloudWatch agent with either tool. The distinction to remember is scope: Cost Explorer rightsizing is EC2-only, Compute Optimizer covers several compute resource types.

</details>

### cost-4.2-09

_EC2, Graviton, EC2 Auto Scaling_

A company runs a Java web service on 50 m6i.xlarge Linux instances in an Auto Scaling group. CPU utilization is steady at around 60% at all times. The application is packaged as a JAR file with no native x86 dependencies. The service must not be interrupted, and the company does not want to make a long-term commitment because it may retire the service in 6 months.

Which solution will reduce compute costs the MOST?

- **A.** Change the launch template to use t3.xlarge burstable instances in unlimited mode.
- **B.** Change the Auto Scaling group to use Spot Instances across several general purpose instance types.
- **C.** Purchase a 1-year Compute Savings Plan that covers the current hourly usage.
- **D.** Change the launch template to use m7g.xlarge instances, which use AWS Graviton processors, and redeploy the JAR file.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ Steady 60% CPU is well above the t3.xlarge baseline, so unlimited mode would charge for surplus CPU credits continuously. Burstable instances suit low average utilization with occasional spikes.
- **B** ❌ Spot Instances give the largest discount, but they can be interrupted. This breaks the requirement that the service must not be interrupted.
- **C** ❌ A Savings Plan would lower the hourly rate, but the 1-year commitment outlasts the 6-month expected life of the service. The company does not want a long-term commitment.
- **D** ✅ Graviton-based instances give better price performance than comparable x86 instances. Java bytecode runs on Arm64 without code changes, and On-Demand Graviton instances need no commitment and are not interrupted.

Graviton instances lower cost per unit of performance with no commitment, and interpreted or JVM workloads usually move without code changes. Spot fails the no-interruption requirement, a Savings Plan fails the no-commitment requirement, and burstable instances are wrong for sustained CPU. Graviton is the default right answer for portable Linux workloads seeking cheaper compute.

</details>

### cost-4.2-10

_Lambda, S3, Fargate, EC2_

A company stores product photos in an Amazon S3 bucket. Each time a photo is uploaded, the company generates three thumbnail sizes. Uploads arrive at unpredictable times, about 2,000 per day, and each thumbnail job takes about 20 seconds with 1 GB of memory. Today a t3.large instance runs 24/7 and polls the bucket for new objects.

The company wants to stop managing servers and to pay as little as possible while the system is idle.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Create an AWS Lambda function for the thumbnails and invoke it with S3 event notifications for new objects.
- **B.** Run the thumbnail code as an Amazon ECS service on AWS Fargate with a desired count of one task that polls the bucket.
- **C.** Replace the t3.large instance with a Spot Instance in an Auto Scaling group with a desired capacity of one.
- **D.** Deploy the Instance Scheduler on AWS solution to stop the t3.large instance outside business hours.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ Lambda is billed only for the duration of each invocation, so there is no cost while no photos arrive. A 20-second job with 1 GB of memory fits easily inside Lambda limits, and S3 event notifications remove the polling.
- **B** ❌ Fargate removes server management, but a service with one task runs and is billed 24/7, including idle periods. The company would still pay for idle capacity.
- **C** ❌ A Spot Instance is cheaper than On-Demand, but the company would still manage an EC2 instance and pay for it while it is idle. This breaks the requirement to stop managing servers.
- **D** ❌ Uploads arrive at unpredictable times, so stopping the instance on a schedule would leave photos unprocessed. The company would also still manage the instance.

For short, event-driven, intermittent work, Lambda is usually the cheapest compute because it scales to zero and bills per millisecond. An always-on Fargate task or EC2 instance pays for idle time. Check the Lambda fit first: under 15 minutes and up to 10 GB of memory.

</details>

### cost-4.2-11

_ECS, Fargate, EventBridge, Lambda_

A company has a containerized data export job that runs once every night and takes about 2 hours. The job is idempotent: if it stops, it can be restarted from the beginning, and it only needs to finish within an 8-hour overnight window. The company does not want to manage servers or clusters of instances.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Package the job as an AWS Lambda container image. Use an Amazon EventBridge schedule to invoke the function each night.
- **B.** Run the job as an Amazon ECS task on Amazon EC2 instances covered by Reserved Instances. Use an Amazon EventBridge schedule to start the task each night.
- **C.** Use an Amazon EventBridge schedule to run the job as an Amazon ECS task with the FARGATE_SPOT capacity provider. Retry the task if it is interrupted.
- **D.** Use an Amazon EventBridge schedule to run the job as an Amazon ECS task with the FARGATE capacity provider.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Lambda runs container images without servers, but a single invocation can run for at most 15 minutes. A 2-hour job cannot run as one Lambda function.
- **B** ❌ The company would manage the EC2 container instances, and Reserved Instances are billed 24/7 for a job that runs 2 hours a day. This breaks the no-servers requirement and wastes most of the commitment.
- **C** ✅ Fargate Spot runs tasks without servers at a large discount compared to Fargate, and billing stops when the task ends. An idempotent job with a 6-hour buffer can absorb an occasional interruption and retry.
- **D** ❌ Standard Fargate meets every functional requirement, but it costs more than Fargate Spot. The restartable job and generous window mean the interruption protection of On-Demand Fargate is not needed.

A long, restartable container job with no server management points to Fargate, and its tolerance for interruption points to Fargate Spot. Lambda fails on the 15-minute limit, and EC2 with Reserved Instances fails both the no-servers requirement and the cost. Options c and d differ only in the capacity provider.

</details>

### cost-4.2-12

_Instance Scheduler on AWS, EC2, RDS_

A company has 40 standalone Amazon EC2 instances and 10 Amazon RDS DB instances in its development and test accounts. The resources are used only from 8:00 AM to 6:00 PM on weekdays, and they run 24/7 today. The EC2 instances are not part of Auto Scaling groups.

The company wants to stop paying for these resources outside working hours and wants a single tag-based mechanism to manage the schedule for both resource types.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Purchase 1-year Reserved Instances for the EC2 instances and reserved DB instances for the RDS instances.
- **B.** Deploy the Instance Scheduler on AWS solution. Define a weekday 8:00 AM to 6:00 PM schedule and tag the EC2 and RDS instances with the schedule name.
- **C.** Place the EC2 instances in Auto Scaling groups. Create scheduled actions that set the desired capacity to zero outside working hours.
- **D.** Purchase a Compute Savings Plan that covers the development and test EC2 usage.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ Reservations lower the hourly rate but are billed every hour of the term. The resources are needed for about 50 of 168 hours each week, so stopping them saves more than any reservation.
- **B** ✅ Instance Scheduler on AWS starts and stops EC2 and RDS instances based on tags and defined schedules. It covers both resource types with one mechanism and no custom code.
- **C** ❌ Scheduled scaling can remove EC2 capacity overnight, but it requires rebuilding standalone instances into Auto Scaling groups. It also does nothing for the RDS DB instances.
- **D** ❌ A Savings Plan commits to hourly spend for every hour of the term and does not apply to RDS. It is designed for steady usage, not resources that can be stopped most of the week.

Non-production resources with fixed working hours are cheapest when they are stopped outside those hours. Instance Scheduler on AWS does this for EC2 and RDS with tags. Commitments such as Reserved Instances or Savings Plans suit steady 24/7 usage, not part-time usage.

</details>

### cost-4.2-13

_Savings Plans, Spot Instances, EC2_

A company runs an analytics platform on Amazon EC2. A core of 12 instances runs 24/7 and will continue for at least 3 years, but the company plans to move these instances to AWS Graviton instance types next year. Every night, the platform also adds 80 instances for 3 hours to run a distributed job. The nightly job writes checkpoints to Amazon S3 and resumes from them if a node is lost.

Which combination of purchasing options will meet these requirements MOST cost-effectively? (Choose TWO.)

- **A.** Purchase a 3-year Compute Savings Plan that covers the hourly cost of the 12 core instances.
- **B.** Purchase 3-year Standard Reserved Instances for the current instance type of the 12 core instances.
- **C.** Run the 80 nightly instances as Spot Instances across multiple instance types.
- **D.** Create On-Demand Capacity Reservations for the 80 nightly instances.
- **E.** Run the 80 nightly instances on Dedicated Hosts.

<details><summary>Answer</summary>

**Correct: A, C**

- **A** ✅ Compute Savings Plans discount steady usage and keep applying when instances change family, including a move to Graviton. This fits the 24/7 core.
- **B** ❌ Standard Reserved Instances cannot be exchanged for a different instance family. After the move to Graviton, the reservations would no longer apply.
- **C** ✅ The nightly job checkpoints to S3 and tolerates lost nodes, which makes it a good fit for Spot pricing. Diversifying instance types improves the chance of getting capacity.
- **D** ❌ Capacity Reservations guarantee capacity at On-Demand prices and are billed whether or not instances run. They add cost for capacity that the fault-tolerant job does not need guaranteed.
- **E** ❌ Dedicated Hosts are for licensing or compliance needs and are billed for the whole host. Nothing in the scenario requires them, and they cost more than Spot.

Split the workload by usage pattern: commit only to the steady baseline, and use Spot for interruptible bursts. The planned move to Graviton rules out Standard Reserved Instances and points to Compute Savings Plans. Checkpointing is the signal that Spot is safe.

</details>

### cost-4.2-14

_Lambda, Graviton, Savings Plans_

A company runs 20 AWS Lambda functions written in Python. The functions process about 400 million invocations each month, and Lambda is now one of the company's largest costs. The functions use only pure-Python libraries with no compiled x86 binaries. The company does not want to make any spending commitment because it is reorganizing its accounts, and it wants to avoid changing application code.

Which solution will reduce Lambda costs the MOST?

- **A.** Change the instruction set architecture of the functions from x86_64 to arm64.
- **B.** Purchase a 1-year Compute Savings Plan that covers the Lambda usage.
- **C.** Migrate the functions to Python applications that run on Amazon EC2 instances in an Auto Scaling group.
- **D.** Double the memory setting of each function so that each invocation finishes faster.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ Lambda functions on arm64 use AWS Graviton processors and are billed at a lower price per GB-second than x86_64, often with better performance. Pure-Python code runs unchanged, and there is no commitment.
- **B** ❌ Compute Savings Plans do apply to Lambda duration charges, but they require a 1-year or 3-year spending commitment. The company does not want to make a commitment.
- **C** ❌ Moving to EC2 requires rewriting the event handling and managing servers. This breaks the requirement to avoid code changes.
- **D** ❌ Doubling memory doubles the price per millisecond. It reduces cost only if duration falls by more than half, and the scenario gives no evidence that it will.

Switching Lambda to arm64 is a configuration change that lowers the GB-second price with no commitment, provided the code and dependencies are architecture-neutral. Savings Plans also cut Lambda cost but need a commitment. Graviton applies to Lambda and Fargate as well as to EC2.

</details>

### cost-4.2-15

_EC2, Compute Optimizer_

A company runs an internal reporting application on a single m5.xlarge instance (4 vCPUs, 16 GiB of memory). The application must run continuously and must not be interrupted. Over the past 3 months, average CPU utilization was 6%, with short spikes to 35% a few times a day. Memory use never exceeded 5 GiB.

Which instance type change will meet these requirements MOST cost-effectively?

- **A.** Change to an m5.large On-Demand Instance (2 vCPUs, 8 GiB of memory).
- **B.** Change to an r5.large On-Demand Instance (2 vCPUs, 16 GiB of memory).
- **C.** Change to an m5.large Spot Instance (2 vCPUs, 8 GiB of memory).
- **D.** Change to a t3.large On-Demand Instance (2 vCPUs, 8 GiB of memory).

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ An m5.large is correctly sized for the memory and peak CPU, but fixed-performance instances charge for full CPU capacity at all times. A burstable instance of the same size costs less for 6% average use.
- **B** ❌ Memory optimized instances cost more per vCPU and provide memory that the application does not use. Memory use never exceeded 5 GiB.
- **C** ❌ Spot pricing is the lowest, but a Spot Instance can be interrupted. This breaks the requirement that the application must run continuously without interruption.
- **D** ✅ Burstable instances suit low average CPU with occasional spikes and cost less than fixed-performance instances of the same size. The 6% average is well below the t3.large baseline, so the instance earns CPU credits that cover the short spikes without surplus charges.

Right-sizing has two parts: the smallest size that fits peak memory and CPU, and the cheapest family for the usage profile. Low average CPU with brief spikes is the burstable profile. The m5.large is a correct size in a more expensive family, so it is the near miss.

</details>

### cost-4.2-16

_Fargate, ECS, Savings Plans_

A company runs 30 microservices as Amazon ECS services on AWS Fargate. The services run 24/7 with a steady number of tasks, and the company expects this usage to continue for at least 3 years. The services handle customer payments, so tasks must not be interrupted.

Which solution will reduce compute costs the MOST?

- **A.** Purchase a 3-year EC2 Instance Savings Plan that matches the hourly Fargate spend.
- **B.** Purchase a 3-year Compute Savings Plan that matches the hourly Fargate spend.
- **C.** Purchase 3-year Standard Reserved Instances for the vCPU and memory that the tasks use.
- **D.** Change the services to use the FARGATE_SPOT capacity provider for all tasks.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ EC2 Instance Savings Plans apply only to EC2 instance usage in one instance family and Region. They do not apply to Fargate.
- **B** ✅ Compute Savings Plans apply to Fargate, Lambda, and EC2 usage. A 3-year term gives the largest discount for steady, long-running tasks without any risk of interruption.
- **C** ❌ Reserved Instances apply to EC2 instances, not Fargate tasks. Fargate usage cannot be covered by Reserved Instances.
- **D** ❌ Fargate Spot is cheaper, but tasks can be interrupted with a 2-minute warning. This breaks the requirement that payment tasks must not be interrupted.

Compute Savings Plans are the only commitment-based discount for Fargate. EC2 Instance Savings Plans and Reserved Instances apply only to EC2 instances. For steady, interruption-sensitive serverless containers, a Compute Savings Plan is the answer.

</details>

### cost-4.2-17

_EC2, On-Demand Capacity Reservations, Reserved Instances_

A retailer expects a large traffic surge during a 10-day sales event next month. The company must be certain that 200 c6i.4xlarge instances will be available in a specific Availability Zone for the whole event. After the event, the company will need only its normal 20 instances, which are already covered by a Savings Plan.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Purchase 180 zonal Reserved Instances for c6i.4xlarge in the Availability Zone with a 1-year term.
- **B.** Increase the Savings Plan commitment to cover 200 c6i.4xlarge instances.
- **C.** Create On-Demand Capacity Reservations for 180 c6i.4xlarge instances in the Availability Zone, and cancel them after the event.
- **D.** Launch the additional 180 instances as Spot Instances in the Availability Zone with the capacity-optimized allocation strategy and Capacity Rebalancing enabled.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Zonal Reserved Instances do reserve capacity, but they commit the company to paying for 180 instances for a full year. The capacity is needed for only 10 days.
- **B** ❌ Savings Plans provide a billing discount only. They do not reserve capacity in any Availability Zone, and the larger commitment would last for the full term.
- **C** ✅ On-Demand Capacity Reservations guarantee capacity in a specific Availability Zone with no long-term commitment. The company pays only while the reservations are active and can cancel them after the event.
- **D** ❌ Capacity-optimized allocation and Capacity Rebalancing lower the chance and impact of interruptions, but Spot capacity is never guaranteed. This breaks the requirement to be certain that the instances will be available.

On-Demand Capacity Reservations are the tool for guaranteed capacity in an Availability Zone for a short, known period. Zonal Reserved Instances also reserve capacity but require a 1-year or 3-year term. Savings Plans give a discount but never reserve capacity.

</details>

### cost-4.2-18

_Spot Instances, EventBridge, S3, EC2 Auto Scaling_

A visual effects studio renders frames on Spot Instances. Each frame takes about 45 minutes, and today all instances are c6i.8xlarge in a single Availability Zone. When an instance is interrupted, all work on the current frame is lost and the frame starts again. Interruptions have recently delayed deliveries.

The studio wants to keep using Spot pricing and finish frames reliably.

Which combination of steps will meet these requirements? (Choose TWO.)

- **A.** Set the maximum Spot price to the On-Demand price so that the instances are not interrupted.
- **B.** Configure the Auto Scaling group to use several instance types of similar size across multiple Availability Zones with the price-capacity-optimized allocation strategy.
- **C.** Move all rendering to On-Demand Instances in a cluster placement group.
- **D.** Pin all instances to one instance type so that the render time per frame is consistent.
- **E.** Change the renderer to write progress checkpoints to Amazon S3. Use an Amazon EventBridge rule for EC2 Spot Instance interruption warnings to trigger a final checkpoint, and resume frames from the latest checkpoint.

<details><summary>Answer</summary>

**Correct: B, E**

- **A** ❌ Spot interruptions are driven mainly by EC2 needing the capacity back, not by price. Setting a maximum price does not prevent interruptions.
- **B** ✅ Diversifying across instance types and Availability Zones draws from more Spot capacity pools, and price-capacity-optimized favors pools with low interruption risk. This reduces how often frames are interrupted.
- **C** ❌ On-Demand Instances are not interrupted, but the studio wants to keep Spot pricing. This option drops the Spot discount.
- **D** ❌ A single instance type keeps the workload in fewer capacity pools, which raises the chance of interruption and capacity shortages. This works against reliability.
- **E** ✅ Checkpointing lets an interrupted frame resume instead of restarting from zero. The 2-minute interruption warning, delivered through EventBridge, gives time to save state.

Reliable Spot workloads use two techniques: reduce interruptions by diversifying capacity pools, and reduce the cost of each interruption by checkpointing and handling the 2-minute warning. A maximum price does not prevent capacity-driven interruptions, and On-Demand gives up the Spot discount.

</details>

## Task 4.3

### cost-4.3-01

_Aurora, Aurora Serverless v2, RDS_

A company is launching a new booking application that uses a MySQL-compatible relational database. Traffic is unpredictable: the database is mostly idle at night and on weekends, but marketing campaigns can increase load tenfold within minutes. The company cannot predict when campaigns will run.

The company wants to avoid paying for peak database capacity during idle periods and does not want to resize instances manually.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Deploy an Amazon Aurora MySQL provisioned cluster sized for peak load. Purchase reserved DB instances for the cluster.
- **B.** Deploy an Amazon Aurora Serverless v2 cluster with a low minimum capacity and a maximum capacity that covers the campaign peak.
- **C.** Deploy Amazon RDS for MySQL on a large instance. Use a scheduled AWS Lambda function to change the instance class at night and on weekends.
- **D.** Deploy an Amazon Aurora MySQL provisioned cluster with Aurora Auto Scaling for Aurora Replicas.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ Reserved DB instances lower the hourly rate, but a cluster sized for a tenfold peak is paid for 24/7. Most of that capacity would sit idle at night and on weekends.
- **B** ✅ Aurora Serverless v2 adjusts capacity in fine-grained increments within seconds and bills for the capacity used. It scales down during idle periods and up during unpredictable campaigns without manual resizing.
- **C** ❌ Scheduled resizing handles only the predictable idle periods and causes downtime during each modification. It cannot react to campaigns that start at unknown times.
- **D** ❌ Aurora Auto Scaling adds and removes read replicas, which helps only read traffic. The writer instance must still be sized for peak write load and runs all the time.

Aurora Serverless v2 fits unpredictable, spiky relational workloads with idle periods because capacity follows demand automatically. Provisioned clusters, even with reservations or replica auto scaling, pay for a writer sized for the peak. Use provisioned capacity with reservations when load is steady and predictable.

</details>

### cost-4.3-02

_RDS, Reserved DB Instances, Database Savings Plans_

A company runs its order management system on an Amazon RDS for PostgreSQL Multi-AZ DB instance (db.r6g.2xlarge). The database has had steady utilization of about 70% for 2 years and must stay available 24/7. The company expects to keep this database, at this size, for at least 3 more years.

Which solution will reduce the database costs the MOST?

- **A.** Purchase a 1-year Database Savings Plan with an hourly commitment that covers the full cost of the DB instance.
- **B.** Migrate the database to Amazon Aurora Serverless v2.
- **C.** Stop the DB instance every night and start it every morning by using a schedule.
- **D.** Purchase a 3-year reserved DB instance for db.r6g.2xlarge PostgreSQL with the Multi-AZ option.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ Database Savings Plans cover RDS, but they have only a 1-year term, apply to the latest provisioned instance generations, and give a smaller discount than a 3-year reservation. They suit workloads that might change engine or instance family.
- **B** ❌ Aurora Serverless v2 is designed for variable or unpredictable load. For a steady, always-on workload, provisioned capacity with a reservation is cheaper per hour than paying for the same capacity in ACUs.
- **C** ❌ The order management system must be available 24/7, so stopping the database at night breaks a stated requirement.
- **D** ✅ Reserved DB instances give a large discount for a 1-year or 3-year commitment on steady RDS usage. Matching the engine, class, and Multi-AZ option means the reservation applies to the full running cost of the instance.

Steady, long-lived RDS workloads that will not change instance family get the deepest discount from reserved DB instances. Database Savings Plans trade some discount for flexibility across engines, families, and Regions, and they have only a 1-year term. Remember that the reservation must match the Multi-AZ option to cover both the primary and the standby.

</details>

### cost-4.3-03

_DynamoDB_

A company has an Amazon DynamoDB table that uses on-demand capacity mode. The application has run for 18 months, and traffic follows a smooth, predictable daily curve: about 2,000 writes per second during business hours and about 300 writes per second overnight. Traffic never spikes suddenly.

The company wants to reduce the cost of the table without risking throttling.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Switch the table to provisioned capacity mode and configure DynamoDB auto scaling with a target utilization of 70%.
- **B.** Switch the table to provisioned capacity mode with a fixed capacity of 2,000 write capacity units.
- **C.** Keep on-demand capacity mode and change the table class to DynamoDB Standard-Infrequent Access.
- **D.** Keep on-demand capacity mode and add a DynamoDB Accelerator (DAX) cluster in front of the table.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ Provisioned capacity costs less per request than on-demand when utilization is steady and predictable. Auto scaling follows the gradual daily curve, and the 70% target leaves headroom to avoid throttling.
- **B** ❌ A fixed capacity sized for the daytime peak would be paid for overnight, when traffic is about 15% of the peak. Auto scaling would remove most of that waste.
- **C** ❌ The Standard-IA table class lowers storage cost but raises the cost of reads and writes. For a write-heavy table, this would increase cost.
- **D** ❌ DAX caches reads. It does not reduce the cost of writes, which are the bulk of this workload, and it adds the cost of the cluster nodes.

On-demand mode is best for unknown or spiky traffic; once traffic is predictable, provisioned mode with auto scaling is cheaper. Auto scaling follows gradual changes well, which removes the need to size for peak. The table class decision is a separate lever that depends on whether storage or throughput dominates cost.

</details>

### cost-4.3-04

_DynamoDB_

A startup is launching a mobile game. The backend stores player state in Amazon DynamoDB. The company has no traffic history. It expects long idle periods with near-zero traffic, interrupted by sudden spikes to about 3,000 requests per second within seconds when a streamer promotes the game.

The company wants to pay as little as possible during idle periods and must not throttle players during spikes.

Which solution will meet these requirements?

- **A.** Create the table in provisioned capacity mode with 3,000 read and 3,000 write capacity units.
- **B.** Create the table in provisioned capacity mode with low base capacity and DynamoDB auto scaling.
- **C.** Create the table in on-demand capacity mode.
- **D.** Store player state in Amazon Aurora Serverless v2 with a high maximum capacity.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ This capacity handles the spikes, but it is paid for every hour, including the long idle periods. It does not minimize idle cost.
- **B** ❌ DynamoDB auto scaling reacts to CloudWatch metrics over several minutes. A jump to 3,000 requests per second within seconds would be throttled before auto scaling adds capacity.
- **C** ✅ On-demand mode bills per request, so idle periods cost almost nothing except storage. It accommodates sudden traffic increases without capacity planning, which fits unknown and spiky traffic.
- **D** ❌ Aurora Serverless v2 scales with load, but it is a relational database that requires a data model change from key-value player state and keeps a minimum capacity when it is not paused. It is a larger change than needed for a simple key-value workload.

On-demand capacity mode is the answer for new tables with unknown traffic or sudden spikes. Auto scaling works for gradual changes but lags behind instant spikes. Once traffic becomes predictable, revisit provisioned mode to cut cost. For spikes far beyond a new table's initial on-demand throughput, pre-warm the table with warm throughput.

</details>

### cost-4.3-05

_DynamoDB, S3_

A company stores 40 TB of order history in an Amazon DynamoDB table. Storage is now more than 70% of the table's cost. Orders older than 30 days are read rarely, but customer service agents must still be able to look up any order in the application with single-digit millisecond latency. All orders must be retained for 7 years.

Which solution will reduce costs MOST while meeting these requirements?

- **A.** Enable Time to Live (TTL) on the table so that orders older than 30 days are deleted automatically.
- **B.** Export orders older than 30 days to Amazon S3 Glacier Flexible Retrieval and delete them from the table.
- **C.** Switch the table from provisioned capacity mode to on-demand capacity mode.
- **D.** Change the table class to DynamoDB Standard-Infrequent Access (Standard-IA).

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ TTL deletes expired items at no throughput cost, but the company must retain all orders for 7 years and look them up in the application. Deleting them breaks both requirements.
- **B** ❌ Glacier storage is very cheap, but retrieval takes minutes to hours. Agents could no longer look up old orders with single-digit millisecond latency.
- **C** ❌ Capacity mode changes how throughput is billed. It does not affect storage cost, which is the dominant cost of this table.
- **D** ✅ The Standard-IA table class lowers storage cost substantially in exchange for higher per-request cost. It suits tables where storage dominates cost, and it keeps the same latency and API.

The DynamoDB Standard-IA table class targets tables whose cost is dominated by storage, while keeping single-digit millisecond access. TTL and archiving to S3 Glacier lower cost but break retention or latency requirements. Choose the table class by asking whether storage or throughput dominates the bill.

</details>

### cost-4.3-06

_DynamoDB, Lambda, EventBridge_

A company stores user session records in an Amazon DynamoDB table that uses provisioned capacity. Each session is useless 24 hours after it is created. Today a scheduled AWS Lambda function scans the table every hour and deletes expired sessions. The scans and deletes consume a large share of the table's provisioned capacity, and the company has had to raise capacity to avoid throttling.

Which solution will reduce costs the MOST?

- **A.** Run the Lambda function once each day instead of every hour.
- **B.** Add an expiration timestamp attribute to each item. Enable Time to Live (TTL) on that attribute and remove the Lambda function.
- **C.** Change the table class to DynamoDB Standard-Infrequent Access.
- **D.** Create a global secondary index on the creation timestamp and change the Lambda function to query the index instead of scanning.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ Fewer runs reduce the number of scans, but each daily scan and delete still consumes read and write capacity. Expired sessions would also stay in the table for up to a day longer.
- **B** ✅ DynamoDB TTL deletes expired items automatically in the background without consuming write capacity. Removing the scanning function also frees the read capacity it used.
- **C** ❌ Standard-IA lowers storage cost but raises per-request cost. Session tables are read and written often, and the scans and deletes would still run.
- **D** ❌ Querying an index reduces the read cost of finding expired items, but the GSI adds its own storage and write costs, and every delete still consumes write capacity.

TTL is the built-in way to expire items in DynamoDB, and its deletes do not consume write capacity. Custom scan-and-delete jobs pay for both reads and writes. Note that TTL deletion is not instantaneous; applications that must hide expired items immediately should filter on the timestamp.

</details>

### cost-4.3-07

_ElastiCache, RDS_

A news website uses an Amazon RDS for MySQL primary instance and four large read replicas. About 90% of the queries are reads, and the same few thousand article queries are repeated millions of times each day. Article content may be up to 5 minutes stale. Read traffic is growing, and the company is about to add more replicas.

Which solution will reduce database costs MOST while handling the growth?

- **A.** Add an Amazon ElastiCache cluster as a lazy loading cache with a 5-minute TTL, and remove some read replicas.
- **B.** Add four more read replicas of the same instance class, and spread reads across all replicas with Route 53 weighted records.
- **C.** Migrate the database to Amazon Aurora MySQL, and use Aurora Auto Scaling to add Aurora Replicas as read load grows.
- **D.** Scale the primary instance and the read replicas up to the next larger memory-optimized instance class.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ A cache serves the repeated article queries from memory, so most reads never reach the database. The 5-minute TTL matches the allowed staleness, and fewer replicas are needed.
- **B** ❌ More replicas handle the growth but add the full cost of each DB instance. Each replica re-executes the same repeated queries.
- **C** ❌ Aurora replicas scale more easily, but each replica is still a full DB instance that re-executes identical queries. The cost per read stays high.
- **D** ❌ Larger instances handle more reads, but the cost scales with instance size. This does nothing to avoid repeating the same queries.

When reads are repetitive and some staleness is allowed, an in-memory cache is far cheaper per read than additional database instances. Read replicas scale reads but at the full cost of a DB instance. The allowed staleness is the clue that makes caching acceptable.

</details>

### cost-4.3-08

_DynamoDB, DynamoDB Accelerator (DAX), ElastiCache_

An ecommerce company stores its product catalog in Amazon DynamoDB with provisioned capacity. Reads are 95% of the traffic, and a small set of popular products is read repeatedly. The table now needs 80,000 read capacity units at peak. Eventually consistent reads are acceptable. The development team wants to make as few code changes as possible.

Which solution will reduce read costs while meeting these requirements?

- **A.** Increase the provisioned read capacity and enable DynamoDB auto scaling.
- **B.** Deploy an Amazon ElastiCache (Redis OSS) cluster. Change the application to check the cache before reading from DynamoDB and to populate the cache on a miss.
- **C.** Deploy a DynamoDB Accelerator (DAX) cluster. Point the application's DynamoDB client at the DAX cluster endpoint.
- **D.** Create a global secondary index that projects the popular product attributes, and read from the index.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Auto scaling matches capacity to demand, but every repeated read of a popular product still consumes read capacity. It does not reduce the number of reads that reach the table.
- **B** ❌ ElastiCache can absorb repeated reads, but the team must write and maintain cache-aside logic for every read path. This requires more code changes than an API-compatible cache.
- **C** ✅ DAX is an in-memory cache that is API-compatible with DynamoDB, so the application changes only its client configuration. Repeated eventually consistent reads are served from the cache instead of consuming table read capacity.
- **D** ❌ A global secondary index has its own provisioned capacity and storage. Reading from it moves the cost rather than reducing it.

DAX and ElastiCache both reduce read cost through caching, but DAX is a drop-in, API-compatible cache for DynamoDB. The phrase 'as few code changes as possible' separates them. DAX helps only with eventually consistent reads; strongly consistent reads pass through to the table.

</details>

### cost-4.3-09

_RDS, EventBridge Scheduler_

A development team uses an Amazon RDS for PostgreSQL DB instance only from 7:00 AM to 7:00 PM on weekdays. The instance runs 24/7 today. The team wants to stop paying for DB instance hours outside working hours. The database endpoint and data must remain the same every morning, and the team wants no manual steps.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Take a manual snapshot every evening and delete the DB instance. Restore the snapshot to a new DB instance every morning by using a script.
- **B.** Purchase a 1-year reserved DB instance for the DB instance.
- **C.** Change the DB instance to a burstable db.t4g instance class that runs 24/7.
- **D.** Create Amazon EventBridge Scheduler schedules that call the RDS StopDBInstance API at 7:00 PM and the StartDBInstance API at 7:00 AM on weekdays.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ Restoring from a snapshot creates a new instance, takes time each morning, and requires a script to manage snapshots and instance settings. It works but adds far more operational effort than stopping the instance.
- **B** ❌ A reservation lowers the hourly rate but is billed for every hour of the term. The team uses the database for about 60 of 168 hours each week.
- **C** ❌ A smaller burstable class lowers the hourly rate, but the instance is still billed outside working hours. Stopping the instance saves more.
- **D** ✅ A stopped RDS instance is not billed for instance hours; only storage and backups are charged. The endpoint and data stay the same, and EventBridge Scheduler can call the RDS APIs directly without custom code.

Stopping a non-production RDS instance outside working hours removes instance-hour charges while keeping its endpoint and storage. A schedule that calls the RDS stop and start APIs automates this. Snapshot-and-delete saves similar money but costs more effort; it suits databases that sit idle for much longer than 7 days.

</details>

### cost-4.3-10

_RDS, RDS snapshots_

A finance department uses an Amazon RDS for MySQL DB instance (db.r6i.4xlarge with 2 TB of storage) only during the first week of each quarter to produce regulatory reports. For the rest of the quarter, nobody connects to the database. The data must be preserved between reporting periods, and the department can wait up to 2 hours for the database to become available before each reporting week.

Which solution will meet these requirements MOST cost-effectively?

- **A.** After each reporting week, take a final snapshot and delete the DB instance. Restore the DB instance from the snapshot before the next reporting week.
- **B.** Stop the DB instance after each reporting week and start it before the next reporting week.
- **C.** Purchase a 1-year reserved DB instance for the db.r6i.4xlarge instance.
- **D.** Change the DB instance to a db.t4g.large instance class between reporting weeks and scale it back up before each reporting week.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ Between reporting periods, the company pays only for snapshot storage, with no instance or provisioned storage charges. A restore of 2 TB fits within the 2-hour window that the department allows.
- **B** ❌ A stopped RDS instance is started again automatically after 7 days. Without repeated intervention, the instance would run and be billed for most of the quarter. Provisioned storage is also billed while the instance is stopped.
- **C** ❌ A reservation is billed for every hour of the year, but the database is used for about 4 weeks per year. Removing the instance between periods saves much more.
- **D** ❌ A smaller class lowers the hourly cost, but the instance and its 2 TB of provisioned storage are still billed for the whole quarter.

RDS instances can be stopped for at most 7 days before AWS starts them again, so stopping is a poor fit for databases that sit idle for months. Snapshot-and-delete reduces the idle cost to snapshot storage. Use stop and start for short idle periods such as nights and weekends.

</details>

### cost-4.3-11

_DMS, AWS SCT, Aurora PostgreSQL_

A company runs a 3 TB Oracle Database on premises and pays high license and support fees. The company wants to move to Amazon Aurora PostgreSQL-Compatible Edition to eliminate commercial database licensing. The database contains hundreds of PL/SQL stored procedures and triggers. The cutover downtime must be less than 15 minutes.

Which combination of steps will meet these requirements? (Choose TWO.)

- **A.** Migrate the database to Amazon RDS for Oracle with the bring-your-own-license model.
- **B.** Use the AWS Schema Conversion Tool (AWS SCT) to convert the schema, stored procedures, and triggers to PostgreSQL, and fix any items that it flags for manual conversion.
- **C.** Export the database with Oracle Data Pump to Amazon S3 and import the dump file into Aurora PostgreSQL.
- **D.** Use AWS Snowball Edge to ship a full backup of the database to AWS and restore it into Aurora PostgreSQL.
- **E.** Use AWS Database Migration Service (AWS DMS) with a full load and ongoing change data capture (CDC) to replicate the data to Aurora PostgreSQL until cutover.

<details><summary>Answer</summary>

**Correct: B, E**

- **A** ❌ RDS for Oracle reduces operational work, but the company would still pay for Oracle licenses. This breaks the requirement to eliminate commercial licensing.
- **B** ✅ AWS SCT converts schema objects and procedural code from Oracle to PostgreSQL and reports code that needs manual work. A heterogeneous migration needs this conversion step before data is moved.
- **C** ❌ Data Pump files are an Oracle-specific format that PostgreSQL cannot import. This approach also requires downtime for the whole export and import.
- **D** ❌ An Oracle backup cannot be restored into PostgreSQL, and shipping a device takes days. Changes made during transit would be lost, which breaks the 15-minute downtime limit.
- **E** ✅ AWS DMS copies the existing data and then keeps the target in sync through CDC while the source stays online. Cutover needs only a short pause to let replication catch up.

A heterogeneous migration to remove commercial licensing pairs schema conversion (AWS SCT or DMS Schema Conversion) with AWS DMS data replication. DMS moves data but does not convert procedural code, and full load plus CDC keeps downtime to minutes. Staying on Oracle in any form keeps the license cost.

</details>

### cost-4.3-12

_Aurora PostgreSQL, Babelfish, RDS for SQL Server_

A company runs a line-of-business application on Amazon RDS for SQL Server Enterprise Edition with license-included pricing. SQL Server license fees are the largest part of the database bill. The application's data access layer uses SQL Server client drivers and calls hundreds of T-SQL stored procedures.

The company wants to stop paying for SQL Server licenses. The development team can change connection strings, but it has no budget to rewrite the data access layer or replace the drivers.

Which solution will meet these requirements?

- **A.** Migrate the database to Amazon RDS for PostgreSQL with Babelfish turned on, and point the connection strings at port 1433.
- **B.** Move to Amazon RDS for SQL Server Standard Edition with license-included pricing, and stop using Enterprise-only features.
- **C.** Migrate the database to Amazon Aurora PostgreSQL with Babelfish turned on, and point the connection strings at its T-SQL port.
- **D.** Migrate the database to Amazon Aurora PostgreSQL. Use AWS SCT to convert the T-SQL procedures to PL/pgSQL, and use AWS DMS to move the data.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Babelfish is a capability of Aurora PostgreSQL-Compatible Edition. Amazon RDS for PostgreSQL does not offer Babelfish, so it cannot accept SQL Server client connections or run T-SQL.
- **B** ❌ Standard Edition is cheaper than Enterprise Edition, but license-included pricing still charges for SQL Server licenses. This lowers the license cost but does not remove it.
- **C** ✅ Babelfish for Aurora PostgreSQL accepts connections from SQL Server clients over the TDS protocol on port 1433 and runs most T-SQL. The application keeps its drivers and most of its code, and Aurora PostgreSQL has no commercial license fee.
- **D** ❌ This removes the license cost, but the application would have to switch to PostgreSQL drivers and call converted procedures. That is the data access layer rewrite the team cannot afford.

Babelfish lets Aurora PostgreSQL understand the SQL Server TDS wire protocol and T-SQL, so applications can leave SQL Server licensing with few code changes and no driver change. Babelfish is available only on Aurora PostgreSQL, not on RDS for PostgreSQL. A conventional SCT and DMS migration also removes licensing but requires application changes. Some T-SQL features are unsupported, so run a compatibility assessment first.

</details>

### cost-4.3-13

_Redshift_

A company has an Amazon Redshift provisioned RA3 cluster that analysts use only from 8:00 AM to 6:00 PM on weekdays. No queries or loads run outside those hours. The cluster runs 24/7 today. The company wants to reduce costs while keeping the existing cluster, its endpoint, and its configuration.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Purchase reserved nodes for the cluster with a 1-year term.
- **B.** Create a Redshift schedule that pauses the cluster at 6:00 PM and resumes it at 8:00 AM on weekdays.
- **C.** Take a snapshot and delete the cluster every evening. Restore the cluster from the snapshot every morning by using an AWS Lambda function.
- **D.** Schedule an elastic resize to the smallest node count every evening and back to the full size every morning.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ Reserved nodes lower the hourly rate but are billed for every hour of the term. The cluster is used for about 50 of 168 hours each week.
- **B** ✅ A paused Redshift cluster is billed only for storage, not for compute. Scheduled pause and resume are built into Redshift and keep the same cluster and endpoint.
- **C** ❌ Deleting and restoring removes compute cost but requires custom automation and restore time each morning. Pause and resume give the same savings with a built-in feature.
- **D** ❌ A resized cluster still bills compute for the remaining nodes overnight, and twice-daily resizes add operational risk. Pausing stops compute billing completely.

Redshift provisioned clusters can be paused and resumed on a schedule, and compute billing stops while they are paused. Reserved nodes suit always-on clusters, not part-time ones. Delete-and-restore saves similar money with far more effort.

</details>

### cost-4.3-14

_Redshift, Redshift Serverless_

A company runs an Amazon Redshift provisioned cluster of four ra3.4xlarge nodes 24/7. A nightly ETL job runs for about 1 hour. During the day, a few analysts run ad hoc queries at unpredictable times. In total, the cluster runs queries for less than 3 hours each day.

Query performance must stay about the same. The company does not want to manage cluster sizes or schedules, and it will not make a long-term commitment because it will review its analytics platform next year.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Create a Redshift schedule that pauses the cluster after the nightly ETL job and resumes it at 8:00 AM on weekdays.
- **B.** Use elastic resize to reduce the cluster to two ra3.4xlarge nodes, and keep the cluster running 24/7.
- **C.** Resize the cluster to two ra3.xlplus nodes, and turn on concurrency scaling to add capacity when queries start to queue.
- **D.** Migrate the data warehouse to Amazon Redshift Serverless with a base capacity sized for the current query performance.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ A paused cluster stops compute billing, but it cannot run the ad hoc queries that arrive at unpredictable times, and the company does not want to manage schedules.
- **B** ❌ Halving the nodes halves the hourly cost, but the cluster is still billed for 24 hours to serve less than 3 hours of queries, and queries would slow down.
- **C** ❌ Concurrency scaling adds capacity only when queries queue, which this light workload rarely does. Smaller nodes slow down each query, and the main cluster is still billed 24/7.
- **D** ✅ Redshift Serverless bills RPU capacity per second only while queries run, with a 60-second minimum, and it scales automatically. Idle time costs nothing for compute, and no commitment is needed.

Redshift Serverless suits intermittent, unpredictable workloads because compute is billed only while queries run and capacity is managed automatically. Pause and resume schedules fit predictable idle windows, and resizing or concurrency scaling still pays for an always-on cluster. For steady, around-the-clock workloads, provisioned clusters with reserved nodes are usually cheaper.

</details>

### cost-4.3-15

_DynamoDB_

A company has an Amazon DynamoDB table that stores device telemetry. The table uses on-demand capacity mode. For the past year, traffic has been steady 24/7 at about 5,000 writes per second and 3,000 reads per second, and it will continue for at least 3 years. Telemetry items are not needed after 90 days, but they remain in the table today. Items written in the past 90 days are read frequently.

Which combination of actions will reduce costs the MOST? (Choose TWO.)

- **A.** Switch the table to provisioned capacity mode with auto scaling, and purchase DynamoDB reserved capacity for the steady baseline.
- **B.** Change the table class to DynamoDB Standard-Infrequent Access.
- **C.** Add a DynamoDB Accelerator (DAX) cluster in front of the table.
- **D.** Add an expiration attribute to each item and enable Time to Live (TTL) to delete items 90 days after they are written.
- **E.** Convert the table to a global table with a replica in a second AWS Region.

<details><summary>Answer</summary>

**Correct: A, D**

- **A** ✅ Steady, predictable throughput is cheaper in provisioned mode than on demand, and reserved capacity adds a further discount for a long-term baseline.
- **B** ❌ Standard-IA lowers the storage price but raises read and write prices by about 25%, and DynamoDB reserved capacity is not available for the Standard-IA table class. For this throughput-heavy table, provisioned capacity with reserved capacity saves more.
- **C** ❌ DAX caches repeated reads. Telemetry is mostly writes and fresh reads, so DAX would add node cost without reducing the bulk of the throughput cost.
- **D** ✅ TTL removes items that are no longer needed without consuming write capacity. This stops paying to store a growing backlog of old telemetry.
- **E** ❌ A global table replicates every write to another Region, which roughly doubles write and storage costs. Nothing in the scenario requires multi-Region access.

Two independent levers apply: match the capacity mode to the traffic pattern, and stop storing data that is no longer needed. Steady traffic favors provisioned capacity with reserved capacity, and TTL removes expired items without consuming write capacity. Standard-IA is the near miss: it raises throughput prices and cannot be combined with reserved capacity.

</details>

### cost-4.3-16

_Aurora_

A company runs an Amazon Aurora PostgreSQL cluster for a high-volume transaction processing application. A review of the bill shows that I/O charges are about 45% of the total Aurora cost for the cluster, and the workload pattern is stable. The company does not want to change the application or the instance sizes.

Which solution will reduce Aurora costs the MOST?

- **A.** Add Aurora Replicas and send read queries to the reader endpoint.
- **B.** Migrate the database to Amazon RDS for PostgreSQL with Provisioned IOPS SSD (io2) storage.
- **C.** Change the cluster storage configuration to Aurora I/O-Optimized.
- **D.** Purchase reserved DB instances for the cluster instances on the Aurora Standard configuration.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Adding replicas adds instance cost. Aurora bills I/O at the cluster storage level, so moving reads to replicas does not remove the I/O charges.
- **B** ❌ Provisioned IOPS storage has a predictable price, but the migration changes the engine platform and gives up Aurora features. It is a larger change than a configuration switch, and provisioned IOPS for a high-volume workload is costly.
- **C** ✅ Aurora I/O-Optimized removes per-request I/O charges in exchange for higher instance and storage prices. AWS recommends it when I/O is more than about 25% of Aurora spend, which this cluster exceeds.
- **D** ❌ Reserved DB instances discount instance hours, but they do not reduce I/O charges, which are almost half of the cost.

Aurora Standard bills per I/O request, while Aurora I/O-Optimized includes I/O in higher instance and storage prices. The rule of thumb is to switch when I/O exceeds about 25% of Aurora spend. Reserved instances can be combined with I/O-Optimized, but alone they do not touch I/O charges.

</details>

### cost-4.3-17

_Aurora, Aurora cloning_

A company's QA team needs a fresh copy of a 5 TB production Amazon Aurora MySQL database every morning to run tests that modify a small fraction of the data. Today the team restores the previous night's snapshot to a new cluster, which takes hours and doubles storage cost. Each copy is deleted at the end of the day.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Create an Aurora clone of the production cluster each morning, and delete the clone at the end of the day.
- **B.** Add an Aurora Replica to the production cluster and give the QA team access to the replica.
- **C.** Use AWS DMS to replicate the production database to a separate Aurora cluster for QA.
- **D.** Export the production database to Amazon S3 each night and load it into a new QA cluster each morning.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ Aurora cloning uses a copy-on-write protocol, so the clone shares the production storage and stores only pages that change. Clones are created quickly, and the small fraction of modified data keeps storage cost low.
- **B** ❌ An Aurora Replica is read-only and shares the production cluster volume. The QA tests modify data, so they cannot run on a replica.
- **C** ❌ A DMS target holds a full copy of the 5 TB data and needs a replication instance. The QA team's changes would also conflict with ongoing replication.
- **D** ❌ Export and reload is slower than a snapshot restore and still creates a full copy of the data. It does not reduce time or storage cost.

Aurora cloning is the fast, cheap way to create writable copies for testing, because storage is shared until pages change. Snapshot restores and DMS copies duplicate all the data. A read replica is not writable.

</details>

## Task 4.4

### cost-4.4-01

_VPC, NAT gateway, VPC endpoints, S3_

A company runs a data processing application on Amazon EC2 instances in private subnets. The instances read and write about 60 TB each month to Amazon S3 buckets in the same AWS Region. All traffic to S3 currently flows through NAT gateways, and NAT gateway data processing charges have become a large part of the bill. The instances still need outbound internet access for software updates.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Create an interface VPC endpoint for Amazon S3 in each private subnet. Use the endpoint DNS names in the application.
- **B.** Replace the NAT gateways with NAT instances on small EC2 instances.
- **C.** Create a gateway VPC endpoint for Amazon S3 and add it to the route tables of the private subnets. Keep the NAT gateways for internet traffic.
- **D.** Move the EC2 instances to public subnets and assign public IP addresses so that they reach S3 through an internet gateway.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ An interface endpoint keeps S3 traffic off the NAT gateways, but interface endpoints have hourly charges per Availability Zone and per-GB processing charges. A gateway endpoint does the same job with no charge.
- **B** ❌ NAT instances avoid NAT gateway processing charges but must carry 60 TB each month, which requires larger instances, and the company must manage their patching, scaling, and failover.
- **C** ✅ Gateway endpoints for S3 have no hourly or data processing charges. Adding the endpoint to the private route tables sends S3 traffic directly to S3, while NAT gateways continue to handle software updates.
- **D** ❌ This avoids NAT charges but exposes the instances to the internet, which weakens the security design. A gateway endpoint removes the cost without that exposure.

S3 and DynamoDB are the only services with gateway endpoints, and gateway endpoints are free. Interface endpoints for S3 exist and are needed for access from on premises or other Regions, but they cost money per hour and per GB. Removing S3 traffic from NAT gateways is one of the most common network cost wins.

</details>

### cost-4.4-02

_ECR, VPC endpoints, NAT gateway, S3, ECS_

A company runs Amazon ECS tasks in private subnets. The tasks are replaced often, and each new task pulls container images of several gigabytes from Amazon ECR in the same AWS Region. All image pulls go through NAT gateways, and the NAT gateway data processing charges have grown sharply. The tasks must keep their NAT gateway route for calls to an external partner API.

A new security rule requires that image pull traffic must not pass through the NAT gateways.

Which combination of steps will meet these requirements MOST cost-effectively? (Choose TWO.)

- **A.** Create interface VPC endpoints for the Amazon ECR API (com.amazonaws.region.ecr.api) and the Docker registry (com.amazonaws.region.ecr.dkr) with private DNS enabled.
- **B.** Create an interface VPC endpoint for Amazon S3 for the image layer downloads.
- **C.** Add a NAT gateway in each Availability Zone so that tasks use the NAT gateway in their own Availability Zone.
- **D.** Create a gateway VPC endpoint for Amazon S3 and associate it with the private subnet route tables.
- **E.** Peer the VPC with a shared services VPC that has its own NAT gateways and route image pulls through the peering connection.

<details><summary>Answer</summary>

**Correct: A, D**

- **A** ✅ The ecr.api and ecr.dkr endpoints carry the ECR API calls, authentication, and image manifests privately. Without them, this part of every pull still goes through the NAT gateways, which breaks the security rule.
- **B** ❌ An interface endpoint for S3 would carry the layer downloads privately, but it adds hourly and per-GB processing charges. The S3 gateway endpoint carries the same traffic at no charge.
- **C** ❌ Zonal NAT gateways avoid cross-AZ data transfer and improve resilience, but every image byte would still incur NAT gateway processing charges.
- **D** ✅ Amazon ECR stores image layers in Amazon S3. A gateway endpoint for S3 carries the large layer downloads with no hourly or data processing charge.
- **E** ❌ VPC peering does not support edge-to-edge routing through a peer's NAT gateway. Even if it did, the traffic would still incur NAT processing charges.

Fully private ECR pulls need the ecr.api and ecr.dkr interface endpoints plus an S3 endpoint for the image layers, which make up most of the bytes. The free S3 gateway endpoint is the cost-optimal choice for the layers. Interface endpoints are justified here because the security rule requires that no part of the pull uses the NAT gateways.

</details>

### cost-4.4-03

_EC2, Placement groups, Data transfer_

A company runs a nightly distributed analytics job on 40 Amazon EC2 instances. During the job, the instances exchange about 300 TB of shuffle data with each other over their private IP addresses. The instances are currently spread across three Availability Zones, and inter-AZ data transfer charges now exceed the compute cost. The job is fault tolerant: if it fails, it can be rerun the next morning with no business impact.

Which solution will reduce the data transfer cost MOST?

- **A.** Launch all 40 instances for the job into a cluster placement group in a single Availability Zone.
- **B.** Launch all 40 instances for the job into a spread placement group in a single Availability Zone.
- **C.** Launch the instances into a partition placement group with partitions in each of the three Availability Zones.
- **D.** Replace the 40 instances with 10 larger instances that have four times the vCPUs each, still across three Availability Zones.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ Data transfer between instances in the same Availability Zone over private IP addresses has no charge, so the shuffle traffic becomes free. A cluster placement group holds any number of instances and also lowers latency. The job can be rerun if the zone has a problem.
- **B** ❌ A single Availability Zone would remove the inter-AZ charges, but a spread placement group allows at most seven running instances per Availability Zone. The 40-instance job cannot launch this way.
- **C** ❌ Partition placement groups isolate groups of instances on separate racks and can span Availability Zones. The instances stay in three zones, so the shuffle traffic still incurs inter-AZ charges.
- **D** ❌ Fewer, larger instances keep more of the shuffle on each host, but most data still crosses zones and is charged in both directions. It reduces the charges less than moving to one zone.

Same-AZ traffic over private IPs is free, so moving a rerunnable batch job into one Availability Zone removes the transfer charge entirely. The placement strategy then matters: cluster groups hold large fleets close together, spread groups cap at seven instances per zone, and partition groups can still span zones.

</details>

### cost-4.4-04

_S3, S3 Replication, S3 Multi-Region Access Points, Data transfer_

A company's analytics application runs on Amazon EC2 in us-west-2. Ten times a day, the application reads the same 2 TB dataset from an S3 bucket in eu-central-1. A partner adds new objects to the dataset each night. The cross-Region data transfer charges are now the largest item on the bill. The application cannot be moved out of us-west-2.

Which solution will reduce data transfer costs MOST?

- **A.** Enable S3 Transfer Acceleration on the eu-central-1 bucket, and change the application to read through the accelerate endpoint.
- **B.** Create a gateway VPC endpoint for Amazon S3 in the us-west-2 VPC, and add it to the route tables of the private subnets.
- **C.** Create an S3 Multi-Region Access Point for the eu-central-1 bucket, and change the application to read through the access point.
- **D.** Copy the dataset once to a bucket in us-west-2, replicate new objects with S3 Cross-Region Replication, and read from that bucket.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ Transfer Acceleration speeds up long-distance transfers through edge locations, but it adds a per-GB charge on top of data transfer. Each of the 10 daily reads would still transfer the full dataset across Regions.
- **B** ❌ Gateway endpoints reach S3 only in the same Region as the VPC. They cannot carry traffic to a bucket in eu-central-1.
- **C** ❌ A Multi-Region Access Point routes requests to the closest of its buckets. With only the eu-central-1 bucket, every read still crosses Regions and adds a per-GB data routing charge.
- **D** ✅ The company pays cross-Region transfer once per object instead of ten times a day. Reads from a bucket in the same Region as the EC2 instances have no data transfer charge.

Repeated cross-Region reads multiply transfer charges; replicating the data once to the consuming Region pays the charge only once. Gateway endpoints are Regional, which is a common trap. Transfer Acceleration and Multi-Region Access Points change how requests are routed, but they do not reduce the bytes that cross Regions unless a copy of the data exists closer to the reader.

</details>

### cost-4.4-05

_CloudFront, S3_

A software company distributes installer files of 1 GB to 4 GB from an Amazon S3 bucket in us-east-1. Customers download the files directly from S3 by using public URLs, about 500 TB each month. Most downloads are of the five latest installers. The customers are in North America, Europe, Japan, Australia, and Brazil, and the company has large customer bases in each. The company wants to reduce data transfer costs and must improve download speed for customers in every one of these locations.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Enable S3 Transfer Acceleration on the bucket and give customers the accelerate endpoint URLs.
- **B.** Create a CloudFront distribution with the bucket as the origin through origin access control, and use Price Class All.
- **C.** Create a CloudFront distribution with the bucket as the origin through origin access control, and use Price Class 200.
- **D.** Create a CloudFront distribution with the bucket as the origin through origin access control, and use Price Class 100.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ Transfer Acceleration improves long-distance transfer speed but adds a per-GB fee on top of S3 data transfer out. It does not cache, so costs would rise.
- **B** ✅ Origin fetches from S3 to CloudFront are free and the popular installers are cached at the edge. Price Class All includes edge locations in South America and Australia, so customers in Brazil and Australia also get faster downloads.
- **C** ❌ Price Class 200 includes Japan but excludes South America and Australia. Customers in Brazil and Australia would be served from more distant edges, which does not meet the speed requirement for them.
- **D** ❌ Price Class 100 has the lowest cost but uses only edge locations in North America, Europe, and Israel. Customers in Japan, Australia, and Brazil would not see the required speed improvement.

CloudFront cuts S3 egress cost for widely downloaded content because origin fetches are free and cached objects are served from the edge. Price classes trade cost for reach: lower classes exclude expensive edges, and viewers in excluded areas get slower performance. When every listed location needs faster downloads, choose the cheapest price class that covers all of them.

</details>

### cost-4.4-06

_Direct Connect, Site-to-Site VPN, Data transfer_

A media company sends about 400 TB each month from AWS to its on-premises studios, and about 50 TB from the studios to AWS. Transfers run continuously, and the company needs consistent throughput of at least 5 Gbps. Today the traffic uses AWS Site-to-Site VPN over the internet, and both the data transfer out charges and the throughput variability are causing problems.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Add more Site-to-Site VPN tunnels and use ECMP across them on an AWS Transit Gateway to increase bandwidth.
- **B.** Enable acceleration on the Site-to-Site VPN connections.
- **C.** Ship the outbound data each week by using AWS Snowball Edge devices.
- **D.** Provision a 10 Gbps AWS Direct Connect dedicated connection and send the traffic over it.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ ECMP over multiple tunnels increases aggregate bandwidth, but the traffic still crosses the internet with variable throughput and is billed at internet data transfer out rates.
- **B** ❌ Accelerated VPN uses the AWS global network to improve performance, but it adds charges and the traffic is still billed at internet data transfer out rates.
- **C** ❌ Snowball suits one-time or periodic bulk transfers, but these transfers run continuously. Weekly shipments would add days of delay.
- **D** ✅ Direct Connect gives consistent private bandwidth, and data transferred out over Direct Connect is billed at a lower per-GB rate than internet data transfer out. At 400 TB each month, the savings outweigh the port-hour charges.

For large, continuous outbound volumes, Direct Connect lowers data transfer out rates and provides consistent throughput. VPN is cheaper to start and fine for low volumes, but it is billed at internet egress rates. Data into AWS is free on both, so outbound volume drives the decision.

</details>

### cost-4.4-07

_Site-to-Site VPN, Transit Gateway, Direct Connect_

A retail company is opening a small regional office that needs encrypted access to applications in one VPC. The office will transfer about 50 GB each month. Throughput of 100 Mbps is enough, and occasional internet variability is acceptable. The office router supports IPsec and BGP. The office opens in 10 days, and the connection must be ready by then. The company has no plans to connect other VPCs.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Create an AWS Site-to-Site VPN connection between a virtual private gateway on the VPC and the office router.
- **B.** Create a transit gateway attached to the VPC, then create an accelerated Site-to-Site VPN connection on it.
- **C.** Create a transit gateway attached to the VPC, then create a Site-to-Site VPN connection on it.
- **D.** Order a 100 Mbps AWS Direct Connect hosted connection from a partner and run a VPN over it.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ A Site-to-Site VPN on a virtual private gateway is encrypted, can be ready within hours, and has only the VPN connection-hour and data transfer out charges. It fits one VPC with small volumes and tolerance for internet variability.
- **B** ❌ Accelerated VPN routes traffic through AWS Global Accelerator for more consistent performance and is supported only on transit gateways. It adds acceleration charges and transit gateway charges that the company does not need.
- **C** ❌ This works, but a transit gateway adds an hourly charge for each attachment and a per-GB data processing charge. With one VPC and no plans for more, a virtual private gateway is cheaper.
- **D** ❌ A hosted connection gives consistent performance, but partner provisioning usually takes longer than 10 days, and it adds port-hour and partner charges that 50 GB each month does not justify.

For one VPC, terminate Site-to-Site VPN on a virtual private gateway: a transit gateway adds attachment and data processing charges that pay off only when many VPCs or networks share it. Accelerated VPN, available only on transit gateways, is for when internet variability is not acceptable.

</details>

### cost-4.4-08

_VPC peering, Transit Gateway, PrivateLink_

A company has two VPCs in the same AWS Region and account: one for an application tier and one for a data tier. The VPCs have non-overlapping CIDR ranges and exchange about 200 TB of traffic each month, and applications in each VPC initiate connections to the other. No other VPCs or on-premises networks need to connect to them, and no transitive routing is required.

Which solution will provide connectivity MOST cost-effectively?

- **A.** Create an AWS Transit Gateway and attach both VPCs.
- **B.** Expose the data tier through an AWS PrivateLink endpoint service and create interface endpoints in the application VPC.
- **C.** Create a VPC peering connection between the two VPCs and update the route tables.
- **D.** Deploy a software VPN appliance on Amazon EC2 in the application VPC, and create a Site-to-Site VPN connection to a virtual private gateway on the data VPC.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Transit Gateway works but charges per attachment per hour and a per-GB data processing fee. At 200 TB each month, the processing fee alone is significant, and no transitive routing is needed.
- **B** ❌ PrivateLink suits one-way access to specific services: only the consumer VPC can initiate connections. It adds hourly endpoint charges and per-GB processing charges, so it fails both the two-way requirement and the cost goal.
- **C** ✅ VPC peering has no hourly charge and no data processing charge. Traffic that stays within an Availability Zone over peering is free, and only standard inter-AZ rates apply otherwise.
- **D** ❌ A VPN between VPCs adds hourly VPN charges, appliance instances to manage, and a throughput limit of about 1.25 Gbps per tunnel. It is not cost-effective for 200 TB each month.

For a small number of VPCs with heavy traffic and no transitive routing, VPC peering is the cheapest connectivity option because it has no processing fee. Transit Gateway pays off when many VPCs or hybrid networks need central routing. The per-GB processing fee is the decisive cost difference.

</details>

### cost-4.4-09

_VPC sharing, AWS RAM, NAT gateway, Transit Gateway_

A company in AWS Organizations has 12 application teams, each with its own AWS account and VPC. Each VPC has three NAT gateways and a Transit Gateway attachment to reach a shared database VPC, and the teams' applications talk to each other heavily through the transit gateway. All the applications are in the same trust boundary, and each team must keep billing and resource ownership in its own account.

Which solution will reduce networking costs MOST?

- **A.** Replace the transit gateway with VPC peering connections between every pair of VPCs, including the database VPC, and keep each VPC's NAT gateways.
- **B.** Share subnets of one central VPC with the application accounts by using AWS RAM, and move the workloads and the shared database into it.
- **C.** Keep the separate VPCs, and move all NAT gateways into a central egress VPC that the transit gateway routes internet traffic to.
- **D.** Keep the separate VPCs, and replace the three NAT gateways in each VPC with a single NAT gateway per VPC.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ Full-mesh peering removes transit gateway processing charges, but it requires dozens of peering connections and still leaves 36 NAT gateways. It is costly and hard to manage.
- **B** ✅ VPC sharing lets accounts deploy into subnets owned by a central account while each account keeps ownership and billing of its resources. Teams share one set of NAT gateways, and traffic within the VPC needs no transit gateway attachments or processing fees.
- **C** ❌ Centralized egress reduces the number of NAT gateways, but all traffic between applications and to the internet still pays transit gateway processing charges.
- **D** ❌ Fewer NAT gateways lower hourly charges, but the transit gateway attachments and processing fees remain. A single NAT gateway also adds cross-AZ charges and a single point of failure in each VPC.

VPC sharing is the cost answer when many accounts in one organization share a trust boundary: one VPC, one set of NAT gateways, and no transit gateway charges for traffic between accounts. Centralized egress through Transit Gateway helps when VPCs must stay separate. Shared subnets keep ownership and billing per account.

</details>

### cost-4.4-10

_Transit Gateway, NAT gateway, VPC peering_

A company has 15 VPCs across several accounts. Each VPC has NAT gateways in three Availability Zones for outbound internet access, so the company pays for 45 NAT gateways. The VPCs are already attached to an AWS Transit Gateway for east-west traffic. Security policy requires each workload to stay in its own VPC. Outbound internet traffic is light.

Which solution will reduce NAT gateway costs MOST while keeping outbound internet access?

- **A.** Create an egress VPC with NAT gateways. Peer every workload VPC with the egress VPC and point the default routes at the peering connections.
- **B.** Replace the NAT gateways in each VPC with NAT instances on small EC2 instances.
- **C.** Create interface VPC endpoints in every VPC for each internet service that the workloads call.
- **D.** Create a central egress VPC with NAT gateways in each AZ, and route each workload VPC's default route through the transit gateway to it.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ VPC peering does not support edge-to-edge routing, so a workload VPC cannot send internet traffic through a NAT gateway in a peered VPC. This design does not work.
- **B** ❌ NAT instances can be cheaper per hour, but the company would run 45 instances that it must patch, scale, and make highly available. Centralizing NAT removes most of them instead.
- **C** ❌ Interface endpoints reach AWS services and PrivateLink services, not arbitrary internet destinations. Each endpoint also adds hourly charges in every VPC.
- **D** ✅ Centralized egress through the existing transit gateway replaces 45 NAT gateways with 3. Because internet traffic is light, the added transit gateway processing charges are much smaller than the NAT gateway hourly charges that are removed.

A centralized egress VPC behind a transit gateway consolidates NAT gateways when VPCs must stay separate. It is cost-effective when internet traffic is light, because transit gateway processing is charged per GB while NAT gateways are charged per hour. Peering cannot be used for this because it does not support transitive or edge-to-edge routing.

</details>

### cost-4.4-11

_AWS Budgets, Cost allocation tags, Cost Explorer_

A company uses AWS Organizations, and several product teams share the same AWS accounts. Every resource has a team tag that identifies the owning team. Finance wants each team lead to receive an email when that team's spend for the month is forecast to exceed its monthly allowance, before the overspend happens.

Which combination of steps will meet these requirements with the LEAST operational overhead? (Choose TWO.)

- **A.** Create an Amazon CloudWatch billing alarm on the EstimatedCharges metric for each team.
- **B.** Create a scheduled AWS Cost Explorer report for each team and email it to the team leads every week.
- **C.** Activate the team tag as a cost allocation tag in the Billing and Cost Management console of the management account.
- **D.** Turn on AWS Trusted Advisor cost optimization checks and send the weekly summary to the team leads.
- **E.** Create an AWS Budgets cost budget for each team, filtered on the team cost allocation tag, with an alert on forecasted spend that emails the team lead.

<details><summary>Answer</summary>

**Correct: C, E**

- **A** ❌ Billing alarms track actual estimated charges for the account or by service. They cannot filter by a resource tag and do not alert on forecasted spend.
- **B** ❌ Cost Explorer can show spend by tag, but a weekly report does not alert when the forecast crosses a threshold. Team leads would have to watch the numbers themselves.
- **C** ✅ A user-defined tag must be activated as a cost allocation tag before AWS cost tools can filter or group costs by it. This is required for per-team budgets.
- **D** ❌ Trusted Advisor identifies savings opportunities such as idle resources. It does not track spend against a team's allowance.
- **E** ✅ AWS Budgets can filter on cost allocation tags and can alert when forecasted spend is expected to exceed the budget. This gives each team lead an early warning without custom tooling.

Per-team spend control combines cost allocation tags, which make tag-based cost data available, with AWS Budgets, which alerts on actual or forecasted spend. CloudWatch billing alarms are account-level and actual-only. Remember that tags do not appear in billing tools until they are activated as cost allocation tags.

</details>

### cost-4.4-12

_AWS Data Exports, Cost and Usage Report, Athena, S3_

A company's FinOps team wants to analyze AWS costs by resource ID at hourly granularity for all 40 accounts in its organization in AWS Organizations. The team writes custom SQL that joins the cost data with an internal project database, and it must keep the detailed history for 3 years. The team does not want to write or run data collection code.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** In each of the 40 member accounts, create a CUR 2.0 export with resource IDs and hourly granularity that delivers to one central S3 bucket.
- **B.** Schedule an AWS Lambda function that calls the Cost Explorer GetCostAndUsageWithResources API each day and writes the results to Amazon S3.
- **C.** In the management account, create a CUR 2.0 export in AWS Data Exports with resource IDs and hourly granularity. Query it with Amazon Athena.
- **D.** In the management account, turn on hourly and resource-level data in AWS Cost Explorer, and download the filtered results as CSV files each month.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Member accounts can create their own exports, and the data would be complete. However, the team must create and maintain 40 exports and add one for every new account, which is more overhead than a single organization-wide export.
- **B** ❌ This is data collection code that the team does not want to run and maintain. Cost Explorer resource-level data also covers only the past 14 days, so any missed run loses data permanently.
- **C** ✅ A CUR 2.0 export from the management account covers every account in the organization at line-item, resource, and hourly level. It is delivered to S3, where it can be kept for 3 years and queried and joined with SQL in Athena.
- **D** ❌ Cost Explorer resource-level data covers only the past 14 days, so monthly downloads would miss most of the history. The manual downloads are also ongoing work.

The Cost and Usage Report, delivered through AWS Data Exports, is the source for detailed, long-term, SQL-based cost analysis. One export from the management account covers the whole organization, which beats per-account exports on overhead. Cost Explorer is for interactive analysis and keeps resource-level data for only 14 days.

</details>

### cost-4.4-13

_Trusted Advisor, Compute Optimizer, Elastic IP addresses, Elastic Load Balancing, EBS_

A company has the AWS Business Support+ plan. After a reorganization, many environments were abandoned. The company suspects that it is paying for Classic Load Balancers with no traffic, Elastic IP addresses that are not associated with running instances, and EBS volumes with almost no I/O.

The company wants an existing AWS service to list all three kinds of resources across its accounts without writing code.

Which solution will meet these requirements?

- **A.** Create an AWS Budgets cost budget for each account, and investigate the accounts whose spend exceeds their budgets.
- **B.** Opt in to AWS Compute Optimizer for the organization, and review its idle resource recommendations for each account.
- **C.** Review the AWS Trusted Advisor cost optimization checks in the organizational view for the flagged resources.
- **D.** Turn on AWS Config in every account with the eip-attached managed rule, and review the noncompliant resources.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Budgets alerts on spend against a threshold. It does not identify which individual resources are idle.
- **B** ❌ Compute Optimizer idle recommendations cover resources such as EC2 instances, EBS volumes, RDS databases, and NAT gateways. They do not cover load balancers or Elastic IP addresses.
- **C** ✅ Trusted Advisor has cost optimization checks for idle load balancers (Classic Load Balancers), unassociated Elastic IP addresses, and underutilized EBS volumes. Business Support+ includes the full set of checks, and the organizational view covers all accounts.
- **D** ❌ The eip-attached rule finds unattached Elastic IP addresses, but AWS Config has no managed rule for idle load balancers or low-activity EBS volumes. The company would need custom rules.

Trusted Advisor cost optimization checks flag common sources of waste such as idle Classic Load Balancers, unassociated Elastic IP addresses, and underutilized EBS volumes. Compute Optimizer idle recommendations are the near miss: they cover compute, storage, and databases but not load balancers or Elastic IP addresses. The full set of Trusted Advisor checks requires Business Support+ or higher.

</details>

### cost-4.4-14

_AWS Cost Anomaly Detection, AWS Budgets, CloudWatch_

A company's AWS spend varies widely from week to week because of seasonal campaigns. Last month, a misconfigured job created an unexpected $40,000 data transfer charge that nobody noticed for two weeks. Budget alerts with fixed amounts produced many false alarms during campaigns.

The operations team wants to be notified as soon as unusual spend is detected in any AWS service. The team does not want to build or tune alarms for each service.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Create an AWS Budgets cost budget for each service with forecasted-spend alerts at 100% of the expected monthly amount.
- **B.** Create a CloudWatch alarm for each service on the EstimatedCharges billing metric, and use an anomaly detection band as the threshold.
- **C.** Create an AWS Cost Anomaly Detection monitor for AWS services, and subscribe the operations team to a weekly summary of anomalies.
- **D.** Create an AWS Cost Anomaly Detection monitor for AWS services, and subscribe the operations team to individual alerts through Amazon SNS.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ Forecast alerts warn earlier than actual-spend alerts, but each budget still has a fixed amount that someone must adjust for every campaign. This is the false-alarm problem the company wants to avoid.
- **B** ❌ Anomaly detection bands adapt to patterns, but the team would build and tune one alarm per service. EstimatedCharges is also a month-to-date total that resets each month, which makes the band hard to tune.
- **C** ❌ Cost Anomaly Detection is the right service, but a weekly summary could deliver an anomaly up to a week after it is detected. Individual alerts notify the team as soon as an anomaly is found.
- **D** ✅ Cost Anomaly Detection uses machine learning to learn each service's normal spend, including seasonality, so no thresholds need tuning. Individual alerts are sent as soon as an anomaly is detected.

AWS Cost Anomaly Detection learns spend patterns per service and alerts on deviations, which suits variable spend where fixed thresholds fail. Alert frequency matters: individual alerts are sent when an anomaly is detected, while daily and weekly summaries batch them. Use AWS Budgets for planned allowances and anomaly detection for surprises.

</details>

### cost-4.4-15

_EC2, VPC, Elastic Load Balancing, Data transfer_

A company runs a web tier and a caching tier on Amazon EC2 instances in the same VPC and the same Availability Zone. To simplify configuration, the web servers connect to the cache servers by using the cache servers' Elastic IP addresses. The web tier reads about 80 TB each month from the cache, and the company sees regional data transfer charges for this traffic.

Which solution will remove these charges MOST cost-effectively?

- **A.** Release the Elastic IP addresses, assign auto-assigned public IPv4 addresses to the cache servers, and connect to those addresses.
- **B.** Place an internal Network Load Balancer in the same Availability Zone in front of the cache servers, and connect to its DNS name.
- **C.** Launch the web and cache servers in a cluster placement group, and keep connecting to the cache servers' Elastic IP addresses.
- **D.** Change the web servers to connect to the cache servers by using the cache servers' private IP addresses.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ Auto-assigned public IPv4 addresses are still public addresses. Traffic sent to them is billed as regional data transfer, and every public IPv4 address also has an hourly charge.
- **B** ❌ An internal load balancer uses private addresses, so the regional data transfer charge goes away. However, the company would pay hourly and capacity unit charges for 80 TB each month that a direct private connection avoids.
- **C** ❌ A cluster placement group improves network latency and throughput, but traffic addressed to Elastic IP addresses is still billed as regional data transfer.
- **D** ✅ Data transfer between instances in the same Availability Zone over private IP addresses has no charge. The change needs no new resources.

In-VPC traffic should use private IP addresses: same-AZ traffic over private IPs is free, while traffic to public or Elastic IPs is billed as regional data transfer even within one Availability Zone. A load balancer can also make the path private, but it adds its own charges. This is a frequent hidden cost that a configuration change fixes.

</details>

### cost-4.4-16

_S3, S3 Requester Pays_

A research institute shares a 500 TB genomics dataset from an Amazon S3 bucket. Hundreds of partner organizations download large parts of the dataset. Most partners use their own AWS accounts, but some download anonymously through public object URLs.

The institute's grant covers only the cost of storing the data, and its data transfer bill is growing quickly. The institute wants each downloader's own AWS bill to show the cost of its downloads, with the least ongoing administration.

Which solution will meet these requirements?

- **A.** Enable Requester Pays on the bucket, and keep a public-read bucket policy so that partners without AWS accounts can still download objects.
- **B.** Create an S3 access point for each partner with an access point policy that allows only that partner's AWS account.
- **C.** Enable Requester Pays on the bucket, and require every partner to send authenticated requests from its own AWS account.
- **D.** Put an Amazon CloudFront distribution in front of the bucket, and require partners to download through signed URLs.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Requester Pays buckets do not allow anonymous requests, because AWS must know which account to bill. Partners without AWS accounts could no longer download, and the design cannot work as described.
- **B** ❌ Access points control who can reach the data, but the bucket owner still pays for requests and data transfer through them. They also add hundreds of policies to manage.
- **C** ✅ With Requester Pays, the requester's AWS account pays for requests and data transfer, while the bucket owner pays for storage. Requests must be authenticated, so anonymous partners must start using AWS accounts.
- **D** ❌ CloudFront can lower per-GB transfer rates, but the institute still pays for all data transfer. Signed URLs control access, not who is billed.

S3 Requester Pays moves request and data transfer charges to the requester's AWS account while the owner keeps paying for storage. Requester Pays buckets reject anonymous requests, so every downloader must authenticate with an AWS account. Access points and CloudFront control or speed up access but do not change who pays.

</details>

### cost-4.4-17

_Direct Connect, Site-to-Site VPN_

A company uses one 10 Gbps AWS Direct Connect dedicated connection to reach its VPCs. Over the past year, peak utilization has never exceeded 400 Mbps, and growth is expected to stay below 600 Mbps. The company's compliance policy requires a private connection that does not traverse the public internet.

Which solution will reduce the connectivity cost MOST while meeting these requirements?

- **A.** Replace the Direct Connect connection with an AWS Site-to-Site VPN connection that uses two IPsec tunnels.
- **B.** Replace the 10 Gbps dedicated connection with a 1 Gbps hosted connection from a Direct Connect Partner.
- **C.** Add a second 10 Gbps dedicated connection, and bundle both connections into a link aggregation group (LAG).
- **D.** Keep the 10 Gbps connection and enable Direct Connect SiteLink.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ Site-to-Site VPN is cheaper, but it runs over the public internet. This breaks the compliance requirement for a private connection.
- **B** ✅ Direct Connect port-hour charges scale with port speed. A 1 Gbps hosted connection covers the 600 Mbps growth ceiling at a much lower port-hour rate and stays private.
- **C** ❌ A LAG adds bandwidth and resilience but doubles the port-hour charges. The company already uses less than 5% of one connection.
- **D** ❌ SiteLink sends traffic between on-premises sites over the AWS network and adds charges. It does not reduce the cost of the existing connection.

Direct Connect port charges depend on capacity, so an overprovisioned port is pure waste. Hosted connections from partners offer smaller capacities such as 500 Mbps or 1 Gbps. VPN is cheaper still but fails any requirement that traffic must not cross the public internet.

</details>
