# Design High-Performing Architectures

84 questions.

## Task 3.1

### performant-3.1-01

_Amazon S3_

An IoT company writes sensor readings to an Amazon S3 bucket as small objects. All objects are written under one prefix that contains the date, such as readings/2026-11-09/. At peak, the application writes about 10,000 objects each second, and many requests fail with HTTP 503 Slow Down errors.

Which solution will resolve the errors?

- **A.** Spread the objects across multiple prefixes by adding a hash of the device ID to each key after the date.
- **B.** Enable S3 Transfer Acceleration on the bucket and send writes to the accelerate endpoint.
- **C.** Use multipart upload for every object so that the parts of each object are uploaded to Amazon S3 in parallel.
- **D.** Request a service quota increase for the Amazon S3 PUT request rate on the bucket.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ Amazon S3 supports at least 3,500 PUT requests per second for each partitioned prefix. Spreading writes across several prefixes multiplies the supported request rate and removes the throttling.
- **B** ❌ Transfer Acceleration speeds up long-distance transfers through edge locations. It does not raise the request rate that a single prefix supports.
- **C** ❌ Multipart upload helps with large objects. For small objects it adds requests, which makes the request-rate throttling worse.
- **D** ❌ S3 request rates scale per prefix and are not an adjustable per-bucket service quota. The fix is to distribute the keys across prefixes.

Amazon S3 scales to at least 3,500 PUT/COPY/POST/DELETE and 5,500 GET/HEAD requests per second per prefix. Writing everything under one prefix caps throughput, so distribute keys across prefixes. Remember: 503 Slow Down at high request rates means add prefixes, not acceleration.

</details>

### performant-3.1-02

_Amazon S3_

A video platform stores user uploads in an Amazon S3 bucket in us-east-1. Users around the world upload video files of 2 GB to 4 GB over the public internet. Users in Asia and Australia report slow uploads, and uploads often fail partway through so that the whole file must be sent again.

Which combination of steps will improve upload performance and reliability? (Choose TWO.)

- **A.** Enable S3 Transfer Acceleration on the bucket and have clients upload to the accelerate endpoint.
- **B.** Configure S3 Cross-Region Replication from the bucket to a bucket in ap-southeast-2.
- **C.** Change the object key naming scheme to spread uploads across more prefixes.
- **D.** Use multipart upload with parts uploaded in parallel, and retry only the parts that fail.
- **E.** Upload the files to the S3 One Zone-Infrequent Access storage class.

<details><summary>Answer</summary>

**Correct: A, D**

- **A** ✅ Transfer Acceleration routes uploads to the nearest edge location and then over the AWS backbone to the bucket, which speeds up long-distance uploads.
- **B** ❌ Replication copies objects after they arrive in the source bucket. It does not speed up uploads into us-east-1.
- **C** ❌ More prefixes raise the request rate that a bucket supports. The problem is the speed and reliability of large uploads over long distances, not the request rate.
- **D** ✅ Multipart upload sends parts in parallel for higher throughput, and a failed part can be retried alone without sending the whole file again.
- **E** ❌ The storage class affects cost and availability. It does not change upload speed or reliability.

Transfer Acceleration addresses distance by entering the AWS network at an edge location, and multipart upload addresses large-file throughput and restarts. Prefixes address request rates, which are not the issue here. Remember: large, distant uploads mean Transfer Acceleration plus multipart upload.

</details>

### performant-3.1-03

_Amazon S3_

A genomics company stores sequence files of about 50 GB each in Amazon S3. An analysis job running on Amazon EC2 in the same Region needs only a few specific segments of each file, and an index gives the byte offset of each segment. Today the job downloads each entire file, which makes it slow.

Which solution will improve the job's performance MOST?

- **A.** Enable S3 Transfer Acceleration on the bucket and download through the accelerate endpoint.
- **B.** Store each file as multiple parts by using multipart upload, and download all parts in parallel.
- **C.** Use byte-range GET requests with the offsets from the index to fetch only the needed segments, in parallel.
- **D.** Copy each file to an Amazon EBS gp3 volume attached to the instance, and have the job read the segments from the volume.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Transfer Acceleration speeds up transfers over long distances. The job runs in the same Region and would still download every byte of each file.
- **B** ❌ Parallel downloads make a full download faster, but the job would still download 50 GB per file when it needs only small segments.
- **C** ✅ A byte-range fetch uses the Range header to retrieve only part of an object. The job downloads only the segments it needs, and parallel range requests add throughput.
- **D** ❌ Copying to EBS still transfers the whole file from Amazon S3 first, which is the step that makes the job slow.

Byte-range fetches let an application read only the bytes it needs from a large object and parallelize those reads. Remember: S3 performance tools are prefixes for request rate, multipart for large uploads, Transfer Acceleration for distance, and byte-range fetches for partial or parallel reads.

</details>

### performant-3.1-04

_Amazon EBS, Amazon EC2_

A company runs a self-managed MySQL database on an Amazon EC2 instance. The database needs a 500 GiB Amazon EBS volume that delivers a consistent 10,000 IOPS and 400 MiB/s of throughput. Testing shows that sub-millisecond latency is not required.

Which EBS volume configuration will meet these requirements MOST cost-effectively?

- **A.** A 500 GiB General Purpose SSD (gp2) volume
- **B.** A 500 GiB General Purpose SSD (gp3) volume with 10,000 IOPS and 400 MiB/s provisioned
- **C.** A 500 GiB Throughput Optimized HDD (st1) volume
- **D.** A 500 GiB Provisioned IOPS SSD (io2) Block Express volume with 10,000 provisioned IOPS

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ A gp2 volume provides 3 IOPS per GiB, so 500 GiB gives a baseline of 1,500 IOPS. Reaching 10,000 IOPS would require a much larger and more expensive volume.
- **B** ✅ gp3 lets you provision IOPS and throughput independently of volume size at a lower price than io2. It meets both performance numbers at the lowest cost.
- **C** ❌ st1 volumes are designed for large sequential throughput. They cannot deliver 10,000 random IOPS for a database.
- **D** ❌ An io2 volume meets the performance requirement, but provisioned IOPS on io2 cost more than on gp3. Its extra durability and latency features are not required here.

gp3 decouples IOPS and throughput from capacity, so a modest volume can be provisioned for 10,000 IOPS and 400 MiB/s. gp2 ties IOPS to size, and io2 costs more for performance this workload does not need. Remember: gp3 is the default cost-effective SSD; choose io2 for the highest IOPS, durability, or latency needs.

</details>

### performant-3.1-05

_Amazon EBS, Amazon EC2_

A company is moving a critical Oracle OLTP database to Amazon EC2. The database needs 150,000 sustained IOPS with consistent sub-millisecond latency on a single volume. Because the database stores financial transactions, the company wants the most durable EBS volume type available.

Which storage solution will meet these requirements?

- **A.** Attach a General Purpose SSD (gp3) volume with IOPS and throughput provisioned at the gp3 maximum.
- **B.** Use the NVMe instance store volumes of a storage optimized instance.
- **C.** Create a RAID 0 array of several gp3 volumes to combine their IOPS.
- **D.** Attach a Provisioned IOPS SSD (io2) Block Express volume provisioned for 150,000 IOPS.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ A single gp3 volume cannot reach 150,000 IOPS, and gp3 has lower durability than io2.
- **B** ❌ Instance store gives very high IOPS, but the data is lost when the instance stops or fails. It is not durable storage for financial transactions.
- **C** ❌ RAID 0 can add up IOPS, but it uses several lower-durability volumes and the failure of any one volume loses the array. It also breaks the single-volume requirement.
- **D** ✅ io2 Block Express volumes deliver up to 256,000 IOPS with sub-millisecond latency and 99.999% durability, the highest of any EBS volume type.

io2 Block Express is the EBS choice for the highest IOPS, consistent sub-millisecond latency, and 99.999% durability on one volume. RAID 0 trades durability for performance, and instance store is not persistent. Remember: io2 when the stem demands maximum IOPS and durability together.

</details>

### performant-3.1-06

_Amazon EBS, Amazon EC2_

A company runs a log analytics cluster on Amazon EC2. Each node stores 10 TiB of log data on Amazon EBS. Every hour, jobs scan the data sequentially in large blocks, and each node needs about 400 MiB/s of sustained throughput. Random I/O is rare.

Which EBS volume type will meet these requirements MOST cost-effectively?

- **A.** Cold HDD (sc1)
- **B.** Throughput Optimized HDD (st1)
- **C.** General Purpose SSD (gp3)
- **D.** Provisioned IOPS SSD (io2)

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ sc1 is the lowest-cost volume type, but a volume is limited to 250 MiB/s. It is designed for data that is accessed infrequently, not scanned every hour at 400 MiB/s.
- **B** ✅ st1 provides throughput that scales with size up to 500 MiB/s per volume. A 10 TiB st1 volume sustains about 400 MiB/s for frequently accessed sequential workloads at a low price per GiB.
- **C** ❌ gp3 can provide 400 MiB/s, but SSD storage costs much more per GiB than st1 for 10 TiB of data. SSD IOPS are not needed for sequential scans.
- **D** ❌ io2 is designed for latency-sensitive random I/O. It is the most expensive option and its performance features are not needed for sequential scans.

st1 is built for large, sequential, frequently accessed workloads such as log processing, data warehouses, and big data. sc1 is cheaper but slower and meant for cold data. Remember: st1 for hot sequential throughput, sc1 for cold data, SSD types for random IOPS.

</details>

### performant-3.1-07

_Amazon EC2, Amazon EBS, Amazon EFS_

A company runs a self-managed distributed NoSQL database on a cluster of Amazon EC2 instances. The database replicates every write to three nodes and rebuilds a lost node from the other replicas. The workload needs the lowest possible storage latency and hundreds of thousands of random IOPS per node.

Which storage solution will meet these requirements MOST cost-effectively?

- **A.** Use an Amazon EFS file system in Max I/O performance mode that all nodes share.
- **B.** Use general purpose instances with Provisioned IOPS SSD (io2) Block Express volumes.
- **C.** Use general purpose instances with General Purpose SSD (gp3) volumes provisioned at maximum IOPS.
- **D.** Use storage optimized instances and store the data on their local NVMe instance store volumes.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ EFS is a network file system with higher latency than block storage. Max I/O mode supports more parallel clients but increases latency, which breaks the lowest-latency requirement.
- **B** ❌ io2 Block Express gives high IOPS and durable storage, but provisioned IOPS are expensive and network-attached storage has higher latency than local NVMe. Durability is already provided by replication.
- **C** ❌ gp3 is low cost, but one volume cannot provide hundreds of thousands of IOPS, and its latency is higher than local NVMe storage.
- **D** ✅ Storage optimized instances provide very high random IOPS with the lowest latency from local NVMe storage, at no extra storage charge. The database's own replication covers the loss of a node's data.

When an application replicates its own data, instance store on storage optimized instances gives the lowest latency and highest IOPS without paying for durable network storage. Remember: instance store is the answer when data is temporary or protected by the application, and performance and cost matter most.

</details>

### performant-3.1-08

_Amazon EFS_

A company's continuous integration build farm uses an Amazon EFS file system that holds 500 GiB of data and uses Bursting throughput. During business hours, the build servers need a steady 200 MiB/s of mostly write throughput for about 10 hours each day. Monitoring shows that throughput is capped near 100 MiB/s for the first few hours of each day and then drops to about 25 MiB/s until the evening. The throughput need is predictable and does not change from day to day.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Switch the file system to Provisioned throughput mode with 200 MiB/s of throughput.
- **B.** Switch the file system to the Max I/O performance mode.
- **C.** Switch the file system to Elastic throughput mode.
- **D.** Move the build data to an Amazon EBS io2 volume with Multi-Attach enabled and attach it to all build servers.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ Provisioned throughput gives a fixed throughput regardless of the amount of stored data or burst credits. For a steady, known requirement it is more cost-effective than paying per GB transferred.
- **B** ❌ Performance mode affects how many parallel operations the file system handles and its latency. It does not raise the throughput limit, so builds would still slow down.
- **C** ❌ Elastic throughput scales automatically and charges for the data that is read and written. For a steady, predictable 200 MiB/s for 10 hours each day, these per-GB charges cost more than provisioning the throughput.
- **D** ❌ Multi-Attach requires a cluster-aware file system to share data safely. Ordinary file systems on a shared volume can be corrupted, so this is not a replacement for a shared file system.

With Bursting throughput, baseline throughput depends on the amount of data stored (50 KiB/s per GiB, so 25 MiB/s for 500 GiB), and a small file system can burst only to 100 MiB/s until its credits run out. Provisioned throughput fits steady, predictable demand; Elastic fits spiky, unpredictable demand. Remember: EFS throughput mode follows the shape of the workload.

</details>

### performant-3.1-09

_Amazon EFS_

A company hosts a content management system on Amazon EC2 instances that share a 200 GiB Amazon EFS file system. The application performs many small, latency-sensitive file operations. Traffic is unpredictable: the file system is mostly idle, but it receives sudden spikes that need up to 1 GiB/s of throughput for a few minutes. The company does not want to plan or manage throughput capacity.

Which combination of settings will meet these requirements MOST cost-effectively? (Choose TWO.)

- **A.** Use the General Purpose performance mode.
- **B.** Use the Max I/O performance mode.
- **C.** Use Elastic throughput mode.
- **D.** Use Provisioned throughput mode set to 1 GiB/s.
- **E.** Use Bursting throughput mode.

<details><summary>Answer</summary>

**Correct: A, C**

- **A** ✅ General Purpose performance mode has the lowest per-operation latency and is recommended for latency-sensitive workloads such as content management systems.
- **B** ❌ Max I/O supports very high levels of parallelism, but it has higher per-operation latency, which hurts small, latency-sensitive operations. It also cannot be used with Elastic throughput.
- **C** ✅ Elastic throughput scales up and down automatically with the workload, and the company pays only for the throughput it uses. This fits spiky, unpredictable traffic without capacity planning.
- **D** ❌ Provisioned throughput would handle the spikes, but the company would pay for 1 GiB/s all day while the file system is mostly idle, and it would have to manage the setting.
- **E** ❌ With 200 GiB of data, Bursting throughput has a low baseline, and bursting for small file systems does not reach 1 GiB/s. Spikes would be throttled.

General Purpose performance mode gives the lowest latency, and Elastic throughput handles unpredictable spikes with pay-per-use pricing. Max I/O trades latency for parallelism. Remember: General Purpose plus Elastic is the default for most EFS workloads; Provisioned only for steady, known demand.

</details>

### performant-3.1-10

_Amazon FSx for Lustre, Amazon S3_

A research institute stores a 200 TB dataset in Amazon S3. A new high performance computing (HPC) cluster on Amazon EC2 must process the dataset through a shared POSIX file system with sub-millisecond latency and hundreds of GB/s of aggregate throughput. Results must be written back to the same S3 bucket. The institute wants to avoid building custom copy jobs.

Which solution will meet these requirements?

- **A.** Create an Amazon EFS file system with Elastic throughput. Use AWS DataSync to copy the dataset from Amazon S3 to the file system and to copy results back.
- **B.** Create an Amazon FSx for NetApp ONTAP file system. Copy the dataset to the file system with a scheduled script and copy results back to Amazon S3.
- **C.** Create an Amazon FSx for Lustre file system and link it to the S3 bucket with a data repository association. Export results back to the bucket.
- **D.** Create an Amazon FSx for Windows File Server file system. Mount it on the cluster nodes and copy the dataset into it.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ EFS is a shared POSIX file system, but it is not designed for hundreds of GB/s of HPC throughput at sub-millisecond latency, and DataSync tasks add copy steps in both directions.
- **B** ❌ FSx for ONTAP provides low-latency NFS and SMB storage for enterprise workloads, but it has no native link to an S3 bucket and is not a parallel HPC file system. The scripts are the custom copy jobs the institute wants to avoid.
- **C** ✅ FSx for Lustre is a parallel file system for HPC with sub-millisecond latency and very high throughput. A data repository association loads S3 objects as files on first access and exports changed files back to Amazon S3.
- **D** ❌ FSx for Windows File Server provides SMB shares for Windows workloads. It is not a POSIX file system for Linux HPC nodes and has no native S3 integration.

FSx for Lustre is the HPC file system, and its data repository association with Amazon S3 presents objects as files and writes results back. Remember: HPC plus data in S3 means FSx for Lustre; Windows SMB means FSx for Windows File Server; multiprotocol enterprise NAS means FSx for ONTAP.

</details>

### performant-3.1-11

_Amazon FSx for Lustre, Amazon S3_

Once a week, an engineering firm runs a 6-hour simulation on a fleet of Amazon EC2 instances. The simulation reads input files from Amazon S3 and needs a high-throughput parallel file system while it runs. Results are exported back to Amazon S3, and the file system is deleted when the run finishes. The input data can always be reloaded from Amazon S3.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Create an Amazon FSx for Lustre persistent file system linked to the S3 bucket for each run.
- **B.** Create an Amazon EFS file system with Provisioned throughput and copy the input files into it before each run.
- **C.** Attach a Provisioned IOPS SSD (io2) volume with Multi-Attach to the instances and copy the input files to it.
- **D.** Create an Amazon FSx for Lustre scratch file system linked to the S3 bucket for each run.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ Persistent file systems replicate data within the Availability Zone for long-running workloads. That durability costs more and is not needed for a short run whose data is reloaded from Amazon S3.
- **B** ❌ EFS is a durable shared file system, but it is not a parallel HPC file system and provisioning high throughput for short runs is costly. Copying the input adds work.
- **C** ❌ Multi-Attach volumes need a cluster-aware file system, and provisioned IOPS are expensive. This is not a parallel file system with S3 integration.
- **D** ✅ Scratch file systems are designed for temporary storage and short-term processing. They do not replicate data, which lowers cost, and the data is safe in Amazon S3.

FSx for Lustre scratch file systems are the low-cost choice for short-lived processing where the source data lives in Amazon S3. Persistent file systems are for long-running workloads that need data replication. Remember: scratch for temporary jobs, persistent for long-term storage.

</details>

### performant-3.1-12

_Amazon FSx for NetApp ONTAP_

