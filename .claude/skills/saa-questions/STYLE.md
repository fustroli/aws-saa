# Question style

The benchmark is `data/official-aws-mock-exam.txt`. Match its shape and difficulty. Use it for calibration only: every scenario you write is your own, never a reworded official one.

## Stem

- Opens with an actor and situation: "A company…", "A media company…", "A solutions architect…". 2–5 sentences of business context.
- Carries concrete, **load-bearing** constraints: numbers (30-minute jobs, 400 GB of scratch data, 5-year retention, 10 VPCs), access patterns (rarely accessed, unpredictable traffic, read-heavy), and operational demands (avoid managing infrastructure, central management, no internet access). Each constraint exists to eliminate at least one option. Cut any detail that eliminates nothing, unless it is a deliberate red herring a strong candidate learns to ignore (at most one per question).
- Ends on its own line with the question, usually "Which solution will meet these requirements?" plus a capitalised qualifier where the trade-off matters: MOST cost-effectively, with the LEAST operational overhead, MOST operationally efficient, MOST secure, with the LEAST latency. Multi-select: "Which combination of steps…? (Choose TWO.)" or "(Choose THREE.)".
- Separate paragraphs with `\n\n` in the JSON string.

## Options

- Each option is a complete solution: one or two sentences naming real services and how they are configured, written in the imperative ("Deploy…", "Configure…", "Use…").
- Options are parallel in structure and similar in length. The key is not the longest or most specific option.
- **Distractors are near-misses**: real, plausible architectures that work technically but each break one stated requirement (manages servers when the stem forbids it, costs more than needed, adds latency, lacks durability, wrong consistency model). Favour close pairs a candidate must truly distinguish: SQS vs SNS, Fargate vs EC2 launch type, gateway vs interface endpoint, CloudFront vs Global Accelerator, EFS vs FSx for Windows vs FSx for Lustre, Transit Gateway vs VPC peering, Aurora Serverless vs provisioned, Kinesis Data Streams vs Firehose, Secrets Manager vs Parameter Store.
- Two options may share most of their wording and differ in one decisive component: this is the official exam's sharpest move, use it often.
- Every option uses real, current features. Options that are absurd (root user keys, disabling encryption) make the question too easy; leave them out.

## Notes (per-option rationale)

One to three sentences in the official "Rationale" voice: what the service does, then whether it meets the scenario, naming the specific requirement it meets or breaks. Example: "Amazon SNS is a publish/subscribe service. Every subscriber receives every message, so SNS cannot distribute work items between processing containers. Amazon SQS is the suitable service for this requirement."

## Explanation

Two to four sentences: why the key is the best answer under the qualifier, and the one concept to remember (the close-pair distinction the question tested).

## Difficulty

Associate level. A strong candidate needs about two minutes, because the question requires knowing how two or three services interact and weighing a trade-off, not recalling a definition. Aim for most questions at the level of the official ones, about 1 in 5 noticeably harder (two near-identical options, or a multi-step architecture), and few easy ones. Test limits and numbers only where the exam habitually does (Lambda 15-minute timeout, SQS retention up to 14 days, S3 storage class minimum durations, Glacier retrieval times).

## Correctness

Exactly one defensible answer (or exactly N for Choose N) under the stated qualifier. Describe AWS as it currently behaves. Prefer the current service name (Amazon Data Firehose, IAM Identity Center). Spread the key across letters a–d.
