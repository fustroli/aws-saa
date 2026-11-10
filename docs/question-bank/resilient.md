# Design Resilient Architectures

91 questions.

## Task 2.1

### resilient-2.1-01

_Amazon SQS, Amazon EC2 Auto Scaling_

A company runs an order-processing application on Amazon EC2 instances in an Auto Scaling group. The instances poll an Amazon SQS standard queue that uses the default queue settings. Each order takes about 3 minutes to process, and the worker deletes the message only after processing completes.

The operations team notices that many orders are processed two or more times by different instances. The company wants to stop the repeated processing with the fewest changes to the application.

Which solution will meet these requirements?

- **A.** Replace the standard queue with an SQS FIFO queue. Enable content-based deduplication on the FIFO queue.
- **B.** Enable long polling on the queue by setting the receive message wait time to 20 seconds.
- **C.** Increase the visibility timeout of the queue to a value longer than the maximum order processing time.
- **D.** Configure the queue as a delay queue by setting the delivery delay to 3 minutes.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ FIFO deduplication removes duplicate sends within a 5-minute window. It does not stop a received message from becoming visible again when processing outlasts the visibility timeout, and moving to FIFO requires a new queue and producer changes.
- **B** ❌ Long polling reduces empty ReceiveMessage responses. It does not change how long a received message stays hidden from other consumers, so the repeated processing continues.
- **C** ✅ The default visibility timeout is 30 seconds, so each message becomes visible again while the first worker is still processing it. A visibility timeout longer than the processing time keeps the message hidden until the worker deletes it, with a single configuration change.
- **D** ❌ A delivery delay hides new messages before their first receive. After a worker receives the message, the 30-second visibility timeout still applies, so other workers receive it again.

When processing takes longer than the visibility timeout, SQS makes the message visible again and another consumer receives it. Set the visibility timeout above the maximum processing time. Remember: delivery delay controls when a message is first visible; visibility timeout controls how long it stays hidden after a receive.

</details>

### resilient-2.1-02

_Amazon SQS, Amazon EC2_

A company has a fleet of Amazon EC2 instances that consume messages from several Amazon SQS queues. Messages arrive sporadically, and some queues receive no messages for hours. Amazon CloudWatch shows a very high NumberOfEmptyReceives metric, and SQS request charges are higher than expected.

The company wants to reduce SQS costs without adding noticeable delay to message processing and without changing the overall architecture.

Which solution will meet these requirements?

- **A.** Set the receive message wait time on each queue to 20 seconds so that consumers use long polling.
- **B.** Change the consumers to sleep for 5 minutes after each ReceiveMessage call that returns no messages.
- **C.** Replace the SQS queues with Amazon SNS topics that push messages to HTTP endpoints on the EC2 instances.
- **D.** Keep short polling and set the maximum number of messages per ReceiveMessage call to 10.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ Long polling holds a ReceiveMessage request open for up to 20 seconds and returns as soon as a message arrives. This cuts empty receives and request charges without adding processing delay.
- **B** ❌ Sleeping between polls reduces requests, but a message that arrives during the sleep waits up to 5 minutes. This adds noticeable processing delay.
- **C** ❌ SNS push delivery removes polling but changes the architecture and removes the durable buffer that the queues provide between producers and consumers.
- **D** ❌ Batching up to 10 messages helps when queues are busy. When queues are empty, short polling still returns immediately with no messages, so empty receives remain high.

Long polling (wait time up to 20 seconds) is the standard way to cut empty receives and SQS request costs on quiet queues. It returns immediately when a message arrives, so latency does not increase. Remember: short polling returns immediately even when empty; long polling waits for messages.

</details>

### resilient-2.1-03

_Amazon SQS, AWS Lambda_

A company uses an AWS Lambda function with an Amazon SQS standard queue as its event source to generate invoices. Occasionally a malformed message causes the function to fail. The message returns to the queue and is retried repeatedly until it expires, which wastes Lambda concurrency.

The company wants to set aside messages that fail several times so that developers can analyze them later. The messages must not be lost, and the company wants to avoid writing custom code.

Which solution will meet these requirements?

- **A.** Configure an on-failure destination for the Lambda function that sends failed invocation records to a second SQS queue.
- **B.** Reduce the message retention period of the queue to 5 minutes so that malformed messages expire quickly.
- **C.** Increase the visibility timeout of the queue to 12 hours so that failed messages are retried less often.
- **D.** Create a dead-letter queue. Configure a redrive policy on the source queue with a maximum receive count of 5.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ Lambda destinations apply to asynchronous invocations. An SQS event source mapping invokes the function synchronously, so the on-failure destination is not used for these messages.
- **B** ❌ A short retention period stops the retries by deleting the messages. The messages are lost, which breaks the requirement to keep them for analysis.
- **C** ❌ A longer visibility timeout slows the retries but does not separate the failing messages from valid ones. They are still retried until the retention period ends.
- **D** ✅ After a message is received 5 times without being deleted, SQS moves it to the dead-letter queue. The message is kept for analysis and stops consuming Lambda concurrency, with no custom code.

A redrive policy with maxReceiveCount moves poison messages to a dead-letter queue after a set number of failed receives. For SQS event sources, configure the DLQ on the source queue, not as a Lambda destination. Remember: Lambda on-failure destinations cover asynchronous invocations and Kinesis, DynamoDB Streams, and Kafka event source mappings, but not SQS event source mappings.

</details>

### resilient-2.1-04

_Amazon SQS, Amazon ECS_

A financial services company processes account transactions from an Amazon SQS FIFO queue. Transactions for the same account must be applied in the order they were sent. Transactions for different accounts are independent. Producers send every message with the same message group ID.

Transaction volume has grown, and the consumers that run on Amazon ECS cannot keep up. Adding more consumer tasks has not increased throughput. The company must increase processing parallelism while preserving per-account ordering.

Which solution will meet these requirements?

- **A.** Replace the FIFO queue with an SQS standard queue. Add more consumer tasks to process messages in parallel.
- **B.** Change the producers to use the account ID as the message group ID. Keep the FIFO queue and scale out the consumer tasks.
- **C.** Enable high throughput mode on the FIFO queue. Keep the single message group ID and scale out the consumer tasks.
- **D.** Create one FIFO queue for each consumer task. Change the producers to distribute transactions across the queues in round-robin order.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ A standard queue increases parallelism but offers only best-effort ordering, so transactions for the same account could be applied out of order.
- **B** ✅ FIFO ordering is enforced per message group. With one group per account, messages for different accounts can be processed by different consumers at the same time while each account stays in order.
- **C** ❌ High throughput mode raises the API request limits. With a single message group, SQS still delivers the group's messages to only one consumer at a time to preserve order, so more consumers do not help.
- **D** ❌ Round-robin distribution sends transactions for the same account to different queues and consumers. Per-account ordering is lost.

In a FIFO queue, the message group ID is the unit of ordering and of parallelism. Using a fine-grained key such as the account ID lets many consumers work in parallel while each group stays strictly ordered. Remember: one message group means one consumer at a time, regardless of throughput mode.

</details>

### resilient-2.1-05

_Amazon SNS, Amazon SQS_

An ecommerce company has an order service that sends an event to an Amazon SQS queue for each new order. The fulfillment system consumes the queue. The company now needs an analytics system and an email system to also receive every order event. Each system processes events at its own pace and must not lose events if it is unavailable for several hours.

The company plans to add more consuming systems in the future and does not want to change the order service each time.

Which solution will meet these requirements?

- **A.** Configure the analytics system and the email system to poll the existing SQS queue alongside the fulfillment system.
- **B.** Publish order events to an Amazon SNS topic. Subscribe an HTTPS endpoint for each system to the topic.
- **C.** Publish order events to an Amazon SNS topic. Subscribe a separate SQS queue for each system to the topic.
- **D.** Create an SQS queue for each system. Change the order service to send each event to every queue.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Consumers of one SQS queue compete for messages. Each event is processed by only one system, so the other systems miss it.
- **B** ❌ SNS delivers every event to each subscriber, but HTTPS delivery retries stop after at most 3,600 seconds. Without a durable buffer, a system that is unavailable for several hours loses events.
- **C** ✅ SNS fan-out copies every event to each subscribed queue. Each queue buffers events durably for its system, and new systems are added by subscribing a new queue without changing the order service.
- **D** ❌ Each system gets its own durable copy, but the order service must be changed every time a new consumer is added, which breaks a stated requirement.

SNS-to-SQS fan-out delivers every message to every subscriber and lets each consumer read from its own durable queue at its own pace. Producers publish once and never need to know about consumers. Remember: SQS distributes work between consumers; SNS copies messages to all subscribers.

</details>

### resilient-2.1-06

_Amazon SNS, Amazon SQS_

An insurance company publishes claim events as JSON messages to an Amazon SNS topic. Three Amazon SQS queues are subscribed to the topic. The fraud-review application that reads one of the queues needs only claims where the claimAmount field in the message body is greater than 10,000. Today it receives every claim and discards about 90% of them.

The team that owns the publishing application cannot change its code in the next year. The company wants to stop delivering irrelevant claims to the fraud-review queue with the LEAST development effort.

Which solution will meet these requirements?

- **A.** Create a second SNS topic for high-value claims. Subscribe the fraud-review queue to the new topic.
- **B.** Subscribe an AWS Lambda function to the topic. Have the function inspect each claim and forward high-value claims to the fraud-review queue.
- **C.** Change the fraud-review application to delete low-value claims from its queue immediately after it receives them.
- **D.** Apply a subscription filter policy to the fraud-review queue subscription with a message body scope and a numeric condition on claimAmount.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ A separate topic works only if the publisher decides which topic to use for each claim. The publishing code cannot change, so nothing would be published to the new topic.
- **B** ❌ A routing function works but adds code to write, deploy, and maintain. Native SNS filtering achieves the same result with configuration only.
- **C** ❌ The queue still receives every claim, and the application still pays to receive and discard most messages. This does not stop the irrelevant deliveries.
- **D** ✅ SNS filter policies can match on fields in the message body. Only claims with claimAmount greater than 10,000 are delivered to the queue, with no code changes.

SNS subscription filter policies route a subset of messages to each subscriber, and payload-based filtering can match on fields in the JSON body. This avoids publisher changes and routing code. Remember: filter at the subscription, not in the consumer.

</details>

### resilient-2.1-07

_Amazon EventBridge, AWS Lambda, AWS Organizations_

A company has 30 AWS accounts in an organization in AWS Organizations. The operations team wants every Amazon EC2 instance state change in every account to be recorded by a single AWS Lambda function in a central operations account. The changes must be recorded within seconds of occurring.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** In each member account, add an EventBridge rule that sends EC2 state-change events to the central account's event bus, where a rule invokes the function.
- **B.** Deploy a Lambda function in each member account that calls the DescribeInstances API every minute and sends any changes to the central Lambda function.
- **C.** Create an organization trail in AWS CloudTrail that delivers logs to an Amazon S3 bucket. Configure an S3 event notification that invokes the Lambda function to parse new log files.
- **D.** Create an Amazon SNS topic in the central account. Configure EC2 in each member account to publish instance state changes to the topic, and subscribe the Lambda function.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ EC2 emits state-change events to EventBridge automatically. Member-account rules forward them within seconds to the central bus, whose resource policy allows the organization, and one central rule invokes the function. No polling code is needed.
- **B** ❌ Polling every minute adds delay, misses short-lived changes between polls, and requires 30 functions to maintain.
- **C** ❌ CloudTrail delivers log files to S3 several minutes after the API calls, so changes are not recorded within seconds. Parsing log files also adds custom code.
- **D** ❌ EC2 does not publish instance state changes directly to SNS. State-change events are delivered through EventBridge, so a rule would still be needed in each account.

AWS services emit events to the default EventBridge bus, and EventBridge rules can route them to an event bus in another account for central processing. This gives near-real-time, cross-account event routing with configuration only. Remember: EventBridge is the native path for AWS service events; SNS needs a publisher.

</details>

### resilient-2.1-08

_Amazon EventBridge Scheduler, AWS Lambda_

A company runs nightly report jobs from cron on a single Amazon EC2 instance. Each job must start at 02:00 local time for one of 12 regional offices in different time zones, and several of those time zones observe daylight saving time. Each job runs for less than 5 minutes and has been rewritten as an AWS Lambda function.

The company wants to remove the single point of failure and avoid managing servers. The jobs must keep starting at 02:00 local time throughout the year without manual changes.

Which solution will meet these requirements?

- **A.** Create an Amazon EventBridge rule with a cron expression for each office that invokes the corresponding Lambda function.
- **B.** Create an Amazon EventBridge Scheduler schedule with a cron expression and the office's time zone for each office. Set the Lambda function as the target.
- **C.** Create an AWS Step Functions Standard workflow for each office that uses a Wait state to pause until 02:00 local time and then invokes the Lambda function in a loop.
- **D.** Move the cron jobs to an Auto Scaling group with a minimum of two EC2 instances in different Availability Zones.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ EventBridge scheduled rules evaluate cron expressions in UTC only. The expressions would need manual changes at each daylight saving transition.
- **B** ✅ EventBridge Scheduler is serverless and lets each schedule specify a time zone. It adjusts for daylight saving time automatically, so each job keeps starting at 02:00 local time.
- **C** ❌ A looping workflow that waits for the next run is a custom scheduler that must compute local times and DST offsets in code. It adds complexity compared with a native scheduler.
- **D** ❌ Two instances remove the single point of failure, but the company still manages servers and must prevent both instances from running the same job.

EventBridge Scheduler supports time zones and daylight saving time for cron schedules and invokes targets such as Lambda without servers. EventBridge scheduled rules run in UTC only. Remember: for time-zone-aware schedules, use EventBridge Scheduler.

</details>

### resilient-2.1-09

_Amazon EventBridge, AWS Lambda_

A company's microservices communicate through a custom Amazon EventBridge event bus. Last month, a bug in the billing service caused it to process events incorrectly for 6 hours. The events were delivered successfully, so they could not be recovered.

The company wants to be able to reprocess the billing events from a specific past time window after any future incident. The solution must require the LEAST operational overhead.

Which solution will meet these requirements?

- **A.** Configure an Amazon SQS dead-letter queue on the billing rule target. Redrive the messages after the bug is fixed.
- **B.** Add an AWS Lambda function as a second target that writes every event to an Amazon DynamoDB table. Build a tool that reads a time range from the table and republishes the events.
- **C.** Create an archive on the custom event bus with an event pattern for billing events. Start a replay for the affected time window when needed.
- **D.** Increase the maximum event age and the retry attempts in the retry policy of the billing rule target to the maximum values.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ A target dead-letter queue captures only events that EventBridge fails to deliver. Events that are delivered but processed incorrectly never reach the dead-letter queue.
- **B** ❌ This stores and replays events, but the company must build and maintain the storage and replay code.
- **C** ✅ EventBridge archives keep matching events, and a replay sends events from a chosen time window back to the bus and its rules. This is a native feature that needs no custom code.
- **D** ❌ The retry policy applies only when delivery fails. Events that the billing service accepted are not retried.

EventBridge archive and replay stores events that match a pattern and can resend those from a chosen time range to the bus. It recovers from consumer bugs without custom storage. Remember: DLQs and retry policies cover delivery failures, not events that were delivered and mishandled.

</details>

### resilient-2.1-10

_AWS Step Functions, AWS Lambda_

A travel company is building a booking service. Each booking reserves a flight, then a hotel, then a rental car by calling three separate AWS Lambda functions. If any reservation fails after retries, the reservations that already succeeded must be canceled by calling compensating Lambda functions. Support staff must be able to see the state and history of each booking.

Which solution will meet these requirements with the LEAST custom code?

- **A.** Have each reservation function invoke the next function asynchronously. Configure an on-failure destination on each function that invokes a cancellation function.
- **B.** Place an Amazon SQS queue between each pair of reservation functions. Write the booking state to an Amazon DynamoDB table after each step.
- **C.** Publish each booking request to an Amazon SNS topic. Subscribe all three reservation functions to the topic.
- **D.** Create an AWS Step Functions Standard workflow with a Task state per reservation, Retry fields, and Catch fields that run compensating tasks.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ Destinations can route failures, but each cancellation function must work out which earlier steps succeeded. Booking state and history are spread across logs, which requires custom tracking.
- **B** ❌ Queues decouple the steps, but the company must write the code that tracks state, decides when to compensate, and runs the cancellations.
- **C** ❌ SNS invokes all three functions in parallel. There is no sequencing, no central state, and no built-in way to cancel completed reservations when one fails.
- **D** ✅ Step Functions orchestrates the sequence, retries, and error handling declaratively. Standard workflows keep the execution history for each booking and show it in the console.

Step Functions Standard workflows implement orchestration and the saga pattern with built-in Retry and Catch, and they record each execution's state and history. Choreography with queues, topics, or destinations needs custom code to coordinate compensation. Remember: orchestration with state and compensation points to Step Functions.

</details>

### resilient-2.1-11

_AWS Step Functions, AWS Lambda_

A company ingests about 2,000 telemetry events each second from industrial sensors. Each event passes through three AWS Lambda functions in sequence that validate, enrich, and store it. The full sequence completes in less than 10 seconds. The processing is idempotent, so at-least-once execution is acceptable.

The company wants to define the sequence and its error handling in AWS Step Functions.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Create a Step Functions Express workflow that invokes the three functions. Start an asynchronous execution for each event.
- **B.** Create a Step Functions Standard workflow that invokes the three functions. Start an execution for each event.
- **C.** Create a fourth Lambda function that invokes the three functions synchronously in sequence and handles errors in code.
- **D.** Create an Amazon Managed Workflows for Apache Airflow (Amazon MWAA) environment with a DAG that runs the three functions for each event.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ Express workflows are built for high-volume, short-duration processing of up to 5 minutes. They are billed by execution count and duration and offer at-least-once execution, which the idempotent processing allows.
- **B** ❌ Standard workflows provide exactly-once execution and long-running history, and they are billed per state transition. At 2,000 events each second this costs far more than Express workflows, and the exactly-once guarantee is not needed.
- **C** ❌ An orchestrator function pays for idle time while it waits for each call, and it moves the sequence and error handling into custom code instead of Step Functions.
- **D** ❌ Apache Airflow is designed for scheduled batch pipelines. It is not suited to starting a workflow for each of 2,000 events each second, and it does not use Step Functions.

Choose Express workflows for high-rate, short (under 5 minutes), idempotent processing, and Standard workflows for long-running processes that need exactly-once execution and full history. Standard is charged per state transition, which is expensive at very high event rates.

</details>

### resilient-2.1-12

_AWS Step Functions, AWS Lambda, Amazon S3_

A media company stores 5 million existing images in an Amazon S3 bucket. The company has written an AWS Lambda function that generates a thumbnail for one image. The company must run the function once for every existing image, with thousands of images processed in parallel. The company must be able to see which images failed and must stop the job if more than 5% of images fail.

Which solution will meet these requirements with the LEAST custom code?

- **A.** Write a Lambda function that lists the objects in the bucket and asynchronously invokes the thumbnail function for each object.
- **B.** Create an AWS Step Functions workflow with a Distributed Map state that reads the objects from the S3 bucket, invokes the thumbnail function for each object, and sets a tolerated failure percentage of 5%.
- **C.** Create an AWS Step Functions workflow with an inline Map state that receives the list of object keys as input and invokes the thumbnail function for each key.
- **D.** Configure an S3 event notification for object creation on the bucket that invokes the thumbnail function.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ Listing 5 million objects and tracking results may exceed the 15-minute Lambda timeout, and the failure tracking and 5% stop condition must be written by hand.
- **B** ✅ Distributed Map runs up to thousands of parallel child executions over an S3 dataset. It records failed items and stops the run when the tolerated failure percentage is exceeded, with no custom orchestration code.
- **C** ❌ An inline Map state runs at most 40 iterations concurrently and is bound by the execution input size and history limits. It cannot process a list of 5 million keys at the required parallelism.
- **D** ❌ Event notifications fire only for new objects. The 5 million existing images would not be processed.