A company is migrating an on-premises network-attached storage (NAS) system to AWS. Linux application servers read and write a set of project folders over NFS, and Windows users open the same folders over SMB. A database server uses iSCSI LUNs from the same system. The storage must keep serving all clients with automatic failover if an Availability Zone fails.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Deploy two Single-AZ Amazon FSx for NetApp ONTAP file systems in different Availability Zones, and replicate the volumes between them with SnapMirror.
- **B.** Deploy a Multi-AZ Amazon FSx for Windows File Server file system for the folders, and attach an Amazon EBS io2 volume to the database server.
- **C.** Deploy a Multi-AZ Amazon FSx for NetApp ONTAP file system, and migrate the folders and LUNs to one storage virtual machine.
- **D.** Deploy a Multi-AZ Amazon FSx for OpenZFS file system for the folders, and serve the database from an Amazon EBS io2 Block Express volume.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ FSx for ONTAP serves NFS, SMB, and iSCSI, and SnapMirror can copy volumes to a second file system. Failing over means breaking the replication and repointing every client by hand, so this is not automatic and adds operational work.
- **B** ❌ FSx for Windows File Server provides SMB shares with automatic Multi-AZ failover, but it does not serve NFS to the Linux servers. An EBS volume lives in one Availability Zone and does not replace the iSCSI LUNs.
- **C** ✅ FSx for ONTAP serves the same volumes over NFS and SMB and serves LUNs over iSCSI. A Multi-AZ file system keeps a standby file server in a second Availability Zone and fails over automatically, so one managed service meets every requirement.
- **D** ❌ FSx for OpenZFS serves NFS with Multi-AZ failover, but it does not support SMB, so the Windows users cannot open the folders. An EBS volume is not iSCSI storage and stays in one Availability Zone.

FSx for NetApp ONTAP is the managed service for multiprotocol NAS (NFS and SMB on the same data, plus iSCSI block storage), and its Multi-AZ deployment fails over automatically. Two Single-AZ file systems with SnapMirror work, but failover is manual. Remember: EFS and FSx for OpenZFS are NFS, FSx for Windows is SMB, and FSx for ONTAP does all three.

</details>

### performant-3.1-13

_Amazon FSx for Windows File Server_

An engineering firm runs a Windows CAD application against a Multi-AZ Amazon FSx for Windows File Server file system with 12 TiB of HDD storage. Each project contains thousands of small files, and most file opens are for projects that have not been used recently, so they miss the file server's in-memory cache. Monitoring shows that disk IOPS stay at the file system's limit, while network throughput and file server CPU are low. The firm needs sub-millisecond latency for these file operations and must keep the existing file system, its DNS name, and its shares.

Which solution will meet these requirements?

- **A.** Update the file system's storage type from HDD to SSD, and let the storage optimization process complete in the background.
- **B.** Increase the HDD storage capacity of the file system so that it receives a higher baseline level of disk IOPS.
- **C.** Restore the latest backup to a new file system that uses SSD storage, and move users to the new file system's DNS name.
- **D.** Increase the throughput capacity of the file system so that the file server gets more memory for its in-memory cache.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ FSx for Windows File Server can change an existing file system from HDD to SSD in place. SSD storage gives sub-millisecond latency for operations that go to disk, and the file system keeps its DNS name and shares.
- **B** ❌ HDD disk IOPS scale with storage capacity, so more capacity raises the IOPS limit. However, HDD storage still has single-digit millisecond latency for each disk operation, so it cannot meet the sub-millisecond requirement.
- **C** ❌ Restoring to an SSD file system gives SSD latency, but it creates a new file system with a new DNS name. This breaks the requirement to keep the existing file system and shares.
- **D** ❌ Higher throughput capacity adds network throughput and cache memory, which helps data that is read repeatedly. Most opens here miss the cache and go to HDD storage, so their latency stays in single-digit milliseconds.

FSx for Windows File Server serves cached data from memory, but cache misses go to the storage volumes: sub-millisecond on SSD and single-digit milliseconds on HDD. An HDD file system can be upgraded to SSD in place. Remember: more HDD capacity adds IOPS, more throughput capacity adds cache and network, but only SSD lowers disk latency.

</details>

### performant-3.1-14

_AWS Storage Gateway, Amazon S3_

A company runs an on-premises application that requires iSCSI block storage. The application must have low-latency access to its entire 20 TB dataset, so all data must stay on premises. The company wants asynchronous point-in-time backups of the volumes in AWS that it can restore to Amazon EBS if needed.

Which solution will meet these requirements?

- **A.** Deploy AWS Storage Gateway as a Volume Gateway with stored volumes.
- **B.** Deploy AWS Storage Gateway as an Amazon S3 File Gateway.
- **C.** Deploy AWS Storage Gateway as a Volume Gateway with cached volumes.
- **D.** Deploy AWS Storage Gateway as a Tape Gateway.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ Stored volumes keep the entire dataset on premises for low-latency access and asynchronously back it up to AWS as point-in-time snapshots, which can be restored as EBS volumes.
- **B** ❌ S3 File Gateway presents NFS and SMB file shares backed by Amazon S3 objects. It does not provide iSCSI block storage.
- **C** ❌ Cached volumes keep the primary data in Amazon S3 and only frequently accessed data on premises. The entire dataset would not be available locally with low latency.
- **D** ❌ Tape Gateway presents a virtual tape library to backup software. It does not provide iSCSI block volumes for an application.

Volume Gateway stored volumes keep all data local and back it up asynchronously to AWS as EBS snapshots. Cached volumes keep the primary copy in AWS and cache hot data locally. Remember: stored when everything must be local, cached when only hot data needs to be.

</details>

### performant-3.1-15

_Amazon EBS_

A production database on an Amazon EC2 instance uses a General Purpose SSD (gp3) volume with the default 125 MiB/s of throughput. Monitoring shows that the volume is throughput-bound during nightly batch jobs. The company must raise the volume's throughput to 500 MiB/s before tonight's batch run without stopping the instance or the database.

Which solution will meet these requirements?

- **A.** Use Amazon EBS Elastic Volumes to modify the volume's provisioned throughput to 500 MiB/s.
- **B.** Stop the instance, change it to a larger instance type, and start it again.
- **C.** Attach a second gp3 volume and configure RAID 0 across both volumes in the operating system.
- **D.** Create a snapshot of the volume, create a Provisioned IOPS SSD (io2) volume from the snapshot, and replace the original volume.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ Elastic Volumes changes a volume's size, type, IOPS, or throughput while it stays attached and in use. A gp3 volume's throughput can be raised without stopping the instance.
- **B** ❌ This requires stopping the instance, and a larger instance does not change the throughput that the gp3 volume is provisioned for.
- **C** ❌ RAID 0 requires rebuilding the file system and moving the data, which interrupts the database. It is more complex than changing the volume's settings.
- **D** ❌ Replacing the volume requires detaching it, which stops the database. io2 is also not needed to reach 500 MiB/s.

EBS Elastic Volumes modifies performance settings of an attached volume with no downtime, and gp3 throughput can be provisioned independently of size. Remember: to change EBS performance live, modify the volume instead of replacing it.

</details>

### performant-3.1-16

_Amazon EC2, Amazon EBS_

A company runs a reporting application on a small general purpose Amazon EC2 instance with one General Purpose SSD (gp3) volume. To speed up reports, an engineer raised the volume's provisioned throughput from 125 MiB/s to 1,000 MiB/s, but measured throughput barely changed. Volume metrics show that the volume is well below its provisioned throughput. The instance's CPU and memory are underused, but the instance's EBSByteBalance% metric drops to 0% during reports.

Which solution will increase storage throughput?

- **A.** Attach a second gp3 volume and stripe both volumes with RAID 0.
- **B.** Change the volume type to Provisioned IOPS SSD (io2) with the same throughput.
- **C.** Change the instance to an instance type that has a higher maximum Amazon EBS bandwidth.
- **D.** Enable enhanced networking with the Elastic Network Adapter (ENA) on the instance.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ RAID 0 adds volume performance, but the instance's EBS bandwidth limit applies to all attached volumes combined. Total throughput would stay the same.
- **B** ❌ The volume is not the bottleneck; it is below its provisioned throughput. Any volume type is still limited by the instance's EBS bandwidth.
- **C** ✅ Each instance type has its own maximum EBS bandwidth. The EBSByteBalance% metric shows that the instance's EBS burst bandwidth is exhausted, so a type with higher EBS bandwidth removes the limit.
- **D** ❌ ENA increases the instance's network performance for general network traffic. It does not change the instance type's EBS bandwidth limit.

EBS performance is capped by both the volume and the instance. When the volume is below its provisioned rate and EBSByteBalance% is exhausted, the instance's EBS bandwidth is the limit. Remember: size the instance for EBS bandwidth, not only the volume.

</details>

### performant-3.1-17

_Amazon S3, Amazon EC2_

A machine learning team trains models on Amazon EC2 instances that all run in one Availability Zone. Each training job reads millions of small objects many times, and the team needs consistent single-digit millisecond request latency. The training data is a copy, and the source data is kept in an S3 Standard bucket.

Which storage solution will provide the LOWEST request latency for the training jobs?

- **A.** Copy the training data to the S3 One Zone-Infrequent Access storage class in a bucket in the same Region as the instances.
- **B.** Copy the training data to an S3 Express One Zone directory bucket in the instances' Availability Zone.
- **C.** Keep the data in S3 Standard and spread the objects across more prefixes.
- **D.** Enable S3 Transfer Acceleration on the S3 Standard bucket and read through the accelerate endpoint.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ S3 One Zone-IA lowers storage cost by storing data in one Availability Zone, but its latency is the same as S3 Standard and it adds retrieval charges for data that is read many times.
- **B** ✅ S3 Express One Zone stores data in one Availability Zone that you choose and is built for consistent single-digit millisecond latency and very high request rates. Co-locating it with the compute minimizes latency, and the source copy protects against an Availability Zone loss.
- **C** ❌ More prefixes raise the request rate that a bucket supports, but they do not lower the latency of each request to single-digit milliseconds.
- **D** ❌ Transfer Acceleration speeds up long-distance transfers over the internet. The instances are in the same Region, so it does not lower request latency.

S3 Express One Zone is the high-performance S3 storage class for latency-sensitive, request-heavy workloads such as ML training, placed in the same Availability Zone as the compute. Because it is single-AZ, keep a durable source copy elsewhere. Remember: Express One Zone for speed, One Zone-IA for cheap infrequent data.

</details>

## Task 3.2

### performant-3.2-01

_Amazon EC2_

A research institute runs a computational fluid dynamics simulation on 64 Amazon EC2 instances. The simulation is tightly coupled: every node exchanges boundary data with its neighbours many times each second, and overall runtime is dominated by node-to-node network latency. The institute can rerun a simulation from its last checkpoint if hardware fails.

Which EC2 placement strategy will provide the HIGHEST network performance for this workload?

- **A.** Launch the instances into a partition placement group with one partition for every eight instances in a single Availability Zone.
- **B.** Launch the instances into a cluster placement group in a single Availability Zone by using the same instance type for all nodes.
- **C.** Launch the instances into a spread placement group across three Availability Zones in the same AWS Region.
- **D.** Launch the instances without a placement group in an Auto Scaling group that spans three Availability Zones.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ Partition placement groups place groups of instances on separate racks to limit correlated hardware failure. Instances in different partitions do not share racks, so this strategy does not minimise node-to-node latency.
- **B** ✅ A cluster placement group packs instances close together inside one Availability Zone to give the lowest latency and highest per-flow throughput. This matches a tightly coupled workload, and checkpoints cover the higher blast radius.
- **C** ❌ Spread placement groups put each instance on distinct hardware and support at most seven running instances per Availability Zone, so 64 nodes do not fit in three AZs. Spreading also increases latency between nodes.
- **D** ❌ Spreading tightly coupled nodes across Availability Zones adds inter-AZ latency to every boundary exchange. This improves availability, which the institute does not need, at the cost of the performance it does need.

Cluster placement groups give the lowest latency and highest throughput between instances, which is what tightly coupled HPC needs. The institute accepts the reduced fault isolation because it can restart from checkpoints. Remember: cluster = performance, partition = large distributed systems with rack awareness, spread = a few critical instances on distinct hardware.

</details>

### performant-3.2-02

_Amazon EC2_

A company is deploying a self-managed Apache Cassandra cluster of 90 Amazon EC2 instances in one AWS Region. Cassandra replicates each row to three nodes and can be configured with rack awareness so that replicas never share a rack. The company wants to reduce the chance that a single hardware failure takes down multiple replicas of the same data.

Which solution will meet these requirements?

- **A.** Launch the instances into a spread placement group in each of three Availability Zones, and map each Availability Zone to a Cassandra rack.
- **B.** Launch the instances into a single cluster placement group, and configure Cassandra to use a simple snitch without rack awareness.
- **C.** Launch the instances into a partition placement group with three partitions, and map each partition to a Cassandra rack by using the partition number from instance metadata.
- **D.** Launch the instances on Dedicated Hosts, and allocate one Dedicated Host for each Cassandra rack.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ A spread placement group supports at most seven running instances per Availability Zone, so three AZs can hold only 21 instances. The 90-node cluster does not fit.
- **B** ❌ A cluster placement group packs instances close together for low latency. Replicas could share the same underlying hardware, which increases rather than reduces correlated failure risk.
- **C** ✅ Partition placement groups place each partition on its own set of racks and expose the partition number through instance metadata. Topology-aware software such as Cassandra can then keep replicas in separate partitions, and the group scales to hundreds of instances.
- **D** ❌ Dedicated Hosts give physical server isolation for licensing and compliance. They do not provide rack-level placement guarantees for a 90-node cluster and add significant cost and host management.

Partition placement groups are designed for large distributed and replicated workloads such as HDFS, HBase, Kafka and Cassandra. Each partition uses separate racks, and the application can read the partition number to place replicas. Spread groups give stronger isolation but are capped at seven instances per AZ.

</details>

### performant-3.2-03

_Amazon EC2_

A financial services company runs a primary-secondary pair of licensed matching-engine servers plus three supporting coordinator nodes on Amazon EC2 in a single Availability Zone. The application requires all five instances to be in the same Availability Zone. Each instance is critical, and the company wants to minimise the risk that one underlying hardware failure affects more than one instance.

Which solution will meet these requirements?

- **A.** Launch the five instances into a spread placement group in the Availability Zone.
- **B.** Launch the five instances into a partition placement group with two partitions in the Availability Zone.
- **C.** Launch the five instances into a cluster placement group in the Availability Zone.
- **D.** Launch the five instances into an Auto Scaling group with a minimum and maximum of five instances in the Availability Zone.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ A spread placement group places every instance on distinct underlying hardware with its own power and network. Five instances fit within the limit of seven per Availability Zone, so no single hardware failure can affect two of them.
- **B** ❌ A partition placement group isolates groups of instances by rack, but instances inside the same partition can share hardware. With five instances in two partitions, one failure could affect several instances.
- **C** ❌ A cluster placement group places instances close together for low latency. This increases the chance that one hardware failure affects several instances, which is the opposite of the requirement.
- **D** ❌ An Auto Scaling group replaces failed instances, but it does not control where instances are placed on underlying hardware. Several instances could still share a host or rack.

For a small number of critical instances that must not share hardware, use a spread placement group (up to seven running instances per AZ per group). Partition groups suit large topology-aware clusters, and cluster groups trade fault isolation for latency.

</details>

### performant-3.2-04

_Amazon EC2 Auto Scaling, Amazon EC2_

A company runs a Linux web application on r7i.2xlarge instances (64 GiB of memory) in an Auto Scaling group. When an instance starts, the application builds a 40 GiB in-memory index from a reference dataset, which takes 12 minutes. Traffic spikes are sudden and do not follow a predictable schedule. During spikes, users see slow responses until new instances are ready.

The company wants new capacity to be in service within a few minutes of a scale-out event.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Add a warm pool to the Auto Scaling group that keeps instances in the Stopped state after a lifecycle hook confirms the index is built.
- **B.** Raise the minimum capacity of the Auto Scaling group to the number of instances that the application needs at peak load.
- **C.** Configure predictive scaling for the Auto Scaling group so that it launches instances before the forecast demand arrives.
- **D.** Add a warm pool to the Auto Scaling group that keeps instances in the Hibernated state after a lifecycle hook confirms the index is built.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ Stopped instances cost only their EBS volumes and Elastic IP addresses, but stopping an instance discards its memory. When the instance starts, the application must rebuild the 40 GiB index, so the 12-minute delay returns.
- **B** ❌ Running peak capacity all the time removes the startup delay, but the company pays for idle running instances between spikes. This is not the most cost-effective option.
- **C** ❌ Predictive scaling forecasts load from recurring daily or weekly patterns. The spikes are unpredictable, so the forecast cannot launch capacity ahead of them.
- **D** ✅ Hibernation saves the instance's RAM to its encrypted EBS root volume and restores it on start, so the index is already in memory. Linux instances with less than 150 GiB of RAM can hibernate, and you pay only for EBS storage and Elastic IP addresses while they wait.

Warm pools cut scale-out time for applications with long initialisation. Choose the pool state by what the initialisation produces: Stopped keeps work saved to disk, Hibernated also keeps in-memory state, and Running is rarely worth its cost. Predictive scaling needs a recurring pattern, and over-provisioning works but wastes money.

</details>

### performant-3.2-05

_AWS Lambda, Amazon API Gateway_

A company exposes a pricing API through Amazon API Gateway backed by an AWS Lambda function written in Node.js. The function's initialisation code loads configuration and opens connections, which adds about 3 seconds to cold starts. Traffic is steady at about 200 concurrent requests during business hours. The company's SLA requires consistently low latency for every request during business hours.

Which solution will meet these requirements?

- **A.** Configure reserved concurrency of 200 for the function so that 200 concurrent executions are always available to it.
- **B.** Increase the function's memory allocation to the maximum of 10,240 MB so that the initialisation code runs on more CPU.
- **C.** Configure provisioned concurrency of 200 on an alias, and use scheduled scaling to apply it only during business hours.
- **D.** Move the configuration loading and connection setup from the initialisation code into the function handler.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Reserved concurrency guarantees and caps the number of concurrent executions available to a function. It does not pre-initialise execution environments, so requests can still hit cold starts.
- **B** ❌ More memory gives more CPU and can shorten initialisation, but it does not remove cold starts. Requests that land on new execution environments still wait for initialisation.
- **C** ✅ Provisioned concurrency keeps the requested number of execution environments initialised and ready, so requests do not incur cold-start latency. Scheduling it to business hours matches the steady daytime load.
- **D** ❌ Running setup inside the handler repeats the work on every invocation instead of once per execution environment. This increases latency for every request rather than reducing it.

