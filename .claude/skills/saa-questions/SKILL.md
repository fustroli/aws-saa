---
name: saa-questions
description: Generate original AWS SAA-C03 practice questions at official-exam difficulty into the question bank.
disable-model-invocation: true
argument-hint: "[<domain>-<task> e.g. secure-1.2] [count]"
---

# Generate SAA-C03 questions

Write original exam questions that a candidate could not tell apart from the official AWS mock exam. The bank lives in `src/data/bank/<domain>-<task>.json`, one JSON array of `Question` (see `src/types.ts`) per exam task statement. The JSON is the source of truth; Markdown in `docs/question-bank/` is generated from it.

Arguments: a task file stem (`secure-1.2`) and a count. With no task, pick the task with the largest gap between its quota in [TOPICS.md](TOPICS.md) and its current count. With no count, fill that gap, up to 25.

## Steps

1. **Calibrate.** Read [STYLE.md](STYLE.md), then read at least five full questions (stem, every option, every rationale) from `data/official-aws-mock-exam.txt`. Done when you can state, for one of them, which requirement each distractor violates.

2. **Plan the batch.** Run `npm run bank:md` and read `docs/question-bank/README.md` for current counts. Read every existing question in the target file. Then write a numbered **concept list**, one line per new question: tested concept, the close-pair decision it forces (e.g. SQS vs SNS fan-out), the qualifier, single or multi-select. Every line covers a concept or angle the file does not already test, and together the lines spread across all bullets of that task in TOPICS.md. Done when the list has exactly `count` lines.

3. **Write.** Append the questions to the target file, continuing the id sequence (`<domain>-<task>-NN`). Follow STYLE.md for the stem, options, notes and explanation. About 1 in 7 is multi-select.

4. **Attack every question.** For each new question, argue as a strong candidate that each distractor is the right answer under the stated qualifier, and that the keyed answer violates some requirement. A question passes only when every distractor fails a requirement written in the stem and the key satisfies all of them. Rewrite or drop any question that fails. Done when every question has passed this check.

5. **Verify facts against AWS docs.** For every limit, number, feature, pricing rule and service name the key or any note relies on, confirm it in current docs.aws.amazon.com or aws.amazon.com pages (What's New, document history), not memory. AWS changes these often: services get renamed (Security Hub CSPM, Amazon Quick Sight), closed to new customers (Snowball Edge, Glacier vaults), retired (Redshift DC2), or have limits lifted (S3 Lifecycle 30-day transition minimum, gp3 IOPS). Rewrite or drop any question you cannot verify.

6. **Validate.** Run `npm test -- src/data/bank.test.ts` until it is green, then `npm run bank:md`. Besides schema checks, the test fails on length tells (a key ≥1.3× every distractor, or the key longest in >40% of a file's single-answer questions) and on near-duplicate scenarios anywhere in the bank (stem + key word similarity >0.45). Fix those by rewriting, never by loosening the thresholds.

Finish by reporting: questions added per task file, questions dropped in steps 4–5 and why, and the new totals from `docs/question-bank/README.md`.