Step Functions Distributed Map is designed for large-scale parallel processing of S3 datasets, with built-in failure thresholds and result reporting. Inline Map is limited to 40 concurrent iterations within one execution. Remember: S3 event notifications only cover new objects, not a backfill.

</details>

### resilient-2.1-13

_Amazon API Gateway_

A software company exposes a REST API through Amazon API Gateway to its customers. Free-tier customers must be limited to 10 requests each second and 10,000 requests each month. Premium customers must be limited to 100 requests each second with no monthly limit. API Gateway must identify which customer sends each request and enforce the limits without changes to the backend code.

Which combination of steps will meet these requirements? (Choose TWO.)

- **A.** Create a usage plan for each tier with the required throttling rate and monthly quota. Associate the usage plans with the API stage.
- **B.** Create an API key for each customer, require an API key on the API methods, and associate each key with the usage plan for its tier.
- **C.** Set the default stage-level throttling for the API to 10 requests each second.
- **D.** Attach an AWS WAF web ACL to the API stage with a rate-based rule that limits requests from each IP address.
- **E.** Set reserved concurrency on the backend AWS Lambda function to limit the requests that free-tier customers can make.

<details><summary>Answer</summary>

**Correct: A, B**

- **A** ✅ Usage plans define throttling and quota limits that API Gateway applies, on a best-effort basis, to each API key associated with the plan.
- **B** ✅ API keys let API Gateway identify the calling customer and apply that customer's usage plan limits to the request.
- **C** ❌ Stage-level throttling applies to all callers together. It cannot give premium customers a higher limit or track a monthly quota for each customer.
- **D** ❌ Rate-based rules count requests from each IP address over a time window. They cannot identify customers, apply different tiers, or enforce monthly quotas.
- **E** ❌ Reserved concurrency limits the function as a whole. It cannot tell free-tier customers from premium customers.

API Gateway usage plans combined with API keys enforce per-customer throttling and quotas at the API layer. Stage throttling, WAF rate rules, and Lambda concurrency all act on aggregate traffic or IP addresses, not on customers. Remember: per-client tiers and quotas mean usage plans plus API keys.

</details>

### resilient-2.1-14

_Amazon API Gateway, Amazon SQS, AWS Lambda, Amazon RDS_

A company's mobile app submits survey responses to a REST API in Amazon API Gateway. The API invokes an AWS Lambda function that writes each response to an Amazon RDS for PostgreSQL database. During marketing campaigns, traffic increases 50 times within minutes. The function is throttled, the database runs out of connections, and some responses are lost.

Responses do not need to be stored immediately. The app needs only an acknowledgment that a response was received.

Which solution will prevent lost responses with the LEAST operational overhead?

- **A.** Request a higher account concurrency quota and raise the reserved concurrency of the function to match the peak.
- **B.** Place an Amazon RDS Proxy between the Lambda function and the database so that the function reuses pooled connections.
- **C.** Integrate the API method directly with an Amazon SQS queue, and have the function consume the queue with a maximum concurrency.
- **D.** Enable API Gateway caching on the API stage with a 300-second TTL to absorb repeated requests during campaigns.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ More concurrent functions reduce throttling but open even more database connections during spikes, so the database is still overwhelmed.
- **B** ❌ RDS Proxy pools connections and protects the database, but the function is still throttled during a 50-times spike, and API Gateway returns errors for those requests, so responses are still lost.
- **C** ✅ API Gateway can call SQS directly and acknowledge the request once the message is stored. The queue absorbs the spike, and the maximum concurrency setting limits how many database connections the function opens.
- **D** ❌ API Gateway caching returns cached responses for repeated read requests. It does not store or buffer new survey submissions.

When the client needs only an acknowledgment, put a queue in front of the slow writer. API Gateway can integrate directly with SQS, and a Lambda consumer with bounded concurrency drains the queue at a rate the database can handle. Remember: buffer writes with SQS; read replicas and caches only help reads.

</details>

### resilient-2.1-15

_Amazon API Gateway, AWS Lambda, Amazon DynamoDB_

A company is building a customer support chat feature for its web application. Messages from support agents must appear in the customer's browser immediately, without the browser asking for them. Messages from customers must reach the backend over the same connection. The number of open conversations is unpredictable.

The company wants to avoid managing servers.

Which solution will meet these requirements?

- **A.** Create a REST API in Amazon API Gateway with AWS Lambda integrations. Have the browser call the API every 2 seconds to check for new messages.
- **B.** Create an HTTP API in Amazon API Gateway with AWS Lambda integrations that return new messages in each response.
- **C.** Run a WebSocket server on Amazon EC2 instances in an Auto Scaling group behind an Application Load Balancer.
- **D.** Create an API Gateway WebSocket API with Lambda route integrations. Store connection IDs in DynamoDB and post messages to each connection.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ Polling every 2 seconds adds delay and cost, and the server cannot push messages. The browser has to ask for each message.
- **B** ❌ HTTP APIs use a request-response model. The backend cannot send a message to the browser unless the browser first makes a request.
- **C** ❌ Application Load Balancers support WebSocket connections, so this works technically. However, the company must manage the EC2 instances, which the requirements rule out.
- **D** ✅ API Gateway WebSocket APIs keep a two-way connection open and let the backend push messages to a connection ID. API Gateway, Lambda, and DynamoDB are serverless and scale with the number of connections.

For serverless two-way, real-time communication, use an API Gateway WebSocket API, store connection IDs, and post messages back through the @connections callback. REST and HTTP APIs are request-response only. Remember: server push without servers points to WebSocket APIs.

</details>

### resilient-2.1-16

_AWS Lambda, Amazon S3_

A company runs many AWS Lambda functions in one AWS account. A batch-import function is invoked by Amazon S3 event notifications when partners upload files. When a partner uploads a large batch, the import function scales to thousands of concurrent executions. Customer-facing API functions in the same account are then throttled.

Imports can take longer to complete, but they must still be processed. The customer-facing functions must always have concurrency available.

Which solution will meet these requirements?

- **A.** Configure reserved concurrency of 200 on the batch-import function.
- **B.** Set the maximum event age for asynchronous invocations of the batch-import function to 1 hour.
- **C.** Configure reserved concurrency of 0 on the batch-import function during business hours.
- **D.** Request an increase to the account's concurrent executions quota.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ Reserved concurrency caps the import function at 200 concurrent executions, so the rest of the account pool stays available for the API functions. Throttled asynchronous invocations are retried, so imports still complete, more slowly.
- **B** ❌ Maximum event age controls how long Lambda keeps retrying an event. It does not limit how many copies of the function run at the same time.
- **C** ❌ Reserved concurrency of 0 throttles every invocation of the function. Imports would stop during business hours, and events retried past their maximum age would be lost.
- **D** ❌ A higher quota raises the ceiling, but nothing stops the import function from consuming the extra concurrency as well. The API functions are not guaranteed capacity.

Reserved concurrency both guarantees and caps a function's concurrency, carving it out of the account's shared pool. Capping a bursty function protects the other functions in the account. Remember: reserved concurrency limits scaling; provisioned concurrency pre-warms environments for latency.

</details>

### resilient-2.1-17

_AWS Lambda, Amazon SQS, Amazon S3_

A company uses Amazon S3 event notifications to invoke an AWS Lambda function asynchronously for each uploaded document. When processing still fails after Lambda's automatic retries, the operations team needs a record of the failure in an Amazon SQS queue. Each record must contain the original event, the error type, the stack trace, and the number of invocation attempts.

Which solution will meet these requirements with the LEAST custom code?

- **A.** Configure an SQS dead-letter queue on the Lambda function.
- **B.** Configure an on-failure destination on the Lambda function that sends invocation records to the SQS queue.
- **C.** Add error handling to the function code that catches exceptions and sends the event and error details to the SQS queue.
- **D.** Create an Amazon CloudWatch Logs subscription filter on the function's log group that sends error lines to a second Lambda function that writes to the SQS queue.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ A Lambda dead-letter queue receives the original event with only the request ID and a short error code and message as attributes. It does not include the stack trace or the attempt count.
- **B** ✅ An on-failure destination receives an invocation record that includes the original request payload, the error response with type and stack trace, and the approximate invoke count. It requires only configuration.
- **C** ❌ This captures the details but requires custom code in every function, and it misses failures such as timeouts that occur before the handler can run its catch block.
- **D** ❌ This requires a second function and log parsing. The log lines do not contain the original S3 event unless the function logs it.

For asynchronous Lambda invocations, on-failure destinations send a rich invocation record (request payload, response with error details, and context such as invoke count) to SQS, SNS, EventBridge, Lambda, or S3. Remember: destinations are the newer, more detailed replacement for Lambda dead-letter queues.

</details>

### resilient-2.1-18

_AWS Lambda, Amazon SQS_

An AWS Lambda function processes payment messages from an Amazon SQS standard queue in batches of 10. When one message in a batch fails, the function raises an error and all 10 messages return to the queue. The 9 messages that succeeded are then processed again, which causes duplicate payments in a downstream system that is not idempotent.

The company must keep the batch size of 10 for throughput. Only the failed messages must be retried.

Which solution will meet these requirements with the LEAST development effort?

- **A.** Set the batch size of the event source mapping to 1 and raise its maximum concurrency to keep throughput.
- **B.** Replace the standard queue with an SQS FIFO queue that uses content-based deduplication.
- **C.** Set the visibility timeout of the queue to six times the function timeout and add a redrive policy to a dead-letter queue.
- **D.** Turn on ReportBatchItemFailures for the event source mapping, and return the IDs of the failed messages from the function.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ A batch size of 1 retries only the failed message, but it breaks the requirement to keep the batch size of 10.
- **B** ❌ FIFO deduplication drops duplicate sends from producers. It does not stop Lambda from returning a whole failed batch to the queue for reprocessing.
- **C** ❌ Six times the function timeout is the recommended visibility timeout for Lambda event sources, and a DLQ isolates poison messages. However, every failed batch still returns all 10 messages to the queue.
- **D** ✅ With partial batch responses, Lambda deletes the successful messages and returns only the listed failures to the queue. This needs a small code change and no change to the batch size.

Partial batch responses (ReportBatchItemFailures) let a Lambda SQS consumer report which messages failed so that only those are retried. Without it, any error retries the entire batch. Remember: batch retries need idempotent consumers or partial batch responses.

</details>

### resilient-2.1-19

_Amazon EKS, AWS Fargate, Amazon EC2_

A company is moving its Kubernetes workloads from an on-premises cluster to Amazon Elastic Kubernetes Service (Amazon EKS). The company wants to minimize the work of patching and replacing worker nodes. Every node must run a logging and security agent that the security team deploys as a Kubernetes DaemonSet. Some pods require privileged containers.

Which compute option will meet these requirements with the LEAST operational overhead?

- **A.** Run all pods on AWS Fargate by creating Fargate profiles for every namespace.
- **B.** Migrate the workloads to Amazon ECS on AWS Fargate.
- **C.** Run the pods on Amazon EKS managed node groups.
- **D.** Run the pods on self-managed EC2 nodes that use a custom AMI, and patch the AMI monthly.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ EKS on Fargate removes node management, but Fargate does not support DaemonSets or privileged containers. The security agent and some pods cannot run.
- **B** ❌ Moving to Amazon ECS means rewriting the Kubernetes manifests and DaemonSet-based tooling. ECS on Fargate also does not support privileged containers.
- **C** ✅ Managed node groups provision EC2 nodes in an Auto Scaling group and handle updates and graceful node replacement. They run DaemonSets and privileged containers because the pods run on EC2 instances.
- **D** ❌ Self-managed nodes support DaemonSets and privileged containers, but the company must build, patch, and roll out node updates itself. This is more operational overhead than managed node groups.

Fargate removes node management but does not support DaemonSets or privileged pods. When those are required, EKS managed node groups give the lowest operational overhead on EC2. Remember: DaemonSet or privileged requirements rule out Fargate.

</details>

### resilient-2.1-20

_Amazon ECS, AWS Fargate, Elastic Load Balancing_

A company runs a web API on Amazon ECS with AWS Fargate behind an Application Load Balancer. Traffic is unpredictable. The tasks spend most of their time waiting on calls to downstream services, so CPU and memory usage stay low even when response times increase. Load tests show that each task performs well up to about 1,000 requests each minute.

The company wants the service to scale automatically so that each task stays near that load.

Which solution will meet these requirements?

- **A.** Configure ECS Service Auto Scaling with a target tracking policy on average CPU utilization of 50%.
- **B.** Configure ECS Service Auto Scaling with target tracking on ALBRequestCountPerTarget with a target value of 1,000.
- **C.** Create an ECS capacity provider for an EC2 Auto Scaling group and enable managed scaling.
- **D.** Configure ECS Service Auto Scaling with scheduled actions that increase the task count during business hours.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ Because the tasks are I/O bound, CPU utilization stays low under heavy load. The policy would not add tasks when they are needed.
- **B** ✅ Request count per target directly measures the load on each task. Target tracking adds or removes tasks to keep each task near 1,000 requests each minute.
- **C** ❌ Capacity providers with managed scaling scale EC2 instances for the cluster. They do not change the number of tasks in the service, and the service runs on Fargate.
- **D** ❌ Scheduled scaling suits predictable patterns. The traffic is unpredictable, so scheduled actions would leave the service under-provisioned or over-provisioned.

Pick the scaling metric that matches the bottleneck. For I/O-bound web tasks behind an ALB, target tracking on ALBRequestCountPerTarget scales on actual load per task. Remember: CPU-based scaling fails when the workload is not CPU bound.

</details>

### resilient-2.1-21

_Amazon EKS, AWS Fargate_

A company runs stateless microservices in containers on an on-premises Kubernetes cluster. The company deploys the services with Kubernetes manifests and Helm charts and must keep using the Kubernetes API so that the services stay portable. The company is moving the services to AWS and does not want to provision, patch, or scale any EC2 instances. The company wants to pay only for the resources that each pod requests.

Which solution will meet these requirements?

- **A.** Deploy the services to an Amazon EKS cluster and run the pods on AWS Fargate by using Fargate profiles.
- **B.** Deploy the services to an Amazon EKS cluster that uses managed node groups with Amazon EC2 Auto Scaling.
- **C.** Convert the services to Amazon ECS task definitions and run them on AWS Fargate.
- **D.** Install Kubernetes on Amazon EC2 instances by using kOps and configure the Kubernetes Cluster Autoscaler.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ EKS keeps the Kubernetes API, manifests, and Helm charts. With Fargate, each pod runs on capacity sized to its resource requests, and there are no EC2 instances to manage.
- **B** ❌ Managed node groups simplify node lifecycle, but the company still runs and pays for EC2 instances and must start node version updates. This breaks the requirement to avoid EC2 instances.
- **C** ❌ ECS on Fargate removes instance management, but ECS does not use the Kubernetes API. The company would have to rewrite its manifests and Helm charts.
- **D** ❌ A self-managed cluster keeps the Kubernetes API, but the company must manage the control plane and the EC2 worker nodes.

When Kubernetes is a requirement and the company wants no nodes to manage, use Amazon EKS with Fargate. Fargate bills for the vCPU and memory requested by each pod. Remember: ECS vs EKS is decided by the Kubernetes requirement; Fargate vs EC2 is decided by who manages the servers.

</details>

### resilient-2.1-22

_Amazon EC2 Auto Scaling, Amazon CloudWatch_

A company runs a CPU-bound web application on Amazon EC2 instances in an Auto Scaling group behind an Application Load Balancer. Traffic changes throughout the day in a pattern that the company cannot predict. The group uses a simple scaling policy that adds one instance when a CloudWatch alarm fires, followed by a 300-second cooldown. Capacity lags behind demand, and the group sometimes adds and removes instances repeatedly.

The company wants average CPU utilization to stay near 60% with the LEAST ongoing tuning.

Which solution will meet these requirements?

- **A.** Replace the simple scaling policy with a target tracking scaling policy that uses average CPU utilization with a target value of 60%.
- **B.** Replace the simple scaling policy with step scaling policies that add or remove different numbers of instances at several CPU thresholds.
- **C.** Create scheduled scaling actions that set the desired capacity for each hour of the day.
- **D.** Change the simple scaling policy to add three instances and reduce the cooldown period to 60 seconds.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ Target tracking creates and manages its own alarms and adjusts capacity in proportion to the difference from the target. It keeps CPU near 60% without manual tuning of steps or thresholds.
- **B** ❌ Step scaling reacts in proportion to the alarm breach, but the company must define and keep tuning the alarms, thresholds, and step sizes.
- **C** ❌ Scheduled actions suit predictable patterns. This traffic cannot be predicted, so fixed schedules would over-provision or under-provision.
- **D** ❌ Larger adjustments with shorter cooldowns can react faster but are likely to overshoot and cause more oscillation. The values still need manual tuning.

Target tracking is the default choice when a metric such as average CPU should stay near a value: AWS manages the alarms and the size of each adjustment. Step and simple scaling need manual thresholds. Remember: scheduled scaling is for known patterns, target tracking for unknown ones.

</details>

### resilient-2.1-23

_Amazon EC2 Auto Scaling_

A company runs a payroll application on Amazon EC2 instances in an Auto Scaling group with a target tracking scaling policy. Every weekday at 08:00, thousands of employees sign in at once and the required capacity jumps from 4 instances to 40 instances within 10 minutes. New instances need 8 minutes to bootstrap. Users receive errors for the first 15 minutes of each weekday. For the rest of the day, load changes in a pattern that the company cannot predict.

Which combination of steps will meet these requirements MOST cost-effectively? (Choose TWO.)

- **A.** Create a scheduled action that raises the minimum capacity of the group to 40 at 07:45 each weekday, and another scheduled action that lowers the minimum capacity to 4 at 09:30 each weekday.
- **B.** Keep the target tracking scaling policy to adjust capacity during the rest of the day.
- **C.** Increase the health check grace period of the group to 15 minutes.
- **D.** Set the minimum capacity of the group to 40 at all times.
- **E.** Replace the target tracking scaling policy with a simple scaling policy that has no cooldown period.

<details><summary>Answer</summary>

**Correct: A, B**

- **A** ✅ The scheduled action brings 40 instances into service before the 08:00 surge, which covers the 8-minute bootstrap time. Lowering the minimum afterward lets the group shrink again.
- **B** ✅ Target tracking handles the unpredictable load outside the morning surge and works alongside the scheduled actions, which set the capacity floor.
- **C** ❌ The grace period delays health checks on new instances. It does not launch instances earlier, so the surge still arrives before capacity is ready.
- **D** ❌ This removes the morning errors but runs 40 instances all day and night, which is not cost-effective.
- **E** ❌ A simple scaling policy still reacts only after the alarm fires. With an 8-minute bootstrap, instances arrive after the surge has started.

Combine scheduled scaling for a known, sharp surge with target tracking for the unpredictable rest of the day. Reactive policies cannot cover a surge that is faster than instance bootstrap time. Remember: scheduled actions set the capacity floor in advance; dynamic policies scale above it.

</details>

### resilient-2.1-24

_Amazon EC2 Auto Scaling_

A company runs an analytics web application on Amazon EC2 instances in an Auto Scaling group with a target tracking scaling policy. Load follows daily and weekly cycles, but the time and size of the peaks change gradually from week to week. New instances need 10 minutes to initialize, so capacity arrives after each daily ramp-up has started.