Provisioned concurrency pre-initialises execution environments so that requests avoid cold starts, which suits steady, latency-sensitive traffic. Reserved concurrency only reserves and limits capacity; it does not warm anything. Scheduled scaling of provisioned concurrency limits the extra cost to the hours that need it.

</details>

### performant-3.2-06

_AWS Lambda_

An AWS Lambda function resizes and watermarks images uploaded to Amazon S3. The function is configured with 512 MB of memory. Amazon CloudWatch shows that each invocation uses about 300 MB of memory, takes 40 seconds, and is CPU-bound. Cold starts are rare and are not a concern. The company wants to reduce the processing time of each image.

Which solution will meet these requirements?

- **A.** Configure provisioned concurrency for the function equal to its average concurrency.
- **B.** Increase the memory allocated to the function to 3,008 MB.
- **C.** Increase the function timeout to 15 minutes and configure reserved concurrency for the function.
- **D.** Increase the function's ephemeral storage in /tmp to 10,240 MB.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ Provisioned concurrency removes cold-start latency. Cold starts are rare here, and provisioned concurrency does not change the CPU power available to each invocation.
- **B** ✅ Lambda allocates CPU power in proportion to configured memory. Raising memory gives a CPU-bound function more compute, which shortens each invocation even though the function does not need the extra memory.
- **C** ❌ A longer timeout only allows the function to run longer, and reserved concurrency only guarantees concurrency. Neither makes an individual invocation faster.
- **D** ❌ Ephemeral storage size affects how much data the function can write locally. The function is CPU-bound, so more disk space does not reduce processing time.

In Lambda, memory is the only compute knob: CPU scales with configured memory (about one full vCPU at 1,769 MB, up to six vCPUs at 10,240 MB). For CPU-bound functions, raising memory often reduces duration enough to offset the higher per-millisecond price. Concurrency settings affect scaling and cold starts, not per-invocation speed.

</details>

### performant-3.2-07

_AWS Lambda_

A company runs a Java 21 AWS Lambda function built with the Spring Boot framework. Framework initialisation makes cold starts take up to 8 seconds. Traffic is low and unpredictable, so most invocations arrive on a new execution environment. The company wants to reduce cold-start latency significantly without paying for idle pre-initialised capacity, and without rewriting the application.

Which solution will meet these requirements?

- **A.** Configure provisioned concurrency of 5 on a published version of the function.
- **B.** Rewrite the function in Node.js to reduce initialisation time.
- **C.** Configure an Amazon EventBridge rule that invokes the function every 5 minutes to keep an execution environment warm.
- **D.** Enable Lambda SnapStart on published versions of the function, and invoke the function through a version or alias.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ Provisioned concurrency removes cold starts, but the company pays for the configured environments around the clock even when traffic is idle. This breaks the requirement not to pay for idle capacity.
- **B** ❌ A lighter runtime could start faster, but this requires rewriting the application, which the company wants to avoid.
- **C** ❌ Scheduled pings keep at most a few environments warm and do not help when concurrent requests need new environments. This is a workaround that does not reliably reduce cold starts.
- **D** ✅ SnapStart takes a snapshot of the initialised execution environment when a version is published and resumes new environments from that snapshot. This greatly reduces Java cold-start latency without code rewrites and without paying for idle environments.

SnapStart restores new execution environments from a cached snapshot of an already initialised environment, which cuts cold starts for frameworks like Spring Boot. Provisioned concurrency also removes cold starts but charges for environments whether they are used or not. SnapStart works only on published versions, not $LATEST.

</details>

### performant-3.2-08

_Amazon ECS, AWS Fargate, Amazon EC2_

A company is containerising a video transcoding service that uses NVIDIA GPUs through CUDA. Each container needs one GPU. Demand varies during the day, and the number of containers and the underlying GPU capacity must scale automatically. The operations team is small and does not want to patch, update, or scale the instances that run the containers.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Run the containers on Amazon ECS with an Auto Scaling group of GPU-based EC2 instances as a capacity provider with managed scaling.
- **B.** Run the containers on Amazon ECS with AWS Fargate, and specify a GPU resource requirement in the task definition.
- **C.** Run the containers on Amazon ECS Managed Instances with a capacity provider that selects GPU-based instance types.
- **D.** Run the containers on Amazon EKS with a managed node group of GPU-based EC2 instances and the Kubernetes Cluster Autoscaler.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ ECS on EC2 supports GPU tasks, and managed scaling grows the instance fleet with the tasks. However, the company still owns the instances: it must choose and update the GPU-optimized AMI, patch the operating system, and maintain the Auto Scaling group.
- **B** ❌ Fargate removes server management, but Fargate tasks cannot use GPUs. This option cannot meet the hardware requirement.
- **C** ✅ With ECS Managed Instances, AWS provisions, scales, and patches the EC2 instances, and GPU instance types come with NVIDIA drivers and CUDA installed. The team specifies the GPU requirement in the task definition and does not manage the instances.
- **D** ❌ EKS managed node groups can run GPU pods, but the team must operate the Kubernetes cluster, run the Cluster Autoscaler, and start node group AMI updates. This is more operational work than ECS Managed Instances.

Fargate does not support GPUs. When containers need GPUs and the team does not want to manage instances, use ECS Managed Instances: AWS handles provisioning, scaling, and patching of GPU instances. ECS on a self-managed Auto Scaling group works but leaves AMI and patching work with the company.

</details>

### performant-3.2-09

_AWS Batch, Amazon EC2_

A genomics company processes sequencing runs in a containerised pipeline. Each run produces about 5,000 independent alignment jobs that each take 1–3 hours, followed by a merge job that must start only after every alignment job succeeds. Runs arrive a few times each week. The company wants compute capacity to scale up for each run and back to zero afterwards, and it does not want to build its own job scheduler.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Invoke an AWS Lambda function for each alignment job, and use an Amazon SQS queue to trigger the merge job when all messages are processed.
- **B.** Run a self-managed Slurm scheduler on Amazon EC2 instances in an Auto Scaling group, and submit the alignment and merge jobs to Slurm.
- **C.** Submit the alignment jobs to AWS Batch as an array job in a managed compute environment with a minimum of 0 vCPUs, and submit the merge job with a dependency on the array job.
- **D.** Create a persistent Amazon EMR cluster, and run the alignment jobs and the merge job as EMR steps.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Lambda functions time out after 15 minutes, so they cannot run alignment jobs that take 1–3 hours.
- **B** ❌ Slurm can schedule the jobs and dependencies, but the company must install, operate and scale the scheduler itself, which the company wants to avoid.
- **C** ✅ AWS Batch queues and schedules containerised jobs, scales a managed compute environment from zero to the needed capacity and back, and supports array jobs with job dependencies. This meets every requirement without a self-built scheduler.
- **D** ❌ EMR is designed for big data frameworks such as Spark and Hadoop. A persistent cluster keeps running between runs, and EMR steps are not a natural fit for thousands of independent containerised jobs.

AWS Batch is the managed choice for large numbers of containerised batch jobs: it provides queues, array jobs, job dependencies and compute environments that scale to zero. Lambda fails the 15-minute limit, and self-managed schedulers add operational overhead.

</details>

### performant-3.2-10

_Amazon EMR, Amazon EC2_

A company runs a nightly Apache Spark job on an Amazon EMR cluster. The job reads its input from Amazon S3 and writes results back to Amazon S3. The job must finish within a 3-hour window, and it now takes 4 hours as data volume grows. The company wants to add processing capacity at the lowest possible cost. The added capacity must be reliably obtainable every night, and reclaimed capacity must never cause the loss of the cluster or of data stored in HDFS.

Which combination of steps will meet these requirements? (Choose TWO.)

- **A.** Run the primary node and the core nodes on On-Demand Instances.
- **B.** Add a task instance fleet that uses Spot Instances and specifies several instance types across multiple instance families.
- **C.** Run the core nodes on Spot Instances so that more core nodes can be added for the same budget.
- **D.** Run the primary node on a Spot Instance to reduce the cost of the cluster.
- **E.** Add a task instance group that uses Spot Instances of a single instance type in a single Availability Zone.

<details><summary>Answer</summary>

**Correct: A, B**

- **A** ✅ The primary node manages the cluster and core nodes store HDFS data. Keeping them On-Demand means a Spot interruption cannot terminate the cluster or lose HDFS blocks.
- **B** ✅ Task nodes run Spark executors but store no HDFS data, so losing them only slows the job. Spot capacity is deeply discounted, and diversifying instance types improves the chance of getting and keeping Spot capacity.
- **C** ❌ Core nodes host HDFS. If Spot capacity is reclaimed, HDFS data on those nodes can be lost and the job can fail, which breaks the requirement.
- **D** ❌ If the primary node is interrupted, the whole EMR cluster terminates. This risks losing the cluster, which the company wants to avoid.
- **E** ❌ Task nodes on Spot are the right idea, but depending on a single instance type in one Availability Zone makes it more likely that Spot capacity is unavailable or reclaimed all at once. This breaks the requirement for capacity that is reliably obtainable every night.

Use Spot Instances for EMR task nodes, which hold no HDFS data, and keep the primary and core nodes On-Demand. Instance fleets with several instance types make Spot capacity more available. Spot on the primary node risks the cluster, and Spot on core nodes risks HDFS data.

</details>

### performant-3.2-11

_Amazon EC2, Elastic Fabric Adapter_

A weather forecasting company is moving a Message Passing Interface (MPI) application from an on-premises InfiniBand cluster to Amazon EC2. The application runs on 32 instances and scales well only when inter-node latency is very low and consistent. The company has measured that standard TCP networking between instances limits how far the application scales.

Which combination of steps should a solutions architect take to provide the HIGHEST inter-node performance? (Choose TWO.)

- **A.** Launch the instances into a spread placement group so that each instance runs on separate hardware.
- **B.** Attach additional elastic network interfaces to each instance, and spread MPI traffic across them.
- **C.** Launch the instances into a partition placement group with one partition for each group of eight instances.
- **D.** Launch the instances into a cluster placement group in a single Availability Zone.
- **E.** Use an instance type that supports Elastic Fabric Adapter (EFA), attach an EFA to each instance, and use an MPI library that supports EFA.

<details><summary>Answer</summary>

**Correct: D, E**

- **A** ❌ A spread placement group maximises fault isolation and is limited to seven running instances per Availability Zone. It does not reduce latency between nodes.
- **B** ❌ Extra network interfaces do not increase an instance's aggregate network bandwidth or remove TCP overhead, so they do not solve the latency problem.
- **C** ❌ Partition placement groups place partitions on separate racks. This isolates failures for distributed databases but increases latency between nodes in different partitions.
- **D** ✅ A cluster placement group places instances close together on the network, giving the lowest latency and highest throughput between them. This is the recommended placement for tightly coupled HPC.
- **E** ✅ EFA provides OS-bypass networking that lets MPI communicate directly with the network interface, giving lower and more consistent latency than TCP. This is the AWS equivalent of the InfiniBand-style interconnect the application relies on.

Tightly coupled MPI workloads on AWS use EFA for OS-bypass networking and a cluster placement group for physical proximity. ENA-based enhanced networking improves TCP throughput, but only EFA removes the kernel network stack from the MPI path.

</details>

### performant-3.2-12

_Amazon EC2, AWS Graviton_

A company runs a stateless Java web application on m5 instances in an Auto Scaling group behind an Application Load Balancer. The application and all its libraries run on the JVM, and the company has confirmed that its build pipeline can produce arm64 artifacts. Load testing shows the application is CPU-bound and needs 4 GiB of memory for each vCPU. The company wants to increase the throughput it gets for each dollar of compute spend.

Which solution will meet these requirements?

- **A.** Change the launch template to a larger x86-based instance size in the same m5 family.
- **B.** Change the launch template to an equivalent AWS Graviton-based general purpose instance type, such as m7g, and deploy arm64 artifacts.
- **C.** Change the launch template to burstable t3 instances with unlimited mode enabled.
- **D.** Change the launch template to a compute optimized x86-based instance type, such as c6i, with the same number of vCPUs.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ A larger m5 size adds vCPUs at a proportionally higher price, so throughput for each dollar stays about the same.
- **B** ✅ Graviton-based general purpose instances keep the 4 GiB per vCPU ratio and deliver better price performance than comparable x86 instances for many workloads. A JVM application with arm64-ready dependencies can move with little or no code change.
- **C** ❌ Burstable instances suit workloads with low baseline CPU and occasional bursts. A CPU-bound application runs above baseline constantly, and unlimited mode charges for the extra CPU credits.
- **D** ❌ Compute optimized instances are cheaper per vCPU, but they provide only 2 GiB of memory for each vCPU. This breaks the requirement for 4 GiB of memory per vCPU.

AWS Graviton (arm64) instances offer the best price performance in EC2 for many workloads, and interpreted or JVM-based applications usually move easily. Remember that Graviton is both a performance and a cost lever, available for EC2, Lambda, Fargate and managed databases.

</details>

### performant-3.2-13

_Amazon EC2, Amazon CloudWatch_

A company runs an in-memory analytics engine on a single c6i.4xlarge instance (16 vCPUs, 32 GiB memory). The engine cannot be distributed across multiple nodes. Metrics from the Amazon CloudWatch agent show memory utilisation above 95% with heavy swapping, while CPU utilisation stays below 25%. Query response times have become unacceptable.

Which solution will improve performance MOST cost-effectively?

- **A.** Change the instance type to c6i.8xlarge (32 vCPUs, 64 GiB memory).
- **B.** Place the instance in an Auto Scaling group and add a second instance when memory utilisation exceeds 80%.
- **C.** Change the instance type to a burstable t3.2xlarge instance with unlimited mode enabled.
- **D.** Change the instance type to r6i.4xlarge (16 vCPUs, 128 GiB memory).

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ This doubles memory, but it also doubles vCPUs that the workload does not use, so the company pays for idle compute. A memory optimized type gives more memory for the money.
- **B** ❌ The engine cannot be distributed across nodes, so a second instance cannot share the working set. Horizontal scaling does not fix the memory shortage.
- **C** ❌ A t3.2xlarge instance has 32 GiB memory, so the memory shortage remains. Burstable instances address CPU bursts, which is not the bottleneck.
- **D** ✅ Memory optimized R instances offer far more memory per vCPU. The workload is memory-bound with idle CPU, so keeping the vCPU count and quadrupling memory removes the swapping at the lowest cost.

Match the instance family to the bottleneck: compute optimized C for CPU-bound work, memory optimized R or X for large in-memory working sets, storage optimized I or D for local disk I/O. Here memory is the constraint and CPU is idle, so an R instance with the same vCPU count is the cost-effective fix.

</details>

### performant-3.2-14

_Amazon EC2_

An engineering firm runs a tightly coupled simulation every Monday on 48 c6in.32xlarge instances in a cluster placement group. Engineers launch the instances in batches of 8 as input data becomes ready, and recent runs failed because later batches returned insufficient capacity errors. The simulation must start on time every week, so the firm must be certain that all 48 instances can launch in the placement group.

Which solution will meet these requirements?

- **A.** Purchase zonal Reserved Instances for 48 c6in.32xlarge instances in the Availability Zone that contains the placement group.
- **B.** Create an On-Demand Capacity Reservation for 48 c6in.32xlarge instances in the cluster placement group, and launch into it.
- **C.** Launch all 48 instances in a single launch request of one instance type, and retry in another Availability Zone if the request fails.
- **D.** Replace the cluster placement group with a partition placement group that has seven partitions, so that EC2 can use more racks.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ Zonal Reserved Instances reserve capacity in an Availability Zone, but they cannot reserve capacity in a placement group. Launches into the cluster placement group can still fail for lack of capacity.
- **B** ✅ A Capacity Reservation created in a cluster placement group holds that capacity for the firm for as long as the reservation is active. Instances that match the reservation launch into the placement group without capacity errors.
- **C** ❌ A single launch request of one instance type is the recommended way to improve the chance of getting capacity in a cluster placement group, but it does not guarantee capacity. Moving to another Availability Zone also delays the run.
- **D** ❌ Spreading instances across partitions draws on more racks, but it gives up the low-latency placement the simulation needs. Partition placement groups also do not support Capacity Reservations, so capacity is still not guaranteed.

To guarantee capacity in a cluster placement group, create an On-Demand Capacity Reservation in the placement group. Zonal Reserved Instances and Capacity Blocks cannot reserve capacity in a placement group, and launching all instances in one request only improves the odds. Remember: placement groups decide where instances go; Capacity Reservations decide whether capacity is there.

</details>

### performant-3.2-15

_Amazon ECS, AWS Fargate, Amazon EventBridge, Amazon S3_

A company receives large data files in an Amazon S3 bucket at irregular times, a few dozen times each day. Each file must be processed by a containerised application that needs 4 vCPUs and 16 GB of memory and runs for 30–50 minutes. Processing must start within a few minutes of each upload. The company does not want to manage servers or pay for idle compute between files.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Configure an S3 event notification that invokes an AWS Lambda function packaged from the container image, with the maximum memory setting of 10,240 MB.
- **B.** Enable Amazon EventBridge notifications on the bucket, and create an EventBridge rule that runs an Amazon ECS task on AWS Fargate for each new object.
- **C.** Run an Amazon ECS service on an Auto Scaling group of EC2 instances, and have the containers poll the bucket for new files every minute.
- **D.** Launch a single Amazon EC2 instance with a cron job that checks the bucket every 5 minutes and starts the container for each new file.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ Lambda can run container images, but its maximum memory is 10,240 MB and its maximum timeout is 15 minutes. The job needs 16 GB of memory and 30–50 minutes, so it cannot run on Lambda.
- **B** ✅ EventBridge can start an ECS task directly for each S3 upload. Fargate runs the container without servers, bills only while the task runs, and has no 15-minute limit.
- **C** ❌ This processes the files, but the company must manage the EC2 instances, and the service runs and costs money even when no files arrive.
- **D** ❌ A cron-based instance runs continuously, needs patching and management, and is a single point of failure. It breaks both the no-servers and no-idle-cost requirements.

