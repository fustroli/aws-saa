# AWS SAA practice

Practice app for the AWS Certified Solutions Architect – Associate (SAA-C03) exam.
React + Vite static site; progress lives in `localStorage` and can sync across
devices with a sync ID (no accounts, no database).

## Develop

```sh
npm install
npm run dev        # http://localhost:5173 (sync shows an error: no API locally)
npm test
```

To use real sync locally, point the dev server at a deployed stack:
`API_PROXY=https://dxxxxxxxx.cloudfront.net npm run dev`.

## Question authoring

The `saa-questions` Claude skill (`.claude/skills/saa-questions/`) uses
`data/official-aws-mock-exam.txt` as its benchmark for style and difficulty. That
file is official AWS practice-exam content, so it is gitignored and not in the
repo. To use the skill, take the official SAA-C03 practice exam on AWS Skill
Builder, copy the results review page (questions, options, rationales) as plain
text, and save it at that path.

## Architecture

```
browser ──HTTPS──> CloudFront + WAF ──OAC──> S3 site bucket (private)
                              └── /api/* ──OAC──> Lambda function URL (AWS_IAM) ──> S3 progress bucket (private)
```

- `infra/template.yaml`: the whole stack, plain CloudFormation. CloudFront and its
  AWS WAF web ACL are on the CloudFront flat-rate Free plan ($0, no overage
  charges). WAF blocks any IP that sends more than `ApiRateLimit` (default 300)
  `/api/*` requests in 5 minutes, which caps what a bot can cost in Lambda/S3.
- `infra/lambda/`: sync API. `GET /api/progress/{id}` loads, `PUT` merges and saves
  to `progress/{id}.json`, using S3 conditional writes (`If-Match`) so concurrent
  saves don't overwrite each other.
- `src/lib/progressDoc.ts`: the progress document and its merge rules, shared by
  the app and the Lambda. Attempts are combined, bookmarks are last-change-wins,
  and "Reset progress" is a timestamp that clears every linked device.

The sync ID is a random UUID and works as a password: anyone with it can read and
change that progress.

## Deploy

Needs AWS CLI v2 with credentials (`aws login` / `aws sso login`). The stack
always deploys to `us-east-1`, the only Region with CloudFront-scope WAF web ACLs.
The flat-rate plan isn't available to accounts on the AWS Free Tier plan.

```sh
npm run deploy
```

The script runs the tests, builds the site and Lambda, creates an artifact bucket
if needed (`<stack>-artifacts-<account>-<region>`), runs `aws cloudformation
package` + `deploy`, uploads `dist/` to the site bucket and invalidates
`index.html`. The first deploy takes a few minutes (CloudFront). It prints the site URL.

Options: `STACK_NAME` (default `aws-saa`), `ARTIFACT_BUCKET`. The template
parameters `PriceClass`, `ReservedConcurrency` and `ApiRateLimit` can be changed in the
CloudFormation console; later deploys keep the values you set.

To delete: empty the site bucket, then delete the stack (this cancels the Free plan). The progress bucket is
retained on purpose (user data); delete it by hand if you want it gone.