The company wants capacity in place before each ramp-up without maintaining scaling schedules by hand, and wants to minimize cost.

Which solution will meet these requirements?

- **A.** Create scheduled scaling actions for each day of the week based on last month's peaks. Update the schedules each month.
- **B.** Replace the target tracking policy with step scaling policies that use lower CPU thresholds.
- **C.** Add a predictive scaling policy in forecast and scale mode, and keep the target tracking policy.
- **D.** Raise the minimum capacity of the group to the highest peak capacity from the previous month.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Scheduled actions can add capacity ahead of the peaks, but the company must keep updating them as the pattern shifts. This breaks the requirement to avoid maintaining schedules by hand.
- **B** ❌ Lower thresholds start scaling earlier but remain reactive to load that is already arriving. They also keep more capacity running than needed at other times.
- **C** ✅ Predictive scaling learns daily and weekly patterns from the group's history and launches capacity ahead of forecast load. Its forecast updates as the pattern shifts, and target tracking still handles unexpected changes.
- **D** ❌ This keeps peak capacity running all the time, which does not minimize cost.

Predictive scaling uses machine learning on historical load to forecast cyclical demand and launches instances in advance, which suits slow-initializing instances. It complements target tracking. Remember: predictive scaling for recurring cycles, scheduled scaling for fixed known events.

</details>

### resilient-2.1-25

_Amazon EC2 Auto Scaling, Amazon SQS, Amazon CloudWatch_

A company runs video transcoding workers on Amazon EC2 instances in an Auto Scaling group. The workers poll an Amazon SQS queue, and each instance processes one message at a time in about 2 minutes. Each message must be processed within 10 minutes of arrival, so each instance can have a backlog of no more than 5 messages. The queue depth ranges from zero to several thousand messages.

The company wants the group to scale so that the processing latency target is met as the queue grows and shrinks.

Which solution will meet these requirements?

- **A.** Create a target tracking scaling policy that keeps average CPU utilization of the group at 70%.
- **B.** Create a step scaling policy that adds one instance for every 100 messages in the ApproximateNumberOfMessagesVisible metric.
- **C.** Create a target tracking scaling policy on the queue's ApproximateNumberOfMessagesVisible metric with a target value of 5 messages.
- **D.** Publish a custom metric for backlog per instance (visible messages divided by running instances) and target track it at 5.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ Each busy worker runs at high CPU whether the backlog is 1 message or 1,000 messages. CPU does not show how far behind the queue is.
- **B** ❌ One instance per 100 messages lets each instance carry a backlog of up to 100 messages, far more than the 5 that meets the latency target. The steps must also be tuned by hand.
- **C** ❌ This metric is the total queue depth, which does not change in proportion to the group size. The group would try to shrink the whole queue to 5 messages, which over-provisions.
- **D** ✅ Backlog per instance changes in proportion to the group size. Targeting 5 messages per instance keeps each message's wait within 10 minutes as the queue changes.

For queue-based scaling, AWS recommends a backlog-per-instance metric, with the target set to the acceptable latency divided by the processing time per message. Raw queue depth is not proportional to group size. Remember: target = acceptable latency / processing time.

</details>

### resilient-2.1-26

_Amazon EC2 Auto Scaling, Elastic Load Balancing_

A company runs a web application on Amazon EC2 instances in an Auto Scaling group behind an Application Load Balancer. Occasionally the application process on an instance stops responding while the operating system keeps running. The load balancer marks the instance as unhealthy and stops sending it traffic, but the instance stays in the group. The group runs with reduced capacity until an engineer terminates the instance.

The company wants unhealthy instances to be replaced automatically with the LEAST operational overhead.

Which solution will meet these requirements?

- **A.** Create an Amazon CloudWatch alarm on the StatusCheckFailed metric for each instance with an EC2 recover action.
- **B.** Turn on Elastic Load Balancing health checks for the Auto Scaling group.
- **C.** Create an AWS Lambda function that runs every 5 minutes, reads target health from the load balancer, and terminates unhealthy instances.
- **D.** Reduce the health check interval and the unhealthy threshold of the load balancer target group.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ EC2 status checks test the hardware and operating system. A hung application process does not fail them, and the recover action only moves the same instance to new hardware.
- **B** ✅ With ELB health checks turned on, the Auto Scaling group treats instances that fail the load balancer health check as unhealthy, terminates them, and launches replacements.
- **C** ❌ This works but adds custom code to maintain. Auto Scaling can use the load balancer health checks natively.
- **D** ❌ Faster checks detect the failure sooner, but the Auto Scaling group still relies on EC2 status checks and does not replace the instance.

By default, Auto Scaling uses only EC2 status checks. Turning on ELB health checks lets the group replace instances whose application fails the load balancer's health check. Remember: the load balancer stops routing, but only the Auto Scaling group replaces.

</details>

### resilient-2.1-27

_Amazon EC2 Auto Scaling, Amazon SQS_

A company runs batch workers on Amazon EC2 instances in an Auto Scaling group that scales on Amazon SQS queue depth. The instances are not behind a load balancer. Each job takes up to 20 minutes. When the group scales in, instances are often terminated in the middle of a job. The job message reappears in the queue after the visibility timeout expires, and the work starts over.

The company wants each instance to finish its current job before it is terminated.

Which solution will meet these requirements?

- **A.** Add a termination lifecycle hook with a 30-minute heartbeat timeout. Have the worker call CompleteLifecycleAction after its job.
- **B.** Change the termination policy of the group to NewestInstance so that the instances least likely to hold long jobs are removed first.
- **C.** Add a warm pool with an instance reuse policy so that scaled-in instances return to the warm pool in a stopped state.
- **D.** Use a step scaling policy that removes only one instance at a time, with a 20-minute cooldown between scale-in activities.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ A termination lifecycle hook holds the instance in a wait state before it is terminated. The worker finishes the job and signals completion, and the timeout covers the 20-minute maximum.
- **B** ❌ A termination policy only chooses which instance to terminate. Any instance can be in the middle of a job, and the chosen instance is still terminated immediately.
- **C** ❌ With an instance reuse policy, scaled-in instances are stopped and returned to the warm pool instead of terminated. Stopping the instance still interrupts the running job.
- **D** ❌ Slower scale-in reduces how many jobs are interrupted, but each instance that is removed can still be in the middle of a job.

Lifecycle hooks pause instances during launch or termination so that custom actions, such as finishing in-flight work, can complete. Termination policies, warm pools, and slower scale-in change which or how many instances leave the group, not whether a running job finishes. Remember: to let work finish before termination, use a termination lifecycle hook (or instance scale-in protection set by the worker).

</details>

### resilient-2.1-28

_Elastic Load Balancing, Amazon ECS_

A company has split its monolithic application into three services that run on Amazon ECS: orders, catalog, and users. Clients must continue to use a single domain name, and requests must be routed by URL path (/orders, /catalog, and /users) to the matching service. Each service must scale independently.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Create a Network Load Balancer for each service. Create an Amazon Route 53 record for each load balancer.
- **B.** Create one Network Load Balancer with a listener on a different port for each service.
- **C.** Create one Application Load Balancer with path-pattern listener rules that forward to a target group for each service.
- **D.** Create an Application Load Balancer for each service. Put an Amazon CloudFront distribution in front with a cache behavior for each path.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Network Load Balancers work at layer 4 and cannot route by URL path. Separate records also mean separate domain names, and three load balancers cost more than one.
- **B** ❌ Port-based routing forces clients to change the ports they call. A Network Load Balancer cannot inspect the URL path.
- **C** ✅ An Application Load Balancer routes HTTP requests by path to different target groups behind one domain name. Each ECS service registers its own target group and scales independently.
- **D** ❌ This routes by path but runs three load balancers and a distribution, which costs more and adds more to operate than a single load balancer.

A single Application Load Balancer with path-based (or host-based) listener rules is the standard front door for microservices that share a domain name. Network Load Balancers cannot see HTTP paths. Remember: layer 7 routing needs an ALB.

</details>

### resilient-2.1-29

_Elastic Load Balancing, Amazon EC2 Auto Scaling_

A gaming company runs multiplayer game servers on Amazon EC2 instances in an Auto Scaling group across two Availability Zones. Game clients send traffic over UDP. Some players connect from corporate networks whose firewalls allow outbound traffic only to specific IP addresses, so the entry point must have a fixed IP address in each Availability Zone.

Which solution will meet these requirements?

- **A.** Place an Application Load Balancer in front of the Auto Scaling group and give players the IP addresses of its nodes.
- **B.** Place an Amazon CloudFront distribution in front of the game servers.
- **C.** Place a Gateway Load Balancer in front of the Auto Scaling group and register the game servers as its targets.
- **D.** Place a Network Load Balancer with a UDP listener in front of the group, with an Elastic IP address in each Availability Zone.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ Application Load Balancers handle HTTP and HTTPS only and do not support UDP. Their IP addresses also change over time.
- **B** ❌ CloudFront delivers HTTP and HTTPS content and does not forward UDP game traffic. Its edge IP addresses are not fixed.
- **C** ❌ Gateway Load Balancers send traffic to virtual appliances such as firewalls for inspection. They are not an entry point for client traffic to application servers.
- **D** ✅ Network Load Balancers support UDP and can use one Elastic IP address in each Availability Zone, which gives players fixed addresses to allow through their firewalls.

Network Load Balancers handle TCP and UDP at layer 4, with very high throughput and support for static Elastic IP addresses in each Availability Zone. Remember: UDP or static IP requirements point to an NLB (or Global Accelerator for global anycast IPs).

</details>

### resilient-2.1-30

_Elastic Load Balancing, Amazon VPC, Amazon EC2 Auto Scaling_

A company must inspect all inbound internet traffic to its application VPC. The security team requires a specific third-party firewall product from AWS Marketplace because of existing licenses and rule sets. The firewall appliances run on Amazon EC2 instances that must scale out and in and stay highly available. Traffic must pass through the appliances transparently, with the original source and destination IP addresses preserved.

Which solution will meet these requirements?

- **A.** Deploy AWS Network Firewall in the VPC and update the route tables to send inbound traffic through the firewall endpoints.
- **B.** Deploy a Gateway Load Balancer with the appliance Auto Scaling group as targets, and route inbound traffic through its endpoints.
- **C.** Deploy a Network Load Balancer in front of the appliances and set the load balancer as the target of the ingress route table.
- **D.** Deploy an Application Load Balancer in front of the appliances and forward requests from the appliances to the application.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ Network Firewall is a managed firewall that inspects traffic transparently, but it is not the third-party product that the security team requires.
- **B** ✅ A Gateway Load Balancer distributes traffic to third-party appliances by using GENEVE encapsulation, which keeps the original packets unchanged. The endpoints act as route table targets, and the appliances scale in an Auto Scaling group.
- **C** ❌ A Network Load Balancer cannot be used as a route table target for transparent inspection. It is designed for client traffic to applications, not bump-in-the-wire appliances.
- **D** ❌ An Application Load Balancer handles only HTTP and HTTPS and ends client connections, so traffic does not pass transparently and other protocols are not inspected.

Gateway Load Balancer is built for scaling and making highly available fleets of third-party virtual appliances that inspect traffic transparently, using endpoints as route targets. Remember: ALB for HTTP apps, NLB for TCP/UDP apps, GWLB for inline appliances.

</details>

### resilient-2.1-31

_Elastic Load Balancing, Amazon EC2 Auto Scaling_

A company runs version 1 of a service on Amazon EC2 instances in an Auto Scaling group behind an Application Load Balancer. The company has deployed version 2 to a second Auto Scaling group. The company wants to send exactly 10% of requests to version 2 at first and then increase the share gradually. If errors increase, all traffic must return to version 1 immediately, without waiting for DNS caches to expire.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Create a second Application Load Balancer for version 2. Use Amazon Route 53 weighted records to send 10% of traffic to the second load balancer.
- **B.** Register the version 2 group with a second target group. Change the listener rule to forward to both target groups with weights of 90 and 10.
- **C.** Register the version 2 instances in the existing target group and size the version 2 group to one tenth of the version 1 group.
- **D.** Create an Amazon CloudFront distribution with an origin group that uses version 1 as the primary origin and version 2 as the secondary origin.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ Weighted records split traffic, but clients and resolvers cache DNS answers, so a rollback does not take effect immediately. A second load balancer also adds cost and management.
- **B** ✅ Weighted target groups let one listener rule split requests by percentage. Changing the weights takes effect at the load balancer immediately, so rollback does not depend on DNS.
- **C** ❌ The traffic share would depend on instance counts and would shift whenever either group scales, so it cannot be held at an exact percentage.
- **D** ❌ Origin groups provide failover when the primary origin returns errors. They do not split traffic by percentage between two origins.

Application Load Balancer weighted target groups support canary and blue/green releases with precise percentages and instant rollback, because routing changes happen at the load balancer rather than in DNS. Remember: Route 53 weighting is subject to DNS caching.

</details>

### resilient-2.1-32

_Amazon ElastiCache, Amazon EC2 Auto Scaling, Elastic Load Balancing_

An ecommerce company runs its web tier on Amazon EC2 instances in an Auto Scaling group behind an Application Load Balancer with sticky sessions turned on. Session data, including shopping carts, is stored in memory on each instance. When an instance is terminated during scale-in or fails, its users lose their carts and must sign in again. Load is also uneven across instances.

The company wants to make the web tier stateless. Session reads and writes must have sub-millisecond latency.

Which solution will meet these requirements?

- **A.** Store session data in an Amazon DynamoDB table with a DynamoDB Accelerator (DAX) cluster in front of it, and turn off sticky sessions.
- **B.** Store session data in an Amazon DynamoDB table that all instances share, and turn off sticky sessions on the load balancer.
- **C.** Store session data as files on an Amazon EFS file system that is mounted on all instances, and turn off sticky sessions.
- **D.** Store session data in an Amazon ElastiCache (Redis OSS) replication group with a Multi-AZ replica, and turn off sticky sessions.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ DAX serves cached reads in microseconds, but it is a write-through cache: every write goes to DynamoDB first, so session writes do not reach sub-millisecond latency.
- **B** ❌ DynamoDB makes sessions shared and durable, but it delivers single-digit millisecond latency, which does not meet the sub-millisecond requirement.
- **C** ❌ EFS shares the data across instances, but EFS write latency is in the milliseconds and a file system is not designed for many small, frequently updated session records. It does not meet the sub-millisecond requirement for writes.
- **D** ✅ ElastiCache is an in-memory key-value store with sub-millisecond latency. Every instance can read any session, so any instance can serve any request and instances can be terminated without losing sessions.

Moving session state out of the instances into an external in-memory store such as ElastiCache makes the web tier stateless, so instances can scale in or fail without user impact. DynamoDB is single-digit milliseconds, and DAX accelerates only reads because it writes through to DynamoDB. Remember: sub-millisecond reads and writes for shared sessions point to ElastiCache.

</details>

### resilient-2.1-33

_Amazon DynamoDB, AWS Lambda, Amazon API Gateway_

A company is building a serverless web application with Amazon API Gateway and AWS Lambda. The application must store user session data, and sessions must expire 30 minutes after a user's last request. Traffic is unpredictable and can increase from zero to thousands of requests each second.

The company does not want to plan capacity or manage servers, and expired sessions must be removed without custom cleanup code.

Which solution will meet these requirements?

- **A.** Store sessions in an Amazon DynamoDB table in on-demand mode. Enable Time to Live (TTL) on an expiration attribute that each request updates.
- **B.** Store sessions in an Amazon ElastiCache (Redis OSS) cluster of cache.r7g nodes in a VPC, and connect the Lambda functions to the VPC.
- **C.** Store sessions in the /tmp directory of the Lambda execution environment.
- **D.** Store sessions in an Amazon RDS for MySQL table. Use an Amazon EventBridge schedule to invoke a Lambda function that deletes expired rows every 5 minutes.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ On-demand mode scales with traffic without capacity planning, and TTL deletes expired items in the background at no cost, typically within a few days. The application treats a session as expired by checking the attribute on read.
- **B** ❌ Keys can expire in Redis, but a node-based cluster requires the company to choose node types and counts and plan capacity for peaks.
- **C** ❌ Each execution environment has its own /tmp storage, and environments are created and removed at any time. Other invocations cannot read the sessions reliably.
- **D** ❌ RDS requires sizing a DB instance for peak load, and the cleanup function is custom code that the company must maintain.

DynamoDB on-demand with TTL is a common serverless session store: no capacity planning, automatic removal of expired items, and access from any Lambda invocation. TTL deletion is not immediate, so the application also checks the expiration attribute when it reads. Remember: TTL removes expired items without consuming write capacity.

</details>

### resilient-2.1-34

_Amazon MQ_

A company is migrating several on-premises Java applications to AWS. The applications exchange messages through an Apache ActiveMQ broker by using the JMS API and the OpenWire and STOMP protocols. The company does not have time to rewrite the messaging code. The company wants to stop patching the broker and managing its failover.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Replace the broker with Amazon SQS queues and change the applications to use the AWS SDK to send and receive messages.
- **B.** Install ActiveMQ on two Amazon EC2 instances in different Availability Zones and configure an active/standby pair with shared storage on Amazon EFS.
- **C.** Create an Amazon MQ for ActiveMQ active/standby broker that spans two Availability Zones. Point the applications to the broker endpoints.
- **D.** Create an Amazon Managed Streaming for Apache Kafka (Amazon MSK) cluster and change the applications to use Kafka producers and consumers.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Amazon SQS is fully managed, but it does not support OpenWire or STOMP. The messaging code would need to be rewritten.
- **B** ❌ This keeps the protocols, but the company still patches the broker software and manages failover itself.
- **C** ✅ Amazon MQ is a managed ActiveMQ and RabbitMQ service that supports JMS, OpenWire, STOMP, and other standard protocols. AWS handles patching and automatic failover, and the applications only need new connection endpoints.
- **D** ❌ Amazon MSK is a managed Kafka service. Kafka uses its own protocol, so the applications would need to be rewritten.

Amazon MQ is the lift-and-shift choice for applications that use standard messaging APIs and protocols such as JMS, AMQP, MQTT, OpenWire, or STOMP. SQS and SNS are the choice for new cloud-native applications. Remember: existing broker protocols point to Amazon MQ.

</details>

### resilient-2.1-35

_Elastic Load Balancing, AWS Lambda_