For event-driven container work that exceeds Lambda's 15-minute limit, start ECS tasks on Fargate from EventBridge. Fargate removes server management and charges only while tasks run. Lambda remains the choice when the work fits within 15 minutes.

</details>

### performant-3.2-16

_Amazon EC2 Auto Scaling, Elastic Load Balancing, Amazon CloudWatch_

A company runs an API on Amazon EC2 instances in an Auto Scaling group behind an Application Load Balancer. Each request mostly waits on calls to downstream services, so CPU utilisation stays below 30% even when the instances are saturated. The group uses a target tracking policy on average CPU utilisation of 60%, and it does not scale out during traffic surges. Load tests show that each instance handles about 500 requests per minute before latency rises.

Which solution will meet these requirements?

- **A.** Keep the CPU utilisation target tracking policy, and lower its target value to 20% so that the group scales out earlier.
- **B.** Replace the policy with a step scaling policy based on the NetworkIn metric of the instances.
- **C.** Add scheduled scaling actions that raise the minimum capacity during the hours when surges have usually occurred.
- **D.** Replace the policy with a target tracking policy on the ALBRequestCountPerTarget metric with a target value of 400.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ CPU utilisation does not track load reliably for this I/O-bound application. A lower CPU target would cause scaling at the wrong times and could keep the group over-provisioned.
- **B** ❌ NetworkIn depends on request and payload size, not on the number of concurrent requests an instance can serve, so it is an indirect signal that needs manual tuning of steps.
- **C** ❌ The problem is that the scaling metric does not reflect load. Scheduled actions cannot react to surges that happen outside the scheduled hours.
- **D** ✅ Request count per target directly measures load on each instance for a request-bound application. Target tracking adds and removes instances to hold the value below the measured capacity of 500 requests per minute.

Choose a scaling metric that tracks the real bottleneck. For I/O-bound web tiers behind an ALB, ALBRequestCountPerTarget is the predefined target tracking metric that scales with load when CPU does not.

</details>

### performant-3.2-17

_Amazon EMR, Amazon S3_

A company runs an on-premises Hadoop cluster with Apache Spark, Apache Hive and Apache HBase workloads on 200 TB of data in HDFS. The cluster is sized for peak load and sits mostly idle. The company wants to migrate to AWS with minimal changes to its existing jobs, and wants to scale compute independently of storage so that it can shut compute down when it is not needed.

Which solution will meet these requirements?

- **A.** Move the data to Amazon S3, and run the jobs on Amazon EMR clusters that use EMRFS, with HBase storing its data in Amazon S3.
- **B.** Move the data to Amazon S3, and rewrite the workloads as AWS Glue ETL jobs that use the AWS Glue Data Catalog.
- **C.** Copy the HDFS data to Amazon EBS volumes on a long-running Amazon EMR cluster, and keep HDFS as the storage layer for all jobs.
- **D.** Load the data into Amazon Redshift, and convert the Spark, Hive, and HBase jobs to SQL queries that run on the cluster.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ Amazon EMR runs Spark, Hive and HBase with minimal job changes. Storing data in S3 through EMRFS (including HBase on S3) separates storage from compute, so clusters can be resized or terminated without losing data.
- **B** ❌ AWS Glue runs serverless Spark ETL jobs, but it does not run HBase or Hive workloads as-is. Rewriting the jobs breaks the minimal-change requirement.
- **C** ❌ HDFS on EBS ties storage to the cluster. The cluster must keep running to keep the data, so compute cannot be shut down independently.
- **D** ❌ Amazon Redshift is a data warehouse for SQL analytics. Converting Spark and HBase workloads to SQL is a major rewrite, and HBase key-value access patterns do not map to Redshift.

Amazon EMR is the managed home for existing Hadoop-ecosystem jobs. Using Amazon S3 as the storage layer (EMRFS, HBase on S3) decouples storage from compute, so transient or resized clusters do not risk data. Glue is the serverless Spark option when rewriting ETL jobs is acceptable.

</details>

## Task 3.3

### performant-3.3-01

_Amazon RDS_

A company runs an order management application on an Amazon RDS for MySQL Multi-AZ DB instance deployment. Business analysts run long reporting queries against the database every afternoon, and during that time order transactions slow down because of CPU contention. The reports can tolerate data that is a few seconds old. The company wants to isolate the reporting load from the transactional workload.

Which solution will meet these requirements?

- **A.** Point the reporting tool at the standby DB instance of the Multi-AZ deployment.
- **B.** Create an RDS read replica of the DB instance, and point the reporting tool at the read replica endpoint.
- **C.** Modify the DB instance to a larger instance class with more vCPUs.
- **D.** Add an Amazon ElastiCache cluster in front of the database, and cache the results of the reporting queries.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ In a Multi-AZ DB instance deployment, the standby exists only for failover and cannot serve read traffic. The reporting tool cannot connect to it.
- **B** ✅ A read replica receives asynchronous updates from the primary and serves read-only queries on its own compute. Reports run on the replica without consuming CPU on the primary, and a few seconds of lag is acceptable.
- **C** ❌ A larger instance gives more headroom, but reports and transactions still compete on the same instance. This does not isolate the reporting load.
- **D** ❌ Caching helps for repeated identical queries. Long ad hoc reporting queries still have to run against the primary the first time, so the load is not isolated.

Offload read-only workloads such as reporting to RDS read replicas. Remember the close pair: a Multi-AZ DB instance standby is for availability and is not readable, whereas a read replica is for read scaling.

</details>

### performant-3.3-02

_Amazon Aurora_

A company runs an Amazon Aurora MySQL DB cluster with one writer instance and two Aurora Replicas. The application sends all queries, including 85% that are read-only, to the cluster endpoint. Read traffic varies widely during the day, and during peaks the writer instance reaches 95% CPU utilisation while the replicas stay nearly idle. The company wants read capacity to follow demand automatically.

Which combination of steps will meet these requirements? (Choose TWO.)

- **A.** Configure the application to send read-only queries to the cluster's reader endpoint.
- **B.** Configure the application to send read-only queries to the instance endpoint of each existing Aurora Replica in turn.
- **C.** Add an Aurora Auto Scaling policy that adjusts the number of Aurora Replicas by target tracking on average replica CPU utilisation.
- **D.** Modify the writer instance to a larger instance class.
- **E.** Create an Amazon RDS Proxy for the cluster, and point the application at the proxy's default endpoint.

<details><summary>Answer</summary>

**Correct: A, C**

- **A** ✅ The reader endpoint distributes connections across the available Aurora Replicas. Sending read-only queries there moves read load off the writer instance.
- **B** ❌ Instance endpoints connect to one specific instance. The application would have to track replicas itself and would not use replicas that are added or removed later.
- **C** ✅ Aurora Auto Scaling adds and removes Aurora Replicas as the chosen metric changes. New replicas join the reader endpoint automatically, so read capacity follows demand.
- **D** ❌ A larger writer handles more load, but read capacity stays fixed and does not follow demand. It also leaves the idle replicas unused.
- **E** ❌ RDS Proxy pools connections, but its default endpoint routes to the writer instance. Reads would still land on the writer unless a separate read-only endpoint were used.

Use the Aurora reader endpoint for read-only traffic and Aurora Auto Scaling to add or remove replicas behind it. The cluster endpoint always points to the writer, so applications that never use the reader endpoint leave replicas idle.

</details>

### performant-3.3-03

_Amazon Aurora_

A company runs an Aurora PostgreSQL DB cluster with one writer and five Aurora Replicas. Three replicas are db.r6g.large instances that serve the application's short read queries. Two replicas are db.r6g.4xlarge instances that the company added for a data science team's long analytical queries, which must run against current data. All read traffic uses the reader endpoint, and analytical queries that land on the small replicas slow down the application.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Configure the data science tools to connect to the instance endpoint of one of the db.r6g.4xlarge replicas.
- **B.** Create an Aurora clone of the cluster each morning, and point the data science tools at the clone.
- **C.** Create one custom endpoint for the two db.r6g.4xlarge replicas and another for the three db.r6g.large replicas.
- **D.** Keep using the reader endpoint for all reads, and enable Aurora Auto Scaling for replicas based on average CPU utilisation.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ An instance endpoint connects to a single replica, so the second large replica is unused and the team loses access if that instance fails or is replaced.
- **B** ❌ A clone is a separate cluster that stops receiving changes after it is created, so analysts would not query current data. Daily recreation also adds operational work.
- **C** ✅ Aurora custom endpoints load-balance connections across a chosen set of instances. Separate endpoints route each workload to the right-sized replicas, and both still read current data from the shared cluster volume.
- **D** ❌ More replicas behind the reader endpoint would still mix analytical and application queries on the same instances. This does not stop the long queries from slowing the application.

Aurora custom endpoints group specific instances so that different workloads use differently sized replicas. The reader endpoint spreads across every replica, and instance endpoints give no load balancing or failover.

</details>

### performant-3.3-04

_Amazon Aurora_

A startup is launching a multi-tenant SaaS application on Amazon Aurora PostgreSQL. Both read and write load are unpredictable and can rise from almost nothing to many times the average within minutes, then fall again. The database must scale its compute capacity automatically without interrupting existing connections. The startup has a small team and wants the LEAST operational overhead.

Which solution will meet these requirements?

- **A.** Use Aurora Serverless v2 DB instances for the writer and the readers in the Aurora cluster.
- **B.** Use provisioned Aurora instances, and configure Aurora Auto Scaling to add Aurora Replicas when CPU utilisation is high.
- **C.** Use a provisioned Aurora writer, and run an AWS Lambda function that modifies the writer's instance class when CPU utilisation crosses a threshold.
- **D.** Use Amazon RDS for PostgreSQL with storage autoscaling enabled.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ Aurora Serverless v2 adjusts the capacity of each instance in fine-grained ACU increments within seconds, without dropping connections. Because the writer also scales, write spikes are handled as well as read spikes.
- **B** ❌ Aurora Auto Scaling adds read capacity only. Every write still goes to a single fixed-size writer, so write spikes cannot be absorbed.
- **C** ❌ Changing the instance class of a provisioned writer causes a restart or failover that interrupts connections, and it requires custom automation that the team must maintain.
- **D** ❌ Storage autoscaling grows allocated storage when free space runs low. It does not change compute capacity, so CPU and memory remain fixed during spikes.

Aurora Serverless v2 scales the compute of writer and reader instances in place, in small increments, without disconnecting clients. Aurora Auto Scaling only changes the number of replicas, so it helps reads but never writes.

</details>

### performant-3.3-05

_Amazon DynamoDB_

A company stores application events in an Amazon DynamoDB table that uses provisioned capacity. The partition key is the event date in YYYY-MM-DD format, and the sort key is the event timestamp. All writes for the current day target the same partition key, and the application receives write throttling errors even though the table's consumed write capacity is far below the provisioned write capacity. Reports must still be able to retrieve all events for a given date.

Which solution will resolve the throttling?

- **A.** Increase the provisioned write capacity units for the table to several times the current peak write rate.
- **B.** Switch the table to on-demand capacity mode so that DynamoDB adapts its capacity to the write rate.
- **C.** Add a global secondary index with the event date as its partition key, and send the report queries to it.
- **D.** Append a random suffix from 1 to N to the date in each key, and have reports query all N keys for a date.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ Throttling happens because a single partition key value receives all writes and hits the per-partition throughput limit. Adding table-level capacity does not raise the limit of that one partition.
- **B** ❌ On-demand mode removes capacity planning at table level, but a single partition key value is still subject to per-partition throughput limits, so the hot key keeps throttling.
- **C** ❌ A GSI keyed on event date has the same single hot key, so writes to the index throttle and can in turn throttle the base table.
- **D** ✅ Write sharding spreads one logical key across N physical partition key values, so writes are distributed across partitions. Reports can still read a whole date by querying each suffix in parallel.

DynamoDB throughput is limited per partition, so a low-cardinality partition key creates a hot partition regardless of table-level capacity or capacity mode. Use high-cardinality keys, or shard a hot key with a calculated or random suffix and scatter-gather the reads.

</details>

### performant-3.3-06

_Amazon DynamoDB, Amazon DynamoDB Accelerator (DAX)_

A gaming company stores player profiles in an Amazon DynamoDB table. The game reads the same popular profiles millions of times each hour, and reads outnumber writes 100 to 1. The company needs read latency in microseconds rather than single-digit milliseconds. The application already uses the DynamoDB SDK, and the company wants to minimise code changes.

Which solution will meet these requirements?

- **A.** Add an Amazon ElastiCache (Redis OSS) cluster, and implement lazy loading in the application for profile reads.
- **B.** Create a DynamoDB Accelerator (DAX) cluster, and switch the application to the DAX client.
- **C.** Increase the provisioned read capacity units for the table, and use strongly consistent reads.
- **D.** Convert the table to a DynamoDB global table with replicas in two additional AWS Regions.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ ElastiCache can deliver microsecond reads, but the application must be rewritten to manage the cache, including reads, writes and invalidation. This breaks the minimal-code-change requirement.
- **B** ✅ DAX is an in-memory cache for DynamoDB that is API-compatible with DynamoDB. Switching to the DAX client gives microsecond reads for cached items with minimal code changes.
- **C** ❌ More read capacity prevents throttling but does not reduce per-request latency below the single-digit milliseconds that DynamoDB provides. Strongly consistent reads do not make reads faster.
- **D** ❌ Global tables replicate data across Regions for multi-Region access and resilience. They reduce latency for distant users but do not deliver microsecond reads.

DAX is the drop-in, API-compatible cache for DynamoDB that turns millisecond reads into microsecond reads for read-heavy workloads. ElastiCache can be faster or more flexible but needs application caching logic.

</details>

### performant-3.3-07

_Amazon DynamoDB_

A company is launching a ticketing application that stores reservations in an Amazon DynamoDB table. When popular events go on sale, write traffic jumps from near zero to about 3,000 writes per second within seconds, and these sales happen at unannounced times. A test with provisioned capacity and DynamoDB auto scaling showed heavy throttling at the start of each surge. The table is idle most of the time.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Keep provisioned capacity with auto scaling, and lower the target utilisation to 20%.
- **B.** Set the provisioned write capacity permanently to the peak write rate.
- **C.** Switch the table to on-demand capacity mode.
- **D.** Add a DynamoDB Accelerator (DAX) cluster in front of the table.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ A lower target keeps more headroom, but auto scaling still reacts over minutes and cannot follow a jump from near zero to thousands of writes per second within seconds. It also pays for unused capacity.
- **B** ❌ Fixed peak capacity prevents throttling, but the company pays for it while the table is idle most of the time. This is not cost-effective.
- **C** ✅ On-demand mode instantly accommodates sudden traffic up to double the previous peak and charges only for requests made, so idle periods cost almost nothing.
- **D** ❌ DAX caches reads. Writes pass through DAX to the table, so DAX does not prevent write throttling.

Choose on-demand mode for spiky, unpredictable or mostly idle workloads, and provisioned mode with auto scaling for steady or gradually changing traffic. Auto scaling responds in minutes, not seconds.

</details>

### performant-3.3-08

_Amazon MemoryDB, Amazon ElastiCache_

A mobile game is replacing its relational leaderboard with an in-memory data store that uses the Redis OSS sorted set API. Queries must return the top 100 players and any player's rank in microseconds, and scores update thousands of times each second. Players buy score boosts with real money, so every acknowledged score update must survive a node failure or a full cluster restart without being lost. The company wants one data store, with no separate database behind it.

Which solution will meet these requirements?

- **A.** Use Amazon ElastiCache (Redis OSS) with replicas in a second Availability Zone, automatic failover, and daily automatic backups.
- **B.** Use an Amazon MemoryDB cluster with nodes in multiple Availability Zones, and store the scores in a sorted set.
- **C.** Use Amazon ElastiCache (Memcached) with several nodes across Availability Zones, and store each player's score as a key.
- **D.** Store the scores in an Amazon DynamoDB table with a GSI on score, and add a DynamoDB Accelerator (DAX) cluster for reads.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ ElastiCache supports sorted sets and Multi-AZ failover, but replication to replicas is asynchronous and backups are point-in-time snapshots. Acknowledged updates can be lost on failover or after a full cluster restart.
- **B** ✅ MemoryDB is Redis OSS-compatible and keeps all data in memory for microsecond reads. It writes every update to a Multi-AZ transactional log before acknowledging it, so no acknowledged score is lost on failover or restart.
- **C** ❌ Memcached is a simple multithreaded cache with no replication, persistence, or sorted data structures. Ranking would need application-side sorting, and a node failure loses its data.
- **D** ❌ DynamoDB is durable, but DAX caches item and query results rather than maintaining ranks, and per-player rank queries are not a native operation. It also does not use the Redis OSS sorted set API.

Amazon MemoryDB is a durable, in-memory primary database: Redis OSS or Valkey data structures with a Multi-AZ transactional log. ElastiCache is a cache: it has the same data structures and fast failover, but asynchronous replication and snapshots can lose recent writes. Remember: MemoryDB when the in-memory store is the system of record, ElastiCache when a durable database sits behind it.

</details>

### performant-3.3-09

_Amazon ElastiCache, Amazon RDS_

An e-commerce company caches inventory counts in Amazon ElastiCache in front of an Amazon RDS for PostgreSQL database. Suppliers update the counts for 500,000 products many times each day, but most products are rarely viewed. Product pages must never show a count older than the latest committed update. The cache has a small amount of memory, and a replaced cache node must not cause errors.

Which caching strategy will meet these requirements?

- **A.** Use write-through to update the cache on every inventory change, and keep the cached items without a TTL.
- **B.** Use lazy loading to cache counts only after a cache miss, and set a TTL of 30 seconds on the cached items.
- **C.** Use write-through on every inventory change and lazy loading on misses, and set a TTL on each cached item.
- **D.** Use lazy loading to cache counts after a miss, and run a job every minute that refreshes the products changed in the database.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Write-through keeps cached counts current, but every updated product stays in the cache with no expiry, including the many that are never viewed. The small cache fills with unread data.
- **B** ❌ Lazy loading with a short TTL caches only viewed products, but a cached count can be up to 30 seconds old after an update. This breaks the requirement to always show the latest count.
- **C** ✅ Write-through keeps every cached count current, the TTL removes products that are written but not read, and lazy loading refills items that expired or were lost with a replaced node.
- **D** ❌ A refresh job narrows the stale window but does not close it. A page can still show an outdated count for up to a minute after a change.

Write-through keeps cached data current; lazy loading caches only what is read and recovers from empty nodes; a TTL stops written-but-unread data from filling the cache. AWS recommends combining them. Lazy loading on its own, even with a short TTL or a refresh job, always leaves a stale window.

</details>

### performant-3.3-10

_Amazon ElastiCache, Amazon RDS_

A retailer serves a catalog of 2 million products from an Amazon RDS for MySQL database. About 5% of the products receive 90% of the page views, and the database is overloaded by repeated reads of the same items. The company will add an Amazon ElastiCache cluster but has a small memory budget, so the cache should hold mainly the products that are actually requested. Product prices change several times each day, and a displayed price may be up to 10 minutes old.

Which combination of caching steps will meet these requirements? (Choose TWO.)

- **A.** Use a write-through strategy that writes every product to the cache whenever the product is created or updated in the database.
- **B.** Use a lazy loading strategy that adds a product to the cache only after a cache miss reads it from the database.
- **C.** Preload the entire product catalog into the cache each night by using a scheduled job.
- **D.** Set a TTL of 10 minutes on each cached product item.
- **E.** Disable item expiration, and rely on the cache's LRU eviction to remove products.

<details><summary>Answer</summary>

**Correct: B, D**

- **A** ❌ Write-through caches every written item, including the 95% of products that are rarely viewed. This fills the small cache with data that is seldom read.
- **B** ✅ Lazy loading caches only items that are requested, so the cache naturally fills with the popular 5% of products and fits the small memory budget.
- **C** ❌ Preloading caches every product, which exceeds the small memory budget, and prices changed during the day would remain stale until the next load.
- **D** ✅ A TTL makes cached items expire, so the next read after expiry reloads the current price from the database. A 10-minute TTL keeps prices within the allowed staleness.
- **E** ❌ LRU eviction removes items only when memory is full. Popular products would stay cached with outdated prices for much longer than 10 minutes.

Lazy loading keeps only requested data in the cache, and a TTL bounds how stale that data can become. Write-through keeps data current but caches everything that is written, which wastes memory when most items are rarely read.

</details>

### performant-3.3-11

_Amazon RDS Proxy, AWS Lambda, Amazon RDS_

A company's API runs on AWS Lambda functions that query an Amazon RDS for MySQL DB instance. During traffic spikes, Lambda scales to more than 2,000 concurrent executions, and the database returns "Too many connections" errors even though its CPU utilisation stays below 40%. The company must serve every request during spikes and wants the LEAST operational overhead.

Which solution will meet these requirements?

- **A.** Configure reserved concurrency of 300 on the Lambda functions so that they cannot open more connections than the database allows.
- **B.** Create an Amazon RDS Proxy for the DB instance, and configure the Lambda functions to connect through the proxy endpoint.
- **C.** Modify the DB instance to a larger instance class to raise the max_connections limit.
- **D.** Create two read replicas, and distribute the Lambda functions' connections across the primary and the replicas.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ Reserved concurrency caps how many functions run at once, which protects the database but throttles requests during spikes. This breaks the requirement to serve every request.
- **B** ✅ RDS Proxy maintains a pool of database connections and multiplexes many short-lived Lambda connections onto them. The database sees far fewer connections, and requests are served without code changes beyond the endpoint.
- **C** ❌ A larger class raises the connection limit but costs more while CPU is mostly idle. Each new Lambda environment still opens its own connection, so a larger spike can exhaust connections again.
- **D** ❌ Read replicas spread read-only connections, but writes must still go to the primary, and the application would need logic to split queries. Connection exhaustion on the primary remains possible.

RDS Proxy pools and reuses database connections, which is the standard fix for serverless or highly concurrent clients exhausting database connections. It also shortens failover time. Reserved concurrency protects the database only by rejecting work.

</details>

### performant-3.3-12

_Amazon Neptune_

A bank is building a fraud detection service. It must find, in milliseconds, whether a new transaction is connected to known fraudulent accounts through shared devices, phone numbers, IP addresses or intermediate accounts, often four to six hops away. The relationships change constantly as new transactions arrive.

Which database service is the MOST suitable for this workload?

- **A.** Amazon RDS for PostgreSQL with tables for accounts and relationships, queried by using recursive joins.
- **B.** Amazon DynamoDB with an adjacency list design, queried hop by hop from the application.
- **C.** Amazon Neptune, queried by using a graph traversal language such as Gremlin or openCypher.
- **D.** Amazon Redshift, queried by using SQL with materialised views refreshed every hour.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ A relational database can model the relationships, but each additional hop needs another join over large tables. Queries four to six hops deep become too slow for millisecond responses.
- **B** ❌ An adjacency list in DynamoDB can return one hop quickly, but multi-hop traversals need many round trips and custom application logic, so deep traversals are slow and complex.
- **C** ✅ Neptune is a purpose-built graph database that stores relationships as first-class edges and traverses many hops efficiently. This fits connected-data queries such as fraud rings.
- **D** ❌ Redshift is a data warehouse for analytical queries over large datasets. Hourly refreshes cannot reflect constantly changing relationships, and it is not designed for millisecond lookups per transaction.

Use a graph database (Amazon Neptune) when queries traverse relationships of variable depth, such as fraud rings, social networks and recommendations. Relational joins and key-value adjacency lists degrade quickly as the number of hops grows.

</details>

### performant-3.3-13

_Amazon Keyspaces (for Apache Cassandra)_

A company runs a self-managed Apache Cassandra cluster on premises for a time-ordered messaging workload. The application uses Cassandra Query Language (CQL) drivers throughout. The company wants to move to AWS, keep the existing CQL code, and stop managing nodes, patching and capacity planning. The workload must deliver single-digit millisecond latency at any scale.

Which solution will meet these requirements?

- **A.** Migrate the data to Amazon Keyspaces (for Apache Cassandra) and use on-demand capacity mode.
- **B.** Migrate the data to Amazon DynamoDB, and rewrite the data access layer to use the DynamoDB API.
- **C.** Migrate the data to Amazon DocumentDB (with MongoDB compatibility).
- **D.** Run Apache Cassandra on Amazon EC2 instances across three Availability Zones by using storage optimized instances.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ Amazon Keyspaces is a serverless, Cassandra-compatible database that works with existing CQL drivers and code. It removes node management and scales automatically with single-digit millisecond latency.
- **B** ❌ DynamoDB is serverless and fast, but moving from CQL to the DynamoDB API requires rewriting the data access code, which breaks the requirement to keep CQL.
- **C** ❌ DocumentDB is compatible with MongoDB drivers, not CQL. The application would need to be rewritten.
- **D** ❌ Cassandra on EC2 keeps CQL compatibility, but the company would still manage nodes, patching and capacity, which it wants to stop doing.

Match the migration target to the API: Cassandra/CQL to Amazon Keyspaces, MongoDB to Amazon DocumentDB, graph to Neptune. Keyspaces is serverless, so it also removes cluster management.

</details>

### performant-3.3-14

_Amazon DocumentDB_

A content platform stores articles as JSON documents with nested fields and arrays, and its application uses MongoDB drivers and queries that filter and index nested fields. The self-managed MongoDB replica set on Amazon EC2 is hard to operate, and read traffic is growing quickly. The company wants a managed database that keeps its application code largely unchanged and lets it add read capacity quickly.

Which solution will meet these requirements?

- **A.** Migrate to Amazon DynamoDB, storing each article as an item and using global secondary indexes for nested fields.
- **B.** Migrate to Amazon Aurora PostgreSQL, storing each article in a JSONB column with GIN indexes.
- **C.** Move the MongoDB replica set to larger EC2 instances in an Auto Scaling group, and add secondary members as read traffic grows.
- **D.** Migrate to Amazon DocumentDB (with MongoDB compatibility), and add read replica instances to the cluster as read traffic grows.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ DynamoDB stores JSON-like items, but it is not compatible with MongoDB drivers or queries, so the application would need significant changes.
- **B** ❌ Aurora PostgreSQL can store and index JSON, but the application would need to move from MongoDB queries to SQL, which is a significant rewrite.
- **C** ❌ This keeps the MongoDB code unchanged, but the company still operates the replica set itself. Each new secondary must also copy the full dataset before it can serve reads, so capacity is not added quickly.
- **D** ✅ DocumentDB is a managed document database compatible with MongoDB drivers and queries. Its storage is shared by the cluster, so up to 15 replica instances can be added quickly to scale reads.

For managed document workloads that use MongoDB APIs, choose Amazon DocumentDB. Like Aurora, it separates compute from shared storage, so read replicas can be added quickly without copying data.

</details>

### performant-3.3-15

_Amazon Redshift, Amazon RDS_

A retail company keeps 5 years of sales history, about 30 TB, in an Amazon RDS for PostgreSQL database and runs business intelligence dashboards against a read replica. Dashboard queries aggregate billions of rows and join several large fact and dimension tables, and they now take many minutes to run. The company wants interactive query performance for these analytics.

Which solution will meet these requirements?

- **A.** Upgrade the read replica to the largest available memory optimized instance class.
- **B.** Migrate the data to Amazon Aurora PostgreSQL, and run the dashboards against Aurora Replicas.
- **C.** Load the sales history into Amazon Redshift, and point the dashboards at the Redshift cluster.
- **D.** Copy the data into Amazon DynamoDB, and add a DynamoDB Accelerator (DAX) cluster for the dashboards.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ A larger replica adds memory and CPU, but a row-oriented OLTP engine still scans whole rows across billions of records. Analytical aggregation at this scale remains slow.
- **B** ❌ Aurora improves OLTP throughput and availability, but it is still a row-oriented transactional engine, so large analytical joins and aggregations remain slow.
- **C** ✅ Amazon Redshift is a columnar, massively parallel data warehouse designed for complex analytical queries over large datasets. It reads only the needed columns and spreads work across nodes, giving interactive performance.
- **D** ❌ DynamoDB is a key-value database optimised for access by key. It does not support joins or ad hoc aggregation across billions of rows, and DAX only caches item reads.

Use Amazon Redshift for OLAP: large aggregations and joins over historical data. RDS and Aurora are OLTP engines; read replicas help with read volume but not with analytical query shape.

</details>

### performant-3.3-16

_Amazon Aurora_

A company runs an Aurora MySQL DB cluster in us-east-1. It has expanded to Europe and Asia, and users there see slow page loads because every read crosses an ocean. The company wants local read latency in eu-west-1 and ap-northeast-1. Replication to the remote Regions must typically lag by less than 1 second and must not consume compute resources on the writer instance. Writes can continue to go to us-east-1.

Which solution will meet these requirements?

- **A.** Create cross-Region Aurora read replica clusters in the two Regions by using MySQL binary log replication.
- **B.** Convert the cluster to an Aurora Global Database, and add secondary clusters in eu-west-1 and ap-northeast-1.
- **C.** Put an Amazon CloudFront distribution in front of the application, and cache all database-backed pages for 1 minute.
- **D.** Migrate the data to Amazon DynamoDB global tables with replicas in the three Regions.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ Binary log replication works across Regions, but the writer instance must generate and ship binary logs, which consumes its resources, and lag is typically higher than storage-based replication.
- **B** ✅ Aurora Global Database replicates at the storage layer to secondary Regions with typical lag under 1 second and without using writer compute. Applications in each Region read from the local secondary cluster.
- **C** ❌ CloudFront caching can speed up shared static responses, but personalised, database-backed pages cannot be cached safely, and reads that miss the cache still cross the ocean.
- **D** ❌ Global tables provide multi-Region reads and writes, but moving from Aurora MySQL to DynamoDB requires redesigning the data model and rewriting the application.

Aurora Global Database uses dedicated storage-level replication to give low-latency local reads in up to several secondary Regions with typical sub-second lag, without load on the primary writer. It also enables fast cross-Region recovery.

</details>

### performant-3.3-17

_Amazon DynamoDB_

A company stores orders in an Amazon DynamoDB table with customerId as the partition key and orderDate as the sort key. A new store dashboard must list a store's orders for a date range, and it is refreshed frequently by thousands of stores. The current implementation uses a Scan with a filter on storeId, which is slow and consumes most of the table's read capacity. The table already holds production data.

Which solution will meet these requirements?

- **A.** Create a global secondary index with storeId as the partition key and orderDate as the sort key.
- **B.** Create a local secondary index with storeId as the sort key, and query it by store and date range.
- **C.** Replace the Scan with a parallel Scan that uses multiple segments and the same filter on storeId.
- **D.** Add a DynamoDB Accelerator (DAX) cluster, and run the existing filtered Scan through the DAX client.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ A GSI can be added to an existing table and supports a different partition key. Querying by storeId and a date range reads only the matching items, which is fast and uses little capacity.
- **B** ❌ A local secondary index must be created when the table is created, and it keeps customerId as the partition key. It cannot support queries by store across customers.
- **C** ❌ A parallel Scan finishes sooner, but it still reads the entire table and consumes even more read capacity in a short time.
- **D** ❌ DAX can cache Scan results, but each dashboard needs different store and date filters, and the underlying Scans still read the whole table on every cache miss.

Design DynamoDB access patterns with keys and indexes, not Scans. A global secondary index adds a new partition key and can be created at any time; a local secondary index shares the base table's partition key and must be defined at table creation.

</details>

## Task 3.4

### performant-3.4-01

_Amazon CloudFront, Amazon S3_

A company hosts the images, JavaScript and CSS files for its website in an Amazon S3 bucket in us-east-1. Users in Europe and Asia report that pages load slowly because each static file is downloaded from us-east-1. The files change a few times each week. The company wants to improve load times for users worldwide with the LEAST operational overhead.

Which solution will meet these requirements?

- **A.** Create an Amazon CloudFront distribution with the S3 bucket as the origin, secured with origin access control, and serve the files through it.
- **B.** Configure S3 Cross-Region Replication to buckets in eu-west-1 and ap-southeast-1, and use Amazon Route 53 latency-based routing to direct users to the nearest bucket.
- **C.** Enable S3 Transfer Acceleration on the bucket, and change the website to load every static file through the bucket's accelerated endpoint.
- **D.** Move the static files to an Amazon EFS file system mounted on web servers in three AWS Regions behind an Application Load Balancer in each Region.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ CloudFront caches the static files at edge locations close to users, so most requests never travel to us-east-1. It is a single managed configuration, and invalidations or versioned file names handle the weekly changes.
- **B** ❌ Replicated buckets would bring files closer to some users, but the company must manage several buckets, replication rules and DNS records, and users far from all three Regions still see high latency.
- **C** ❌ Transfer Acceleration routes individual transfers over the AWS network to the bucket, which mainly helps large uploads over long distances. It does not cache content, so every request still goes to us-east-1.
- **D** ❌ This adds servers, file systems and load balancers to manage in three Regions, and it still lacks a global caching layer. It is far more operational overhead than a CDN.

Amazon CloudFront is the default answer for speeding up delivery of static content to a global audience: it caches at hundreds of edge locations with no servers to manage. Transfer Acceleration speeds up transfers to and from a bucket but does not cache.

</details>

### performant-3.4-02

_AWS Global Accelerator, Elastic Load Balancing_

A game studio runs multiplayer game servers on Amazon EC2 behind Network Load Balancers in us-east-1, eu-central-1 and ap-northeast-1. The game uses a custom protocol over UDP. Players around the world report high latency and jitter caused by routing over the public internet. The studio wants players to connect to fixed IP addresses and be routed automatically to the closest healthy Region.

Which solution will meet these requirements?

- **A.** Create an Amazon CloudFront distribution that uses Anycast static IPs, with the three Network Load Balancers as origins.
- **B.** Create Amazon Route 53 latency-based alias records that point to the three Network Load Balancers, with health checks enabled.
- **C.** Create an AWS Global Accelerator standard accelerator with a UDP listener and an endpoint group per Region that holds the Region's NLB.
- **D.** Create AWS Direct Connect connections from each Region to major internet exchange points used by players.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ CloudFront Anycast static IPs give fixed entry addresses, but CloudFront proxies only HTTP-based traffic (HTTP, HTTPS and WebSocket). It cannot carry a custom UDP game protocol.
- **B** ❌ Latency-based routing sends players to a nearby Region, but traffic still crosses the public internet to the NLB, so latency and jitter remain. Each Region has its own NLB addresses rather than one fixed global set, and DNS caching delays failover.
- **C** ✅ Global Accelerator provides two static anycast IP addresses, supports TCP and UDP, and carries traffic from the nearest edge location over the AWS global network to the closest healthy endpoint group. This reduces latency and jitter.
- **D** ❌ Direct Connect links customer networks to AWS. Players connect from home internet services, so Direct Connect cannot improve their path, and it does not provide static entry IPs.

Choose Global Accelerator for non-HTTP (TCP or UDP) applications that need static IP addresses, fast regional failover and routing over the AWS backbone. Choose CloudFront when HTTP content can be cached at the edge.

</details>

### performant-3.4-03

_Amazon CloudFront, CloudFront Functions_

A news website serves millions of requests each minute through Amazon CloudFront. On every viewer request, the company wants to rewrite friendly URLs to versioned paths, normalise the Accept-Language header to a small set of values to improve the cache hit ratio, and add security headers to every response. The logic is simple, needs no network calls, and must add as little latency and cost as possible.

Which solution will meet these requirements?

- **A.** Implement the logic in Lambda@Edge functions associated with the viewer request and viewer response events.
- **B.** Implement the logic in CloudFront Functions associated with the viewer request and viewer response events.
- **C.** Implement the logic in an AWS Lambda function behind an Application Load Balancer that CloudFront uses as its origin.
- **D.** Implement the logic in Amazon API Gateway request and response mapping templates in front of the origin.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ Lambda@Edge can perform this logic, but it runs in Regional edge caches with higher startup latency and costs more per request than CloudFront Functions. It suits heavier logic that needs network access or the request body.
- **B** ✅ CloudFront Functions run lightweight JavaScript at every edge location with sub-millisecond start-up, at a fraction of the cost of Lambda@Edge. They are designed for URL rewrites, header manipulation and cache key normalisation at high request rates.
- **C** ❌ Running the logic at the origin means every request must miss the cache to be rewritten, and header normalisation at the origin cannot improve the CloudFront cache key. This adds latency and origin load.
- **D** ❌ API Gateway mapping templates transform requests at the origin side. They cannot change requests before CloudFront looks up the cache, and they add a hop and cost for every request.