A company runs a monolithic web application on Amazon EC2 instances behind an Application Load Balancer. The company wants to gradually move features to AWS Lambda, starting with the notifications feature. Clients must keep using the same domain name and URLs. Requests to /notifications/* must go to the new Lambda function, and all other requests must continue to go to the monolith. The company wants to limit the risk of each change.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Put an Amazon CloudFront distribution in front of the load balancer with a /notifications/* cache behavior that uses a Lambda function URL origin.
- **B.** Create an API in Amazon API Gateway for the notifications feature. Use Amazon Route 53 weighted records to split traffic between the API and the load balancer.
- **C.** Create a second Application Load Balancer for the Lambda function and have clients call its DNS name for notification requests.
- **D.** Register the Lambda function in a new target group, and add a /notifications/* rule on the existing load balancer that forwards to it.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ CloudFront can route the path to a Lambda function URL, but this adds a distribution to operate and requires moving the domain name to CloudFront. It has more overhead than a rule on the existing load balancer.
- **B** ❌ Weighted DNS records split requests by percentage, not by URL path. Notification requests would still reach the monolith, and other requests would reach the new API.
- **C** ❌ This changes the URLs that clients must use, which breaks the requirement to keep the same domain name and URLs.
- **D** ✅ Application Load Balancers can invoke Lambda functions as targets. A path-based rule sends only notification requests to the function while every other request still reaches the monolith.

This is the strangler fig pattern: a routing layer sends one path at a time to new services while the monolith keeps handling the rest. The existing ALB can already do this, because ALBs support Lambda functions as targets and path-based rules. Remember: migrate incrementally behind the endpoint you already have before adding new layers.

</details>

### resilient-2.1-36

_Amazon SQS, Amazon S3, Amazon EC2 Auto Scaling_

A photo printing company runs a web tier on Amazon EC2 instances. When a customer uploads a photo, the web server renders a print-ready file before it responds, which takes about 1 minute of CPU time. The rendering software is a licensed Windows application installed on a custom AMI. During holiday peaks, the web servers become overloaded, requests time out, and some orders are lost.

The company wants the web tier to respond quickly, the rendering capacity to scale independently, and no orders to be lost.

Which combination of steps will meet these requirements? (Choose TWO.)

- **A.** Store each upload in Amazon S3, send an SQS message that references the object, and respond to the customer immediately.
- **B.** Run the rendering code on a separate Auto Scaling group of EC2 instances that scales on the queue backlog per instance.
- **C.** Send each rendering job to an Amazon Kinesis Data Streams stream that the rendering instances read from.
- **D.** Publish each job to an Amazon SNS topic with an HTTP subscription to the rendering instances.
- **E.** Run the rendering code in AWS Lambda functions that are invoked by the SQS queue.

<details><summary>Answer</summary>

**Correct: A, B**

- **A** ✅ S3 stores the upload durably and SQS buffers the job, so the web tier responds without waiting for rendering and no order is lost during peaks.
- **B** ✅ A separate worker tier scales with the amount of queued work, independent of the web tier.
- **C** ❌ Kinesis stores records durably, but each shard is read in order by one consumer, so a slow job blocks the jobs behind it, and rendering parallelism is capped by the shard count that the company must manage.
- **D** ❌ SNS pushes each message to the HTTP endpoint without a durable backlog. If the rendering instances are busy or scaling, delivery retries can be exhausted and jobs can be lost.
- **E** ❌ Lambda would scale with the queue, but Lambda functions run on Linux-based runtimes. The licensed Windows rendering software cannot run in Lambda.

Decoupling slow work from the request path with a durable queue lets the front end respond immediately and the worker tier scale on backlog. Remember: SQS buffers work for pull-based consumers; SNS pushes without a backlog.

</details>

### resilient-2.1-37

_Amazon S3, Amazon ElastiCache, Amazon EC2 Auto Scaling_

A company runs a social web application on Amazon EC2 instances in an Auto Scaling group across three Availability Zones. The application keeps user sessions in memory and saves uploaded profile images to the Amazon EBS volume of the instance that receives the upload. After the group scales in, users are signed out and some profile images are missing.

The company wants any instance to serve any request and wants the group to keep scaling in and out with demand.

Which combination of steps will meet these requirements? (Choose TWO.)

- **A.** Store user sessions in an Amazon ElastiCache (Redis OSS) cluster that all instances use.
- **B.** Store uploaded images in an Amazon S3 bucket and save the object key with the user profile.
- **C.** Turn on sticky sessions on the load balancer.
- **D.** Store uploaded images on one Provisioned IOPS SSD (io2) volume with EBS Multi-Attach enabled and attach it to every instance.
- **E.** Turn on scale-in protection for all instances in the group.

<details><summary>Answer</summary>

**Correct: A, B**

- **A** ✅ An external session store removes session state from the instances, so users stay signed in when an instance terminates.
- **B** ✅ S3 stores the images durably outside the instances, and every instance can read them in any Availability Zone.
- **C** ❌ Sticky sessions keep a user on one instance while it runs, but sessions and images on that instance are still lost when it terminates.
- **D** ❌ Multi-Attach works only with instances in the same Availability Zone as the volume and needs a cluster-aware file system. It cannot serve instances in three Availability Zones.
- **E** ❌ Scale-in protection stops the data loss by preventing the group from shrinking, which breaks the requirement to keep scaling with demand.

A stateless tier keeps no data on its instances: sessions go to a shared store such as ElastiCache or DynamoDB, and files go to Amazon S3 (or Amazon EFS when a file system is required). Remember: EBS volumes, including Multi-Attach, are bound to one Availability Zone.

</details>

### resilient-2.1-38

_AWS Lambda, Amazon SQS_

A company uses an AWS Lambda function to process messages from an Amazon SQS standard queue. The function calls a partner API that accepts no more than 50 concurrent requests. During spikes, Lambda scales out and the partner API rejects requests. Some messages contain data that the partner API will never accept.

The company wants to stay within the partner's limit without messages being set aside only because the function was throttled. Messages that fail repeatedly must be kept for investigation.

Which combination of steps will meet these requirements? (Choose TWO.)

- **A.** Set the maximum concurrency of the SQS event source mapping to 50.
- **B.** Set the reserved concurrency of the Lambda function to 50.
- **C.** Create a dead-letter queue and configure a redrive policy on the source queue with a maximum receive count of 5.
- **D.** Configure an on-failure destination on the Lambda function that sends failed events to a second SQS queue.
- **E.** Increase the batch size of the event source mapping to 50 messages.

<details><summary>Answer</summary>

**Correct: A, C**

- **A** ✅ Maximum concurrency limits how many concurrent function invocations the event source mapping starts. Lambda stops reading more messages instead of throttling, so messages are not returned to the queue because of throttling.
- **B** ❌ Reserved concurrency caps the function, but the SQS pollers can still read more messages than the function can run. Throttled messages return to the queue and count as receives, so valid messages can reach the dead-letter queue.
- **C** ✅ Messages that fail 5 times move to the dead-letter queue, where they are kept for investigation instead of being retried until they expire.
- **D** ❌ Destinations apply to asynchronous invocations. Event source mappings for SQS invoke the function synchronously, so the destination is not used.
- **E** ❌ A larger batch size changes how many messages each invocation receives. It does not limit the number of concurrent invocations calling the partner API.

For SQS event sources, the event source mapping's maximum concurrency is the right way to limit downstream pressure; reserved concurrency throttles after messages are already received. Pair it with a dead-letter queue on the source queue for poison messages. Remember: Lambda destinations do not apply to SQS event sources.

</details>

### resilient-2.1-39

_Amazon API Gateway, Amazon SQS, AWS Step Functions, Amazon EventBridge_

A retailer is building a serverless order pipeline. Partners submit orders over HTTPS, and orders must be stored durably during traffic spikes. Each order must go through validation, payment, and inventory steps with retries, and support staff must be able to see each order's progress. When an order completes, the shipping, analytics, and loyalty teams must each receive an event, filtered by rules that each team defines. New teams are added often.

Which combination of steps will meet these requirements with the LEAST operational overhead? (Choose THREE.)

- **A.** Create a REST API in Amazon API Gateway that sends each order directly to an Amazon SQS queue.
- **B.** Use a Lambda function that reads the queue to start an AWS Step Functions Standard workflow for each order that runs the three steps with retries.
- **C.** Publish an order-completed event to an Amazon EventBridge custom event bus. Have each team create its own rule with an event pattern.
- **D.** Run the validation, payment, and inventory steps in a script on an Amazon EC2 instance that reads from the queue.
- **E.** Send order-completed events to a single Amazon SQS queue that all teams poll.
- **F.** Ingest orders into an Amazon Kinesis Data Streams stream in provisioned mode and adjust the shard count before each expected peak.

<details><summary>Answer</summary>

**Correct: A, B, C**

- **A** ✅ API Gateway accepts the HTTPS requests and stores each order in SQS without servers, which buffers spikes durably.
- **B** ✅ Step Functions runs the steps with built-in retries, and the execution history shows each order's progress to support staff.
- **C** ✅ Each EventBridge rule filters events by content and routes them to the team's targets. New teams add rules without changing the pipeline.
- **D** ❌ A script on EC2 requires server management and custom retry and tracking code, and the instance is a single point of failure.
- **E** ❌ Consumers of one queue compete for messages, so each event reaches only one team. Queues also cannot filter by each team's rules.
- **F** ❌ Kinesis can buffer orders, but provisioned shards must be managed and resized by the company, which adds operational overhead compared with SQS.

Each part of the pipeline gets the managed service built for it: API Gateway with SQS for durable intake, Step Functions for orchestration with retries and visibility, and EventBridge for rule-based fan-out to many consumers. Remember: queues buffer, workflows orchestrate, event buses route.

</details>

### resilient-2.1-40

_Amazon S3, Amazon EventBridge, AWS Lambda_

A company stores customer uploads in an Amazon S3 bucket. Three teams need to react to new objects. A virus-scanning AWS Lambda function must process every object under the uploads/ prefix. A thumbnail Lambda function must process only objects under uploads/ that end in .jpg. A compliance Lambda function must process every object larger than 1 GB. The company tried to configure S3 event notifications but received an error about overlapping configurations.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Create three S3 event notification configurations for the object created event, each with its own prefix and suffix filter, and point each one to a function.
- **B.** Create one S3 event notification that invokes a router Lambda function. Have the router inspect each event and invoke the correct functions.
- **C.** Turn on Amazon EventBridge notifications for the bucket. Create three rules that match on key prefix, key suffix, and object size.
- **D.** Create one S3 event notification that publishes to an Amazon SNS topic. Subscribe all three functions and have each function ignore objects that it does not need.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ S3 event notifications do not allow overlapping prefix and suffix filters for the same event type, which is the error the company received. They also cannot filter by object size.
- **B** ❌ A router function works, but the company must write and maintain the routing code.
- **C** ✅ With EventBridge, each rule can match overlapping sets of objects. Event patterns support prefix and suffix matching on the key and numeric matching on object size.
- **D** ❌ SNS fan-out delivers every event to every function, so each function needs filtering code and is invoked for objects it does not process.

S3 integration with EventBridge removes the limits of S3 event notifications: overlapping filters, richer matching (such as object size), and many targets per event. Remember: when native S3 notification filters are too limited, send bucket events to EventBridge.

</details>

### resilient-2.1-41

_Amazon SQS, AWS Lambda_

A company sends account reminder messages through an Amazon SQS standard queue to an AWS Lambda function that sends emails. Password-reset reminders must reach the function 5 minutes after they are sent to the queue. Trial-expiry reminders must reach the function 10 minutes after they are sent. Both types of messages must continue to use the same queue.

Which solution will meet these requirements with the LEAST change to the application?

- **A.** Have the producer set a per-message DelaySeconds value of 300 or 600 seconds, depending on the reminder type.
- **B.** Use Amazon EventBridge Scheduler one-time schedules that send each reminder to the queue at the required time.
- **C.** Create two delay queues with delivery delays of 5 and 10 minutes, and have the producer send each reminder type to its own queue.
- **D.** Configure the queue as a delay queue with a delivery delay of 10 minutes.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ Message timers on a standard queue hide each message for its own delay, up to 15 minutes. One queue can then deliver each reminder type after a different delay.
- **B** ❌ This works, but the producer must create a schedule for every message and manage schedule cleanup. A message attribute on the existing send call is a smaller change.
- **C** ❌ Two delay queues give each type the right delay, but the company requires both types to keep using the same queue.
- **D** ❌ A queue-level delivery delay applies the same delay to every message. Password-reset reminders would arrive after 10 minutes instead of 5 minutes.

SQS supports a delay for the whole queue (delay queue) and a delay for each message (message timer), both up to 15 minutes. Use message timers when different messages need different delays. Remember: message timers are not supported on FIFO queues, and delay is not the same as visibility timeout.

</details>

### resilient-2.1-42

_Amazon SQS, Amazon S3_

A medical imaging company uses an Amazon SQS queue to pass scan results from a Java producer application to a Java processing service. Each scan result is 20 MB to 50 MB, which is larger than the maximum SQS message size. The company wants to keep SQS to decouple the two applications.

Which solution will meet these requirements with the LEAST development effort?

- **A.** Compress each scan result with gzip before sending it in the message body.
- **B.** Use the Amazon SQS Extended Client Library for Java to store each payload in Amazon S3 and send a reference in the message.
- **C.** Split each scan result into chunks that fit in a message and reassemble the chunks in the processing service.
- **D.** Mount an Amazon EFS file system on both applications. Write each scan result to the file system and send the file path in the message.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ Image data is already dense and does not compress enough to bring 20 MB to 50 MB payloads under the SQS message size limit.
- **B** ✅ The Extended Client Library implements the claim-check pattern for the company: it stores large payloads in S3, sends a reference through SQS, and retrieves the payload for the consumer.
- **C** ❌ Chunking requires custom code to track and reorder parts, and a standard queue can deliver chunks out of order or more than once.
- **D** ❌ This works, but the company must write the file handling and cleanup code and manage mounts on both applications. A ready-made library achieves the same result with less effort.

For payloads larger than the SQS message size limit, store the payload in S3 and pass a pointer through the queue (the claim-check pattern). The SQS Extended Client Library does this automatically. Remember: queues carry references, object storage carries large data.

</details>

### resilient-2.1-43

_Amazon EventBridge Scheduler, Amazon ECS, AWS Fargate, AWS Lambda_

A company runs a nightly data-reconciliation job as an AWS Lambda function. The data volume has grown, and the job now needs up to 45 minutes, so the function times out. The job cannot be split into smaller parts. The code is already packaged as a container image.

The company wants the job to start at 01:00 each night, to retry automatically if it fails to start, and to run without any servers to manage.

Which solution will meet these requirements?

- **A.** Create an EventBridge Scheduler schedule with a retry policy that runs the image as an Amazon ECS task on AWS Fargate at 01:00.
- **B.** Increase the timeout of the Lambda function to 60 minutes and keep the existing schedule.
- **C.** Create an AWS Step Functions Express workflow that invokes the Lambda function repeatedly until the job completes.
- **D.** Run the container on an Amazon EC2 instance in an Amazon ECS cluster and start the job with a cron entry on the instance.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ ECS tasks on Fargate have no 15-minute limit and need no servers. EventBridge Scheduler can run ECS tasks directly and retries the target if the call fails.
- **B** ❌ The maximum Lambda timeout is 15 minutes, so a 45-minute job cannot complete in one invocation.
- **C** ❌ Express workflows run for at most 5 minutes, and the job cannot be split into parts that separate invocations could run.
- **D** ❌ This removes the time limit, but the company must manage the EC2 instance, and cron has no automatic retry if the job fails to start.

When a task exceeds Lambda's 15-minute maximum, run it as a container on Fargate, triggered by EventBridge Scheduler or Step Functions. Remember: Lambda for short event-driven work; Fargate tasks for long jobs without servers.

</details>

### resilient-2.1-44

_Amazon ECS, AWS Fargate, AWS Cloud Map_

A company runs 20 microservices on Amazon ECS with AWS Fargate. Each service calls other services through a dedicated internal Application Load Balancer, and the company pays for 20 load balancers. The company wants services to find each other by name, with load balancing, retries, and traffic metrics between services. The company does not want to deploy or manage its own service mesh software.

Which solution will meet these requirements?

- **A.** Create records for each task in an Amazon Route 53 private hosted zone and update the records when tasks start and stop.
- **B.** Configure Amazon ECS Service Connect with an AWS Cloud Map namespace, and remove the internal load balancers.
- **C.** Deploy a self-managed service mesh with Envoy sidecar containers and a HashiCorp Consul cluster on Amazon EC2 instances.
- **D.** Replace each internal Application Load Balancer with an internal Network Load Balancer.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ Fargate task IP addresses change frequently, so the records would need constant updates. DNS records also do not provide retries or traffic metrics.
- **B** ✅ Service Connect registers services in Cloud Map and adds a managed proxy to each task. Services call each other by name with load balancing, retries, and traffic metrics, without separate load balancers.
- **C** ❌ This provides discovery, retries, and metrics, but the company must deploy and operate the mesh software and the EC2 instances.
- **D** ❌ Network Load Balancers can cost less, but the company still runs 20 load balancers. They do not provide name-based discovery, retries, or request-level metrics between services.

ECS Service Connect provides managed service discovery (through Cloud Map), client-side load balancing, retries, and metrics for service-to-service calls without internal load balancers or a self-managed mesh. Remember: use Cloud Map or Service Connect for discovery between ECS services.

</details>

### resilient-2.1-45

_Amazon SNS, Amazon SQS, Amazon EventBridge_

A trading platform publishes price updates for thousands of financial instruments. Three downstream systems must each receive every update. For each instrument, updates must reach each system in the order they were published and without duplicates. Updates for different instruments can be processed in parallel.

Which solution will meet these requirements?

- **A.** Publish updates to an Amazon SNS standard topic. Subscribe an Amazon SQS queue for each system.
- **B.** Publish updates to one Amazon SQS FIFO queue with the instrument ID as the message group ID. Have all three systems poll the queue.
- **C.** Publish updates to an Amazon EventBridge custom event bus. Create a rule for each system that targets an SQS FIFO queue.
- **D.** Publish updates to an Amazon SNS FIFO topic with the instrument ID as the message group ID. Subscribe an SQS FIFO queue per system.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ SNS standard topics deliver every message to each subscriber but provide best-effort ordering and at-least-once delivery, so updates can arrive out of order or more than once.
- **B** ❌ The FIFO queue preserves order per instrument, but the three systems compete for messages. Each update reaches only one system.
- **C** ❌ EventBridge does not guarantee the order in which events are delivered to targets, so per-instrument ordering cannot be ensured.
- **D** ✅ SNS FIFO topics preserve order within each message group and deduplicate messages, then fan out to SQS FIFO queues. Each system receives every update in order per instrument, and different instruments can be processed in parallel.

Ordered, deduplicated fan-out requires SNS FIFO topics delivering to SQS FIFO queues, with the message group ID set to the ordering key. Remember: SNS standard and EventBridge provide no ordering guarantee; a single queue cannot deliver each message to every consumer.

</details>

### resilient-2.1-46

_AWS Step Functions, AWS Lambda, Amazon SNS_

A bank uses an AWS Step Functions workflow to process loan applications. After automated checks finish, a human underwriter must approve or reject the application in an internal web application. The underwriter can take up to 5 days to respond. The workflow must pause until the decision arrives, must not pay for compute while it waits, and must continue as soon as the underwriter responds.

Which solution will meet these requirements?

- **A.** Add a loop to the workflow that uses a Wait state of 10 minutes and then invokes a Lambda function that checks a database for the underwriter's decision.
- **B.** Convert the workflow to a Step Functions Express workflow with a Wait state that pauses until the underwriter responds.
- **C.** Use a .waitForTaskToken Task state that sends the task token through Amazon SNS. Have the web application return the token with the decision.
- **D.** Invoke a Lambda function that waits in a loop until the underwriter's decision is written to a database, and then returns the decision to the workflow.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Polling works but adds up to 10 minutes of delay after the decision, invokes a function hundreds of times for each application, and requires custom polling code.
- **B** ❌ Express workflows run for at most 5 minutes, so they cannot wait up to 5 days for a decision.
- **C** ✅ The callback pattern pauses a Standard workflow for up to one year without running compute. The workflow resumes as soon as the web application calls SendTaskSuccess or SendTaskFailure with the token.
- **D** ❌ Lambda functions run for at most 15 minutes and are billed while they wait, so a function cannot wait up to 5 days for a decision.

The Step Functions callback pattern (.waitForTaskToken) pauses a Standard workflow until an external system or person returns the task token. Use it for human approvals and long external steps. Remember: Standard workflows run up to one year; Express workflows up to 5 minutes.

</details>

## Task 2.2

### resilient-2.2-01

_Amazon RDS_

A company runs an order-processing application that stores data in a single-AZ Amazon RDS for PostgreSQL DB instance. An outage in the instance's Availability Zone recently stopped order processing for several hours.

The company needs the database to fail over automatically if an Availability Zone becomes unavailable. Committed transactions must not be lost during a failover, and the application must continue to use the same database endpoint. The application does not need additional read capacity.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Create a read replica of the DB instance in a different Availability Zone. Use an Amazon CloudWatch alarm and an AWS Lambda function to promote the replica and update the application's connection string when the primary fails.
- **B.** Modify the DB instance to be a Multi-AZ deployment so that Amazon RDS maintains a synchronous standby instance in a different Availability Zone.
- **C.** Use AWS Backup to take snapshots of the DB instance every 15 minutes. Restore the latest snapshot to a new DB instance in another Availability Zone when the primary fails.
- **D.** Migrate the database to PostgreSQL on Amazon EC2 instances in two Availability Zones. Configure synchronous streaming replication and a floating private IP address for failover.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ A read replica uses asynchronous replication, so recently committed transactions can be lost at promotion. The custom promotion and connection-string logic also adds operational overhead and changes the endpoint.
- **B** ✅ A Multi-AZ deployment replicates synchronously to a standby in another Availability Zone and fails over automatically by updating the DNS record of the same endpoint. This meets every requirement with a single configuration change.
- **C** ❌ Restoring from snapshots loses up to 15 minutes of transactions, takes time, and produces a new endpoint. This does not meet the no-data-loss or automatic failover requirements.
- **D** ❌ Self-managed replication on EC2 can avoid data loss, but the company would have to build and operate failover, patching, and backups. This is far more operational overhead than a managed Multi-AZ deployment.

RDS Multi-AZ keeps a synchronous standby in another Availability Zone and fails over automatically behind the same DNS endpoint, so no committed data is lost and the application needs no changes. Remember: Multi-AZ is for availability (synchronous, automatic failover); read replicas are for read scaling (asynchronous, manual promotion).

</details>

### resilient-2.2-02

_Amazon RDS_

A company runs a production database on an Amazon RDS for MySQL Multi-AZ DB instance deployment. Business analysts run heavy reporting queries against the primary instance, which slows down the application. The company also wants failovers to complete faster than they do today.

The company must remain on Amazon RDS for MySQL because of a vendor support agreement. The company wants the standby capacity that it pays for to serve read traffic instead of sitting idle.

Which solution will meet these requirements?

- **A.** Keep the Multi-AZ DB instance deployment. Point the reporting tools at the endpoint of the standby instance in the second Availability Zone.
- **B.** Keep the Multi-AZ DB instance deployment. Add a read replica in a third Availability Zone and point the reporting tools at the read replica endpoint.
- **C.** Migrate the database to an RDS for MySQL Multi-AZ DB cluster deployment. Point the reporting tools at the cluster's reader endpoint.
- **D.** Migrate the database to an Amazon Aurora MySQL DB cluster with two Aurora Replicas. Point the reporting tools at the cluster's reader endpoint.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ In a Multi-AZ DB instance deployment, the standby is not accessible for reads. Reporting queries cannot be sent to it.
- **B** ❌ A read replica offloads the reporting queries, but the standby still sits idle and failover time does not improve. This does not meet the requirements for faster failover or a readable standby.
- **C** ✅ A Multi-AZ DB cluster has a writer and two readable standby instances in three Availability Zones. The standbys serve read traffic through the reader endpoint, and failover is typically faster than with a Multi-AZ DB instance deployment.
- **D** ❌ Aurora Replicas serve reads and provide fast failover. However, Aurora MySQL is a different engine offering, which violates the requirement to remain on Amazon RDS for MySQL.

An RDS Multi-AZ DB cluster deployment provides two readable standbys and faster failover than the single-standby Multi-AZ DB instance deployment, while staying on RDS for MySQL. Remember the difference: a Multi-AZ DB instance standby cannot serve reads; Multi-AZ DB cluster standbys can.

</details>

### resilient-2.2-03

_Amazon RDS_

A company runs its customer database on an Amazon RDS for MySQL Multi-AZ DB instance in the us-east-1 Region. A new disaster recovery (DR) policy requires the company to recover the database in the us-west-2 Region if us-east-1 becomes unavailable.

The policy sets an RPO of 5 minutes and an RTO of 1 hour. The company does not want to change database engines.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Create a cross-Region read replica of the DB instance in us-west-2. Promote the read replica to a standalone DB instance during a disaster.
- **B.** Use AWS Backup to create a daily snapshot of the DB instance and copy each snapshot to us-west-2. Restore the latest snapshot during a disaster.
- **C.** Convert the DB instance to a Multi-AZ DB cluster deployment with a writer and two standby instances in three Availability Zones in us-east-1.
- **D.** Migrate the database to Amazon Aurora MySQL. Create an Aurora global database with a secondary cluster in us-west-2.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ A cross-Region read replica receives changes asynchronously, typically within seconds, which meets the 5-minute RPO. Promotion takes minutes, which meets the 1-hour RTO, and only one replica instance runs in the DR Region.
- **B** ❌ Daily snapshots can lose up to 24 hours of data. This does not meet the 5-minute RPO.
- **C** ❌ A Multi-AZ DB cluster improves availability and failover time, but all of its instances stay in us-east-1. This does not protect against the loss of the us-east-1 Region.
- **D** ❌ Aurora Global Database meets the RPO and RTO, but it requires a migration to a different engine, which the company does not want. It also costs more than a single cross-Region read replica.

A cross-Region read replica is the lowest-cost way to keep an RDS for MySQL database nearly current in another Region, and promoting it meets an RTO of an hour. Snapshot copies are cheaper but cannot meet a minutes-level RPO, and Multi-AZ never leaves the Region.

</details>

### resilient-2.2-04

_Amazon Aurora_

A financial services company runs a payments application on an Amazon Aurora MySQL DB cluster in the eu-west-1 Region. The company is expanding into North America and wants users there to have low-latency reads from a Region near them.

If eu-west-1 becomes unavailable, the company requires an RPO of about 1 second and an RTO of about 1 minute for the database.

Which solution will meet these requirements?

- **A.** Create a cross-Region Aurora read replica of the DB cluster in us-east-1 by using MySQL binary log replication. Promote the replica during a disaster.
- **B.** Use AWS Backup to take hourly snapshots of the DB cluster and copy them to us-east-1. Restore the latest snapshot during a disaster.
- **C.** Add Aurora Replicas to the DB cluster in all three Availability Zones in eu-west-1. Direct North American users to the cluster's reader endpoint.
- **D.** Convert the DB cluster to an Aurora global database. Add a secondary DB cluster in us-east-1 and fail over to it if eu-west-1 becomes unavailable.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ Binary log replication can serve local reads, but replication lag can grow under heavy write load and promotion takes longer. It cannot reliably deliver a 1-second RPO and a 1-minute RTO.
- **B** ❌ Hourly snapshots can lose up to an hour of data and restoring a cluster takes much longer than a minute. This also provides no local reads in North America.
- **C** ❌ Aurora Replicas improve availability within eu-west-1 but do not protect against a Regional outage. North American users would still read from Europe.
- **D** ✅ Aurora Global Database replicates at the storage layer with typical lag under 1 second, serves local reads from the secondary cluster, and can fail over to the secondary Region in about a minute.

Aurora Global Database uses dedicated storage-level replication, giving an RPO of about 1 second and an RTO of about 1 minute, and its secondary clusters serve local reads. Binary log replicas, snapshots, and in-Region replicas each miss either the Regional DR target or the latency goal.

</details>

### resilient-2.2-05

_Amazon Aurora_

A company runs an Amazon Aurora PostgreSQL DB cluster. The writer is a db.r6g.4xlarge instance. The cluster has three Aurora Replicas: two db.r6g.large instances that the analytics team uses, and one db.r6g.4xlarge instance. A previous administrator set the two db.r6g.large replicas to promotion tier 0 and left the db.r6g.4xlarge replica at the default tier 1.

During a recent failover, Aurora promoted a db.r6g.large replica, and the application slowed down until an engineer intervened. The company wants the db.r6g.4xlarge replica to be promoted in future failovers. The analytics team must keep its replicas.

Which solution will meet these requirements?

- **A.** Assign the db.r6g.4xlarge replica to promotion tier 0. Assign the two db.r6g.large replicas to promotion tier 15.
- **B.** Create a custom endpoint that contains only the db.r6g.4xlarge replica. Configure the application to send writes to the custom endpoint.
- **C.** Assign the db.r6g.4xlarge replica to promotion tier 15. Assign the two db.r6g.large replicas to promotion tier 0.
- **D.** Configure Aurora Auto Scaling for the cluster with a target CPU utilization so that larger replicas are added when the writer fails.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ Aurora promotes the replica in the lowest-numbered (highest-priority) promotion tier. Placing the large replica alone in tier 0 makes it the failover target.
- **B** ❌ Custom endpoints group instances for connections; they do not influence which replica Aurora promotes. Sending writes to a reader instance would also fail.
- **C** ❌ This reverses the priority. Tier 0 is the highest priority, so Aurora would promote one of the small analytics replicas.
- **D** ❌ Aurora Auto Scaling adds or removes replicas based on load. It does not control which existing replica Aurora promotes during a failover.

Aurora chooses the failover target by promotion tier, with tier 0 as the highest priority; only replicas that share a tier are ranked by instance size. Putting the large replica alone in the highest-priority tier guarantees it is promoted while the analytics replicas remain available for reads.

</details>

### resilient-2.2-06

_Amazon Aurora_

A company's application connects to an Amazon Aurora MySQL DB cluster that has one writer and two Aurora Replicas. The application stores the instance endpoint of the writer instance for writes and the instance endpoint of one replica for reads.

After a recent failover, the application's writes failed until an engineer updated its configuration. The company wants writes to follow the current writer automatically after any failover and wants read traffic spread across all replicas.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Create Amazon Route 53 weighted records that point to the instance endpoints. Update the records with an AWS Lambda function that runs when Aurora publishes a failover event.
- **B.** Create a custom endpoint that includes the writer and both replicas. Configure the application to send both reads and writes to the custom endpoint.
- **C.** Configure the application to send writes to the cluster endpoint and reads to the reader endpoint.
- **D.** Configure the application to send writes to the reader endpoint and reads to the cluster endpoint.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ This can work, but it re-implements endpoint management with custom code that the company must build and maintain. It adds operational overhead compared to built-in Aurora endpoints.
- **B** ❌ A custom endpoint load-balances connections across its members, so many writes would reach read-only replicas and fail.
- **C** ✅ The cluster endpoint always points to the current writer, including after a failover, and the reader endpoint load-balances connections across the available replicas. No custom logic is needed.
- **D** ❌ This reverses the endpoints. The reader endpoint connects only to read-only replicas, so writes would fail, and reads would all land on the writer.

Aurora's cluster (writer) endpoint follows the writer through failovers and the reader endpoint spreads connections across replicas. Using these managed endpoints instead of instance endpoints removes manual reconfiguration after a failover.

</details>

### resilient-2.2-07

_Amazon DynamoDB_

A gaming company stores player profiles in an Amazon DynamoDB table in the us-east-1 Region. The company is launching in Europe and will run its game backend in both us-east-1 and eu-central-1. Players in each Region must be able to read and write their profiles with single-digit millisecond latency.

The game must keep accepting writes in one Region if the other Region becomes unavailable.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Create a second table in eu-central-1. Use DynamoDB Streams and AWS Lambda functions in each Region to copy every change to the table in the other Region.
- **B.** Convert the table to a DynamoDB global table and add a replica in eu-central-1. Configure the backend in each Region to use the local replica.
- **C.** Deploy a DynamoDB Accelerator (DAX) cluster in eu-central-1 that caches the us-east-1 table for the European game backend.
- **D.** Use AWS Backup to copy the table to eu-central-1 every hour. Restore the copy and redirect European players if us-east-1 becomes unavailable.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ Custom stream-based replication can work, but the company must build, monitor, and resolve conflicts in its own replication code. This is more operational overhead than a managed feature.
- **B** ✅ Global tables provide fully managed, multi-active replication. Each Region reads and writes its local replica with low latency and keeps working if the other Region is unavailable.
- **C** ❌ DAX caches reads, but writes still go to the table in us-east-1. European writes would have cross-Region latency and would fail if us-east-1 were unavailable.
- **D** ❌ Backups do not provide a live table in eu-central-1. European players would not get low-latency writes, and a restore would lose up to an hour of data.

DynamoDB global tables give multi-Region, multi-active replication with no code to manage, which is the standard answer when both Regions must read and write locally and survive a Regional outage. DAX and backups solve read latency and recovery, not active-active writes.

</details>

### resilient-2.2-08

_Amazon DynamoDB_

A retail company stores inventory data in an Amazon DynamoDB global table with replicas in two AWS Regions. Last month a faulty deployment wrote incorrect quantities to thousands of items. The bad writes replicated to both Regions within seconds.

The company needs the ability to restore the table to its exact state at any second within the previous 7 days.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Add a third replica Region to the global table. Restore from that replica if a faulty deployment corrupts data.
- **B.** Create an AWS Backup plan that backs up the table once a day and retains each backup for 7 days.
- **C.** Stream all table changes through DynamoDB Streams to Amazon Data Firehose and store them in Amazon S3. Replay the changes to rebuild the table when needed.
- **D.** Enable point-in-time recovery (PITR) on the table. Restore the table to a new table at the second before the faulty deployment when needed.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ Global table replicas receive every write, including bad ones, within seconds. A replica protects against Regional outages, not against logical corruption.
- **B** ❌ Daily backups can restore only to the time each backup was taken. They cannot restore to any second within the previous 7 days.
- **C** ❌ A change log in S3 could rebuild a past state, but the company would have to write and maintain the replay process. This is high operational overhead.
- **D** ✅ PITR provides continuous backups and restores a table to any second within the recovery period, which can be up to 35 days. It is a single setting with no custom code.

Point-in-time recovery restores a DynamoDB table to any second within its recovery window, which is exactly what is needed to undo bad writes. Global tables replicate corruption as faithfully as good data, so replication is not a backup.

</details>

### resilient-2.2-09

_Amazon RDS, AWS Lambda, Amazon RDS Proxy_

A company runs a serverless API. AWS Lambda functions query an Amazon RDS for MySQL Multi-AZ DB instance. During traffic spikes, thousands of concurrent function invocations open new database connections, and the database returns "too many connections" errors. During a recent Multi-AZ failover, the API returned errors for several minutes.

The company wants to reduce connection errors and shorten the disruption during failovers. The API must continue to serve all requests during spikes, and the company does not want to rewrite the application.

Which solution will meet these requirements?

- **A.** Set reserved concurrency on the Lambda functions to a value below the database's maximum number of connections.
- **B.** Create an RDS Proxy for the DB instance. Configure the Lambda functions to connect to the proxy endpoint instead of the database endpoint.
- **C.** Create a read replica of the DB instance in another Availability Zone. Configure the Lambda functions to send read queries to the replica endpoint.
- **D.** Modify the DB instance to a larger instance class and raise the max_connections parameter to match the peak concurrency.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ Reserved concurrency caps database connections, but excess requests are throttled during spikes. This violates the requirement to serve all requests and does not shorten failovers.
- **B** ✅ RDS Proxy pools and shares database connections, so spikes do not exhaust the database. The proxy also detects failovers and routes to the new primary without waiting for DNS changes, which reduces failover disruption.
- **C** ❌ A read replica spreads read load but each function still opens its own connections. It does not pool connections or shorten Multi-AZ failovers.
- **D** ❌ A larger instance accepts more connections at a higher cost, but connection churn remains and failover still depends on DNS propagation to clients.

RDS Proxy is the managed fix for Lambda connection storms and also reduces failover time by keeping client connections open while it reconnects to the new primary. Throttling or scaling the database treats the symptom without solving both problems.

</details>

### resilient-2.2-10

_Amazon Route 53, Amazon S3, Elastic Load Balancing_

A company runs a web application on Amazon EC2 instances behind an Application Load Balancer (ALB) in the us-east-1 Region. The company hosts its DNS in Amazon Route 53.

If the application becomes unavailable, the company wants users to be sent automatically to a static maintenance page. The maintenance page is hosted as a static website in an Amazon S3 bucket in the us-west-2 Region.

Which combination of steps will meet these requirements? (Choose TWO.)

- **A.** Create a primary failover alias record that points to the ALB. Set Evaluate Target Health to Yes on the record.
- **B.** Create a secondary failover alias record that points to the S3 website endpoint in us-west-2.
- **C.** Create latency alias records that point to the ALB and to the S3 website endpoint.
- **D.** Create a Route 53 health check that monitors the S3 website endpoint. Associate the health check with the record that points to the ALB.
- **E.** Create a multivalue answer record that contains the IP addresses of the ALB and the S3 website endpoint.

<details><summary>Answer</summary>

**Correct: A, B**

- **A** ✅ A primary failover alias record with Evaluate Target Health uses the health of the ALB's targets to decide whether Route 53 answers with the primary.
- **B** ✅ Route 53 answers with the secondary failover record only when the primary is unhealthy, which sends users to the maintenance page. For an alias to an S3 website endpoint, the bucket name must match the record name.
- **C** ❌ Latency routing sends some users to whichever endpoint has lower latency for them, even while the application is healthy. Users could see the maintenance page during normal operation.
- **D** ❌ The health check must monitor the primary application. Checking the S3 bucket would not detect an application failure.
- **E** ❌ Multivalue answer records return several healthy values together, so clients would be sent to both endpoints at random. ALB and S3 website IP addresses also change, so they must be referenced through alias records.

Active-passive DNS failover in Route 53 uses a primary failover record with a health signal and a secondary failover record that is returned only when the primary is unhealthy. Latency and multivalue routing are for spreading traffic, not for a standby target.

</details>

### resilient-2.2-11

_Amazon Route 53, Elastic Load Balancing_

A company runs identical copies of its web application behind Application Load Balancers (ALBs) in the us-east-1 and eu-west-1 Regions. Both copies serve production traffic. Users are located across North America and Europe.

The company wants each user to be routed to the Region that gives that user the best response time. If the application in one Region becomes unhealthy, all users must be routed to the other Region automatically.

Which Amazon Route 53 configuration will meet these requirements?

- **A.** Create failover alias records. Make the us-east-1 ALB the primary record and the eu-west-1 ALB the secondary record, with Evaluate Target Health enabled.
- **B.** Create weighted alias records with equal weights for the two ALBs, with Evaluate Target Health enabled.
- **C.** Create latency alias records for the two ALBs in their respective Regions, with Evaluate Target Health enabled.
- **D.** Create geolocation alias records that map North America to the us-east-1 ALB and Europe to the eu-west-1 ALB, without a default record.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Failover routing is active-passive. All users would go to us-east-1 while it is healthy, so European users would not get the best response time.
- **B** ❌ Weighted routing splits traffic by the configured ratio regardless of where users are. Half of the users would be sent to the more distant Region.
- **C** ✅ Latency routing answers with the Region that has the lowest latency for the user. With Evaluate Target Health, Route 53 stops returning an unhealthy Region and sends users to the healthy one.
- **D** ❌ Geolocation routing uses the user's location, not measured latency. Without a default record, users outside the mapped continents receive no answer.

Latency-based routing combined with health evaluation gives an active-active, multi-Region setup: users reach the lowest-latency healthy Region and are moved automatically when a Region fails. Failover routing is the active-passive alternative.

</details>

### resilient-2.2-12

_Amazon Route 53_

A company is replacing its web application with a new version that runs as an immutable stack behind a separate Application Load Balancer in a new AWS account. The company's domain is hosted in Amazon Route 53.

The company wants to send 5% of users to the new stack at first and then increase the share over 2 weeks. If errors increase, the company must be able to send all traffic back to the old stack quickly without redeploying either stack.

Which solution will meet these requirements?

- **A.** Create weighted records for the old and new stacks with weights of 95 and 5. Adjust the weights over time, and set the new stack's weight to 0 to roll back.
- **B.** Create failover records with the old stack as the primary and the new stack as the secondary. Swap the primary and secondary records to shift traffic.
- **C.** Create multivalue answer records that contain the endpoints of both stacks. Add more endpoints for the new stack over time.
- **D.** Create latency records for the old and new stacks. Move the new stack to a Region closer to more users over time.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ Weighted routing sends a controlled share of DNS answers to each stack. Changing the weights shifts traffic gradually, and a weight of 0 rolls back without touching either stack.
- **B** ❌ Failover routing sends all traffic to one stack at a time. It cannot send 5% of users to the new stack.
- **C** ❌ Multivalue answer routing returns several values that clients choose from at random. It provides no precise percentage control and would initially send about half the users to the new stack.
- **D** ❌ Latency routing chooses a stack by network latency, not by a percentage. Moving stacks between Regions would require redeployment.

Route 53 weighted routing is the DNS tool for canary and blue/green cutovers between independent stacks: weights control the share and a weight of 0 removes a stack from rotation. Failover, multivalue, and latency routing cannot set a traffic percentage.

</details>

### resilient-2.2-13

_Amazon Route 53_

A media company must show country-specific content because of licensing agreements. The company uses Amazon Route 53 geolocation records to route users in Germany, France, and the United States to separate application stacks. Each stack is licensed only for its own country.

Users in other countries currently receive no DNS answer and cannot reach the service. The company wants these users to reach a stack that shows only license-free content. The routing for Germany, France, and the United States must not change.

Which solution will meet these requirements?

- **A.** Replace the geolocation records with geoproximity records for the three stacks. Add a bias to each stack so that it serves users in its own country.
- **B.** Add latency records for the license-free stack with the same record name as the geolocation records.
- **C.** Associate a health check with each geolocation record so that Route 53 returns an answer for users from other countries.
- **D.** Create a geolocation record with the Default location that points to the license-free stack.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ Geoproximity routing selects a stack by distance, so users near a border could be routed to another country's stack, which breaks the licensing rule. Users in other countries would also reach a licensed stack.
- **B** ❌ Route 53 does not allow records with the same name and type to use different routing policies. The latency records cannot be added beside the geolocation records.
- **C** ❌ Health checks control whether a healthy record is returned. They do not create an answer for locations that no record matches.
- **D** ✅ The Default geolocation record answers queries from locations that do not match any other geolocation record. The existing country records are unchanged.

With geolocation routing, Route 53 returns no answer for unmatched locations unless a Default record exists. Adding a Default record catches everyone else without changing country-specific routing, which geoproximity cannot guarantee.

</details>

### resilient-2.2-14

_Amazon Route 53, Amazon CloudWatch_

A company runs an internal application on Amazon EC2 instances in private subnets in two VPCs, one in each of two AWS Regions. Employees reach the application through a record in a Route 53 private hosted zone. The application must not be reachable from the internet.

The company wants Route 53 to answer with the secondary Region's endpoint automatically when the primary Region's application becomes unhealthy.

Which solution will meet these requirements?

- **A.** Create Route 53 health checks that monitor the private IP addresses of the primary instances. Associate the health checks with failover records in the private hosted zone.
- **B.** Assign Elastic IP addresses to the primary instances and allow the Route 53 health checker IP ranges in the security groups. Create health checks for the Elastic IP addresses.
- **C.** Have the application publish a health metric to CloudWatch from inside the VPC. Create a Route 53 health check that monitors an alarm on the metric and use it on the primary record.
- **D.** Create a calculated health check that combines child health checks for each primary instance's private IP address. Associate the calculated health check with the primary failover record.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Route 53 health checkers run outside the VPC and cannot reach private IP addresses. These health checks would never report the application as healthy.
- **B** ❌ This would make the health checks work, but it exposes the application to the internet. This violates the requirement that the application must not be reachable from the internet.
- **C** ✅ A Route 53 health check can monitor the state of a CloudWatch alarm instead of an endpoint. This gives Route 53 a health signal for private resources without exposing them.
- **D** ❌ A calculated health check only aggregates other health checks. The child checks still target private IP addresses that Route 53 health checkers cannot reach.

Route 53 health checkers cannot reach private endpoints, so health for private resources must come from a CloudWatch alarm-based health check. This is the standard way to drive failover records in a private hosted zone.

</details>

### resilient-2.2-15

_Amazon Route 53, Amazon EC2_

A company runs a lightweight API on six Amazon EC2 instances that each have an Elastic IP address. The company does not want to pay for a load balancer. Today a single Route 53 record contains all six IP addresses. When an instance fails, some clients continue to receive its IP address and their requests fail.

The company wants DNS to return only the IP addresses of healthy instances.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Create a multivalue answer record for each instance's IP address and attach a Route 53 health check to each record.
- **B.** Keep the simple routing record with all six IP addresses. Associate a single Route 53 health check with the record.
- **C.** Create a Network Load Balancer with the instances as targets. Create an alias record that points to the load balancer.
- **D.** Create six weighted records with equal weights, one for each instance's IP address, without health checks.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ Multivalue answer routing returns up to eight healthy records for each query and omits records whose health checks fail. It adds only the cost of the health checks.
- **B** ❌ Simple routing records do not support health checks. Route 53 would keep returning all six IP addresses, including failed ones.
- **C** ❌ A Network Load Balancer would route only to healthy targets, but it adds the load balancer cost that the company wants to avoid.
- **D** ❌ Without health checks, Route 53 keeps returning the IP addresses of failed instances. Weighted routing alone does not remove unhealthy endpoints.

Multivalue answer routing with health checks is DNS-level load distribution that skips unhealthy endpoints, without paying for a load balancer. It is not a substitute for a load balancer, but it fits when cost rules one out.

</details>

### resilient-2.2-16

_AWS Backup, Amazon EC2, Amazon RDS_

A company runs an internal HR application on Amazon EC2 instances with Amazon EBS volumes and an Amazon RDS for PostgreSQL database in the us-east-1 Region. The company must be able to recover the application in another Region if us-east-1 becomes unavailable.

The business has approved an RPO of 24 hours and an RTO of 24 hours for this application. The company wants to keep DR costs as low as possible.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Create a cross-Region read replica of the database in us-west-2. Keep AMIs of the application servers in us-west-2 and launch instances from them during a disaster.
- **B.** Create an AWS Backup plan that backs up the EC2 instances and the database daily and copies each recovery point to a backup vault in us-west-2. Restore from the copies during a disaster.
- **C.** Run a scaled-down copy of the application and a cross-Region read replica in us-west-2. Scale out the copy during a disaster.
- **D.** Convert the database to a Multi-AZ deployment. Place the EC2 instances in an Auto Scaling group that spans three Availability Zones in us-east-1.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ This is a pilot light strategy. It meets the requirements, but a continuously running read replica costs more than the 24-hour RPO and RTO require.
- **B** ✅ This is a backup and restore strategy. Daily backups copied to another Region meet a 24-hour RPO, restoring takes hours, and the company pays only for backup storage.
- **C** ❌ This is a warm standby strategy. It recovers in minutes, but continuously running compute and database resources cost far more than needed for a 24-hour RTO.
- **D** ❌ Multi-AZ and multiple Availability Zones protect against an Availability Zone failure only. They do not allow recovery if the whole Region becomes unavailable.

When RPO and RTO are measured in hours, backup and restore is the cheapest DR strategy that still works, and AWS Backup copy rules put the recovery points in another Region. Pilot light and warm standby buy faster recovery that this application does not need.

</details>

### resilient-2.2-17

_Amazon RDS, AWS CloudFormation, Amazon EC2 Auto Scaling_

A company runs an e-commerce application on Amazon EC2 instances in an Auto Scaling group and an Amazon RDS for MySQL database in the us-east-1 Region. The company is creating a DR plan for a Regional outage.

The plan requires an RPO of 1 minute and an RTO of 1 hour. The company wants to minimize the cost of resources that run in the DR Region before a disaster occurs.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Back up the database and the EC2 instances every hour with AWS Backup and copy the backups to the DR Region. Restore all resources from the backups during a disaster.
- **B.** Run a full-capacity copy of the application and a cross-Region read replica in the DR Region. Use Amazon Route 53 to send traffic to both Regions at all times.
- **C.** Run a cross-Region read replica and a scaled-down Auto Scaling group of application servers in the DR Region. Scale out the group and promote the replica during a disaster.
- **D.** Create a cross-Region read replica and copy AMIs to the DR Region. In a disaster, promote the replica and create the Auto Scaling group with AWS CloudFormation.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ Hourly backups can lose up to an hour of data, which does not meet the 1-minute RPO.
- **B** ❌ Multi-site active-active meets the targets with near-zero RTO, but running full capacity in two Regions is the most expensive option.
- **C** ❌ Warm standby meets the targets, but keeping application servers running in the DR Region costs more than the 1-hour RTO requires.
- **D** ✅ This is a pilot light strategy. The replica keeps data within seconds of the primary, meeting the 1-minute RPO, and the application tier is created from AMIs and a template within the 1-hour RTO.

Pilot light keeps only the core data layer running in the DR Region and provisions the rest at failover, which fits an RPO of minutes and an RTO of tens of minutes to an hour. Warm standby and active-active also work but cost more than needed.

</details>

### resilient-2.2-18

_Amazon Aurora, Amazon EC2 Auto Scaling, Amazon Route 53_

A company's booking application runs on Amazon EC2 instances and an Amazon Aurora MySQL database in the us-east-1 Region. The company's DR plan requires an RTO of 10 minutes and an RPO of a few seconds if us-east-1 fails.

Auditors also require evidence that the DR environment continuously handles real production requests, not only scheduled tests. The company wants to keep costs as low as possible within these requirements.

Which DR strategy will meet these requirements MOST cost-effectively?

- **A.** Pilot light: Create an Aurora global database with a secondary cluster in us-west-2. Keep AMIs and launch templates in us-west-2, and create the application servers during a disaster.
- **B.** Multi-site active-active: Run full production capacity in us-west-2 and split traffic evenly between the Regions with Route 53 weighted routing.
- **C.** Warm standby: Create an Aurora global database with a secondary cluster in us-west-2. Run a small Auto Scaling group in us-west-2 and use Route 53 weighted routing to send it a small share of production traffic.
- **D.** Backup and restore: Copy Aurora snapshots and AMIs to us-west-2 every hour. Restore the database and launch the application during a disaster.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Pilot light meets the RPO, but the DR Region has no running application servers, so it cannot continuously handle production requests. Creating the application tier during a disaster also puts the 10-minute RTO at risk.
- **B** ❌ Active-active meets every requirement, but running full capacity in both Regions costs more than necessary.
- **C** ✅ Warm standby runs a scaled-down but fully functional copy that serves a small share of live traffic, sending writes to the primary Region (for example with Aurora global database write forwarding). It meets the RPO through Aurora Global Database, meets the RTO because it only needs to scale out, and costs less than full capacity.
- **D** ❌ Hourly snapshots cannot meet an RPO of a few seconds, and restoring a database and application stack cannot meet a 10-minute RTO.

Warm standby is the cheapest strategy in which the DR environment is always running and can take live traffic, giving an RTO of minutes. Pilot light is cheaper but idle; active-active is always serving at full scale and costs more.

</details>

### resilient-2.2-19

_Amazon DynamoDB, Amazon Route 53, Amazon EC2 Auto Scaling_

A stock trading platform runs on Amazon EC2 instances and stores orders in Amazon DynamoDB in a single AWS Region. Regulators require that the platform keep accepting orders with no noticeable interruption if an entire Region fails. Losing even a few seconds of capacity during a failover is unacceptable.

Cost is a secondary concern for this platform.

Which solution will meet these requirements?

- **A.** Run the platform at full production capacity in two Regions. Use DynamoDB global tables and Amazon Route 53 latency routing with health checks to send users to both Regions.
- **B.** Run a scaled-down copy of the platform in a second Region with DynamoDB global tables. Scale out the second Region when Route 53 health checks detect a failure.
- **C.** Replicate data to a second Region with DynamoDB global tables. Keep AMIs in the second Region and launch the platform there when Route 53 health checks detect a failure.
- **D.** Run the platform at full production capacity across three Availability Zones in one Region. Enable point-in-time recovery on the DynamoDB tables.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ Multi-site active-active keeps full capacity serving traffic in both Regions, with data replicated by global tables. A Regional failure only removes one Region from DNS answers, giving a near-zero RTO.
- **B** ❌ Warm standby must scale out before it can absorb all traffic, so users would experience reduced capacity during failover. This violates the requirement for no capacity loss.
- **C** ❌ Pilot light keeps data current but must launch the whole application tier at failover. This causes a noticeable interruption.
- **D** ❌ Multiple Availability Zones protect against an Availability Zone failure but not against the loss of the entire Region.

Only multi-site active-active, with full capacity already serving in more than one Region, avoids both downtime and capacity loss when a Region fails. Every cheaper DR strategy trades some recovery time for cost.

</details>

### resilient-2.2-20

_AWS Elastic Disaster Recovery_

A company runs 200 servers with a mix of Windows and Linux operating systems in an on-premises VMware data center. The company wants to use AWS as its disaster recovery site.

The DR plan requires an RPO of seconds and an RTO of minutes for all servers. The company wants to pay as little as possible for AWS resources until a failover is needed and wants to avoid building custom replication tooling.

Which solution will meet these requirements?

- **A.** Use VM Import/Export to create AMIs from the servers every night. Launch EC2 instances from the latest AMIs during a disaster.
- **B.** Install the AWS Replication Agent on each server and use AWS Elastic Disaster Recovery to replicate to a low-cost staging area. Launch recovery instances during a disaster.
- **C.** Use AWS Backup for VMware to back up the virtual machines every hour to AWS. Restore the virtual machines as EC2 instances during a disaster.
- **D.** Run a full-size copy of each server on Amazon EC2. Use operating system-level scripts to synchronize application data from on premises every minute.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ Nightly images give an RPO of up to 24 hours and require custom scheduling. This does not meet the RPO of seconds.
- **B** ✅ Elastic Disaster Recovery replicates block-level changes continuously, giving an RPO of seconds, and keeps only lightweight replication servers and low-cost storage running. It launches full-size recovery instances in minutes when needed.
- **C** ❌ Hourly backups can lose up to an hour of data, and restoring 200 servers from backups takes much longer than minutes.
- **D** ❌ This could approach the RPO and RTO, but full-size EC2 instances running all the time are expensive, and the custom synchronization scripts are the tooling the company wants to avoid.

AWS Elastic Disaster Recovery is the managed service for on-premises or cloud servers that need an RPO of seconds and an RTO of minutes, while paying only for a low-cost staging area until failover. Backups and image exports cannot reach a seconds-level RPO.

</details>

### resilient-2.2-21

_Amazon S3_

A healthcare company stores medical imaging files in an Amazon S3 bucket in the us-east-1 Region. A new regulation requires the company to keep a copy of every new object in a second Region. The company must be able to show auditors that 99.99% of new objects are copied within 15 minutes and must be alerted when an object takes longer.

Which solution will meet these requirements?

- **A.** Configure S3 Same-Region Replication to a second bucket in us-east-1. Enable S3 Replication Time Control on the replication rule.
- **B.** Configure S3 Cross-Region Replication to a bucket in us-west-2. Use Amazon CloudWatch to compare the object counts of the two buckets every 15 minutes.
- **C.** Configure an S3 event notification that invokes an AWS Lambda function to copy each new object to a bucket in us-west-2.
- **D.** Configure S3 Cross-Region Replication to us-west-2 with S3 Replication Time Control enabled, and subscribe to its missed-threshold events.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ Replication Time Control provides the 15-minute SLA and metrics, but Same-Region Replication keeps the copy in us-east-1. This does not meet the second-Region requirement.
- **B** ❌ Cross-Region Replication copies most objects within minutes but provides no time guarantee. Comparing object counts cannot show that 99.99% of objects met the 15-minute target or alert on individual late objects.
- **C** ❌ A custom copy function puts a copy in another Region, but it has no SLA and the company would need to build its own tracking for late or failed copies.
- **D** ✅ S3 Replication Time Control is designed to replicate 99.99% of objects within 15 minutes, backed by an SLA. It provides replication metrics and events for objects that miss the threshold.

S3 Replication Time Control adds a predictable 15-minute replication SLA, metrics, and missed-threshold events to replication. Plain Cross-Region Replication is asynchronous with no time guarantee, and Same-Region Replication does not leave the Region.

</details>

### resilient-2.2-22

_Amazon S3_

A company has an Amazon S3 bucket that contains 400 million objects. Versioning is enabled. The company just created an S3 Cross-Region Replication rule to a bucket in another Region for DR. New objects are replicating, but the 400 million existing objects are not.

The replicas of the existing objects must keep the same version IDs and metadata as the source objects.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Create an S3 Batch Replication job for the existing objects by using the existing replication configuration.
- **B.** Create an AWS DataSync task that copies the source bucket to the destination bucket. Run the task once.
- **C.** Run the AWS CLI aws s3 sync command from an Amazon EC2 instance to copy the existing objects to the destination bucket.
- **D.** Edit the replication rule and enable S3 Replication Time Control so that existing objects are replicated within 15 minutes.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ S3 Batch Replication replicates objects that existed before a replication rule was created. It uses the replication configuration, so replicas keep the source version IDs and metadata, and it runs as a managed job.
- **B** ❌ DataSync can copy the existing objects, but it writes them as new objects in the destination, so the replicas get new version IDs. This violates the version ID requirement.
- **C** ❌ aws s3 sync creates new objects with new version IDs and requires the company to run and monitor a long-running copy of 400 million objects. This adds operational overhead and breaks the version ID requirement.
- **D** ❌ Replication Time Control adds an SLA for new object replication. It does not replicate objects that existed before the rule was created.

Replication rules apply only to objects written after the rule is created; S3 Batch Replication is the managed way to backfill existing objects through the same configuration. Copy tools create new objects with new version IDs instead of true replicas.

</details>

### resilient-2.2-23

_Amazon S3, AWS KMS_

A company replicates an Amazon S3 bucket in the eu-west-1 Region to a bucket in the eu-central-1 Region by using S3 Cross-Region Replication. Versioning is enabled on both buckets. Objects encrypted with SSE-S3 replicate successfully. Objects encrypted with SSE-KMS by using a customer managed key in eu-west-1 are not replicated.

Company policy requires that all replicas be encrypted with a customer managed key that the company controls in eu-central-1.

Which solution will meet these requirements?

- **A.** Change the default encryption on the source bucket to SSE-S3 and re-upload the SSE-KMS encrypted objects so that they replicate.
- **B.** Update the replication rule to replicate SSE-KMS encrypted objects and use the source key in eu-west-1 for the replicas. Grant the replication role access to that key.
- **C.** Update the replication rule to replicate SSE-KMS encrypted objects and use a customer managed key in eu-central-1 for replicas. Grant the replication role access to both keys.
- **D.** Replace the source key with a multi-Region KMS key and create its replica key in eu-central-1. Grant the replication role access to both keys and leave the replication rule unchanged.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Objects encrypted with SSE-S3 would replicate, but the replicas would not be encrypted with a company-controlled customer managed key. This violates the encryption policy.
- **B** ❌ The KMS key for replicas must be in the same Region as the destination bucket. A key in eu-west-1 cannot encrypt replicas in eu-central-1, so replication would fail.
- **C** ✅ S3 replicates SSE-KMS encrypted objects only when the rule opts in and names a destination key in the destination Region. The replication role needs kms:Decrypt on the source key and kms:Encrypt on the destination key.
- **D** ❌ Amazon S3 treats multi-Region keys as single-Region keys. The replication rule must still opt in to SSE-KMS objects and specify the destination key, so without a rule change the objects still do not replicate.

By default, S3 replication skips objects encrypted with SSE-KMS. The replication rule must opt in and name a replica key that lives in the destination Region, and the replication role must be able to decrypt with the source key and encrypt with the destination key. Multi-Region keys do not remove the need for this configuration.

</details>

### resilient-2.2-24

_AWS Backup, AWS Organizations_

A company has 30 AWS accounts in an organization in AWS Organizations. The accounts use Amazon EBS volumes, Amazon RDS databases, Amazon DynamoDB tables, and Amazon EFS file systems. A new policy requires daily backups of all these resources, with a copy of every backup stored in a central backup account in a different AWS Region.

The company wants to manage the backup configuration centrally and avoid writing custom code.

Which combination of steps will meet these requirements with the LEAST operational overhead? (Choose TWO.)

- **A.** Enable cross-account management for AWS Backup in the management account. Create an AWS Backup policy in Organizations and attach it to the organizational units that contain the accounts.
- **B.** Add a copy rule to the backup plan in the backup policy that copies each recovery point to a backup vault in the central backup account in the second Region.
- **C.** Create an Amazon Data Lifecycle Manager policy in each account that creates daily snapshots and copies them to the second Region.
- **D.** Deploy an AWS Lambda function to each account that creates daily snapshots of each resource and shares them with the central account.
- **E.** Configure S3 Cross-Region Replication on the buckets that store the snapshots so that they are copied to the central account in the second Region.

<details><summary>Answer</summary>

**Correct: A, B**

- **A** ✅ Backup policies in Organizations deploy the same AWS Backup plan to every account in the targeted organizational units and are managed from one place.
- **B** ✅ AWS Backup copy rules can copy recovery points across accounts and across Regions in one step, which places a copy of every backup in the central account in another Region. DynamoDB copies require AWS Backup advanced features for DynamoDB to be turned on.
- **C** ❌ Data Lifecycle Manager manages EBS snapshots and AMIs only. It does not cover RDS, DynamoDB, or EFS, and it must be configured in each account.
- **D** ❌ Custom functions could take the backups, but the company would have to write and maintain the code for four services in 30 accounts. This violates the requirement to avoid custom code.
- **E** ❌ EBS, RDS, DynamoDB, and EFS backups are managed by their services and are not stored as objects in customer S3 buckets. S3 replication cannot copy them.

AWS Backup centralizes backups across many services, and Organizations backup policies push one plan to every account. A copy rule then sends each recovery point to a central vault in another account and Region, with no custom code.

</details>

### resilient-2.2-25

_Amazon EFS, Amazon EC2 Auto Scaling_

A company runs a content management system on Linux Amazon EC2 instances in an Auto Scaling group that spans three Availability Zones. All instances must read and write the same set of uploaded files, and the application uses standard POSIX file operations, including file locking.

The file storage must remain available if any single Availability Zone fails.

Which solution will meet these requirements?

- **A.** Create an Amazon EFS One Zone file system and mount it on all instances in the Auto Scaling group.
- **B.** Create an Amazon EFS file system with the Regional (Standard) storage classes and a mount target in each Availability Zone. Mount it on all instances.
- **C.** Create an Amazon EBS Provisioned IOPS SSD (io2) volume with Multi-Attach enabled and attach it to all instances in the Auto Scaling group.
- **D.** Create an Amazon FSx for Lustre scratch file system and mount it on all instances in the Auto Scaling group.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ EFS One Zone stores data in a single Availability Zone. If that Availability Zone fails, the file system becomes unavailable to all instances.
- **B** ✅ A Regional EFS file system stores data redundantly across multiple Availability Zones and supports concurrent POSIX access, including file locking, from instances in every Availability Zone.
- **C** ❌ Multi-Attach works only for instances in the same Availability Zone as the volume, and the volume is lost to all of them if that Availability Zone fails.
- **D** ❌ Scratch file systems are deployed in one Availability Zone and do not replicate data. They are designed for temporary high-performance processing, not durable shared storage.

Amazon EFS with Regional storage is the shared POSIX file system for Linux instances spread across Availability Zones. EBS volumes, including Multi-Attach, and One Zone or scratch file systems are tied to a single Availability Zone.

</details>

### resilient-2.2-26

_Amazon Aurora_

A bank runs an Amazon Aurora MySQL global database with the primary cluster in us-east-1 and a secondary cluster in us-west-2. All clusters are healthy and run the same engine version. A regulator requires the bank to run production from us-west-2 for 3 months each year to prove that its DR process works.

No committed transactions can be lost when the primary Region changes. After the change, the global database must keep replicating to us-east-1 without being rebuilt.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Detach the us-west-2 cluster from the global database to promote it to a standalone cluster. Then add us-east-1 back to it as a secondary Region.
- **B.** Perform a managed failover with the allow-data-loss option to make the us-west-2 cluster the primary cluster of the global database.
- **C.** Take a snapshot of the primary cluster, copy it to us-west-2, and restore it as a new cluster. Point the application at the restored cluster.
- **D.** Perform a switchover on the global database to make the us-west-2 cluster the primary cluster.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ Detaching stops replication immediately, so writes not yet replicated can be lost, and the company must rebuild the global database topology by hand. This is the manual method for when managed operations are unavailable.
- **B** ❌ A managed failover is designed for unplanned outages. It does not wait for the secondary to synchronize, so the RPO is typically a few seconds rather than zero.
- **C** ❌ Writes made after the snapshot are lost, the restore causes extended downtime, and the restored cluster is not part of the global database.
- **D** ✅ A switchover (formerly managed planned failover) waits for the secondary to be fully synchronized before promoting it, so the RPO is 0. It keeps the existing replication topology, with us-east-1 becoming a secondary.

For planned Region rotation in Aurora Global Database, use a switchover: it synchronizes first, so no data is lost, and it keeps the global topology. A failover (allow data loss) is for unplanned outages and can lose seconds of writes; detach-and-promote is the manual fallback that breaks replication.

</details>

### resilient-2.2-27

_Amazon EC2, Amazon CloudWatch_

A company runs a legacy application on a single Amazon EC2 instance with Amazon EBS volumes. The software license is bound to the instance's ID and private IP address, and the license allows only one running instance at a time.

The company wants the instance to recover automatically if the underlying host hardware fails.

Which solution will meet these requirements?

- **A.** Create an Amazon CloudWatch alarm on the StatusCheckFailed_System metric for the instance with the EC2 recover action.
- **B.** Create an Auto Scaling group with a minimum, maximum, and desired capacity of 1 that uses a launch template based on an AMI of the instance.
- **C.** Launch a second instance from an AMI of the instance in another Availability Zone and keep it stopped. Start it if the first instance fails.
- **D.** Create an Amazon Data Lifecycle Manager policy that takes hourly snapshots of the EBS volumes. Restore the volumes to a new instance if the host fails.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ The recover action moves the instance to new hardware when a system status check fails. The recovered instance keeps its instance ID, private IP addresses, Elastic IP addresses, and EBS volumes.
- **B** ❌ The Auto Scaling group replaces a failed instance with a new instance that has a new instance ID and a new private IP address. This breaks the license.
- **C** ❌ The second instance has its own instance ID and private IP address, so the license would not work. Starting it is also a manual step.
- **D** ❌ Snapshots protect the data, but restoring to a new instance gives a new instance ID and private IP address and is not automatic.

EC2 instance recovery is the fix for a single stateful instance that must keep its identity after hardware failure. Supported instance types also get simplified automatic recovery by default; the CloudWatch alarm makes recovery explicit and configurable. An Auto Scaling group gives self-healing too, but it replaces the instance with a new one and a new identity.

</details>

### resilient-2.2-28

_EC2 Image Builder, Amazon EC2 Auto Scaling_

A company runs a web application on Amazon EC2 instances in an Auto Scaling group. Every month, administrators connect to each instance to install operating system patches and application updates. Over time, the instances have drifted apart in configuration, and several outages were caused by instances that were patched differently.

The company wants every running instance to be identical and wants to stop making changes to running instances. The solution must require the LEAST operational overhead.

Which solution will meet these requirements?

- **A.** Use AWS Systems Manager Patch Manager with a maintenance window to patch all instances in the Auto Scaling group every month.
- **B.** Use AWS Systems Manager Run Command to run the same update script on all instances in the Auto Scaling group at the same time.
- **C.** Use an EC2 Image Builder pipeline to build a patched AMI every month. Update the launch template with the new AMI and start an instance refresh on the Auto Scaling group.
- **D.** Build a patched AMI manually every month. Terminate the instances one at a time so that the Auto Scaling group launches replacements from the original launch template.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Patch Manager automates patching, but it still changes running instances in place. This does not meet the requirement to stop modifying running instances.
- **B** ❌ Run Command makes the updates consistent, but it still modifies running instances. Drift can return if any command fails on some instances.
- **C** ✅ This is immutable infrastructure: a tested image is built once, and the instance refresh replaces running instances with new ones from that image. Every instance is identical and no running instance is modified.
- **D** ❌ If the launch template is not updated, the replacements use the old AMI. The manual image builds and terminations also add operational overhead.

Immutable infrastructure replaces instances from a new versioned image instead of patching them in place. EC2 Image Builder automates the image and an instance refresh rolls it out safely, which removes configuration drift.

</details>

### resilient-2.2-29

_Amazon EC2 Auto Scaling_

A company runs a stateless application on Amazon EC2 instances in an Auto Scaling group. Load tests show that the application needs at least 6 instances of the current type to handle peak traffic. The AWS Region that the company uses has four Availability Zones.

The application must keep at least 6 running instances at all times, even immediately after the loss of any single Availability Zone, before replacements can launch.

Which Auto Scaling group configuration will meet these requirements MOST cost-effectively?

- **A.** Span two Availability Zones with a minimum capacity of 12 instances, 6 in each Availability Zone.
- **B.** Span three Availability Zones with a minimum capacity of 9 instances, 3 in each Availability Zone.
- **C.** Span four Availability Zones with a minimum capacity of 8 instances, 2 in each Availability Zone.
- **D.** Span three Availability Zones with a minimum capacity of 6 instances, 2 in each Availability Zone.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Losing one Availability Zone leaves 6 instances, which meets the requirement. However, 12 instances cost more than other configurations that also meet it.
- **B** ❌ Losing one Availability Zone leaves 6 instances, which meets the requirement. However, 9 instances cost more than the four-Availability Zone configuration.
- **C** ✅ Losing one Availability Zone leaves 6 instances, which meets the requirement with only 8 instances. Spreading capacity across more Availability Zones reduces the spare capacity needed.
- **D** ❌ Losing one Availability Zone leaves only 4 instances until replacements launch. This does not meet the requirement.

To survive an Availability Zone loss with N instances still running, each of the remaining Availability Zones must already carry N divided by (AZs - 1). More Availability Zones means less over-provisioning: 8 instances across four Availability Zones beats 9 across three or 12 across two.

</details>

### resilient-2.2-30

_Amazon DynamoDB_

A fintech company is building a new account-balance service that will store data in a new, empty Amazon DynamoDB table. The service will run active-active in the us-east-1 and us-west-2 Regions.

A strongly consistent read in either Region must always return the latest balance, even when the last write happened in the other Region. If either Region fails, no acknowledged writes can be lost.

Which solution will meet these requirements?

- **A.** Create a global table in the default multi-Region eventual consistency mode with replicas in us-east-1 and us-west-2. Use strongly consistent reads.
- **B.** Create a global table in multi-Region strong consistency mode with replicas in us-east-1 and us-west-2 and a witness in us-east-2.
- **C.** Migrate the data to an Amazon Aurora PostgreSQL global database with a secondary cluster in us-west-2 and write forwarding enabled.
- **D.** Create a global table in multi-Region strong consistency mode with replicas in us-east-1 and us-west-2 only, without a third Region.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ Eventual consistency mode replicates asynchronously. A strongly consistent read can return stale data if the item was last written in the other Region, and the RPO is greater than zero.
- **B** ✅ Strong consistency mode replicates each write synchronously to another Region before acknowledging it, so strongly consistent reads in any replica return the latest item and the RPO is zero. Two replicas plus a witness meet the three-Region requirement.
- **C** ❌ Aurora Global Database replicates asynchronously, typically with lag under a second. It cannot guarantee an RPO of zero or the latest data on reads in the secondary Region.
- **D** ❌ A strong consistency global table must be deployed in exactly three Regions, as three replicas or two replicas and a witness. A two-Region configuration is not supported.

DynamoDB global tables in multi-Region strong consistency (MRSC) mode give an RPO of zero and strongly consistent reads in every Region, at the cost of higher write latency. MRSC needs exactly three Regions; a witness can stand in for the third replica. The default eventual consistency mode resolves conflicts by last writer wins and has an RPO of seconds.

</details>

### resilient-2.2-31

_Amazon VPC_

A company runs an application on Amazon EC2 instances in private subnets in three Availability Zones. The instances call a third-party API on the internet. All private subnets use one route table that sends internet-bound traffic to a single NAT gateway in the first Availability Zone.

During an outage in the first Availability Zone, instances in the other two Availability Zones lost access to the third-party API. The company wants outbound internet access from each Availability Zone to be independent of failures in other Availability Zones.

Which combination of steps will meet these requirements? (Choose TWO.)

- **A.** Create a NAT gateway in a public subnet in each of the other two Availability Zones.
- **B.** Create a separate route table for the private subnets in each Availability Zone that routes 0.0.0.0/0 to the NAT gateway in the same Availability Zone.
- **C.** Create a second NAT gateway in the same public subnet as the existing NAT gateway and split traffic between them.
- **D.** Create an internet gateway for each Availability Zone and add a route to it in the private subnets' route table.
- **E.** Create an egress-only internet gateway and route the private subnets' outbound traffic to it.

<details><summary>Answer</summary>

**Correct: A, B**

- **A** ✅ A NAT gateway is redundant only within its own Availability Zone. A NAT gateway in each Availability Zone removes the cross-AZ dependency.
- **B** ✅ Per-AZ route tables send each Availability Zone's traffic to its local NAT gateway, so an outage in one Availability Zone does not affect outbound access from the others.
- **C** ❌ Both NAT gateways would be in the first Availability Zone. An outage there would still cut off outbound access for all Availability Zones.
- **D** ❌ A VPC can have only one internet gateway, and it is already highly available. Routing private subnets to an internet gateway would also make them public subnets.
- **E** ❌ An egress-only internet gateway supports outbound IPv6 traffic only. It does not provide outbound access for the instances' IPv4 traffic to the API.

NAT gateways are zonal resources. For Availability Zone-independent outbound access, deploy a NAT gateway in each Availability Zone and give each Availability Zone's private subnets a route table that points to the local NAT gateway.

</details>

### resilient-2.2-32

_Amazon ElastiCache_

A company runs a stateless web tier on Amazon EC2 instances across three Availability Zones. User session data is stored in an Amazon ElastiCache (Memcached) cluster with nodes in each Availability Zone. When a cache node fails, the users whose sessions were on that node are logged out.

The company wants sessions to survive the failure of a cache node or an entire Availability Zone. The solution must require the LEAST operational overhead.

Which solution will meet these requirements?

- **A.** Add a second node in each Availability Zone to the Memcached cluster and enable Auto Discovery in the client library.
- **B.** Enable sticky sessions on the load balancer and store session data in memory on each EC2 instance.
- **C.** Create an ElastiCache (Redis OSS) cluster with cluster mode enabled and no replicas, and enable daily automatic backups.
- **D.** Create an ElastiCache (Redis OSS) replication group with Multi-AZ enabled and a replica in each other Availability Zone.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ Auto Discovery lets clients find nodes as they change, but Memcached partitions data across nodes without replication. Sessions on a failed node are still lost.
- **B** ❌ Sticky sessions tie users to one instance. If that instance or its Availability Zone fails, the sessions are lost.
- **C** ❌ Shards without replicas have nothing to fail over to, and daily backups would restore day-old sessions after a long restore. This does not keep sessions available.
- **D** ✅ Redis OSS replicates data to replicas in other Availability Zones. With Multi-AZ automatic failover, a replica is promoted when the primary node or its Availability Zone fails, and sessions remain available.

ElastiCache for Redis OSS (or Valkey) supports replication and Multi-AZ automatic failover; Memcached does not replicate. For a session store that must survive node or Availability Zone loss, choose a Redis OSS replication group with Multi-AZ.

</details>

### resilient-2.2-33

_Amazon RDS_

A company runs an Amazon RDS for PostgreSQL DB instance in the us-east-1 Region. For DR, the company must be able to restore the database in the us-west-2 Region to any point in time within the previous 7 days. The DR plan accepts an RPO of 2 hours and an RTO of 8 hours.

The company wants to minimize DR costs.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Enable cross-Region automated backups replication for the DB instance to us-west-2 with a retention period of 7 days.
- **B.** Create a cross-Region read replica of the DB instance in us-west-2. Promote the replica during a disaster.
- **C.** Use an AWS Lambda function to create a snapshot of the DB instance every day and copy it to us-west-2. Keep the copies for 7 days.
- **D.** Convert the DB instance to a Multi-AZ DB cluster deployment with readable standbys in three Availability Zones.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ Cross-Region automated backups replicate snapshots and transaction logs to us-west-2, which supports point-in-time restores there. The company pays for backup storage and transfer, not for a running DB instance.
- **B** ❌ A read replica keeps a current copy, but it costs a full running DB instance and cannot restore to an earlier point in time.
- **C** ❌ Daily snapshots can lose up to 24 hours of data, which misses the 2-hour RPO, and they cannot restore to an arbitrary point in time.
- **D** ❌ A Multi-AZ DB cluster protects against Availability Zone failures but stays in us-east-1, so it does not support recovery in us-west-2.

RDS cross-Region automated backups give point-in-time restore in a second Region for only the cost of backup storage and transfer. A cross-Region read replica is the choice when the RPO and RTO are minutes; it is more expensive and has no point-in-time restore.

</details>

### resilient-2.2-34

_Amazon RDS, Amazon EC2 Auto Scaling, Elastic Load Balancing_

A company runs a web application and its MySQL database on a single Amazon EC2 instance in one Availability Zone. The application's session data is already stored in Amazon DynamoDB. The company wants the application to remain available if an instance or an Availability Zone fails, with minimal ongoing management of the database.

Which combination of steps will meet these requirements? (Choose TWO.)

- **A.** Migrate the database to an Amazon RDS for MySQL Multi-AZ deployment.
- **B.** Run the web tier on EC2 instances in an Auto Scaling group that spans multiple Availability Zones behind an Application Load Balancer.
- **C.** Migrate the database to Amazon RDS for MySQL with a read replica in a second Availability Zone.
- **D.** Launch the web tier instances in a cluster placement group that spans two Availability Zones.
- **E.** Move the application to a larger instance type with instance store volumes for the database.

<details><summary>Answer</summary>

**Correct: A, B**

- **A** ✅ A Multi-AZ deployment keeps a synchronous standby in another Availability Zone and fails over automatically. RDS also manages backups and patching.
- **B** ✅ Instances in several Availability Zones behind a load balancer keep serving traffic if one instance or Availability Zone fails, and the Auto Scaling group replaces failed instances.
- **C** ❌ A read replica does not fail over automatically. An engineer would have to promote it and reconfigure the application, so the application would be unavailable during an Availability Zone failure.
- **D** ❌ A cluster placement group is limited to a single Availability Zone. It improves network performance, not availability.
- **E** ❌ A larger single instance is still a single point of failure, and instance store data is lost if the instance stops or fails.

Removing single points of failure means a multi-AZ web tier behind a load balancer and a managed database with automatic failover. Read replicas scale reads but require manual promotion, so they are not a high availability mechanism by themselves.

</details>

### resilient-2.2-35

_Amazon API Gateway, AWS Lambda, Amazon DynamoDB, Amazon Route 53_

A company runs a serverless REST API in the us-east-1 Region. The API uses a Regional Amazon API Gateway endpoint with a custom domain name, AWS Lambda functions, and an Amazon DynamoDB table. The company wants the API to keep serving reads and writes if us-east-1 becomes unavailable, with failover to the us-west-2 Region happening automatically.

Which combination of steps will meet these requirements? (Choose THREE.)

- **A.** Convert the DynamoDB table to a global table with a replica in us-west-2.
- **B.** Deploy the same API Gateway API and Lambda functions in us-west-2, and configure the same custom domain name on the us-west-2 API.
- **C.** Create Amazon Route 53 failover records for the custom domain name that point to the API endpoints in each Region, with a health check on the us-east-1 API.
- **D.** Create an AWS Global Accelerator accelerator with the API Gateway endpoints in both Regions as endpoints.
- **E.** Enable point-in-time recovery on the DynamoDB table and configure restores into us-west-2.
- **F.** Configure provisioned concurrency for the Lambda functions in us-east-1.

<details><summary>Answer</summary>

**Correct: A, B, C**

- **A** ✅ A global table keeps a writable, continuously replicated copy of the data in us-west-2, so the API there can serve reads and writes.
- **B** ✅ A second Regional deployment provides the compute and API layer in us-west-2. Configuring the same custom domain name lets it accept requests for the company's domain.
- **C** ✅ Failover records with a health check send clients to us-west-2 automatically when the us-east-1 API becomes unhealthy.
- **D** ❌ Global Accelerator supports Application Load Balancers, Network Load Balancers, EC2 instances, and Elastic IP addresses as endpoints. It cannot use API Gateway APIs directly as endpoints.
- **E** ❌ Point-in-time recovery protects against data corruption, but a restore is a manual, slow process. It does not provide automatic failover.
- **F** ❌ Provisioned concurrency reduces cold starts in us-east-1. It does nothing for availability if the Region becomes unavailable.

A multi-Region serverless API needs replicated data (DynamoDB global tables), a deployed stack in the second Region, and DNS failover with health checks. Global Accelerator does not front API Gateway directly, and backups and cold-start tuning do not provide failover.

</details>

### resilient-2.2-36

_Amazon CloudFront, Amazon S3_

A company serves a static website from an Amazon S3 bucket in the us-east-1 Region through an Amazon CloudFront distribution. During a recent S3 service disruption in us-east-1, users received errors for content that was not in the CloudFront cache.

The company wants CloudFront to serve the content from another Region automatically when the primary bucket returns errors. The failover must happen within CloudFront so that it does not depend on DNS changes.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Create a second CloudFront distribution that uses a bucket in us-west-2 as its origin. Use Amazon Route 53 failover records to switch between the two distributions.
- **B.** Configure S3 Cross-Region Replication to a bucket in us-west-2. Create a CloudFront origin group with the us-east-1 bucket as the primary origin and the us-west-2 bucket as the secondary origin, failing over on 5xx status codes.
- **C.** Create an empty bucket in us-west-2. Create a CloudFront origin group with the us-east-1 bucket as the primary origin and the us-west-2 bucket as the secondary origin, failing over on 5xx status codes.
- **D.** Increase the default TTL on the distribution's cache behavior to 7 days so that more content is served from the CloudFront cache during an outage.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ This could fail over, but it depends on DNS changes that clients cache, and the company must manage two distributions and keep the second bucket's content in sync.
- **B** ✅ Replication keeps the second bucket current, and the origin group makes CloudFront retry the request on the secondary origin when the primary returns the configured error codes. Failover happens inside CloudFront.
- **C** ❌ The origin group fails over correctly, but the secondary bucket contains no content. Users would receive errors from the secondary origin instead.
- **D** ❌ A longer TTL keeps more content cached, but requests for content that is not cached still fail when the origin is unavailable.

CloudFront origin failover uses an origin group to retry a request against a secondary origin when the primary returns specified errors. Pair it with S3 Cross-Region Replication so the secondary origin actually has the content.

</details>

### resilient-2.2-37

_AWS Global Accelerator, Elastic Load Balancing, Amazon Route 53_

A gaming company runs a multiplayer game server fleet that uses UDP. The fleet runs behind Network Load Balancers in the us-east-1 and eu-west-1 Regions, and any healthy server in a Region can host any player. Many game clients cache DNS responses for a long time and ignore DNS TTLs.

The company wants players to be moved to the other Region automatically within about a minute if a Region becomes unhealthy, without changing the game clients.

Which solution will meet these requirements?

- **A.** Create Amazon Route 53 failover records for the two Network Load Balancers with health checks and a TTL of 60 seconds.
- **B.** Create an AWS Global Accelerator custom routing accelerator with an endpoint group in each Region that contains the game servers' VPC subnets.
- **C.** Use Amazon Route 53 Application Recovery Controller routing controls to switch Route 53 failover records from us-east-1 to eu-west-1.
- **D.** Create an AWS Global Accelerator standard accelerator with an endpoint group in each Region that holds that Region's Network Load Balancer.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ DNS failover depends on clients requesting a new DNS answer. Clients that cache DNS and ignore the TTL would keep sending traffic to the failed Region.
- **B** ❌ A custom routing accelerator maps ports to specific EC2 instances in VPC subnets for matchmaking logic. It does not use Network Load Balancers as endpoints, and the company would have to build port-mapping logic to steer players.
- **C** ❌ Routing controls give reliable control over which DNS records Route 53 returns, but the failover still happens through DNS answers. Clients that ignore TTLs keep using the cached address.
- **D** ✅ A standard accelerator gives clients static anycast IP addresses that support UDP. It health-checks each endpoint group and shifts traffic to the healthy Region without any DNS change, so cached DNS answers stay valid.

Global Accelerator standard accelerators fail over at the network layer behind static anycast IP addresses, so DNS caching does not matter. Any Route 53-based option, including Application Recovery Controller, still depends on clients fetching new DNS answers; custom routing accelerators are for deterministic matchmaking to specific instances, not load-balanced failover.

</details>

### resilient-2.2-38

_Amazon EBS, Amazon Data Lifecycle Manager_

A company runs a reporting application on a single Amazon EC2 instance that stores its data on an Amazon EBS gp3 volume. The application can tolerate up to 4 hours of data loss and up to 8 hours of downtime. If the instance's Availability Zone fails, the company must be able to recover the application in another Availability Zone in the same Region.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Use Data Lifecycle Manager to snapshot the volume every 4 hours. Restore the latest snapshot in another Availability Zone if needed.
- **B.** Enable EBS Multi-Attach on the volume and attach it to a stopped standby instance in another Availability Zone in the same Region.
- **C.** Attach a second gp3 volume to the instance and mirror the two volumes in a RAID 1 array so that either volume can fail without data loss.
- **D.** Use AWS Elastic Disaster Recovery to continuously replicate the instance to a staging area in another Availability Zone.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ EBS snapshots are stored regionally, so they can be restored to a volume in any Availability Zone in the Region. Snapshots every 4 hours meet the RPO, and a restore fits within the 8-hour RTO.
- **B** ❌ Multi-Attach works only with Provisioned IOPS volumes and only for instances in the same Availability Zone as the volume. It cannot attach a volume across Availability Zones.
- **C** ❌ Both volumes are in the same Availability Zone as the instance. An Availability Zone failure would make both volumes unavailable.
- **D** ❌ Elastic Disaster Recovery would meet the requirements with an RPO of seconds, but its continuous replication costs more than the 4-hour RPO and 8-hour RTO require.

EBS volumes live in one Availability Zone, but their snapshots are stored regionally and can be restored in any Availability Zone. Scheduled snapshots are the cheapest way to meet an RPO and RTO measured in hours.

</details>

### resilient-2.2-39

_Amazon ECS, AWS Fargate, Elastic Load Balancing_

A company runs a containerized web service on a single Amazon EC2 instance that runs Docker. The service keeps WebSocket connections open to clients for several hours. The instance failed last week and the service was down until an engineer launched a new instance.

The company wants the service to remain available if an Availability Zone fails. The company does not want to manage servers or operating systems.

Which solution will meet these requirements?

- **A.** Create an Amazon ECS service on Amazon EC2 container instances in an Auto Scaling group that spans three Availability Zones. Run three tasks behind an Application Load Balancer.
- **B.** Create an Amazon ECS service on AWS Fargate with all three tasks in a single subnet behind an Application Load Balancer.
- **C.** Create an Amazon ECS service on AWS Fargate with subnets in three Availability Zones and a desired count of three tasks behind an Application Load Balancer.
- **D.** Package the service as an AWS Lambda container image. Invoke it through an Amazon API Gateway WebSocket API.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ This is highly available, but the company must manage the EC2 container instances and their operating systems.
- **B** ❌ Fargate removes server management, but one subnet is in one Availability Zone. All tasks would stop if that Availability Zone failed.
- **C** ✅ Amazon ECS spreads the service's tasks across the Availability Zones of the configured subnets and replaces failed tasks. Fargate removes the need to manage servers.
- **D** ❌ API Gateway WebSocket APIs with Lambda are serverless and span Availability Zones, but an API Gateway WebSocket connection can stay open for at most 2 hours. Connections that must stay open for several hours would be dropped, and the service would need to be rewritten as Lambda handlers.

An ECS service on Fargate with subnets in multiple Availability Zones provides Availability Zone-level resilience without server management. The same service in one subnet, or on self-managed EC2 instances, each breaks one requirement.

</details>

### resilient-2.2-40

_Amazon Aurora_

A company runs an Amazon Aurora MySQL DB cluster that has a single writer instance and no Aurora Replicas. When the writer instance failed recently, the database was unavailable for about 10 minutes while Aurora created a new instance.

The company wants to reduce database downtime when the writer instance or its Availability Zone fails.

Which solution will meet these requirements?

- **A.** Create an RDS Proxy for the DB cluster and configure the application to connect through the proxy.
- **B.** Add an Aurora Replica to the DB cluster in a different Availability Zone from the writer instance.
- **C.** Enable Aurora Backtrack on the DB cluster with a target backtrack window of 24 hours.
- **D.** Modify the writer instance to a larger instance class so that a replacement instance starts faster.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ RDS Proxy shortens client-side failover disruption, but there is still no replica to promote. Aurora must still create a new writer instance, so most of the downtime remains.
- **B** ✅ When an Aurora Replica exists, Aurora promotes it to writer during a failover, which is much faster than creating a new instance. Placing it in a different Availability Zone also covers an Availability Zone failure.
- **C** ❌ Backtrack rewinds the database to an earlier point in time to undo logical errors. It does not provide a standby instance for failover.
- **D** ❌ The instance class does not meaningfully change how long Aurora takes to create and start a replacement instance. Without a replica, failover still requires creating a new instance.

Aurora storage is already replicated across three Availability Zones, but compute is not: without an Aurora Replica, recovery means creating a new instance. Adding a replica in another Availability Zone gives Aurora a ready target to promote.

</details>

### resilient-2.2-41

_AWS Elastic Disaster Recovery, Amazon EC2_

A company runs 40 Amazon EC2 instances in the us-east-1 Region. The instances host stateful applications, including several self-managed databases, that store data on Amazon EBS volumes. The company needs a DR solution in the us-east-2 Region.

The DR plan requires an RPO of seconds and an RTO of minutes. The company wants to keep standby costs low and cannot change the applications.

Which solution will meet these requirements?

- **A.** Create an AWS Backup plan that backs up the instances every hour and copies each recovery point to us-east-2. Restore the instances during a disaster.
- **B.** Create an Amazon Data Lifecycle Manager policy that snapshots the EBS volumes every hour and copies the snapshots to us-east-2.
- **C.** Run a full-size copy of each instance in us-east-2. Configure application-level replication between each pair of instances.
- **D.** Use AWS Elastic Disaster Recovery to replicate the instances continuously to a staging area in us-east-2. Launch recovery instances in a disaster.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ Hourly backups can lose up to an hour of data, and restoring 40 instances from backups takes longer than minutes.
- **B** ❌ Hourly snapshots cannot meet an RPO of seconds, and the instances would still need to be rebuilt from the snapshots during a disaster.
- **C** ❌ Full-size standby instances increase standby costs, and adding application-level replication requires changes that the company cannot make.
- **D** ✅ Elastic Disaster Recovery supports cross-Region replication of EC2 instances. Continuous block-level replication gives an RPO of seconds, recovery instances launch in minutes, and only a low-cost staging area runs before a disaster.

AWS Elastic Disaster Recovery works for EC2 instances between Regions as well as for on-premises servers. It replicates at the block level without application changes and keeps standby costs low, while backups and snapshots cannot reach a seconds-level RPO.

</details>

### resilient-2.2-42

_Amazon S3_

A company runs an application in the us-east-1 and us-west-2 Regions that reads and writes objects in Amazon S3. The company wants the application in both Regions to use a single global S3 endpoint. Normally all requests must go to a bucket in us-east-1. If S3 in us-east-1 has problems, the company wants to shift all requests to a bucket in us-west-2 within minutes. Objects written to either bucket must be available in the other bucket.

Which combination of steps will meet these requirements? (Choose TWO.)

- **A.** Create an S3 Multi-Region Access Point that contains both buckets. Use failover controls to set the us-east-1 bucket as active and the us-west-2 bucket as passive.
- **B.** Configure S3 Cross-Region Replication rules in both directions between the two buckets.
- **C.** Configure an S3 Cross-Region Replication rule from the us-east-1 bucket to the us-west-2 bucket only.
- **D.** Enable S3 Transfer Acceleration on the us-east-1 bucket and configure the application to use the accelerated endpoint.
- **E.** Create Amazon Route 53 failover records that point to the static website endpoints of the two buckets.

<details><summary>Answer</summary>

**Correct: A, B**

- **A** ✅ A Multi-Region Access Point gives one global endpoint. Its failover controls route all requests to the active bucket and can shift traffic to the passive bucket within minutes.
- **B** ✅ Two-way replication keeps both buckets in sync, so objects written to either bucket, including writes made after a failover, are available in the other.
- **C** ❌ One-way replication copies objects only from us-east-1. Objects written to the us-west-2 bucket after a failover would not be copied back.
- **D** ❌ Transfer Acceleration speeds up long-distance transfers to one bucket. It provides no failover to a bucket in another Region.
- **E** ❌ S3 static website endpoints support only read requests over HTTP. The application could not write objects through them.

S3 Multi-Region Access Points provide a single global endpoint, and failover controls give active-passive routing between buckets. Pair them with two-way replication so that the buckets stay in sync no matter which one is active.

</details>

### resilient-2.2-43

_Amazon EFS_

A company runs a document processing application on Amazon EC2 instances that share an Amazon EFS file system in the eu-west-1 Region. The company needs a copy of the file system in the eu-central-1 Region for DR.

The DR plan requires an RPO of 30 minutes. The company wants the solution with the LEAST operational overhead.

Which solution will meet these requirements?

- **A.** Configure Amazon EFS replication from the file system to a destination file system in eu-central-1.
- **B.** Create an AWS DataSync task that copies the file system to a file system in eu-central-1. Schedule the task to run every hour.
- **C.** Create an AWS Backup plan that backs up the file system every hour and copies each backup to eu-central-1.
- **D.** Change the file system to use the EFS Regional storage classes with mount targets in every Availability Zone in eu-west-1.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ EFS replication keeps a read-only copy of the file system in another Region and is designed for an RPO of about 15 minutes for most file systems. It is a managed setting with no scheduling to maintain.
- **B** ❌ DataSync can copy between EFS file systems, but an hourly schedule cannot meet a 30-minute RPO, and the company must manage the task.
- **C** ❌ Hourly backups plus the copy time give an RPO of more than an hour, which misses the 30-minute RPO.
- **D** ❌ Regional storage protects against the loss of an Availability Zone. It does not keep a copy of the data in eu-central-1.

EFS replication is the managed way to keep an EFS file system copied to another Region with an RPO of minutes. Scheduled copies and backups are bounded by their schedule and need more management.

</details>

### resilient-2.2-44

_Amazon ElastiCache_

A gaming company stores live leaderboards in an Amazon ElastiCache (Redis OSS) cluster with Multi-AZ enabled in the us-east-1 Region. The leaderboard data exists only in the cache, and rebuilding it from game logs takes several hours.

The company needs a DR plan for a Regional outage with an RPO of seconds and an RTO of minutes. The solution must require the LEAST operational overhead.

Which solution will meet these requirements?

- **A.** Schedule daily ElastiCache backups, export them to Amazon S3, and copy them to the us-west-2 Region. Restore a new cluster from the latest backup during a disaster.
- **B.** Change the application to write every update to the existing cluster and to a second ElastiCache (Redis OSS) cluster in the us-west-2 Region.
- **C.** Create an ElastiCache (Redis OSS) Global Datastore with the existing cluster as the primary and a secondary cluster in the us-west-2 Region. Promote the secondary cluster during a disaster.
- **D.** Add replicas to the existing cluster in all Availability Zones in us-east-1 and enable automatic failover.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Daily backups can lose up to a day of data, and creating a new cluster from a backup takes longer than minutes.
- **B** ❌ Dual writes could meet the RPO, but the company must build and maintain the logic to keep both clusters consistent when writes fail. This adds operational overhead.
- **C** ✅ Global Datastore provides fully managed cross-Region replication, typically with less than 1 second of lag. The secondary cluster can be promoted to primary in minutes or less.
- **D** ❌ More replicas improve resilience to node and Availability Zone failures, but all of them are in us-east-1. They do not protect against a Regional outage.

ElastiCache Global Datastore is the managed cross-Region replication feature for Redis OSS, giving an RPO of about a second and fast promotion. Multi-AZ replicas handle Availability Zone failures only, and backups cannot meet a seconds-level RPO.

</details>

### resilient-2.2-45

_Amazon Route 53, Elastic Load Balancing, Amazon RDS_

A company uses Amazon Route 53 failover routing for a web application. The primary alias record points to an Application Load Balancer (ALB) in the us-east-1 Region with Evaluate Target Health enabled. The secondary record points to a standby environment in the us-west-2 Region. The ALB target group health check requests the path /, which returns a static page.

Last week the application's database in us-east-1 failed. Users received errors for an hour, but Route 53 did not fail over. The company wants Route 53 to fail over whenever the application in us-east-1 cannot process requests, including when a dependency such as the database fails.

Which solution will meet these requirements?

- **A.** Reduce the TTL of the failover records to 10 seconds so that clients receive the secondary record sooner.
- **B.** Add a /health path to the application that tests its database connection. Create a Route 53 health check that requests /health through the ALB and associate it with the primary record.
- **C.** Create a Route 53 health check that requests the path / through the ALB and associate it with the primary record.
- **D.** Create an Amazon CloudWatch alarm on the ALB's HealthyHostCount metric. Create a Route 53 health check that monitors the alarm and associate it with the primary record.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ A shorter TTL speeds up failover once Route 53 decides the primary is unhealthy. It does not change how health is detected, so Route 53 would still not fail over.
- **B** ✅ A health check that exercises the application's dependencies fails when the database is unavailable. Route 53 then treats the primary record as unhealthy and answers with the secondary record.
- **C** ❌ The / path returns a static page that does not touch the database. The health check would keep passing during a database failure.
- **D** ❌ The targets keep passing the ALB's / health check during a database failure, so HealthyHostCount stays normal and the alarm never fires.

DNS failover is only as good as the health signal behind it. A shallow health check on a static page cannot detect dependency failures; a health check against an endpoint that exercises the critical dependencies makes Route 53 fail over when the application cannot actually serve requests.

</details>