CloudFront Functions handle high-volume, lightweight viewer-side tasks such as rewrites, redirects, header changes and cache key normalisation. Use Lambda@Edge when the logic needs network calls, the request body, longer execution or origin-facing events.

</details>

### performant-3.4-04

_Amazon CloudFront, Lambda@Edge_

A media company uses Amazon CloudFront to deliver premium video. Before any request is served, including requests for cached content, the company must validate the viewer's session token by calling its existing token introspection service over HTTPS, and must reject requests with invalid tokens. The introspection call usually completes in about 100 ms.

Which solution will meet these requirements?

- **A.** Use a CloudFront Function on the viewer request event that calls the introspection service and returns a 403 response for invalid tokens.
- **B.** Use an AWS WAF web ACL on the distribution with a rule that sends the token to the introspection service for validation.
- **C.** Use a Lambda@Edge function on the origin request event that calls the introspection service and returns a 403 response for invalid tokens.
- **D.** Use a Lambda@Edge function on the viewer request event that calls the introspection service and returns a 403 response for invalid tokens.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ CloudFront Functions cannot make network calls, so a function cannot reach the introspection service.
- **B** ❌ AWS WAF inspects requests against rules and managed rule groups. It cannot call an external service to validate a token.
- **C** ❌ Origin request functions run only when CloudFront must go to the origin, that is, on cache misses. Requests for cached content would be served without validation.
- **D** ✅ Viewer request functions run on every request before the cache is checked, and Lambda@Edge can make network calls. This validates every request, including those for cached content.

Two decisions: CloudFront Functions vs Lambda@Edge (only Lambda@Edge can make network calls), and viewer vs origin events (viewer events run on every request, origin events only on cache misses).

</details>

### performant-3.4-05

_Amazon CloudFront_

A company serves product images through Amazon CloudFront with an Application Load Balancer as the origin. The images vary only by a size query string parameter. Marketing links append unique tracking parameters such as utm_source and utm_campaign to the URLs. The cache behavior uses a cache policy that includes all query strings and all headers in the cache key. The CloudFront cache hit ratio is below 10%, and the origin is overloaded.

Which change will MOST improve the cache hit ratio?

- **A.** Change the cache behavior to a cache policy that includes only the size query string in the cache key and excludes headers.
- **B.** Increase the default TTL and maximum TTL in the existing cache policy to 7 days so that cached images stay at the edge longer.
- **C.** Add more targets to the Application Load Balancer and enable cross-zone load balancing.
- **D.** Enable compression in the cache policy, and configure the origin to return Cache-Control: max-age headers.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ The cache key decides which requests share a cached object. Including only the parameter that changes the response lets requests with different tracking parameters and headers hit the same cached image.
- **B** ❌ Longer TTLs keep objects cached longer, but nearly every request has a unique cache key because of the tracking parameters and headers, so they still miss the cache.
- **C** ❌ More origin capacity reduces overload but does nothing to the cache hit ratio; requests still miss the cache.
- **D** ❌ Compression reduces transfer size and Cache-Control controls expiry, but neither changes the cache key. Unique keys still cause cache misses.

Keep the CloudFront cache key minimal: include only the query strings, headers and cookies that change the response. Values the origin needs but that do not affect the object can be forwarded with an origin request policy without fragmenting the cache.

</details>

### performant-3.4-06

_Amazon Route 53, Elastic Load Balancing_

A company runs an HTTPS application behind Application Load Balancers in us-west-2, eu-central-1 and ap-southeast-2. The application's domain is hosted in Amazon Route 53. The company wants each user to be sent to the Region that gives that user the lowest network latency, and to stop sending users to a Region whose load balancer is unhealthy.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Create geolocation records for each continent that point to the closest Region's load balancer, with a default record.
- **B.** Create weighted alias records with equal weights for the three load balancers, with health checks enabled.
- **C.** Create latency-based alias records for the three load balancers, with Evaluate Target Health enabled.
- **D.** Create an AWS Global Accelerator accelerator with an endpoint group in each Region that contains the Region's load balancer.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Geolocation routing uses the user's location, not measured latency. Network latency does not always match geography, and users in unlisted locations go to the default Region.
- **B** ❌ Weighted routing splits traffic by ratio regardless of where users are, so many users would be sent to a distant Region.
- **C** ✅ Latency-based routing answers each DNS query with the Region that has the lowest measured latency for that user's network, and alias records with Evaluate Target Health skip an unhealthy load balancer. It uses the existing hosted zone at very low cost.
- **D** ❌ Global Accelerator also routes users to the nearest healthy Region and adds static IPs and backbone routing, but it adds a fixed hourly fee and data transfer premium that the requirements do not justify.

Route 53 latency-based routing is the cost-effective way to send users to the lowest-latency Region for DNS-addressed applications. Choose Global Accelerator when you also need static IPs, non-HTTP protocols or failover that does not depend on DNS caching.

</details>

### performant-3.4-07

_AWS Direct Connect_

A company needs to transfer about 15 Gbps of sustained traffic between its data center and its VPCs in one AWS Region over a private path with consistent latency. The data center reaches a single AWS Direct Connect location. The network team wants to configure and manage the capacity as one logical connection.

Which solution will meet these requirements?

- **A.** Order two 10 Gbps hosted connections from an AWS Direct Connect Partner at the location, and bundle them into a link aggregation group (LAG).
- **B.** Order two 10 Gbps dedicated connections at the Direct Connect location, and bundle them into a link aggregation group (LAG).
- **C.** Create multiple AWS Site-to-Site VPN connections to a transit gateway, and use equal-cost multi-path (ECMP) routing to aggregate their bandwidth.
- **D.** Order one 10 Gbps dedicated connection and five 1 Gbps dedicated connections, and bundle all six into a link aggregation group (LAG).

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ A LAG can contain only dedicated connections. Hosted connections from a Direct Connect Partner cannot be added to a LAG, so they cannot be managed as one logical connection.
- **B** ✅ A LAG uses LACP to bundle dedicated connections of the same bandwidth that terminate at the same Direct Connect endpoint into one logical connection. Two 10 Gbps links give 20 Gbps of private, consistent bandwidth.
- **C** ❌ ECMP across VPN tunnels can aggregate bandwidth, but the tunnels run over the public internet, so latency is not consistent, and every tunnel is managed separately.
- **D** ❌ All connections in a LAG must have the same bandwidth, and a LAG can hold at most four connections below 100 Gbps. This combination cannot form a LAG.

A Direct Connect LAG combines dedicated connections of the same port speed, at the same Direct Connect endpoint, into one logical connection (up to four connections below 100 Gbps). Hosted connections and mixed speeds cannot join a LAG, and VPN with ECMP aggregates bandwidth only over the internet.

</details>

### performant-3.4-08

_AWS Direct Connect, Direct Connect gateway_

A company has a 10 Gbps AWS Direct Connect connection at a location near us-east-1, with a private virtual interface to a VPC in us-east-1. The company is launching new VPCs in us-west-2 and eu-west-1. Applications in the data center need private connectivity with consistent performance to all three VPCs. The VPCs do not need to communicate with each other.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Create inter-Region VPC peering connections from the us-east-1 VPC to the new VPCs, and route on-premises traffic through the us-east-1 VPC.
- **B.** Create AWS Site-to-Site VPN connections from the data center to virtual private gateways in the two new VPCs, and keep the existing private virtual interface.
- **C.** Order new Direct Connect connections at locations near us-west-2 and eu-west-1, and create a private virtual interface on each.
- **D.** Create a Direct Connect gateway with a private virtual interface on the existing connection, and associate all three VPCs' virtual private gateways with it.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ VPC peering is not transitive. Traffic from the data center that enters the us-east-1 VPC cannot be routed through it to a peered VPC.
- **B** ❌ Site-to-Site VPN provides private, encrypted connectivity, but it runs over the public internet, so performance is not consistent.
- **C** ❌ Additional Direct Connect connections would work, but they add port and circuit costs and lead times that the existing connection can avoid.
- **D** ✅ A Direct Connect gateway is a global resource that lets one private virtual interface reach VPCs through virtual private gateways in multiple AWS Regions. The existing connection serves all three VPCs.

A Direct Connect gateway lets a single Direct Connect connection reach VPCs in many Regions. It does not route traffic between the associated VPCs; for VPC-to-VPC routing, combine it with a transit gateway.

</details>

### performant-3.4-09

_AWS Direct Connect, AWS Site-to-Site VPN_

A healthcare company connects its data center to AWS with an AWS Direct Connect connection. A new compliance rule requires all traffic between the data center and its VPC to be encrypted with IPsec. The company also needs the consistent latency and throughput that Direct Connect provides, and it does not want to modify its applications.

Which solution will meet these requirements?

- **A.** Create an AWS Site-to-Site VPN connection whose IPsec tunnels run over the Direct Connect connection through a public virtual interface.
- **B.** Create an AWS Site-to-Site VPN connection over the internet as the primary path, and keep Direct Connect as a backup.
- **C.** Keep the existing private virtual interface unchanged, because traffic on Direct Connect is private and does not traverse the public internet.
- **D.** Deploy AWS Client VPN, and have each on-premises server connect to the Client VPN endpoint over the Direct Connect connection.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ A Site-to-Site VPN over a Direct Connect public virtual interface encrypts traffic with IPsec while it travels on the dedicated Direct Connect path. This meets the encryption and consistent performance requirements without application changes.
- **B** ❌ This encrypts traffic with IPsec, but the primary path is the public internet, so latency and throughput are not consistent.
- **C** ❌ Direct Connect is a private connection, but traffic on a private virtual interface is not encrypted by IPsec, so this fails the compliance rule.
- **D** ❌ Client VPN is a TLS-based remote access service for individual users and devices, not IPsec site-to-site connectivity. Installing clients on every server is also an application-level change.

Direct Connect is private but not encrypted. To add IPsec, run a Site-to-Site VPN over Direct Connect (a public VIF, or a private IP VPN over a transit VIF). The result combines encryption with Direct Connect's consistent network performance.

</details>

### performant-3.4-10

_AWS Transit Gateway, AWS Resource Access Manager, AWS Site-to-Site VPN_

A company has 60 VPCs in one AWS Region spread across 12 AWS accounts in AWS Organizations, and it adds new VPCs every month. Every VPC must be able to communicate with every other VPC and with the on-premises network, which connects through an AWS Site-to-Site VPN. The VPC CIDR blocks do not overlap.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Create VPC peering connections between every pair of VPCs, and create a Site-to-Site VPN connection from the on-premises network to each VPC.
- **B.** Deploy a transit VPC with third-party VPN appliances on Amazon EC2, and connect every VPC and the on-premises network to those appliances.
- **C.** Create a transit gateway, share it with the other accounts through AWS Resource Access Manager, and attach every VPC and the Site-to-Site VPN.
- **D.** Expose each VPC's workloads as VPC endpoint services with AWS PrivateLink, and create interface endpoints in every other VPC.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ A full mesh of 60 VPCs needs 1,770 peering connections and route entries, growing with every new VPC, plus 60 VPN connections. Peering is not transitive, so no shared path exists.
- **B** ❌ A transit VPC provides hub-and-spoke routing, but the company must operate, scale and patch the EC2 appliances, which adds operational overhead.
- **C** ✅ A transit gateway is a managed regional hub that routes transitively between all attached VPCs and the VPN. Each new VPC needs only one attachment and route update.
- **D** ❌ PrivateLink exposes specific services in one direction. It does not provide general network connectivity between VPCs, and it does not connect the on-premises network to every VPC.

Use AWS Transit Gateway for hub-and-spoke, transitive routing between many VPCs and on-premises networks. VPC peering is one-to-one and non-transitive, which does not scale beyond a handful of VPCs.

</details>

### performant-3.4-11

_Amazon VPC, AWS Transit Gateway_

A company runs a primary database tier in one VPC and an analytics cluster in a second VPC in the same AWS Region and account. The analytics cluster copies several terabytes from the database tier every day and is sensitive to network latency. No other networks need to connect to either VPC, and the CIDR blocks do not overlap.

Which solution will provide the required connectivity with the LOWEST latency and cost?

- **A.** Attach both VPCs to a transit gateway, and add routes for each VPC's CIDR block through the transit gateway.
- **B.** Create a VPC peering connection between the two VPCs, and add routes to each VPC's route tables for the other VPC's CIDR block.
- **C.** Create a Site-to-Site VPN between a virtual private gateway in one VPC and a software VPN appliance on Amazon EC2 in the other VPC.
- **D.** Create a Network Load Balancer and a VPC endpoint service in the database VPC, and an interface endpoint in the analytics VPC.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ A transit gateway works, but it adds an extra network hop and charges per attachment hour and per GB processed. Those costs are unnecessary for connecting only two VPCs.
- **B** ✅ VPC peering connects two VPCs directly over the AWS network with no extra hop, no bandwidth bottleneck and no per-GB processing charge. It is the lowest-latency, lowest-cost option for one pair of VPCs.
- **C** ❌ A VPN adds encryption overhead, tunnel bandwidth limits and an EC2 appliance to manage. Latency and cost are higher than direct peering.
- **D** ❌ PrivateLink works for consumer-to-service access, but it adds load balancer and endpoint hourly and per-GB charges and an extra hop, so it is not the lowest-cost option.

For a small number of VPCs, VPC peering is the lowest-latency and lowest-cost option. Move to a transit gateway when the number of VPCs, transitive routing or on-premises connectivity makes a full mesh unmanageable.

</details>

### performant-3.4-12

_AWS Global Accelerator, Amazon EC2_

A communications company runs a real-time voice conferencing service on thousands of Amazon EC2 instances in private subnets in two AWS Regions. A session broker assigns all participants in a meeting to one specific media instance and UDP port. Participants worldwide report jitter caused by long public internet paths. The company wants participant traffic to enter the AWS global network close to each participant and still reach the exact instance and port that the broker assigned.

Which solution will meet these requirements?

- **A.** Create an AWS Global Accelerator standard accelerator with a UDP listener and an endpoint group in each Region that contains a Network Load Balancer for the media instances.
- **B.** Create an AWS Global Accelerator custom routing accelerator with the media subnets as endpoints, and have the broker return the mapped accelerator port.
- **C.** Assign an Elastic IP address to each media instance in public subnets, and have the broker return the assigned instance's Elastic IP address and UDP port.
- **D.** Create an Amazon CloudFront distribution with the media instances as custom origins, and have the broker return a URL path that identifies the assigned instance.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ A standard accelerator sends each client to the closest healthy endpoint, and the Network Load Balancer then picks a target. Participants in one meeting could land on different instances, not the one the broker assigned.
- **B** ✅ A custom routing accelerator deterministically maps each listener port on its static IP addresses to one EC2 instance IP address and port in the endpoint subnets. The broker hands out the mapped port, and traffic rides the AWS global network to the assigned instance.
- **C** ❌ Participants would reach the exact instance, but their traffic would cross the public internet all the way to the Region, so jitter would not improve.
- **D** ❌ CloudFront proxies HTTP-based traffic such as HTTP, HTTPS and WebSocket. It cannot carry real-time UDP media streams to a specific instance and port.

A Global Accelerator custom routing accelerator lets application logic pin users to a specific EC2 instance and port in VPC subnet endpoints, while traffic still enters the AWS global network at the nearest edge location. A standard accelerator chooses the closest healthy endpoint itself, so it cannot keep a group of users on one chosen instance.

</details>

### performant-3.4-13

_Amazon EC2, Elastic Network Adapter_

A company runs a distributed in-memory caching tier on an older Amazon EC2 instance family in one Availability Zone. The instances were launched from a custom AMI that was built several years ago and does not include the Elastic Network Adapter (ENA) driver. Monitoring shows that the nodes hit a packets-per-second ceiling and that inter-node latency is high and variable, while CPU and memory utilisation stay low. The company wants higher throughput, higher packets per second and lower latency between the nodes.

Which solution will meet these requirements?

- **A.** Relaunch the nodes on the existing instance type in a cluster placement group so that they sit close together on the network.
- **B.** Attach two additional elastic network interfaces to each instance, and spread the cache traffic across all of the interfaces.
- **C.** Install the ENA driver in the AMI and set its ENA support attribute, then relaunch the nodes on a current-generation instance type.
- **D.** Stop each node, change it to a current-generation Nitro-based instance type, and start it again from the existing AMI unchanged.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ A cluster placement group reduces hop count and latency between instances, but the instance type still lacks enhanced networking, so the packets-per-second ceiling remains.
- **B** ❌ Additional network interfaces do not raise an instance type's network performance limits or add enhanced networking, so the packets-per-second bottleneck remains.
- **C** ✅ Enhanced networking with ENA uses SR-IOV to give higher bandwidth, higher packets per second and consistently lower latency. It requires a supported instance type and an AMI with the ENA driver and the enaSupport attribute.
- **D** ❌ Nitro-based instance types use ENA for networking. Without the ENA driver and the enaSupport attribute, the instance cannot use enhanced networking and can become unreachable after the change.

Enhanced networking with ENA (SR-IOV) is how EC2 delivers high bandwidth, high packets per second and low, consistent latency. It needs both a supported instance type and an operating system with the ENA driver and enaSupport enabled. A cluster placement group lowers latency but does not lift a per-instance PPS limit.

</details>

### performant-3.4-14

_AWS Site-to-Site VPN, AWS Transit Gateway, AWS Global Accelerator_

A company connects 20 branch offices around the world to a VPC in us-east-1 through AWS Site-to-Site VPN connections that terminate on a virtual private gateway. Branches in Asia and South America experience high latency and jitter because their VPN traffic crosses the public internet for long distances. The company needs an improvement within a few weeks and cannot order AWS Direct Connect circuits for these sites.

Which solution will meet these requirements?

- **A.** Create a transit gateway attached to the VPC, and re-create the VPN connections on the transit gateway with acceleration enabled.
- **B.** Enable acceleration on the existing VPN connections that terminate on the virtual private gateway.
- **C.** Replace the site-to-site connections with AWS Client VPN, and install the VPN client on every device in the branches.
- **D.** Create an Amazon CloudFront distribution with the VPC's resources as origins, and route branch traffic through CloudFront.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ Accelerated Site-to-Site VPN uses AWS Global Accelerator to carry VPN traffic from the edge location nearest each branch over the AWS global network. Acceleration is supported only for VPN connections on a transit gateway.
- **B** ❌ Acceleration cannot be enabled for VPN connections on a virtual private gateway; it is supported only for VPN connections attached to a transit gateway.
- **C** ❌ Client VPN still travels over the public internet from each device to the endpoint, so latency and jitter do not improve, and every device needs a client.
- **D** ❌ CloudFront accelerates HTTP and HTTPS content delivery. It cannot carry general IPsec site-to-site network traffic between branches and a VPC.

Accelerated Site-to-Site VPN routes VPN traffic onto the AWS global network at the nearest edge location, improving performance for distant sites without Direct Connect. It requires the VPN to terminate on a transit gateway, not a virtual private gateway.

</details>

### performant-3.4-15

_Amazon CloudFront, Amazon S3, Elastic Load Balancing_

A company's web application serves static assets from an Amazon S3 bucket and a personalised JSON API from an Application Load Balancer, both in us-east-1. Users worldwide experience slow page loads. API responses are unique to each user and must never be cached, but the company still wants to reduce API latency for distant users. All traffic must use a single domain name.

Which combination of steps will meet these requirements? (Choose TWO.)

- **A.** Configure an Amazon CloudFront cache behavior for the /api/* path that caches API responses for 1 hour.
- **B.** Create an Amazon CloudFront distribution with the S3 bucket as the default origin, accessed through origin access control, and a cache policy that caches the static assets.
- **C.** Create an AWS Global Accelerator accelerator with the S3 bucket as an endpoint for static assets.
- **D.** Add a cache behavior for the /api/* path that uses the Application Load Balancer as the origin with a caching-disabled cache policy and an origin request policy that forwards the required headers and cookies.
- **E.** Create Amazon Route 53 latency-based records for the Application Load Balancer.

<details><summary>Answer</summary>

**Correct: B, D**

- **A** ❌ Caching personalised API responses could serve one user's data to another user, and it breaks the requirement never to cache API responses.
- **B** ✅ CloudFront caches static assets at edge locations close to users, so they load quickly, and the distribution provides the single domain name.
- **C** ❌ Global Accelerator endpoints are load balancers, EC2 instances and Elastic IP addresses. An S3 bucket cannot be a Global Accelerator endpoint, and the accelerator would not cache the assets.
- **D** ✅ With caching disabled, CloudFront still terminates connections at the edge and carries requests over the AWS network to the origin with reused connections, which lowers latency for dynamic, uncacheable content.
- **E** ❌ With a single load balancer in one Region, latency-based routing has only one possible answer, so it does not reduce latency for distant users.

One CloudFront distribution can serve both static and dynamic content: cache static paths from S3, and forward dynamic paths to the ALB with caching disabled. Even uncached requests benefit from edge TLS termination and the AWS backbone.

</details>

### performant-3.4-16

_Amazon CloudFront_

A sports broadcaster streams live video through Amazon CloudFront from origin servers on Amazon EC2 in eu-west-1. Viewers are spread across six continents. Each new video segment is requested from the origin by many CloudFront regional edge caches at almost the same moment, and the origin servers become overloaded during popular events. The broadcaster wants to reduce the load on the origin without adding origin servers.

Which solution will meet these requirements?

- **A.** Increase the TTL for video segments in the CloudFront cache policy from 2 seconds to 1 hour.
- **B.** Enable CloudFront Origin Shield in the AWS Region closest to the origin.
- **C.** Create a second CloudFront distribution for viewers in Asia and the Americas that uses the same origin.
- **D.** Place an AWS Global Accelerator accelerator in front of the origin servers, and configure CloudFront to use the accelerator as its origin.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ The overload comes from the first request for each new segment arriving from many regional edge caches. A longer TTL does not reduce these first fetches, and an incorrect TTL on live manifests could serve stale content.
- **B** ✅ Origin Shield adds a central caching layer in front of the origin. Requests from all regional edge caches are consolidated there, so the origin receives one request for each new segment instead of one from every regional edge cache.
- **C** ❌ A second distribution adds another set of caches that independently request each segment from the origin, which increases origin load.
- **D** ❌ Global Accelerator improves the network path but does not cache content. Every regional edge cache would still send its own request to the origin servers.

Origin Shield is an additional, centralised caching layer that collapses requests from all CloudFront regional edge caches into a single request to the origin. It helps most with live streaming and globally distributed audiences that share content.

</details>

### performant-3.4-17

_AWS Direct Connect, Direct Connect gateway, AWS Transit Gateway_

A company has 40 VPCs in us-east-1 that are all attached to a transit gateway. The company has a dedicated 10 Gbps AWS Direct Connect connection from its data center. It wants every VPC to reach the data center over Direct Connect, and wants new VPCs that attach to the transit gateway to gain this connectivity without new virtual interfaces.

Which combination of steps will meet these requirements? (Choose TWO.)

- **A.** Create a private virtual interface for each VPC on the Direct Connect connection, and attach each one to that VPC's virtual private gateway.
- **B.** Create a transit virtual interface on the Direct Connect connection to a Direct Connect gateway.
- **C.** Create a public virtual interface on the Direct Connect connection, and route traffic to the VPCs through their public IP addresses.
- **D.** Associate the Direct Connect gateway with the transit gateway, and set an allowed prefix that summarises the VPC address range, such as 10.0.0.0/8.
- **E.** Create a hub VPC with a virtual private gateway attached to the Direct Connect connection, and peer the hub VPC with each of the 40 VPCs.

<details><summary>Answer</summary>

**Correct: B, D**

- **A** ❌ One private virtual interface per VPC means 40 virtual interfaces to create and manage, and every new VPC needs another one. This breaks the requirement to avoid new virtual interfaces.
- **B** ✅ A transit virtual interface connects a Direct Connect connection to a Direct Connect gateway that can be associated with transit gateways. One interface serves every VPC behind the transit gateway.
- **C** ❌ A public virtual interface reaches AWS public endpoints, not private VPC address space. Workloads in the VPCs would have to be exposed publicly.
- **D** ✅ For a transit gateway association, the Direct Connect gateway advertises only the allowed prefixes to on-premises. A summary prefix covers new VPCs allocated from that range, so they are reachable through the transit gateway route table with no new virtual interfaces.
- **E** ❌ VPC peering is not transitive, so on-premises traffic arriving in the hub VPC cannot be routed onward to peered VPCs.

To connect Direct Connect to a transit gateway, use a transit virtual interface to a Direct Connect gateway, then associate the Direct Connect gateway with the transit gateway. Private virtual interfaces connect to individual virtual private gateways and do not scale to many VPCs.

</details>

## Task 3.5

### performant-3.5-01

_Amazon Kinesis Data Streams, Amazon Data Firehose, Amazon SQS_

A gaming company collects player telemetry events from mobile clients at about 20,000 events per second. Three independent teams build consumer applications: a fraud detector that must react within 1 second, a leaderboard service, and a machine learning feature pipeline. Each consumer must read every event in order for a given player, and the ML team must be able to reprocess the last 3 days of events after a model change.

Which solution will meet these requirements?

- **A.** Ingest the events into an Amazon Data Firehose stream. Configure the stream to deliver to an Amazon S3 bucket and have each consumer read new objects from the bucket.
- **B.** Ingest the events into an Amazon Kinesis Data Streams stream partitioned by player ID with a 3-day retention period. Register each consumer application for enhanced fan-out.
- **C.** Ingest the events into an Amazon SQS FIFO queue that uses player ID as the message group ID. Have each consumer application poll the queue.
- **D.** Ingest the events into an Amazon Kinesis Data Streams stream partitioned by player ID with the default retention period. Register each consumer application for enhanced fan-out.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ Firehose buffers records and delivers batches to destinations such as Amazon S3. Consumers polling S3 objects cannot react within 1 second, and Firehose does not support multiple custom consumers reading the stream directly.
- **B** ✅ Kinesis Data Streams preserves order per partition key, lets many consumers read the same records independently, and retains data for up to 365 days for replay. Enhanced fan-out gives each consumer dedicated read throughput with low latency. This meets every requirement.
- **C** ❌ An SQS FIFO queue preserves order per message group, but each message is processed by only one consumer and is deleted after processing. Three teams cannot each read every event, and deleted messages cannot be replayed.
- **D** ❌ This design supports ordered, low-latency fan-out, but the default retention period is 24 hours. The ML team could not reprocess the last 3 days of events.

Kinesis Data Streams is the choice when several applications must each read the same ordered records in real time and replay them later. Retention must be extended beyond the 24-hour default to support a 3-day replay. Firehose is a delivery service to destinations, and SQS distributes each message to only one consumer.

</details>

### performant-3.5-02

_Amazon Data Firehose, AWS Glue, Amazon S3_

An ecommerce company wants to land website clickstream records, which are produced as JSON, in an Amazon S3 data lake. Analysts query the data with Amazon Athena and have asked for the records to be stored in Apache Parquet format. Data that arrives in S3 within a few minutes is acceptable. The company does not want to write or operate any custom ingestion code.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Send the records to an Amazon Kinesis Data Streams stream. Use an AWS Lambda function as the consumer to batch the records, convert them to Parquet, and write them to Amazon S3.
- **B.** Send the records to an Amazon Data Firehose stream that delivers JSON to Amazon S3. Schedule an AWS Glue ETL job every hour to convert the new files to Parquet.
- **C.** Send the records to an Amazon Data Firehose stream with record format conversion to Apache Parquet, using an AWS Glue Data Catalog table as the schema.
- **D.** Send the records to an Amazon MSK cluster. Use a Kafka Connect S3 sink connector on Amazon MSK Connect with a Parquet format converter to write to Amazon S3.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ This works, but the company must write, deploy, and maintain the conversion and batching code in the Lambda function. It has more operational overhead than a managed delivery stream.
- **B** ❌ This produces Parquet, but it adds a second pipeline stage to build and schedule, and data is not in Parquet until the hourly job runs. It is not the least operational overhead and misses the few-minutes target.
- **C** ✅ Firehose can convert incoming JSON records to Apache Parquet or ORC by using a schema from the AWS Glue Data Catalog before delivery to S3. It is fully managed, buffers for minutes at most, and requires no custom code.
- **D** ❌ This can produce Parquet files, but the company must size and manage a Kafka cluster and connector configuration. It has more operational overhead than Firehose for simple delivery to S3.

Amazon Data Firehose can convert records to Parquet or ORC in flight by using a Glue Data Catalog schema, which removes the need for any custom transformation code. When the requirement is managed delivery into S3, Firehose beats a Kinesis Data Streams or MSK pipeline that needs consumers or connectors.

</details>

### performant-3.5-03

_Amazon MSK, Amazon Kinesis Data Streams, AWS Secrets Manager_

A financial services company runs a self-managed Apache Kafka cluster on premises. Dozens of producer and consumer applications use the Kafka client libraries and authenticate with SASL/SCRAM user names and passwords. The application teams cannot change client code or client security settings during the migration. The company is moving the applications to AWS and wants to stop patching and operating Kafka brokers.

Which solution will meet these requirements?

- **A.** Create an Amazon MSK Serverless cluster, replicate the topics to it with MirrorMaker 2, and point the applications at the serverless bootstrap endpoint.
- **B.** Migrate the topics to Amazon Kinesis Data Streams, and update the producers and consumers to use the Kinesis Producer Library and Kinesis Client Library.
- **C.** Install Apache Kafka on Amazon EC2 instances in an Auto Scaling group across three Availability Zones, and enable SASL/SCRAM on the new brokers.
- **D.** Create an Amazon MSK provisioned cluster with SASL/SCRAM authentication backed by AWS Secrets Manager, and replicate the topics with MirrorMaker 2.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ MSK Serverless removes capacity management, but it requires IAM access control for every client. The SASL/SCRAM clients would need new authentication libraries and settings, which the teams cannot change.
- **B** ❌ Kinesis Data Streams is a managed streaming service, but it uses its own APIs rather than the Kafka protocol. Every application would need to be rewritten.
- **C** ❌ The clients would keep working unchanged, but the company would still patch and operate the Kafka brokers on EC2, which it wants to stop doing.
- **D** ✅ MSK provisioned clusters support SASL/SCRAM with credentials stored in AWS Secrets Manager, so existing Kafka clients connect with their current settings. AWS operates and patches the brokers.

Amazon MSK runs open-source Apache Kafka, so existing Kafka clients move without code changes. The near-miss is MSK Serverless: it is simpler to operate but supports only IAM access control, so clients that use SASL/SCRAM or mutual TLS need an MSK provisioned cluster. Kinesis Data Streams would require rewriting every client.

</details>

### performant-3.5-04

_AWS Glue, Amazon Athena, Amazon S3_

A company stores several terabytes of CSV and JSON log files in Amazon S3. New folders with new columns are added every few weeks. Analysts need to run ad hoc SQL queries against the data a few times each week. The company wants a serverless solution and wants the table schemas to stay current without manual updates.

Which combination of steps will meet these requirements? (Choose TWO.)

- **A.** Schedule an AWS Glue crawler to scan the S3 prefixes and update tables in the AWS Glue Data Catalog.
- **B.** Load the files into an Amazon Redshift provisioned cluster with the COPY command each night and have analysts query Redshift.
- **C.** Use Amazon Athena to query the Data Catalog tables directly against the files in Amazon S3.
- **D.** Launch an Amazon EMR cluster with Apache Hive and use the Hive metastore on the primary node to store the table schemas.
- **E.** Create an AWS Lambda function that runs when new objects arrive and inserts each record into an Amazon RDS for PostgreSQL database for querying.

<details><summary>Answer</summary>

**Correct: A, C**

- **A** ✅ A Glue crawler infers schemas and partitions from data in S3 and creates or updates tables in the Data Catalog. Running it on a schedule keeps schemas current with no manual work.
- **B** ❌ Redshift can run the queries, but a provisioned cluster runs continuously and must be managed and loaded each night. It is not serverless and is costly for a few ad hoc queries each week.
- **C** ✅ Athena is a serverless query service that runs standard SQL against data in S3 by using table definitions in the Glue Data Catalog. The company pays only for the queries it runs.
- **D** ❌ EMR with Hive can query S3 data, but the company must manage the cluster, and a metastore on the primary node is lost when the cluster terminates. It is not serverless.
- **E** ❌ This moves the data into a database instance that must be provisioned and sized for terabytes of logs, and schema changes still require manual table updates. It is not serverless or self-updating.

A Glue crawler keeps the Data Catalog schemas current, and Athena queries S3 in place through that catalog with no infrastructure. This pairing is the standard serverless pattern for ad hoc SQL on a data lake.

</details>

### performant-3.5-05

_Amazon Athena, AWS Glue, Amazon S3_

A media company runs Amazon Athena queries against 40 TB of uncompressed JSON request logs in Amazon S3. Almost every query filters on a single day and reads only 4 of the 60 fields in each record. The queries take several minutes and the Athena bill is growing quickly.

Which combination of steps will improve query performance and reduce cost the MOST? (Choose TWO.)

- **A.** Convert the data to Apache Parquet with an AWS Glue ETL job.
- **B.** Move the log files to the S3 Standard-Infrequent Access storage class.
- **C.** Partition the data in S3 by date and register the partitions in the AWS Glue Data Catalog.
- **D.** Enable S3 Transfer Acceleration on the bucket that stores the logs.
- **E.** Compress each JSON file with gzip and keep the existing folder layout.

<details><summary>Answer</summary>

**Correct: A, C**

- **A** ✅ Parquet is a compressed columnar format. Athena reads only the 4 columns that a query needs, which greatly reduces the data scanned, the query time, and the per-TB-scanned charge.
- **B** ❌ S3 Standard-IA reduces storage cost but adds per-GB retrieval charges for every query and does not reduce the amount of data Athena scans. It does not improve query performance.
- **C** ✅ With date partitions, Athena prunes partitions and scans only the day that the query filters on instead of all 40 TB. This reduces both run time and cost.
- **D** ❌ Transfer Acceleration speeds up long-distance uploads and downloads over the internet through edge locations. It does not affect how much data Athena scans inside AWS.
- **E** ❌ Compression reduces the bytes scanned, but Athena still reads every field of every record across all 40 TB because JSON is row-based and nothing is partitioned. Columnar format and partitioning give far larger gains.

Athena charges by data scanned, so the two biggest levers are a columnar format (read only the needed columns) and partitioning (read only the needed days). Plain compression helps but cannot skip columns or partitions.

</details>

### performant-3.5-06

_Amazon Redshift, Amazon Redshift Spectrum, Amazon S3_

A retail company keeps the last 12 months of sales data in an Amazon Redshift cluster for dashboards. Seven years of older sales data is stored in Amazon S3 as Parquet files and is cataloged in the AWS Glue Data Catalog. Analysts occasionally need to run queries that join current Redshift tables with the historical data. The company does not want to increase the size of the Redshift cluster.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Use the COPY command to load the historical data into the Redshift cluster before each analysis. Drop the tables after the analysis is complete.
- **B.** Create a Redshift external schema that points to the Glue Data Catalog database, and join the S3 data to local tables with Redshift Spectrum.
- **C.** Query the historical data with Amazon Athena, export the results to Amazon S3, and load them into temporary Redshift tables with COPY for each join.
- **D.** Launch an Amazon EMR cluster with Apache Spark that reads the Parquet files from S3 and the current tables from Redshift through JDBC to perform the join.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ COPY loads data into cluster storage. Seven years of data might not fit without resizing the cluster, and loading and dropping tables for each analysis adds operational work.
- **B** ✅ Redshift Spectrum queries data in S3 directly through external tables defined in the Glue Data Catalog and can join it with local Redshift tables in one SQL statement. No data is loaded and the cluster is not resized.
- **C** ❌ This works but adds a multi-step export and load process for every analysis. It has more operational overhead than querying the S3 data in place from Redshift.
- **D** ❌ EMR can perform the join, but the company must manage a cluster and write Spark jobs. This adds far more operational overhead than a SQL query in Redshift.

Redshift Spectrum extends Redshift queries to data in S3 through external tables, so hot data stays in the cluster and cold data stays in S3. Use Spectrum when you must join warehouse tables with data lake files without loading them; use Athena when there is no Redshift cluster in the picture.

</details>

### performant-3.5-07

_AWS Lake Formation, Amazon Athena, Amazon Redshift Spectrum, AWS Glue_

A healthcare company has built a data lake in Amazon S3 that is cataloged in the AWS Glue Data Catalog. Analysts in several departments query it with Amazon Athena and Amazon Redshift Spectrum. Each department must see only certain columns of the patient tables, and regional teams must see only rows for their own region. The security team wants to define and audit these permissions in one place.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Create a separate S3 prefix and IAM policy for each department and region. Run AWS Glue jobs to copy the permitted columns and rows into each prefix.
- **B.** Register the S3 locations with AWS Lake Formation. Grant column-level permissions and row-level data filters on the catalog tables to each department's IAM roles.
- **C.** Write S3 bucket policies with conditions on object prefixes and IAM principal tags for each department and region.
- **D.** Create Athena views for each department and region that select the permitted columns and rows. Grant each IAM role access only to its views.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ This enforces access by duplicating data, which multiplies storage and requires jobs to keep every copy in sync. Permissions are scattered across many IAM policies, which adds significant operational overhead.
- **B** ✅ Lake Formation centrally manages fine-grained permissions on Data Catalog tables, including column-level and row-level filters. Athena and Redshift Spectrum enforce these grants, and access is auditable in one place.
- **C** ❌ Bucket policies control access to whole objects, not to columns or rows inside the files. They cannot hide specific columns of a table from a department.
- **D** ❌ Views can hide columns and rows in Athena, but IAM cannot stop users from querying the underlying tables or S3 data directly, and the views do not apply to Redshift Spectrum. Many views must be maintained by hand.

AWS Lake Formation adds central, fine-grained (column, row, and cell-level) permissions on top of the Glue Data Catalog that integrated engines such as Athena and Redshift Spectrum enforce. IAM and bucket policies operate on objects, not on columns or rows.

</details>

### performant-3.5-08

_Amazon EMR, AWS Glue, Amazon EC2_

A research company runs nightly Apache Spark jobs and Apache HBase workloads on an on-premises Hadoop cluster. The jobs depend on custom native libraries and specific Spark configuration tuning that the data engineers adjust frequently. The company wants to move the workloads to AWS, keep control over the cluster software and instance types, and shut down compute when jobs are not running.

Which solution will meet these requirements?

- **A.** Rewrite the jobs as AWS Glue ETL jobs, package the custom libraries as job dependencies, and run the Spark code on a Glue schedule.
- **B.** Install Hadoop, Spark, and HBase on a fleet of Amazon EC2 instances built from a custom AMI, and use scripts to start and stop the instances each night.
- **C.** Load the data into Amazon Redshift and convert the Spark jobs and HBase workloads to SQL stored procedures.
- **D.** Run the jobs on transient Amazon EMR clusters that use bootstrap actions for the custom libraries and configuration classifications for Spark tuning.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ AWS Glue runs serverless Spark, but it does not run HBase and does not let the engineers choose instance types or install arbitrary native libraries on the cluster nodes. It does not provide the required control.
- **B** ❌ This keeps full control, but the company must install, configure, and integrate the Hadoop stack itself. Amazon EMR provides the same frameworks as a managed cluster service.
- **C** ❌ Redshift is a data warehouse for SQL analytics. Converting Spark and HBase workloads would require a full rewrite and would not preserve the custom libraries.
- **D** ✅ Amazon EMR provides managed Hadoop, Spark, and HBase on instance types that the company chooses. Bootstrap actions and configuration classifications give control over software, and transient clusters that terminate after the jobs stop compute charges when idle.

Amazon EMR is the fit when you need the Hadoop ecosystem (Spark, HBase, Hive) with control over instances and software. AWS Glue is serverless Spark for ETL with less control; it does not run HBase.

</details>

### performant-3.5-09

_Amazon Quick Sight, Amazon Athena, Amazon S3_

A logistics company stores shipment data in Amazon S3 and queries it with Amazon Athena. About 300 business users, most of whom view reports only a few times each month, need interactive dashboards with fast filtering. The company wants a fully managed business intelligence service, does not want to manage servers or install desktop BI software, and wants dashboards to respond quickly without running an Athena query on every click.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Use Amazon Quick Sight with Athena as the data source, import the data into SPICE on a schedule, and share dashboards with view-only users.
- **B.** Use Amazon Quick Sight with Athena as the data source in direct query mode, and share the dashboards with view-only users.
- **C.** Install a commercial BI server on Amazon EC2 instances behind an Application Load Balancer. Connect it to Athena through the JDBC driver.
- **D.** Load the data into an Amazon Redshift provisioned cluster, build charts in Amazon Redshift query editor v2, and share them with the business users.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ Amazon Quick Sight (formerly Amazon QuickSight) is a fully managed BI service. SPICE holds the data in memory so dashboard interactions do not query Athena each time, and low-cost view-only user licences suit occasional viewers.
- **B** ❌ This is fully managed, but direct query sends a query to Athena for dashboard interactions. That adds latency and Athena scan charges, which the company wants to avoid.
- **C** ❌ This can serve dashboards, but the company must manage servers and buy BI licenses. It is not fully managed and is not the most cost-effective option.
- **D** ❌ A provisioned Redshift cluster runs continuously and is costly for occasional report viewers. The query editor is a SQL tool for analysts, not a managed BI dashboard service for 300 business users.

Amazon Quick Sight (formerly QuickSight) is the AWS managed BI service, and SPICE imports data into memory so dashboards stay fast without re-querying the source. Direct query mode is the near-miss: it works but pays for and waits on Athena for every interaction.

</details>

### performant-3.5-10

_AWS DataSync, AWS Direct Connect, Amazon EFS_

A company is migrating 60 TB of files from an on-premises NFS server to Amazon EFS. The data center has a 10 Gbps AWS Direct Connect connection that is mostly idle. Users will keep changing files on the NFS server for the 3 weeks before cutover, and the final cutover window is 4 hours. The company wants built-in data integrity verification and does not want to write transfer scripts.

Which solution will meet these requirements?

- **A.** Order several AWS Snowball Edge Storage Optimized devices. Copy the data to the devices, ship them to AWS, and import the data into Amazon EFS.
- **B.** Mount the EFS file system on an Amazon EC2 instance and run rsync jobs over the Direct Connect connection from an on-premises server on a schedule.
- **C.** Deploy an AWS DataSync agent on premises, and run a DataSync task from the NFS share to Amazon EFS over Direct Connect repeatedly until cutover.
- **D.** Create an AWS Transfer Family SFTP server with Amazon EFS as the backend storage. Have the operations team upload the files with an SFTP client.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Snowball Edge imports data into Amazon S3, not directly into EFS, and an offline copy would be weeks out of date by cutover. The idle 10 Gbps link can move 60 TB in well under a day.
- **B** ❌ rsync can copy incremental changes, but the company must write, schedule, and monitor the scripts and handle verification and parallelism itself. This does not meet the requirement to avoid transfer scripts.
- **C** ✅ DataSync is a managed online transfer service that copies only changed files on later runs, verifies data integrity, and uses the available bandwidth. A final incremental run fits easily in the 4-hour cutover window.
- **D** ❌ Transfer Family provides managed SFTP endpoints for users and partners to exchange files. It is not designed for bulk incremental migration of a 60 TB file share and offers no automatic change detection.

AWS DataSync is the managed tool for online migration of file shares to EFS, FSx, or S3, with incremental runs and integrity checks. Choose Snow Family only when the network cannot move the data in time, and Transfer Family when external users need SFTP or FTP access.

</details>

### performant-3.5-11

_AWS Snowball Edge, AWS DataSync, Amazon S3_

A film studio must move 900 TB of archived video from its data center to Amazon S3 within 6 weeks. The data center has a 500 Mbps internet connection that is shared with production traffic, and installing AWS Direct Connect would take several months. The archive is static and will not change during the migration.

Which solution will meet these requirements?

- **A.** Order multiple AWS Snowball Edge Storage Optimized devices. Copy the archive to the devices in parallel and ship them to AWS for import into Amazon S3.
- **B.** Deploy an AWS DataSync agent on premises, and run parallel DataSync tasks that transfer the archive to Amazon S3 over the internet connection.
- **C.** Enable S3 Transfer Acceleration on the target bucket, and upload the archive with parallel multipart uploads from several on-premises servers.
- **D.** Order an AWS Direct Connect hosted connection with 10 Gbps capacity from a Direct Connect Partner, and run AWS DataSync over the connection.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ Snowball Edge devices move large datasets offline, so throughput does not depend on the internet link. Running several devices in parallel can move hundreds of terabytes within weeks.
- **B** ❌ DataSync makes good use of available bandwidth, but 900 TB over a 500 Mbps link would take more than 5 months even at full utilization. It cannot meet the 6-week deadline.
- **C** ❌ Transfer Acceleration improves throughput over long distances, but it cannot exceed the 500 Mbps local link. The upload would still take months.
- **D** ❌ A 10 Gbps link could move the data quickly once installed, but the stem states Direct Connect would take several months to provision. It cannot meet the 6-week deadline.

Calculate transfer time first: 900 TB at 500 Mbps is roughly 170 days. When the network cannot meet the deadline, use Snowball Edge devices in parallel for an offline transfer. Online tools such as DataSync and Transfer Acceleration are limited by the link.

</details>

### performant-3.5-12

_AWS Transfer Family, Amazon S3_

A bank receives daily statement files from 40 partner organizations. The partners use existing automated SFTP clients and cannot change their tooling. The bank currently runs an SFTP server on an Amazon EC2 instance that writes to Amazon S3, and patching and scaling the server takes significant effort. Files must land in Amazon S3 so that downstream processing can start.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Create an AWS Transfer Family SFTP server with an Amazon EFS file system as the storage backend, and create a user for each partner.
- **B.** Create an AWS Transfer Family SFTP server with an Amazon S3 bucket as the storage backend, and map each partner's user to its own S3 prefix.
- **C.** Move the SFTP server into an Auto Scaling group behind a Network Load Balancer and mount the S3 bucket on each instance with Mountpoint for Amazon S3.
- **D.** Create AWS Transfer Family SFTP connectors that connect to each partner, and retrieve the daily statement files into the S3 bucket.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ This gives partners a managed SFTP endpoint, but the files land in Amazon EFS rather than Amazon S3, so downstream processing would need an extra copy step.
- **B** ✅ Transfer Family provides a fully managed, highly available SFTP endpoint that stores files directly in Amazon S3. Partners keep their SFTP clients, and the bank no longer patches or scales servers.
- **C** ❌ This improves availability, but the bank still patches and manages the SFTP servers and the AMI. It does not reduce operational overhead as much as a managed SFTP service.
- **D** ❌ SFTP connectors are outbound clients that connect to remote SFTP servers. The partners run SFTP clients, not servers, so the connectors would have nothing to connect to.

AWS Transfer Family is the managed SFTP, FTPS, FTP, and AS2 service that stores files directly in Amazon S3 or Amazon EFS. Use a Transfer Family server when external parties push files with their own clients, and SFTP connectors when AWS must pull from or push to partner-hosted servers.

</details>

### performant-3.5-13

_Amazon S3 Transfer Acceleration, Amazon S3_

A company runs a video collaboration application. Editors in Asia, Europe, and South America upload project files of 2 GB to 10 GB to a single Amazon S3 bucket in us-east-1. The editors report slow and inconsistent upload speeds over the public internet. The application must continue to write to the one existing bucket, and the company wants the simplest change to the upload path.

Which solution will meet these requirements?

- **A.** Enable S3 Transfer Acceleration on the bucket. Update the application to use the accelerate endpoint and multipart uploads.
- **B.** Create S3 buckets in Regions close to each editor group. Configure S3 Cross-Region Replication from each bucket to the bucket in us-east-1.
- **C.** Deploy AWS DataSync agents on the editors' workstations to transfer the project files to the bucket.
- **D.** Set up an AWS Site-to-Site VPN connection from each editor office to a VPC in us-east-1 and upload through an S3 gateway endpoint.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ Transfer Acceleration routes uploads to the nearest edge location and then over the AWS backbone to the bucket. Combined with multipart uploads, it improves long-distance upload speed while writing to the same bucket.
- **B** ❌ Regional buckets speed up uploads, but the application would write to several buckets instead of the one existing bucket, and replication adds cost and delay before files reach us-east-1.
- **C** ❌ DataSync agents are deployed as virtual machines or on EC2 to move data from storage systems. They are not a practical upload path for individual editors using an application.
- **D** ❌ A VPN still runs over the public internet from each office to us-east-1, so it does not shorten the long-distance path. S3 gateway endpoints are also reachable only from inside the VPC, not through a VPN connection.

S3 Transfer Acceleration speeds up long-distance transfers to a single bucket by using CloudFront edge locations and the AWS network. Use it with multipart upload for large files from geographically distant clients.

</details>

### performant-3.5-14

_Amazon OpenSearch Service, Amazon Data Firehose, Amazon Athena_

A company's operations team wants to search and visualize application logs from 200 Amazon EC2 instances. Engineers must run full-text searches on logs that are less than 1 minute old during incidents and build interactive dashboards. The logs are already published to an Amazon Data Firehose stream. The company wants a managed solution.

Which solution will meet these requirements?

- **A.** Configure the Firehose stream to deliver the logs to Amazon S3. Use Amazon Athena to search the logs and Amazon Quick Sight for dashboards.
- **B.** Configure the Firehose stream to deliver the logs to an Amazon Redshift cluster. Use the Redshift query editor to search the logs.
- **C.** Configure the Firehose stream to deliver the logs to Amazon S3. Run an AWS Glue crawler every minute and query the logs with Amazon Redshift Spectrum.
- **D.** Configure the Firehose stream to deliver the logs to an Amazon OpenSearch Service domain. Use OpenSearch Dashboards to search and visualize the logs.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ Athena runs SQL over files in S3. It is not a full-text search engine, and each query scans files, so incident searches are slower than an indexed search service.
- **B** ❌ Redshift is a columnar data warehouse for SQL analytics. It is not optimized for full-text search and has no built-in interactive log dashboards.
- **C** ❌ Crawlers only update the catalog, and Redshift Spectrum runs SQL over S3 files. This provides no full-text indexing or interactive log dashboards.
- **D** ✅ OpenSearch Service indexes documents for fast full-text search and includes OpenSearch Dashboards for visualization. Firehose delivers to it natively with short buffering, so logs are searchable within about a minute.

Amazon OpenSearch Service is the managed choice for near real-time log analytics and full-text search with dashboards. Athena and Redshift run SQL over structured data and are better for scheduled or ad hoc analytics than for interactive log search.

</details>

### performant-3.5-15

_AWS Glue, AWS Lambda, Amazon EMR_

A company receives thousands of new CSV files in an Amazon S3 bucket every day. Each night, a transformation must join the new files with reference data, clean the records, and write Parquet output. The nightly job takes about 2 hours to process one day of data. The job must process only the files that arrived since the previous run. The company wants a serverless solution.

Which solution will meet these requirements?

- **A.** Invoke an AWS Lambda function on a nightly Amazon EventBridge schedule to read the new files, perform the join, and write Parquet to Amazon S3.
- **B.** Run a persistent Amazon EMR cluster with Apache Spark. Schedule a nightly step that lists the bucket and processes files whose timestamps are newer than the last run.
- **C.** Create an AWS Glue ETL job with job bookmarks enabled. Start the job with a nightly AWS Glue trigger.
- **D.** Run an AWS Glue crawler on a nightly schedule to add the new files to the Data Catalog and convert them to Parquet.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Lambda is serverless, but a function can run for at most 15 minutes. A 2-hour transformation cannot run in a single Lambda invocation.
- **B** ❌ EMR on EC2 can run the job, but a persistent cluster must be managed and runs all day. It is not serverless, and tracking processed files requires custom logic.
- **C** ✅ AWS Glue runs serverless Spark jobs that can run for many hours. Job bookmarks track which S3 files previous runs processed, so each run reads only the new files.
- **D** ❌ A Glue crawler infers schemas and updates the Data Catalog. It does not transform data, join it with reference data, or write Parquet output.

Glue ETL jobs are serverless Spark, and job bookmarks provide built-in incremental processing of new S3 data. Remember the split: crawlers catalog, ETL jobs transform, and Lambda cannot run past 15 minutes.

</details>

### performant-3.5-16

_Amazon Kinesis Data Streams_

A sports streaming company ingests viewer interaction events into an Amazon Kinesis Data Streams stream in provisioned mode. Traffic is unpredictable: during popular broadcasts it grows to several times the normal rate over the course of an hour and then falls back. During these periods, producers receive ProvisionedThroughputExceededException errors. The company wants to stop the throttling without managing shard counts.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Switch the stream to on-demand capacity mode.
- **B.** Create an AWS Lambda function that monitors Amazon CloudWatch metrics and calls UpdateShardCount when incoming records exceed a threshold.
- **C.** Keep provisioned mode and increase the shard count to handle the peak event load at all times.
- **D.** Enable enhanced fan-out for every consumer application of the stream.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ In on-demand mode, Kinesis Data Streams automatically scales write and read capacity with traffic and the company does not manage shards. This removes throttling during spikes with no ongoing operational work.
- **B** ❌ This can scale the stream, but the company must build and maintain the scaling logic and still manages shard counts. Resharding also has limits on how often and how far it can scale at once.
- **C** ❌ Enough shards for the highest observed peak might stop throttling, but the company would still manage shard counts as traffic changes and would pay for peak capacity most of the time.
- **D** ❌ Enhanced fan-out gives each consumer dedicated read throughput. It does not increase write capacity, so producers would still be throttled.

Kinesis Data Streams on-demand mode handles unpredictable or spiky traffic without shard management. Provisioned mode suits predictable traffic; enhanced fan-out addresses read contention, not write throttling.

</details>
