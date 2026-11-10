# Design Secure Architectures

105 questions.

## Task 1.1

### secure-1.1-01

_IAM, Amazon EC2, Amazon S3_

A company runs a reporting application on Amazon EC2 instances in an Auto Scaling group. The application reads input files from one Amazon S3 bucket and writes reports to a second bucket. The application authenticates with an IAM user access key pair that is stored in a configuration file on the AMI.

A security audit flagged the long-term credentials. The company wants the credentials that the application uses to rotate automatically, with no extra steps when the Auto Scaling group launches new instances.

Which solution will meet these requirements MOST securely?

- **A.** Store the access key pair in AWS Secrets Manager and turn on automatic rotation. Update the application to retrieve the keys from Secrets Manager at startup.
- **B.** Store the access key pair as a SecureString parameter in AWS Systems Manager Parameter Store. Allow the application to read the parameter at startup.
- **C.** Create an IAM role that allows reads from the input bucket and writes to the output bucket. Attach the role to the launch template as an instance profile.
- **D.** Create an IAM role that allows reads from the input bucket and writes to the output bucket. Allow an IAM user to assume the role, and store that user's access keys on the AMI.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Secrets Manager can rotate secrets, but the application still uses long-term IAM user keys, and rotating IAM user keys requires a custom rotation function. An IAM role removes the long-term keys entirely, which is more secure.
- **B** ❌ Parameter Store encrypts the value but does not rotate it, so the long-term keys remain static. This solution does not meet the automatic rotation requirement.
- **C** ✅ An instance profile delivers temporary credentials from AWS STS through the instance metadata service. AWS rotates the credentials automatically, and every instance that the Auto Scaling group launches receives them with no extra steps.
- **D** ❌ The role issues temporary credentials, but the instances still need long-term IAM user keys to call AssumeRole. The audit finding about long-term credentials on the AMI remains.

Applications on EC2 should get permissions from an IAM role attached through an instance profile. The SDK picks up temporary credentials from instance metadata, and AWS rotates them automatically. Storing access keys anywhere, even in Secrets Manager, is less secure than having no long-term keys at all.

</details>

### secure-1.1-02

_IAM_

A company's platform team wants application developers to create IAM roles for their own AWS Lambda functions without waiting for the platform team. The security team is concerned that a developer could create a role with more permissions than the developer has and then use the role to escalate privileges.

The platform team has written a managed policy named DevBoundary that defines the maximum permissions that any developer-created role may have.

Which solution will meet these requirements?

- **A.** Allow developers to create roles only when the request sets DevBoundary as the permissions boundary. Deny developers permission to change DevBoundary or to remove boundaries from roles.
- **B.** Allow developers to create roles and attach policies to them. Attach DevBoundary to the developers' IAM group as an identity-based policy that limits what developers can do.
- **C.** Create an SCP that denies iam:CreateRole for every principal except the platform team. Attach the SCP to the organization root.
- **D.** Allow developers to create roles and attach policies to them. Deploy an AWS Config rule that flags roles with permissions broader than DevBoundary and notifies the platform team.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ A permissions boundary caps the effective permissions of the roles that developers create, whatever policies they attach. The iam:PermissionsBoundary condition key forces the boundary on every new role, and the deny statements stop developers from weakening it.
- **B** ❌ Attaching DevBoundary to the developers limits the developers, not the roles they create. A developer could still attach AdministratorAccess to a new role and pass it to a Lambda function, so privilege escalation remains possible.
- **C** ❌ This SCP prevents privilege escalation by blocking role creation entirely. It fails the requirement that developers create their own roles without waiting for the platform team.
- **D** ❌ AWS Config is a detective control. The over-privileged role exists, and can be used, before anyone is notified, so this does not prevent the escalation.

Delegating role creation safely is the classic use case for permissions boundaries: require the boundary on every role that developers create, and protect the boundary from being changed. Remember that a boundary sets maximum permissions and grants nothing on its own, and that detective controls such as AWS Config do not prevent escalation.

</details>

### secure-1.1-03

_AWS Organizations, IAM_

A company uses AWS Organizations to manage 60 member accounts. Because of data residency regulations, the company must prevent all users in the member accounts, including account administrators, from creating resources outside the eu-central-1 and eu-west-1 Regions. Users must still be able to use global services such as IAM and Amazon CloudFront.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Create an IAM policy that denies actions when aws:RequestedRegion is not one of the approved Regions. Use AWS CloudFormation StackSets to attach the policy to every IAM user and role in each account.
- **B.** Deploy an AWS Config rule in every account that detects resources in unapproved Regions. Configure automatic remediation that deletes the resources.
- **C.** Create a permissions boundary that allows actions only in the approved Regions. Require account administrators to attach the boundary to every new IAM role.
- **D.** Create an SCP that denies all actions, except actions of global services, when aws:RequestedRegion is not one of the approved Regions. Attach the SCP to the organization root.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ The policy logic works, but account administrators can detach an IAM policy from themselves, and every new user or role needs the policy. This does not reliably restrict administrators and adds overhead.
- **B** ❌ AWS Config detects resources after they are created. Data could already reside in a forbidden Region before remediation runs, so this does not prevent creation.
- **C** ❌ The boundary depends on administrators applying it, and it does not restrict the administrators themselves. The requirement explicitly includes account administrators.
- **D** ✅ An SCP applies to every principal in the member accounts, including administrators and the root user, and cannot be removed from within the account. Exempting global services keeps IAM and CloudFront usable. One policy covers all 60 accounts and any new ones.

SCPs are the preventive guardrail for an entire organization: they limit what every principal in a member account can do, even administrators. A Region-deny SCP uses aws:RequestedRegion and exempts global services. IAM policies and permissions boundaries can be changed by account administrators, and AWS Config only detects.

</details>

### secure-1.1-04

_AWS Organizations, IAM, Amazon Athena_

A company uses AWS Organizations. The Analytics OU has the default FullAWSAccess SCP removed and an SCP attached that allows only Amazon S3, Amazon Athena, and AWS Glue actions.

An administrator creates a new IAM role for a data analyst in a member account in the Analytics OU. No policies are attached to the role. When the analyst assumes the role and runs an Athena query, the request is denied.

What should a solutions architect do to give the analyst the required access while following the principle of least privilege?

- **A.** Update the SCP that is attached to the Analytics OU so that it explicitly allows the Athena, Glue, and S3 actions for the analyst role's ARN only.
- **B.** Attach an identity-based policy to the role that allows only the Athena, Glue, and S3 actions that the analyst needs on the required resources.
- **C.** Reattach the FullAWSAccess SCP to the Analytics OU so that the member account is no longer restricted by the allow-list SCP.
- **D.** Attach a permissions boundary to the role that allows only the Athena, Glue, and S3 actions that the analyst needs on the required resources.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ SCPs only define the maximum available permissions for an account. They never grant permissions to a principal, so the role still has no permissions after this change.
- **B** ✅ The role has no identity-based permissions, so every request is implicitly denied. A scoped identity-based policy grants exactly what the analyst needs, and the SCP already allows these services.
- **C** ❌ This weakens the OU guardrail and still grants nothing to the role. The request remains denied because the role has no identity-based permissions.
- **D** ❌ A permissions boundary sets the maximum permissions for a role but does not grant any. Without an identity-based policy, the role's requests are still denied.

Effective permissions are the intersection of what the SCP allows, what any permissions boundary allows, and what an identity-based (or resource-based) policy grants. SCPs and boundaries only set limits. Something must still grant the action, and the least-privilege way is a scoped identity-based policy.

</details>

### secure-1.1-05

_AWS Organizations, AWS CloudTrail_

A company has an organization in AWS Organizations. The company attached an SCP to the organization root that denies the deletion of AWS CloudTrail trails. Several legacy production workloads still run in the management account.

During an audit, the security team discovers that an engineer deleted a trail in the management account. The security team wants the guardrail to apply in every account that runs workloads.

Which solution will meet these requirements and follow AWS best practices?

- **A.** Attach the SCP directly to the management account in addition to the organization root so that it applies to every account.
- **B.** Attach a permissions boundary that denies cloudtrail:DeleteTrail to every IAM user and role in the management account, including administrator roles.
- **C.** Migrate the workloads from the management account to member accounts. Limit access to the management account to a small group of administrators.
- **D.** Create an organization trail in the management account so that users in member accounts cannot delete the trail.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ SCPs never affect users or roles in the management account, regardless of where the SCP is attached. The engineer could still delete the trail.
- **B** ❌ A boundary restricts only the roles it is attached to. Administrators in the management account can remove it, and the root user is not affected. This also leaves workloads running in the management account, which AWS advises against.
- **C** ✅ SCPs do not apply to the management account, so AWS recommends running no workloads there. After the migration, the root SCP guards every account that runs workloads, and the management account is used only for organization administration.
- **D** ❌ An organization trail cannot be modified from member accounts, but users in the management account can still delete it. The workloads and the gap in the guardrail both remain in the management account.

SCPs apply only to member accounts and never restrict the management account, even when attached directly to it. AWS best practice is to keep workloads out of the management account so that organization guardrails cover all of them.

</details>

### secure-1.1-06

_Amazon S3, IAM_

A company stores a data lake in an Amazon S3 bucket in Account A. An analytics application runs on Amazon EC2 instances in Account B and uses an instance profile with an IAM role named AnalyticsRole. The application must read objects from one prefix of the bucket.

The bucket uses SSE-S3 encryption, and S3 Object Ownership is set to bucket owner enforced.

Which combination of steps will meet these requirements? (Choose TWO.)

- **A.** Create an IAM role in Account A that allows s3:GetObject on the prefix. Attach the role to the EC2 instances in Account B as an instance profile.
- **B.** Add a statement to the bucket policy in Account A that allows s3:GetObject on the prefix for the AnalyticsRole ARN.
- **C.** Add an object ACL grant that gives read access to the canonical user ID of Account B.
- **D.** Create a resource share in AWS Resource Access Manager (AWS RAM) that shares the bucket prefix with Account B.
- **E.** Add a statement to the identity-based policy of AnalyticsRole that allows s3:GetObject on the prefix in the Account A bucket.

<details><summary>Answer</summary>

**Correct: B, E**

- **A** ❌ An instance profile can contain only a role from the same account as the instance. A role in Account A cannot be attached to instances in Account B.
- **B** ✅ For cross-account access, the resource owner must grant access. The bucket policy names the role in Account B as a principal and limits access to the prefix.
- **C** ❌ The bucket owner enforced setting disables ACLs on the bucket and its objects. Access must be granted with policies instead.
- **D** ❌ AWS RAM does not support sharing S3 buckets or prefixes. Cross-account S3 access uses bucket policies, access points, or roles.
- **E** ✅ In cross-account access, the principal's own account must also allow the action. The role needs an identity-based policy for the bucket in addition to the bucket policy grant.

Cross-account access with a resource-based policy needs two allows: the resource owner's policy (the bucket policy) must grant the external principal, and the principal's account must grant the action in an identity-based policy. With ACLs disabled by bucket owner enforced, policies are the only grant mechanism.

</details>

### secure-1.1-07

_AWS KMS, Amazon S3, IAM_

A company stores invoices in an Amazon S3 bucket in a finance account. The objects are encrypted with SSE-KMS by using a customer managed key in the finance account. An application in a reporting account uses an IAM role that is granted s3:GetObject by the bucket policy and by the role's identity-based policy.

Requests from the application fail with an AccessDenied error. Compliance rules require the company to keep using the customer managed key.

Which solution will resolve the error?

- **A.** Add a statement to the key policy that allows the reporting role to use kms:Decrypt. Add kms:Decrypt on the key ARN to the role's identity-based policy.
- **B.** Add a statement to the bucket policy in the finance account that allows the reporting role to use kms:Decrypt on the customer managed key.
- **C.** Re-encrypt the objects with the AWS managed key for Amazon S3 (aws/s3). Grant the reporting role in the reporting account permission to use that key.
- **D.** Add kms:Decrypt on the key ARN to the reporting role's identity-based policy. Keep the existing key policy in the finance account unchanged.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ A KMS key in another account requires an allow in both the key policy, which is the key's resource-based policy, and the caller's identity-based policy. With both in place, Amazon S3 can decrypt the objects for the role.
- **B** ❌ A bucket policy controls access to S3 resources only. It cannot grant permissions on a KMS key, which is controlled by its key policy.
- **C** ❌ The key policy of an AWS managed key cannot be changed, so the key cannot be used across accounts. This also violates the requirement to keep the customer managed key.
- **D** ❌ For cross-account use, the identity-based policy alone is not enough. The key policy in the finance account must also allow the external principal, or KMS denies the request.

SSE-KMS objects need both S3 permissions and KMS permissions. Cross-account use of a customer managed key requires an allow in the key policy of the owning account and in the caller's identity-based policy. AWS managed keys cannot be shared across accounts because their key policies are fixed.

</details>

### secure-1.1-08

_Amazon Cognito, Amazon S3, IAM_

A company is building a mobile app. Users sign up with an email address and password and then upload photos directly to an Amazon S3 bucket. Each user must be able to read and write only objects under a prefix that matches that user's own identity.

The company does not want to run backend servers to broker uploads and does not want any AWS credentials embedded in the app.

Which combination of steps will meet these requirements? (Choose TWO.)

- **A.** Create an Amazon Cognito user pool to handle user sign-up and sign-in.
- **B.** Create an IAM user for each app user at sign-up. Return the IAM user's access keys to the app.
- **C.** Create an Amazon Cognito identity pool that trusts the user pool. Assign an authenticated role whose policy limits S3 access to a prefix built from the ${cognito-identity.amazonaws.com:sub} policy variable.
- **D.** Configure the S3 bucket policy to accept ID tokens issued by the user pool and to grant each user access to the prefix that matches the token's sub claim.
- **E.** Create an Amazon Cognito identity pool with unauthenticated access turned on. Assign a role that allows s3:PutObject and s3:GetObject on the bucket.

<details><summary>Answer</summary>

**Correct: A, C**

- **A** ✅ A Cognito user pool is a managed user directory that handles sign-up and sign-in with email and password and issues tokens to the app.
- **B** ❌ This places long-term AWS credentials on the device, which the requirements forbid. IAM is not designed to hold app end users.
- **C** ✅ An identity pool exchanges user pool tokens for temporary AWS credentials. The policy variable resolves to each user's identity ID, so each user can access only that user's prefix.
- **D** ❌ Amazon S3 authorizes requests signed with AWS credentials. It cannot validate Cognito JWTs, so the tokens must first be exchanged for AWS credentials through an identity pool.
- **E** ❌ Unauthenticated identities do not require sign-in, and the role grants access to the whole bucket. Users would not be limited to their own prefix.

User pools authenticate users (who you are); identity pools authorize access to AWS resources by issuing temporary credentials (what you can call in AWS). Combining them with a policy variable such as ${cognito-identity.amazonaws.com:sub} gives per-user S3 prefixes without servers or embedded keys.

</details>

### secure-1.1-09

_Amazon Cognito, Amazon API Gateway, AWS Lambda_

A company runs a web application whose backend is an Amazon API Gateway REST API that invokes AWS Lambda functions. Customers must be able to sign up with an email address and password or sign in with their Google accounts.

The company wants AWS to manage password policies, account recovery, and token issuance. Only signed-in customers may call the API.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Create an Amazon Cognito identity pool with Google as an identity provider. Configure the API methods to use IAM authorization.
- **B.** Store customer credentials in an Amazon DynamoDB table. Create a Lambda authorizer that validates passwords and Google tokens on every request to the API.
- **C.** Configure AWS IAM Identity Center with Google Workspace as an external identity provider. Configure the API methods to use IAM authorization.
- **D.** Create an Amazon Cognito user pool with Google configured as a social identity provider. Configure a Cognito user pool authorizer on the API methods.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ An identity pool issues AWS credentials for federated identities, but it is not a user directory. It provides no email and password sign-up, password policies, or account recovery.
- **B** ❌ This works, but the company would build and operate its own password storage, recovery, and token logic. That is far more overhead than a managed user directory.
- **C** ❌ IAM Identity Center provides workforce access to AWS accounts and applications. It is not designed for customer sign-up to a public web application, and customers without Google accounts could not sign up.
- **D** ✅ A user pool provides managed sign-up, password policies, account recovery, and federation with Google. API Gateway validates the user pool tokens natively, so no custom code is needed.

For customer sign-up and sign-in, including social providers, use a Cognito user pool, and protect a REST API with a Cognito user pool authorizer. Identity pools exchange identities for AWS credentials but do not store users. IAM Identity Center serves the workforce, not customers.

</details>

### secure-1.1-10

_AWS IAM Identity Center, AWS Organizations_

A company has 40 AWS accounts in AWS Organizations. Employees authenticate with Microsoft Entra ID. Each AWS account has its own IAM users, so employees keep a separate password for every account.

The company wants employees to use their existing Entra ID credentials to sign in to any account they are authorized for. Access must be managed centrally, and disabling a user in Entra ID must remove that user's AWS access automatically.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Create an IAM SAML identity provider for Entra ID in each account. Create IAM roles in each account that trust the provider, and map Entra ID groups to the roles.
- **B.** Enable IAM Identity Center for the organization. Connect Entra ID as the external identity provider with SAML and automatic SCIM provisioning, and assign groups to accounts with permission sets.
- **C.** Create IAM users for all employees in a central identity account. Create roles in each member account that trust the identity account, and synchronize passwords from Entra ID with a scheduled script.
- **D.** Create an Amazon Cognito user pool that is federated with Entra ID. Use a Cognito identity pool to issue role credentials for each account.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ SAML federation per account works, but the company must create and maintain identity providers and roles in all 40 accounts. Access is not managed from one place.
- **B** ✅ IAM Identity Center gives single sign-on to every account in the organization from one place. SCIM keeps users and groups synchronized, so disabling a user in Entra ID removes access, and permission sets are provisioned to accounts automatically.
- **C** ❌ This keeps IAM users with their own passwords and requires custom synchronization. Employees do not sign in with their Entra ID credentials, and deprovisioning depends on the script.
- **D** ❌ Cognito is designed for customer identities in applications. It does not provide workforce single sign-on to the AWS Management Console across accounts.

IAM Identity Center is the recommended way to give a workforce single sign-on across the accounts in an organization. Connect an external IdP with SAML and SCIM, and assign access with permission sets. Per-account IAM SAML federation also works but multiplies the operational work.

</details>

### secure-1.1-11

_AWS IAM Identity Center, AWS Directory Service_

A company has 15 AWS accounts in AWS Organizations and a self-managed Active Directory in its on-premises data center. The data center connects to AWS through AWS Direct Connect.

The company wants employees to sign in to the AWS accounts with their existing Active Directory credentials and to manage access by AD group. The company does not want to copy the directory to AWS or to operate additional domain controllers.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Deploy AD Connector in a VPC and point it to the on-premises domain controllers. Enable IAM Identity Center and choose the AD Connector directory as the identity source.
- **B.** Deploy AWS Managed Microsoft AD and create a two-way forest trust with the on-premises domain. Choose AWS Managed Microsoft AD as the IAM Identity Center identity source.
- **C.** Deploy Simple AD and import the users and groups from the on-premises directory. Choose Simple AD as the IAM Identity Center identity source.
- **D.** Use the IAM Identity Center directory as the identity source. Create users and groups in it that match the on-premises Active Directory.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ AD Connector is a proxy that forwards authentication requests to the on-premises directory without caching or replicating it. IAM Identity Center can use it as an identity source and assign permission sets to AD groups.
- **B** ❌ This works, but it adds a second directory with its own domain controllers in AWS and a trust to maintain. The company wanted no additional domain controllers.
- **C** ❌ Simple AD is a standalone directory that cannot connect to or trust an on-premises domain, so users and passwords would have to be copied. IAM Identity Center also does not support Simple AD as an identity source.
- **D** ❌ Users would have separate Identity Center passwords, not their existing AD credentials, and the company would maintain the users and groups twice.

To use an existing on-premises AD with AWS without replicating it, use AD Connector as a proxy. AWS Managed Microsoft AD with a trust is the choice when AWS workloads need a real directory in AWS, at the cost of running extra domain controllers. Simple AD cannot integrate with on-premises AD.

</details>

### secure-1.1-12

_IAM, AWS STS, Amazon EC2_

A small company uses a single AWS account that is not part of an organization. Operators sign in to the console as IAM users and also run AWS CLI commands with access keys.

The company wants to require MFA before any operator can stop or terminate Amazon EC2 instances, whether the request comes from the console or the CLI. Other actions must keep working without MFA.

Which solution will meet these requirements?

- **A.** Assign a virtual MFA device to every operator's IAM user so that operators must enter an MFA code when they sign in.
- **B.** Create an SCP that denies ec2:StopInstances and ec2:TerminateInstances when aws:MultiFactorAuthPresent is false or absent. Attach the SCP to the account.
- **C.** Attach a group policy that denies EC2 stop and terminate actions when aws:MultiFactorAuthPresent is false or absent. Have CLI users call sts:GetSessionToken with an MFA code.
- **D.** Move the operators from IAM users to IAM Identity Center users, and configure Identity Center to require MFA every time an operator signs in.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ An assigned MFA device is enforced at console sign-in, but CLI requests signed with access keys do not require MFA. It also affects every console action, not only stopping and terminating instances.
- **B** ❌ The condition is correct, but SCPs require AWS Organizations. The account is not part of an organization, so an SCP cannot be applied.
- **C** ✅ The deny statement with the MFA condition key blocks only the two actions unless the request was authenticated with MFA. Console sessions with MFA and CLI sessions from GetSessionToken with an MFA code both carry the key, so both paths are covered.
- **D** ❌ A standalone account can use only an account instance of IAM Identity Center, which cannot manage access to AWS accounts. Identity Center MFA would also apply to every sign-in, not only to stopping and terminating instances.

To require MFA for specific actions, use an IAM policy with the aws:MultiFactorAuthPresent condition key (BoolIfExists, so that requests made with long-term access keys are also denied). CLI users get MFA-authenticated temporary credentials from sts:GetSessionToken. Assigning an MFA device protects console sign-in only.

</details>

### secure-1.1-13

_IAM, AWS Organizations_

A startup created an AWS account and later made it the management account of a new organization in AWS Organizations. The founders use the root user for daily administration. The root user also has an access key that a deployment script uses.

A security review asks the company to protect the root user according to AWS best practices.

Which combination of steps should the company take? (Choose TWO.)

- **A.** Keep the root user access key for the script. Attach an IAM policy to the root user that limits it to the actions that the script needs.
- **B.** Delete the root user access key. Update the deployment script to use an IAM role with only the permissions the script needs.
- **C.** Attach an SCP to the organization root that denies all actions by the root user.
- **D.** Enable MFA on the root user. Use IAM Identity Center users for daily administration, and use the root user only for tasks that require it.
- **E.** Enable centralized root access management in IAM. Delete the root user credentials of the management account, and run root tasks as privileged sessions.

<details><summary>Answer</summary>

**Correct: B, D**

- **A** ❌ IAM policies cannot be attached to the root user, so the key keeps unrestricted access to the account. AWS recommends that the root user have no access keys at all.
- **B** ✅ Removing the root access key eliminates the most dangerous long-term credential in the account. A role gives the script temporary, least-privilege credentials.
- **C** ❌ SCPs do not apply to the management account, so this SCP would not restrict the root user of this account.
- **D** ✅ MFA protects the root sign-in. Individual Identity Center users for daily work mean the most privileged credential is used only for the few tasks that require it.
- **E** ❌ Centralized root access management removes root credentials only from member accounts. It cannot delete the root credentials of the management account, which must be protected directly.

Root user best practice: no access keys, MFA on the root sign-in, and individual non-root identities for everyday work. Neither SCPs nor centralized root access management apply to the management account, so its root user must be secured directly.

</details>

### secure-1.1-14

_IAM, AWS Organizations_

A company has 200 member accounts in AWS Organizations, and an automated account vending process creates more each month. Root user passwords were set for many member accounts when the accounts were created.

The security team wants to remove long-term root user credentials from all member accounts and prevent anyone from recovering them. The team must still be able to perform the rare tasks that require root, such as deleting a misconfigured S3 bucket policy that denies all principals.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Enable a hardware MFA device on the root user of every member account, including new accounts. Store all of the devices in a locked safe in the security team's office.
- **B.** Attach an SCP to the organization root that denies all actions by the root user in every member account of the organization.
- **C.** Run a script that resets each member account's root password to a random value and then discards the value.
- **D.** Enable centralized root access management in IAM. Delete the member accounts' root credentials, and run privileged root tasks from the management account.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ MFA protects the root credentials but does not remove them, and the team must register and store a device for each of 200+ accounts, including every new one.
- **B** ❌ An SCP limits what the member account root users can do, but the long-term root credentials still exist and can still be recovered through the password reset process.
- **C** ❌ The root user can still recover access through the email-based password reset. The script must also be rerun for every new account.
- **D** ✅ Centralized root access lets the security team remove root credentials from member accounts, blocks recovery, and creates new accounts without root credentials. Root-only tasks run as short-lived privileged sessions that are started centrally.

Centralized root access management in IAM, used with AWS Organizations, removes member account root credentials at scale and replaces them with short-term privileged root sessions started from the management account or a delegated administrator. SCPs restrict root actions but leave the credentials in place.

</details>

### secure-1.1-15

_IAM, AWS STS_

A company subscribes to a third-party SaaS cost-monitoring service. The vendor needs read-only access to the company's billing data and Amazon EC2 metadata. The vendor serves thousands of customers from its own AWS account and asks each customer for the ARN of an IAM role that the vendor will assume.

The company wants to ensure that another vendor customer cannot trick the vendor into accessing the company's account by supplying the company's role ARN.

Which solution will meet these requirements?

- **A.** Create a read-only role whose trust policy allows the vendor's account to assume it only with the external ID that the vendor assigned to the company.
- **B.** Create a read-only role whose trust policy allows the vendor's AWS account to assume it. Provide the role ARN to the vendor.
- **C.** Create an IAM user with read-only permissions. Give the user's access keys to the vendor, and rotate the keys every 90 days through a scheduled process.
- **D.** Create a read-only role whose trust policy allows the vendor's account to assume it only when aws:MultiFactorAuthPresent is true.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ The external ID is a value that the vendor generates for each customer and sends with every AssumeRole call. A request made on behalf of another customer carries a different external ID and fails, which prevents the confused deputy problem.
- **B** ❌ This grants least-privilege cross-account access, but any request from the vendor's account succeeds, including one made for another customer who supplied this role ARN. This is the confused deputy problem.
- **C** ❌ This shares long-term credentials with a third party, which AWS discourages. Cross-account access should use a role.
- **D** ❌ The vendor's automated service cannot provide MFA for every call, and MFA does not tell the company which customer the vendor is acting for. It does not address the confused deputy problem.

When a third party assumes roles in many customers' accounts, require an external ID in the trust policy to prevent the confused deputy problem. Roles, not shared IAM user keys, are the correct mechanism for cross-account access.

</details>

### secure-1.1-16

_IAM Roles Anywhere, Amazon S3_

A company runs a batch application on servers in its on-premises data center. The application uploads results to Amazon S3 by using an IAM user access key that has not been rotated in 2 years. The company already runs a private certificate authority (CA) that issues X.509 certificates to its servers.

The company wants the application to use short-lived AWS credentials without storing long-term AWS secrets on the servers.

Which solution will meet these requirements?

- **A.** Store the IAM user access key in AWS Secrets Manager. Configure the application to retrieve the key from Secrets Manager at runtime.
- **B.** Configure IAM Roles Anywhere with the company's CA as a trust anchor. Have the application exchange its server certificate for temporary role credentials.
- **C.** Configure IAM Identity Center in the account. Have the application sign in as a dedicated Identity Center user to get temporary credentials for a permission set.
- **D.** Rotate the IAM user access key every 30 days with a scheduled script. Store the key encrypted on the servers.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ The servers still need AWS credentials to call Secrets Manager, and the retrieved key is still a long-term IAM user key. Neither requirement is met.
- **B** ✅ IAM Roles Anywhere lets workloads outside AWS exchange an X.509 certificate from a trusted CA for temporary role credentials. No long-term AWS secret is stored on the servers.
- **C** ❌ IAM Identity Center is designed for interactive human sign-in. A service user would need a stored password and MFA, which is a long-term secret on the servers.
- **D** ❌ Frequent rotation reduces risk, but the key is still a long-term AWS secret stored on the servers.

IAM Roles Anywhere extends IAM roles to servers outside AWS: a certificate from a registered trust anchor is exchanged for temporary STS credentials. Remember the pairing: instance profiles for EC2, Roles Anywhere for on-premises workloads that have certificates, IAM Identity Center for people.

</details>

### secure-1.1-17

_AWS Lambda, Amazon S3, IAM_

A developer configures an S3 event notification on a bucket to invoke an AWS Lambda function when objects are created. The bucket and the function are in the same account. The function's execution role already allows reads from the bucket.

When the developer saves the notification configuration, the request fails with an error that the destination configuration cannot be validated.

What should a solutions architect do to resolve the issue while following the principle of least privilege?

- **A.** Add lambda:InvokeFunction for the function to the function's execution role.
- **B.** Add a statement to the bucket policy that allows the s3.amazonaws.com service principal to perform lambda:InvokeFunction on the function.
- **C.** Add a statement to the function's resource-based policy that allows the s3.amazonaws.com principal to invoke it from any bucket in any account.
- **D.** Add a statement to the function's resource-based policy that allows the s3.amazonaws.com principal to invoke it, conditioned on the bucket ARN and account ID.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ The execution role defines what the function can do when it runs. It does not control who can invoke the function, so Amazon S3 is still not allowed to call it.
- **B** ❌ A bucket policy controls access to the bucket and its objects. It cannot grant permission to invoke a Lambda function.
- **C** ❌ This fixes the error, but any bucket in any account could configure notifications that invoke the function. It is broader than necessary.
- **D** ✅ Amazon S3 needs permission in the function's resource-based policy to invoke it. The aws:SourceArn and aws:SourceAccount conditions restrict the permission to this one bucket in this account.

Push-style integrations such as S3 event notifications need permission in the Lambda function's resource-based policy, not in its execution role. Scope service principal grants with aws:SourceArn and aws:SourceAccount to keep least privilege and prevent the confused deputy problem.

</details>

### secure-1.1-18

_IAM, Amazon EC2_

A company has 30 development teams that share one AWS account. Developers must be able to start, stop, and reboot only the Amazon EC2 instances that belong to their own team. Every instance has a project tag. Developers federate from the corporate identity provider into an IAM role, and each session carries a project session tag.

New teams are formed every month, and the security team does not want to change IAM policies when that happens.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Create an IAM policy for each team that lists the ARNs of the team's instances. Update the policy whenever the team launches or terminates instances.
- **B.** Create a role for each team with a policy that allows the actions when ec2:ResourceTag/project equals that team's project name.
- **C.** Create one policy that allows the actions when ec2:ResourceTag/project equals ${aws:PrincipalTag/project}. Attach the policy to the role that developers assume.
- **D.** Create a separate AWS account for each team. Grant each team's developers full Amazon EC2 access in their own account through a federated IAM role.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Resource ARN lists restrict access correctly, but policies must change for every instance and every new team. This is the most operational overhead.
- **B** ❌ Tag conditions work, but the project name is hard-coded, so every new team needs a new role and policy. The requirement to avoid policy changes is not met.
- **C** ✅ This is attribute-based access control (ABAC). The policy compares the instance tag with the session tag, so one policy serves every current and future team with no changes.
- **D** ❌ Separate accounts give strong isolation, but creating and governing a new account every month is more overhead, and full EC2 access exceeds start, stop, and reboot.

ABAC scales permissions by matching principal tags with resource tags, so new teams need only tags, not policy edits. Role-based access control with hard-coded values or ARN lists requires a policy change for every new team or resource.

</details>

### secure-1.1-19

_IAM, Amazon SQS_

An administrator set a permissions boundary on a developer's IAM role. The boundary allows all Amazon S3 and Amazon DynamoDB actions. The role's identity-based policy allows all Amazon S3 and Amazon SQS actions. The account's SCPs allow all actions.

The developer reports that sqs:SendMessage requests fail with AccessDenied. The security team wants the developer to be able to send messages to one specific queue only, and the permissions boundary must stay in place.

Which solution will meet these requirements?

- **A.** Attach the AmazonSQSFullAccess AWS managed policy to the developer's role in addition to the existing identity-based policy.
- **B.** Add sqs:SendMessage on the queue ARN to the permissions boundary. Limit the identity-based policy's SQS statement to that action on the same queue.
- **C.** Create an SCP that explicitly allows sqs:SendMessage on the queue ARN, and attach the SCP directly to the developer's account.
- **D.** Remove the permissions boundary from the developer's role. Limit the SQS statement in the role's identity-based policy to sqs:SendMessage on the queue.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ The identity-based policy already allows SQS actions. The boundary does not include SQS, so effective permissions are unchanged, and full access exceeds one queue.
- **B** ✅ Effective permissions are the intersection of the boundary and the identity-based policy. Adding the action to the boundary and narrowing the identity-based policy allows exactly one action on one queue.
- **C** ❌ SCPs already allow all actions, and SCPs never grant permissions. The boundary still blocks SQS.
- **D** ❌ This grants the access, but it violates the requirement to keep the permissions boundary in place.

An action is allowed only if every applicable layer allows it: SCPs, permissions boundary, and identity-based policy. The request failed because the boundary does not include SQS, so the fix must add the action to the boundary while the identity-based policy keeps it scoped to one queue.

</details>

### secure-1.1-20

_AWS Organizations, Amazon EC2, AWS Config_

A company uses AWS Organizations with all features enabled. The finance team requires every new Amazon EC2 instance and Amazon EBS volume in member accounts to have a CostCenter tag when it is created. Requests that omit the tag must fail. A tag policy already standardizes the allowed CostCenter values.

Which solution will meet these requirements?

- **A.** Create an SCP that denies ec2:RunInstances and ec2:CreateVolume when aws:RequestTag/CostCenter is null. Attach the SCP to the member account OUs.
- **B.** Turn on tag policy enforcement for the CostCenter tag on EC2 instances and volumes so that noncompliant requests are rejected.
- **C.** Deploy the AWS Config required-tags managed rule to all member accounts by using an organization conformance pack.
- **D.** Activate CostCenter as a cost allocation tag in the management account so that untagged costs are visible in billing reports.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ An SCP with a Null condition on aws:RequestTag/CostCenter rejects any create request that does not include the tag, in every member account. This is the preventive control the requirement asks for.
- **B** ❌ Tag policy enforcement rejects tag values that do not comply when the tag is supplied. It does not reject console or API requests that omit the tag, so untagged resources can still be created.
- **C** ❌ AWS Config evaluates resources after they are created and reports them as noncompliant. It does not make the create request fail.
- **D** ❌ Cost allocation tags make tags visible in billing reports. They do not enforce tagging.

Tag policies standardize tag keys and values; SCPs (or IAM policies) with aws:RequestTag conditions prevent creating untagged resources. AWS Config only detects noncompliance after the fact.

</details>

### secure-1.1-21

_AWS Control Tower, AWS Organizations_

A company is moving from a single AWS account to many accounts. Logs from every account must be stored centrally where workload teams cannot alter them, and a security team needs read access to all accounts. Every new account must start with the same set of preventive and detective controls.

Teams must be able to create accounts without opening a ticket. The company has a small cloud team and wants to write as little custom code as possible.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Create an organization in AWS Organizations. Write SCPs and AWS Config rules, deploy them with AWS CloudFormation StackSets, and build an account request workflow with AWS Step Functions.
- **B.** Set up AWS Control Tower. Enable the required controls on the OUs, and have teams request new accounts through Account Factory.
- **C.** Create an organization in AWS Organizations with an organization trail. Deploy an AWS Config conformance pack to all accounts, and vend accounts through a Service Catalog product that calls CreateAccount.
- **D.** Use AWS Service Catalog to publish an AWS CloudFormation product that creates new accounts and deploys baseline resources into them.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ This can produce the same result, but the team must design, build, and maintain the landing zone, the guardrails, and the account vending workflow itself. That is the most custom work.
- **B** ✅ Control Tower sets up a landing zone with log archive and audit accounts, applies preventive and detective controls to OUs, and enrolls accounts created through Account Factory automatically. No custom code is needed.
- **C** ❌ The trail and conformance pack provide central logging and detective rules, but there are no preventive controls, and the team must build and maintain the account vending product and its baseline itself.
- **D** ❌ Service Catalog can offer self-service products, but it does not set up a landing zone or apply guardrails across OUs. The team would still build those parts itself.

AWS Control Tower is the managed way to set up and govern a multi-account landing zone: shared log archive and audit accounts, preventive (SCP-based) and detective (Config-based) controls, and Account Factory for vending accounts. Building the same thing from Organizations, StackSets, and custom workflows is possible but carries more overhead.

</details>

### secure-1.1-22

_AWS Organizations, IAM_

A company uses AWS Organizations. Each member account contains an IAM role named SecurityAuditRole that the central security team assumes from its tooling account. Member account administrators have full administrator access in their own accounts.

Recently an administrator changed the trust policy of SecurityAuditRole, which broke the security team's access. The company wants to prevent every principal in the member accounts from modifying or deleting the role, except an automation role named OrgBaselineRole that deploys the role.

Which solution will meet these requirements?

- **A.** Attach a permissions boundary that denies changes to SecurityAuditRole to every administrator role in each of the member accounts.
- **B.** Add a statement to the trust policy of SecurityAuditRole that denies all principals in the member account permission to modify the role.
- **C.** Create an SCP that denies IAM actions that modify or delete SecurityAuditRole unless aws:PrincipalArn is OrgBaselineRole. Attach it to the member OUs.
- **D.** Deploy an AWS Config rule in each member account that detects changes to SecurityAuditRole and automatically restores its configuration.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Administrators with full IAM access can remove the boundary from themselves or create new roles without it, so the protection can be bypassed.
- **B** ❌ A trust policy controls only who can assume the role. It cannot control who can edit or delete the role.
- **C** ✅ SCPs cannot be changed from inside member accounts and apply to every principal there, including administrators. The aws:PrincipalArn condition exempts only the automation role.
- **D** ❌ AWS Config reacts after the change. The security team loses access until remediation runs, so this does not prevent the change.

To protect baseline resources from member account administrators, use an SCP with a deny statement and an exception for the deployment role (aws:PrincipalArn). Permissions boundaries can be removed by administrators, trust policies govern only role assumption, and AWS Config only detects.

</details>

### secure-1.1-23

_Amazon S3, AWS Organizations_

A company shares a reference dataset in an Amazon S3 bucket with all the accounts in its organization in AWS Organizations. The organization has 120 accounts, and new accounts are added every week.

Any IAM principal in the organization whose own account grants it access must be able to read the objects. Principals outside the organization must not have access.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Add each account ID as a principal in the bucket policy with s3:GetObject access. Update the bucket policy when new accounts join the organization.
- **B.** Create an IAM role with read access in the bucket owner's account. Add each account ID to the role's trust policy, and have principals assume the role.
- **C.** Share the bucket with the organization by using AWS Resource Access Manager (AWS RAM).
- **D.** Add a bucket policy statement that allows s3:GetObject for all principals when aws:PrincipalOrgID equals the organization ID.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ This grants the right access, but the policy must be edited every week as accounts join, and bucket policies have a size limit.
- **B** ❌ The trust policy must be updated for every new account, and every consumer must change its code to assume the role. This is more overhead than a single bucket policy statement.
- **C** ❌ AWS RAM does not support sharing S3 buckets. Cross-account bucket access is granted with bucket policies or access points.
- **D** ✅ The aws:PrincipalOrgID condition matches any principal in any current or future account in the organization, so the policy never needs updating. Principals outside the organization are not allowed.

Use the aws:PrincipalOrgID condition key in resource-based policies to grant access to an entire organization without listing accounts. Each principal still needs an identity-based allow from its own account, which matches the requirement.

</details>

### secure-1.1-24

_IAM_

A company has three IAM groups in one AWS account: Developers, Testers, and Support. In addition to their group-specific permissions, all three groups need the same read access to four Amazon CloudWatch Logs log groups and one Amazon S3 bucket.

The security team wants the shared permissions defined once and changed in one place. Staff must be able to use the shared and group-specific permissions in the same session, and new staff must receive the shared permissions when they are added to a group.

Which solution will meet these requirements?

- **A.** Create a customer managed policy that grants read access to the four log groups and the bucket. Attach the policy to the three groups.
- **B.** Create a customer managed policy that grants read access to the four log groups and the bucket. Set it as the permissions boundary of each user in the three groups.
- **C.** Create an IAM role with a policy that grants read access to the four log groups and the bucket. Allow the three groups to assume the role.
- **D.** Add statements to the S3 bucket policy and to a CloudWatch Logs resource policy that grant read access to the three IAM groups as principals.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ A customer managed policy is defined once, is versioned, and can be attached to several groups. Members inherit it from the group in their own session, so new staff get access when they join a group.
- **B** ❌ A permissions boundary only limits the maximum permissions and grants nothing. Boundaries are also set per user, so new staff would not receive it from their group.
- **C** ❌ The role is defined once, but users must switch to it, and a role session has only the role's permissions. Staff could not use their group-specific permissions in the same session.
- **D** ❌ An IAM group is not a principal, so it cannot be named in a resource-based policy. The shared access would also be split across several policies instead of one place.

Attach shared permissions to groups as a customer managed policy: it is defined once, versioned, and inherited by every member. Permissions boundaries grant nothing, assuming a role replaces the user's permissions for that session, and IAM groups cannot be principals in resource-based policies.

</details>

### secure-1.1-25

_IAM Access Analyzer, AWS CloudTrail, IAM_

A company's data pipeline runs under an IAM role that has the AdministratorAccess policy attached. The pipeline has run in production for 3 months, and an AWS CloudTrail trail records the account's management events.

The security team wants to replace AdministratorAccess with a least-privilege policy based on the actions that the pipeline actually performs.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Download the IAM credential report for the account. Remove permissions for the services that the report shows the role has not used.
- **B.** Use IAM Access Analyzer to generate a policy from the role's CloudTrail activity. Review the generated policy, and replace AdministratorAccess with it.
- **C.** Query the CloudTrail logs with Amazon Athena to list the API calls made by the role. Write a new least-privilege policy by hand from the query results.
- **D.** Turn on AWS Config recording for IAM resources. Use the role's configuration timeline to identify the permissions the pipeline uses.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ The credential report lists IAM users and the status of their passwords, access keys, and MFA devices. It contains no information about the actions a role performs.
- **B** ✅ Access Analyzer policy generation analyzes up to 90 days of the trail and produces a policy template with the services and actions that the role used. The team reviews it, adding resource ARNs and any data-event actions, which are not identified.
- **C** ❌ This produces a least-privilege policy, but the team must build the queries and write the policy manually. Access Analyzer does the same work automatically.
- **D** ❌ AWS Config records configuration changes to the role and its policies, not the API calls the role makes. It cannot show which permissions are actually used.

IAM Access Analyzer can generate a least-privilege policy from a principal's CloudTrail activity, which is the fastest way to right-size an over-permissive role. The credential report covers IAM users' credentials, and AWS Config tracks configuration, not usage.

</details>

### secure-1.1-26

_IAM Access Analyzer, AWS Organizations_

A company has 80 accounts in AWS Organizations. The security team must identify every S3 bucket, KMS key, IAM role trust policy, and Lambda function policy that grants access to principals outside the organization. The team must be notified on an ongoing basis whenever a new policy of this kind is created.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Create an organization-wide IAM Access Analyzer external access analyzer in a delegated administrator account. Route findings to the team with Amazon EventBridge.
- **B.** Enable Amazon Macie in all accounts through a delegated administrator account. Route Macie findings to the security team with Amazon EventBridge.
- **C.** Enable Amazon GuardDuty in all accounts through a delegated administrator account. Route GuardDuty findings to the security team with Amazon EventBridge.
- **D.** Schedule an AWS Lambda function that assumes a role in each account, reads every resource-based policy, and reports any principals outside the organization.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ Access Analyzer evaluates resource-based policies on buckets, KMS keys, role trust policies, Lambda functions, and more, and creates a finding for any access from outside the zone of trust. Findings update continuously and are published to EventBridge.
- **B** ❌ Macie discovers sensitive data in S3 and reports bucket-level exposure. It does not analyze KMS key policies, role trust policies, or Lambda function policies.
- **C** ❌ GuardDuty detects threats from logs and network activity. It does not evaluate resource policies for external access.
- **D** ❌ This could work, but the team must write and maintain policy-parsing code for every resource type. A managed analyzer does this with no code.

IAM Access Analyzer external access analysis, with the organization as the zone of trust, finds resources that are shared outside the organization across many resource types. Macie focuses on sensitive data in S3, and GuardDuty on threat detection.

</details>

### secure-1.1-27

_IAM, AWS STS, AWS CodePipeline, AWS CloudFormation_

A company runs AWS CodePipeline in a tooling account. The pipeline's deploy stage runs with an IAM role named PipelineRole and must deploy AWS CloudFormation stacks into a production account.

The company does not allow long-term credentials. The production account team wants to control which permissions the pipeline has in the production account.

Which combination of steps will meet these requirements? (Choose TWO.)

- **A.** In the production account, create a deployment role with the required permissions and a trust policy that allows PipelineRole to assume it.
- **B.** In the tooling account, create a deployment role with the required production permissions. Add the production account to its trust policy.
- **C.** In the production account, create an IAM user with deployment permissions. Store its access keys in AWS Secrets Manager in the tooling account.
- **D.** Add a statement to the identity-based policy of PipelineRole that allows sts:AssumeRole on the ARN of the production deployment role.
- **E.** Add the PipelineRole ARN to the permissions boundary of the production deployment role.

<details><summary>Answer</summary>

**Correct: A, D**

- **A** ✅ The role lives in the account that owns the resources, so the production team controls its permissions. The trust policy names the pipeline role as the only principal that can assume it.
- **B** ❌ Permissions in a tooling account role cannot act on resources in the production account. The role must be created in the production account.
- **C** ❌ Access keys are long-term credentials, which the company does not allow.
- **D** ✅ For cross-account role assumption, the caller's account must also allow sts:AssumeRole on the target role. Both the trust policy and this permission are required.
- **E** ❌ A permissions boundary limits what the deployment role can do. It does not control who can assume the role and grants nothing to PipelineRole.

Cross-account role assumption needs two sides: a role in the target account whose trust policy names the caller, and an sts:AssumeRole permission in the caller's identity-based policy. Placing the role in the target account keeps that account in control of the permissions.

</details>

### secure-1.1-28

_IAM, AWS STS, Amazon EC2_

A security engineer discovers that temporary credentials for an IAM role used by a fleet of Amazon EC2 instances were published in a public code repository. The credentials remain valid for another 6 hours.

The engineer must invalidate the exposed credentials immediately. The application on the instances must keep using the same role after the instances receive new credentials.

Which solution will meet these requirements?

- **A.** Delete the role. Create a new role with the same permissions, and associate it with the instances.
- **B.** Remove the role from the instance profile, and then add the role back to the instance profile.
- **C.** Detach all permissions policies from the role until the exposed credentials expire.
- **D.** Use the revoke active sessions option for the role in the IAM console.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ This disrupts the application and requires re-associating instance profiles across the fleet. The application would no longer use the same role.
- **B** ❌ Changing the instance profile does not invalidate credentials that AWS STS already issued. The exposed credentials stay valid until they expire in 6 hours.
- **C** ❌ This blocks the exposed credentials, but it also blocks the application for the next 6 hours, because new credentials would have no permissions either.
- **D** ✅ Revoking sessions attaches a policy that denies all actions to credentials issued before the current time. Credentials issued later, including the instances' refreshed credentials, keep working with the role.

Temporary role credentials cannot be deleted, but they can be invalidated by revoking active sessions, which denies any session token issued before a given time (aws:TokenIssueTime). New sessions for the same role keep working; instances may see AccessDenied briefly until the instance metadata service delivers refreshed credentials.

</details>

### secure-1.1-29

_Amazon Cognito, Amazon Kinesis Data Streams, IAM_

A gaming company has a mobile game that sends gameplay telemetry records to an Amazon Kinesis data stream. Players can play without creating an account, and the company needs telemetry from all players, including players who never sign in.

The app must not contain embedded AWS credentials. Each device must be limited to kinesis:PutRecord on the single stream.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Create an Amazon Cognito user pool. Require every player to sign up before playing, and send telemetry only from signed-in players.
- **B.** Create an IAM user whose policy allows only kinesis:PutRecord on the stream. Embed the user's access keys in the app's configuration.
- **C.** Create an Amazon Cognito identity pool with guest access turned on. Give the unauthenticated role permission for only kinesis:PutRecord on the stream.
- **D.** Deploy an API on Amazon EC2 instances that receives telemetry from the app and writes the records to the stream by using an instance profile role.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ This changes the product so that players must create an account, and a user pool alone does not issue AWS credentials for calling Kinesis.
- **B** ❌ The permissions are narrow, but embedded long-term keys can be extracted from the app, which the requirements forbid.
- **C** ✅ An identity pool issues temporary, limited AWS credentials to anonymous guest users. The unauthenticated role restricts every device to one action on one stream, and no servers are needed.
- **D** ❌ This keeps credentials off the device, but the company must run and scale a server fleet. That is more overhead than issuing guest credentials.

Cognito identity pools support unauthenticated (guest) identities that receive temporary credentials for a tightly scoped role. Use them when anonymous users must call AWS services directly. User pools handle sign-in but do not issue AWS credentials on their own.

</details>

### secure-1.1-30

_IAM, Amazon EC2_

A developer must launch Amazon EC2 instances that use an existing IAM role named AppRole through its instance profile. The developer has permission for ec2:RunInstances, but launch requests that specify the instance profile fail with an authorization error for iam:PassRole.

Some roles in the account have administrative permissions. The security team wants to ensure that the developer cannot attach any other role to instances.

Which policy change will meet these requirements?

- **A.** Allow iam:PassRole on all resources for the developer.
- **B.** Allow iam:PassRole on the AppRole ARN for the developer, with an iam:PassedToService condition of ec2.amazonaws.com.
- **C.** Allow sts:AssumeRole on the AppRole ARN for the developer.
- **D.** Allow iam:CreateRole and iam:AddRoleToInstanceProfile so that the developer can create a role with the same permissions as AppRole.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ This fixes the error, but the developer could then pass an administrative role to an instance and use it to escalate privileges.
- **B** ✅ Scoping iam:PassRole to one role ARN, and only to Amazon EC2, lets the developer launch instances with AppRole and no other role.
- **C** ❌ Assuming a role gives the developer the role's permissions directly, which is not needed. It does not allow passing the role to EC2, so the launch still fails.
- **D** ❌ The developer would still need iam:PassRole for the new role, and the ability to create roles opens a path to privilege escalation.

Passing a role to a service requires iam:PassRole, which should be scoped to specific role ARNs (and optionally a service with iam:PassedToService). PassRole on all resources is a common privilege escalation path. Passing a role is different from assuming it.

</details>

### secure-1.1-31

_AWS KMS, IAM_

An administrator created a customer managed AWS KMS key. The key policy has one statement, which grants all KMS permissions to the administrator's IAM user. Later, developers attached identity-based policies that allow kms:Encrypt and kms:Decrypt on the key to several application roles, but the roles receive AccessDenied errors.

The security team wants to manage future access to the key with IAM policies. The administrator must keep its current permissions on the key.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Attach the AWSKeyManagementServicePowerUser managed policy to the application roles.
- **B.** Create a KMS grant for each application role that allows kms:Encrypt and kms:Decrypt.
- **C.** Create a new customer managed key with the default key policy. Re-encrypt all data with the new key, and schedule the old key for deletion.
- **D.** Add a statement to the key policy that allows all KMS actions for the account principal (arn:aws:iam::111122223333:root).

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ This is another identity-based policy. The key policy does not allow IAM policies to grant access to the key, so the roles are still denied.
- **B** ❌ Grants would let the current roles use the key, but future access would be managed through grants instead of IAM policies, which does not meet the requirement.
- **C** ❌ The default key policy enables IAM policies, but re-encrypting all existing data and updating every application to use a new key is far more work than editing the key policy.
- **D** ✅ Granting the account principal in the key policy delegates access control to IAM, so identity-based policies in the account can grant use of the key. The administrator's existing statement remains.

Unlike most AWS resources, a KMS key is accessible only if its key policy allows it. IAM policies take effect only when the key policy includes a statement for the account principal, which the default key policy contains. Grants are an alternative for granting access to specific principals, not a way to enable IAM policies.

</details>

### secure-1.1-32

_AWS Organizations_

A company uses AWS Organizations. The Sandbox OU contains 25 accounts that are used for experiments. The default FullAWSAccess SCP is attached to the organization root, to the Sandbox OU, and to every account.

The company wants all principals in the Sandbox accounts to be able to use only Amazon EC2, Amazon S3, and AWS Lambda. The restriction must also cover services that AWS launches in the future.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Attach an additional SCP to the Sandbox OU that allows only Amazon EC2, Amazon S3, and AWS Lambda actions.
- **B.** Attach an SCP to the Sandbox OU that denies the actions of every other AWS service, listing each service by name.
- **C.** Detach FullAWSAccess from the Sandbox OU. Attach an SCP to the Sandbox OU that allows only Amazon EC2, Amazon S3, and AWS Lambda actions.
- **D.** Create a permissions boundary that allows only Amazon EC2, Amazon S3, and AWS Lambda actions. Attach it to every IAM user and role in the Sandbox accounts.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ SCP allows at one level are combined. Because FullAWSAccess is still attached to the Sandbox OU, every service remains allowed and the new SCP has no effect.
- **B** ❌ A deny list works only for the services that are listed. New services are allowed until someone adds them, so the policy needs constant maintenance.
- **C** ✅ With an allow-list SCP as the only SCP on the OU, every account in the OU can use only the three services. Any service that is not listed, including future services, is implicitly denied.
- **D** ❌ Boundaries must be attached to every principal, including new ones, and account administrators can remove them. This is neither complete nor low overhead.

An allow-list SCP strategy replaces FullAWSAccess with an SCP that allows only approved services, so anything unlisted, including new services, is denied. An action must be allowed by an SCP at every level from the root to the account, so an extra allow SCP next to FullAWSAccess restricts nothing.

</details>

### secure-1.1-33

_IAM, AWS STS_

A company deploys infrastructure from GitHub Actions workflows in a repository named example-org/infra. The workflows authenticate to AWS with an IAM user access key that is stored as a GitHub secret.

The company wants to remove long-term AWS credentials from GitHub. Only workflows that run on the main branch of that repository may obtain credentials for the deployment role.

Which combination of steps will meet these requirements? (Choose TWO.)

- **A.** Store the access key in AWS Secrets Manager. Configure the workflow to retrieve the key from Secrets Manager at runtime.
- **B.** Create an IAM OIDC identity provider in the account for the GitHub Actions token issuer (token.actions.githubusercontent.com).
- **C.** Create the deployment role with a trust policy that allows sts:AssumeRoleWithWebIdentity from the GitHub OIDC provider when the aud claim is sts.amazonaws.com and the sub claim matches repo:example-org/*.
- **D.** Configure IAM Identity Center with GitHub as an external identity provider, and assign the workflow a permission set for the deployment account.
- **E.** Create the deployment role with a trust policy that allows sts:AssumeRoleWithWebIdentity from the GitHub OIDC provider when the aud claim is sts.amazonaws.com and the sub claim is repo:example-org/infra:ref:refs/heads/main.

<details><summary>Answer</summary>

**Correct: B, E**

- **A** ❌ The workflow would still need AWS credentials to call Secrets Manager, and the retrieved key is still a long-term credential.
- **B** ✅ The IAM OIDC identity provider lets AWS STS trust tokens issued by GitHub Actions, so workflows can exchange them for temporary role credentials.
- **C** ❌ The sub pattern limits the role to the example-org organization, but any repository and any branch in it could obtain credentials. Workflows outside the main branch of example-org/infra could assume the role.
- **D** ❌ IAM Identity Center provides interactive single sign-on for people. It does not issue credentials to CI/CD workflows from OIDC tokens.
- **E** ✅ The sub claim identifies the repository and branch that requested the token. Matching it in the trust policy limits the role to workflows from the main branch of this repository.

OIDC federation replaces stored keys in CI/CD: create an IAM OIDC identity provider and a role that trusts it through AssumeRoleWithWebIdentity. IAM requires a sub condition for the GitHub provider, and the sub value must name the exact repository and branch to restrict access to one workflow source.

</details>

### secure-1.1-34

_Amazon EKS, IAM, Amazon DynamoDB_

A company runs several microservices on an Amazon EKS cluster that uses managed node groups. One microservice needs to read and write items in a single Amazon DynamoDB table. Other microservices that run on the same nodes must not have access to the table.

The company wants to avoid storing AWS credentials in the cluster.

Which solution will meet these requirements?

- **A.** Add permissions for the DynamoDB table to the IAM role of the managed node group.
- **B.** Create an IAM user with access to the table. Store the user's access keys in a Kubernetes secret that is mounted only in the microservice's pods.
- **C.** Create an IAM role with access to the table. Associate the role with the microservice's Kubernetes service account by using EKS Pod Identity.
- **D.** Create an IAM role with access to the table. Set the role as the cluster IAM role of the EKS cluster.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Pods can use the node role through the instance metadata service, so every microservice on those nodes would get access to the table.
- **B** ❌ Access is limited to one microservice, but long-term credentials are stored in the cluster, which the company wants to avoid.
- **C** ✅ EKS Pod Identity delivers temporary credentials for the role only to pods that run under that service account. Other pods on the same nodes do not receive them.
- **D** ❌ The cluster IAM role is used by the Kubernetes control plane to manage AWS resources. Pods do not receive its permissions.

Give pods their own IAM permissions with EKS Pod Identity (or IAM roles for service accounts), which map a role to a Kubernetes service account. Permissions on the node role are shared by every pod on the node, which breaks least privilege.

</details>

### secure-1.1-35

_Amazon ECS, AWS Fargate, IAM, Amazon SNS_

A company runs a containerized order service on Amazon ECS with AWS Fargate. The service must publish messages to one Amazon SNS topic.

A developer added sns:Publish to the task execution role, but the application's calls to Amazon SNS fail with AccessDenied errors. Image pulls from Amazon ECR and log delivery to Amazon CloudWatch Logs work correctly.

Which solution will fix the errors while following the principle of least privilege?

- **A.** Change the sns:Publish statement in the task execution role so that it applies to all SNS topics in the account instead of one topic.
- **B.** Add a statement to the topic's access policy that allows the task execution role to publish to the topic.
- **C.** Move the service to the Amazon EC2 launch type. Add sns:Publish on the topic to the instance profile role of the container instances in the cluster.
- **D.** Create an IAM role with sns:Publish on the topic. Set it as the task role in the task definition, and remove sns:Publish from the execution role.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ The task execution role is used by the ECS agent to pull images and send logs. The application code never receives its credentials, so widening the statement does not help.
- **B** ❌ The application does not sign its requests with the task execution role's credentials, so a grant to that role still does not apply to the application's calls.
- **C** ❌ Containers could use the instance role, but every task on the instance would get the permission, and the company would have to manage EC2 instances.
- **D** ✅ The task role provides credentials to the application code in the containers. Scoping it to one topic and removing the unused permission from the execution role follows least privilege.

In Amazon ECS, the task role grants permissions to the application in the containers; the task execution role is used by ECS itself to pull images, fetch secrets, and send logs. Application permissions belong in the task role.

</details>

## Task 1.2

### secure-1.2-01

_Amazon VPC, Amazon Aurora, Amazon EC2 Auto Scaling_

A company runs a three-tier application in a VPC. The application tier runs on Amazon EC2 instances in an Auto Scaling group that scales in and out many times each day, so instance IP addresses change constantly. The database tier is an Amazon Aurora MySQL DB cluster in private subnets. The application tier subnets also host batch-processing instances that must not be able to connect to the database.

A solutions architect must ensure that the DB cluster accepts connections only from the application tier instances on port 3306.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Configure the network ACL of the database subnets to allow inbound TCP 3306 from the CIDR blocks of the application tier subnets and to deny all other inbound traffic.
- **B.** Add an inbound rule to the database security group that allows TCP 3306 from the CIDR blocks of the application tier subnets. Remove all other inbound rules.
- **C.** Add an inbound rule to the database security group that allows TCP 3306 from the security group of the application tier instances. Remove all other inbound rules.
- **D.** Use an Auto Scaling lifecycle hook to invoke an AWS Lambda function that adds and removes /32 rules for each application instance in the database security group.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Network ACLs filter by CIDR block at the subnet boundary. The batch-processing instances share the application subnets, so a subnet-level rule would still let them reach the database.
- **B** ❌ This restricts access to the correct port, but a CIDR-based rule matches every instance in those subnets, including the batch-processing instances that must be blocked.
- **C** ✅ A security group rule can reference another security group as its source. Only instances that carry the application tier security group can connect, regardless of their changing IP addresses, and no ongoing maintenance is needed.
- **D** ❌ This would restrict access to the application instances, but it requires custom code that must run on every scaling event and can hit the security group rule quota. It has far more operational overhead than referencing a security group.

Security groups can use another security group as a rule source, so membership in the application tier security group, not IP address, grants access. This handles constantly changing instance IPs with no maintenance and excludes other instances in the same subnets. CIDR-based rules in security groups or network ACLs cannot tell apart instances that share a subnet.

</details>

### secure-1.2-02

_Amazon VPC, Amazon EC2, AWS WAF_

A company hosts a public web application on Amazon EC2 instances that have Elastic IP addresses in a public subnet. There is no load balancer. The security group allows inbound HTTPS from 0.0.0.0/0, and the subnet uses a custom network ACL whose rule 100 allows all inbound HTTPS traffic.

The security team has identified malicious traffic from the 198.51.100.0/24 address range. The company must block this range immediately while all other internet users keep access to the application.

Which solution will meet these requirements?

- **A.** Add an inbound rule to the instances' security group that denies all traffic from 198.51.100.0/24.
- **B.** Create an AWS WAF web ACL with an IP set rule that blocks 198.51.100.0/24. Associate the web ACL with the EC2 instances.
- **C.** Add an inbound rule numbered 200 to the subnet's network ACL that denies all traffic from 198.51.100.0/24.
- **D.** Add an inbound rule numbered 50 to the subnet's network ACL that denies all traffic from 198.51.100.0/24.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ Security groups support only allow rules. A deny rule cannot be added to a security group.
- **B** ❌ AWS WAF can be associated with CloudFront, Application Load Balancers, API Gateway, AppSync, and similar resources, but not directly with EC2 instances. Without a supported resource in front of the instances, this cannot be applied.
- **C** ❌ Network ACL rules are evaluated in ascending order and the first match wins. Rule 100 allows the HTTPS traffic before rule 200 is evaluated, so the malicious traffic is still allowed.
- **D** ✅ Network ACLs support explicit deny rules and evaluate rules in ascending order. A deny rule with a lower number than the allow rule blocks the range while rule 100 continues to allow everyone else.

To block specific addresses, use a network ACL deny rule, because security groups have no deny rules. Network ACL rules are processed lowest number first and stop at the first match, so the deny rule must have a lower number than the broad allow rule. AWS WAF would also work, but only on a supported resource such as an ALB or CloudFront, not on bare EC2 instances.

</details>

### secure-1.2-03

_Amazon VPC, Elastic Load Balancing_

An application runs on Amazon EC2 instances in private subnets behind an internet-facing Application Load Balancer (ALB) that listens on HTTPS. The ALB forwards requests to the instances on TCP port 8080. A network engineer applied a new custom network ACL to the private subnets. Its inbound rules allow TCP 8080 from the ALB subnet CIDR blocks. Its outbound rules allow TCP 443 to 0.0.0.0/0 so that the instances can call an external API.

Since the change, ALB health checks fail and users receive HTTP 502 errors. The security groups have not changed and are configured correctly.

Which change will resolve the issue?

- **A.** Add an outbound rule to the network ACL that allows TCP ports 1024-65535 to the ALB subnet CIDR blocks.
- **B.** Add an inbound rule to the network ACL that allows TCP ports 1024-65535 from the ALB subnet CIDR blocks.
- **C.** Add an outbound rule to the network ACL that allows TCP port 8080 to the ALB subnet CIDR blocks.
- **D.** Add an outbound rule to the instances' security group that allows TCP ports 1024-65535 to the ALB security group.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ Network ACLs are stateless, so response traffic needs its own rule. The instances reply to the ALB on the ALB's ephemeral source ports, so an outbound rule for 1024-65535 to the ALB subnets restores the return path.
- **B** ❌ Inbound requests from the ALB on port 8080 are already allowed. The failure is in the response direction, which is outbound from the private subnets, so an inbound rule does not fix it.
- **C** ❌ Outbound network ACL rules match the destination port. Responses from the instances leave from port 8080 but are sent to the ALB's ephemeral ports, so a rule for destination port 8080 does not match them.
- **D** ❌ Security groups are stateful and already allow responses to permitted inbound traffic. The traffic is being dropped by the stateless network ACL, which this change does not affect.

Network ACLs are stateless: return traffic must be explicitly allowed in the opposite direction, and it is addressed to the client's ephemeral port range, not to the service port. Here the client is the ALB, so the private subnets need an outbound rule for 1024-65535 to the ALB subnets. Security groups are stateful and never need rules for response traffic.

</details>

### secure-1.2-04

_Amazon VPC, NAT gateway_

A company runs application servers on Amazon EC2 instances in private subnets across three Availability Zones. The instances must download operating system patches from the internet. Security policy states that the instances must not have public IP addresses and must not accept connections that are initiated from the internet. Outbound internet access must continue to work if any single Availability Zone fails.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Create one NAT gateway in a public subnet in one Availability Zone. Route 0.0.0.0/0 from the route tables of all private subnets to the NAT gateway.
- **B.** Create a NAT gateway in a public subnet in each Availability Zone. Route 0.0.0.0/0 from each private subnet route table to the NAT gateway in the same Availability Zone.
- **C.** Launch a NAT instance in a public subnet in each Availability Zone, each in its own Auto Scaling group with a size of one. Route each private subnet to the NAT instance in its Availability Zone.
- **D.** Route 0.0.0.0/0 from the private subnet route tables to the internet gateway. Restrict the instances' security group to allow only outbound traffic.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ A NAT gateway is redundant only within its own Availability Zone. If that Availability Zone fails, the private subnets in the other two Availability Zones lose outbound internet access.
- **B** ✅ NAT gateways are managed and allow only outbound-initiated connections. One per Availability Zone, with zone-local routing, keeps the other zones working when one zone fails.
- **C** ❌ NAT instances can provide zone-independent outbound access, but the company must patch, scale, and fail over the instances and update routes on replacement. This adds operational overhead compared with NAT gateways.
- **D** ❌ Routing through an internet gateway requires the instances to have public IP addresses, which the policy forbids, and turns the subnets into public subnets.

A NAT gateway is a managed, zonal resource, so a highly available design places one NAT gateway in each Availability Zone and routes each private subnet to its local gateway. A single shared NAT gateway is a single-AZ point of failure, and NAT instances meet the requirement only with extra operational work.

</details>

### secure-1.2-05

_AWS Secrets Manager, AWS KMS, AWS Lambda, AWS IAM_

A company's central data team owns an Amazon RDS for MySQL database in Account A. The database credentials are stored in an AWS Secrets Manager secret in Account A. The secret is encrypted with the AWS managed key aws/secretsmanager and is rotated automatically. An AWS Lambda function in Account B must read the current credentials at runtime. The security team does not allow copies of the credentials to be stored outside Account A.

Which solution will meet these requirements?

- **A.** Attach a resource policy to the secret that allows secretsmanager:GetSecretValue for the Lambda execution role in Account B. Grant the same permission in the role's IAM policy.
- **B.** Re-encrypt the secret with a customer managed KMS key whose key policy allows kms:Decrypt for the Lambda role. Allow the role in the secret's resource policy and IAM policy.
- **C.** Replicate the secret to Account B by using Secrets Manager secret replication. Have the Lambda function read the replica secret in its own account by using its execution role.
- **D.** Create an Amazon EventBridge rule for the secret's rotation events that invokes a Lambda function to write each new value to a secret in Account B for the function to read.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ Cross-account access does need both a resource policy and an identity policy. However, the AWS managed key aws/secretsmanager cannot be used for cross-account access, so the role in Account B still cannot decrypt the secret value.
- **B** ✅ A customer managed key can grant kms:Decrypt to a principal in another account. Together with the secret's resource policy and the role's identity policy, the function reads the current value directly from Account A, and no copy is made.
- **C** ❌ Secrets Manager replication copies a secret to other AWS Regions in the same account, not to other accounts. A replica would also be a copy of the credentials outside the primary secret.
- **D** ❌ This stores a copy of the credentials in Account B, which the security team forbids. It also adds custom synchronization code that can fail and leave a stale password.

Secrets Manager supports cross-account access when three things line up: a resource policy on the secret, an identity policy on the caller, and a KMS key policy that lets the caller decrypt. The AWS managed key aws/secretsmanager cannot be shared across accounts, so the secret must use a customer managed key. Replication is cross-Region within one account, not cross-account.

</details>

### secure-1.2-06

_Amazon VPC, Amazon S3, AWS Direct Connect, AWS PrivateLink_

A company has an AWS Direct Connect connection with a private virtual interface to a VPC. On-premises servers must upload files to an Amazon S3 bucket in the same AWS Region. The traffic must travel over the Direct Connect connection and must not traverse the public internet. The network team will not create a public virtual interface because policy forbids advertising public AWS prefixes into the corporate network.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Create a gateway VPC endpoint for Amazon S3 in the VPC. Configure on-premises routing to send S3 traffic over the private virtual interface to the endpoint.
- **B.** Deploy a fleet of proxy servers on Amazon EC2 in the VPC that forward uploads to Amazon S3 through a gateway VPC endpoint.
- **C.** Enable S3 Transfer Acceleration on the bucket. Configure the on-premises servers to upload to the accelerated endpoint.
- **D.** Create an interface VPC endpoint for Amazon S3 in the VPC. Configure the on-premises servers to use the endpoint-specific DNS names over the private virtual interface.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ Gateway endpoints work only through VPC route tables for traffic that originates inside the VPC. They cannot be reached from on-premises networks over Direct Connect or VPN.
- **B** ❌ This keeps traffic private, but the company must build, scale, patch, and keep the proxy fleet highly available. It has more operational overhead than a managed interface endpoint.
- **C** ❌ Transfer Acceleration uses public CloudFront edge locations reached over the internet. It does not use the private virtual interface.
- **D** ✅ Interface endpoints (AWS PrivateLink) have private IP addresses in the VPC, so on-premises clients can reach them over a private virtual interface. This keeps traffic on Direct Connect without a public virtual interface.

Interface VPC endpoints for S3 are ENIs with private IPs, so on-premises networks connected through Direct Connect or VPN can reach them. Gateway endpoints are route-table targets that serve only traffic from inside the VPC. This difference is the usual reason to choose an interface endpoint for S3 despite its cost.

</details>

### secure-1.2-07

_AWS PrivateLink, Elastic Load Balancing, Amazon VPC_

A software-as-a-service (SaaS) provider runs an API on Amazon EC2 instances in its own VPC. Hundreds of customers, each in their own AWS accounts, need to call the API from their VPCs. Many customer VPCs use CIDR ranges that overlap with the provider's VPC and with each other. Traffic must stay on the AWS network, and customers must be able to reach only the API, not any other resources in the provider's VPC.

Which solution will meet these requirements?

- **A.** Place a Network Load Balancer in front of the API and create a VPC endpoint service. Have each customer create an interface endpoint to the service.
- **B.** Create a VPC peering connection with each customer VPC. Use security groups in the provider VPC to allow access only to the API instances.
- **C.** Create a transit gateway and share it with customer accounts by using AWS Resource Access Manager. Attach the provider VPC and each customer VPC.
- **D.** Place an internet-facing Application Load Balancer in front of the API. Use AWS WAF to allow requests only from the customers' NAT gateway IP addresses.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ AWS PrivateLink exposes a single service through an NLB. Consumers reach it through endpoint ENIs in their own VPCs, so overlapping CIDRs do not matter and nothing else in the provider VPC is reachable.
- **B** ❌ VPC peering does not support overlapping CIDR blocks, and peering opens routing between whole VPCs. Managing hundreds of peering connections also adds significant overhead.
- **C** ❌ Transit Gateway routes between attached VPCs and cannot route correctly between overlapping CIDR ranges. It also connects networks rather than exposing one service.
- **D** ❌ This restricts callers, but the traffic would travel over the public internet, which breaks the requirement to stay on the AWS network.

AWS PrivateLink (an endpoint service behind an NLB, consumed through interface endpoints) is the pattern for exposing one service privately to many VPCs. It works with overlapping CIDRs and exposes only that service. Peering and Transit Gateway connect entire networks and require non-overlapping address space.

</details>

### secure-1.2-08

_AWS Lambda, Amazon SQS, AWS KMS, Amazon VPC_

A company runs AWS Lambda functions that are connected to private subnets so that they can query an Amazon RDS database in those subnets. The functions must also send messages to an Amazon SQS queue and call AWS KMS to decrypt data. Security policy forbids any route from the VPC to the internet, so the VPC has no internet gateway or NAT gateway.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Create gateway VPC endpoints for Amazon SQS and AWS KMS. Add the endpoints to the route tables of the Lambda subnets.
- **B.** Create interface VPC endpoints for Amazon SQS and AWS KMS with private DNS enabled. Allow HTTPS from the Lambda security group in the endpoints' security group.
- **C.** Add a NAT gateway and an internet gateway. Use a network ACL to allow outbound traffic only to the published AWS IP address ranges.
- **D.** Remove the VPC configuration from the Lambda functions so that they use the Lambda service network to reach Amazon SQS and AWS KMS.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ Gateway endpoints exist only for Amazon S3 and Amazon DynamoDB. Amazon SQS and AWS KMS can be reached privately only through interface endpoints.
- **B** ✅ Interface endpoints give the VPC private access to SQS and KMS. With private DNS, the default SDK endpoints resolve to the endpoint IP addresses, so no code changes are needed.
- **C** ❌ This creates a route to the internet, which the policy forbids. Keeping a network ACL in sync with AWS IP ranges also adds ongoing work.
- **D** ❌ Without a VPC connection, the functions could reach SQS and KMS but could no longer reach the RDS database in the private subnets.

AWS services other than S3 and DynamoDB are reached privately through interface VPC endpoints (PrivateLink). With private DNS enabled, existing code works without changes. Gateway endpoints are limited to S3 and DynamoDB, a common trap.

</details>

### secure-1.2-09

_Amazon S3, Amazon VPC_

A company stores confidential financial reports in an Amazon S3 bucket. An analytics application on Amazon EC2 instances in a private subnet accesses the bucket through a gateway VPC endpoint. The security team requires that the bucket be accessible only through that VPC endpoint. Requests from anywhere else must be denied, even if they come from IAM principals in the same account that have s3:* permissions.

Which solution will meet these requirements?

- **A.** Turn on S3 Block Public Access for the bucket and for the account.
- **B.** Add a bucket policy statement that denies all S3 actions when the aws:SourceIp condition key does not match the VPC CIDR block.
- **C.** Add a bucket policy statement that denies all S3 actions when the aws:SourceVpce condition key does not match the ID of the gateway VPC endpoint.
- **D.** Attach an endpoint policy to the gateway VPC endpoint that allows access only to the confidential reports bucket.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ S3 Block Public Access prevents public access through ACLs and bucket policies. It does not deny authenticated IAM principals in the account who call S3 from outside the VPC.
- **B** ❌ For requests that arrive through a VPC endpoint, aws:SourceIp does not contain the requester's private IP address (aws:VpcSourceIp does). This policy would therefore deny the application's legitimate requests as well.
- **C** ✅ An explicit deny in the bucket policy overrides any IAM allow. The aws:SourceVpce key identifies requests that arrive through the specific endpoint, so all other paths are denied.
- **D** ❌ An endpoint policy controls which resources can be reached through the endpoint. It does not stop principals from reaching the bucket through other paths, such as from the internet.

To lock a bucket to a VPC endpoint, use a bucket policy with an explicit Deny and the aws:SourceVpce (or aws:SourceVpc) condition, which beats any IAM allow. Endpoint policies restrict what can be reached through the endpoint. Bucket policies restrict where the bucket can be reached from.

</details>

### secure-1.2-10

_AWS WAF, Elastic Load Balancing, AWS Shield_

A company's login page runs on Amazon EC2 instances behind an Application Load Balancer. The page is receiving credential-stuffing traffic from a constantly changing set of IP addresses. Each attacking IP address sends thousands of requests within a few minutes. Legitimate users rarely send more than 50 requests in 5 minutes.

The company wants to automatically block any IP address that sends more than 500 requests in 5 minutes, and to unblock it when its request rate drops.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Create an AWS WAF web ACL with an IP set rule that blocks the attacking addresses. Have the security team update the IP set when new attackers appear.
- **B.** Rely on AWS Shield Standard, which is included at no extra cost, to detect and block the high request rates.
- **C.** Use an AWS Lambda function that parses ALB access logs every 5 minutes and adds deny rules for offending IP addresses to the subnet network ACL.
- **D.** Create an AWS WAF web ACL with a rate-based rule that blocks IP addresses exceeding 500 requests in a 5-minute window. Associate it with the ALB.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ An IP set blocks known addresses only. The attackers' addresses keep changing, so manual updates cannot keep up and nothing unblocks addresses automatically.
- **B** ❌ Shield Standard protects against common network and transport layer DDoS attacks. It does not rate-limit individual clients at the HTTP layer.
- **C** ❌ This would work partly, but it requires custom code and log processing. Network ACLs also have a small rule quota, which a changing set of attacker addresses would quickly exhaust.
- **D** ✅ A rate-based rule tracks request rates per IP address, blocks addresses that exceed the limit, and stops blocking them automatically when their rate falls below it. It is fully managed.

AWS WAF rate-based rules count requests per client IP over a time window and automatically block and release addresses as their rates change. This makes them the managed answer to HTTP floods and brute-force traffic from changing sources. Shield handles network-layer DDoS, and IP sets handle known, static addresses.

</details>

### secure-1.2-11

_AWS WAF, Elastic Load Balancing, Amazon CloudFront, Amazon Route 53_

A media company streams licensed content from Amazon EC2 instances behind an internet-facing Application Load Balancer (ALB). Users reach the ALB through an Amazon Route 53 alias record. A new licensing agreement requires the company to block all requests that originate from three specific countries. The company wants to keep its current architecture as unchanged as possible.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Create an AWS WAF web ACL with a geographic match rule that blocks requests from the three countries. Associate the web ACL with the ALB.
- **B.** Create an Amazon CloudFront distribution with the ALB as its origin. Enable CloudFront geographic restrictions for the three countries and point the Route 53 record to the distribution.
- **C.** Change the Route 53 record to use a geolocation routing policy that has records only for allowed countries and no default record.
- **D.** Add inbound rules to the ALB security group that deny the published IP address ranges of the three countries.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ AWS WAF can be associated directly with an ALB, and geographic match rules block requests based on the client's country. This needs no new components and blocks every request that reaches the ALB.
- **B** ❌ CloudFront geographic restrictions work, but this adds a new distribution and DNS changes. Users could also still bypass CloudFront by calling the ALB directly unless more controls are added.
- **C** ❌ Geolocation routing only changes DNS answers, and it estimates the user's location from the resolver's IP address or the EDNS0 client subnet. Anyone who knows the ALB's DNS name or IP addresses can still send requests to it, so it cannot enforce a block.
- **D** ❌ Security groups do not support deny rules. Maintaining country IP ranges by hand would also be error-prone.

AWS WAF geographic match rules attached to the existing ALB enforce country blocking at the application entry point with no architectural change. CloudFront geographic restrictions are the alternative when CloudFront is already in place. DNS-based geolocation and security groups cannot enforce a country block.

</details>

### secure-1.2-12

_AWS Shield, Amazon CloudFront, AWS Global Accelerator, Amazon Route 53_

An online gaming company serves its platform through Amazon CloudFront and AWS Global Accelerator in front of Amazon EC2 instances. During a recent DDoS attack, nobody noticed degraded performance for 40 minutes, and the Auto Scaling groups scaled out sharply and increased the AWS bill. The company already meets the AWS Support plan prerequisites for Shield Response Team (SRT) engagement.

For future attacks, AWS DDoS specialists must contact the operations team as soon as an attack affects application health. The company also wants credits for scaling charges that DDoS attacks cause.

Which solution will meet these requirements?

- **A.** Subscribe to AWS Shield Advanced and protect the distribution and the accelerator. Have the operations team contact the SRT through AWS Support when it detects an attack.
- **B.** Subscribe to AWS Shield Advanced and protect the distribution and the accelerator. Associate Route 53 health checks with the protections and turn on proactive engagement.
- **C.** Rely on AWS Shield Standard for the distribution and the accelerator. Create Route 53 health checks with CloudWatch alarms that page the operations team when health degrades.
- **D.** Add the AWS WAF Anti-DDoS managed rule group to a web ACL on the distribution, and use AWS Firewall Manager to apply the web ACL across all accounts.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ Shield Advanced provides cost protection and SRT access, but here the company must notice the attack and reach out first. The SRT contacts the company directly only when proactive engagement is turned on with health checks.
- **B** ✅ With proactive engagement, the SRT contacts the company's listed contacts when a Shield Advanced detected event affects the health of a protected resource, as shown by its associated Route 53 health check. Shield Advanced also adds DDoS cost protection.
- **C** ❌ This alerts the company's own team faster, but Shield Standard includes neither the SRT nor DDoS cost protection, so no AWS specialists engage and the scaling charges are not credited.
- **D** ❌ The Anti-DDoS managed rule group mitigates HTTP request floods automatically, but it does not provide cost protection, and its detections do not trigger SRT proactive engagement.

AWS Shield Advanced adds the Shield Response Team and DDoS cost protection for protected resources such as CloudFront, Global Accelerator, Route 53, ELB, and Elastic IPs. For the SRT to reach out first, turn on proactive engagement and associate Route 53 health checks with the protected resources, because the SRT uses health check status to decide when to engage. Shield Standard and AWS WAF provide mitigation but no SRT or cost protection.

</details>

### secure-1.2-13

_AWS Network Firewall, Amazon VPC, NAT gateway_

A company runs workloads on Amazon EC2 instances in private subnets that reach the internet through NAT gateways. A new security policy states that outbound HTTPS traffic must be allowed only to an approved list of domain names, such as *.partner-example.com and the company's package repositories. All other outbound traffic must be blocked and logged. The IP addresses behind the approved domains change frequently. The company wants a managed solution.

Which solution will meet these requirements?

- **A.** Add outbound rules to the instances' security groups that allow HTTPS only to the approved domain names, and remove the default rule that allows all outbound traffic.
- **B.** Associate an AWS WAF web ACL with the NAT gateways. Add a rule that allows requests only to the approved domain names.
- **C.** Deploy AWS Network Firewall with a stateful domain list rule group that allows only the approved domains. Route the private subnets through its endpoints.
- **D.** Add outbound rules to the private subnets' network ACLs that allow HTTPS only to the current IP address ranges of the approved domains.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Security group rules accept CIDR blocks, prefix lists, and security groups, not domain names. They also cannot log blocked traffic.
- **B** ❌ AWS WAF inspects inbound HTTP requests to resources such as ALBs and CloudFront. It cannot be associated with a NAT gateway or filter outbound traffic.
- **C** ✅ Network Firewall is a managed stateful firewall that can filter outbound HTTPS by domain name using the TLS SNI, and it can log allowed and dropped traffic. Changing IP addresses do not matter.
- **D** ❌ Network ACLs filter by IP address only. The approved domains' IP addresses change often, so the rules would need constant updates and would break.

AWS Network Firewall provides managed, stateful egress filtering by domain name (using the SNI or Host header) for VPC traffic, with logging. Security groups and network ACLs work only with IP addresses. AWS WAF protects inbound web applications, not outbound VPC traffic.

</details>

### secure-1.2-14

_Elastic Load Balancing, Amazon VPC, AWS Network Firewall_

A financial services company must inspect all inbound internet traffic to its VPC with virtual firewall appliances from a specific third-party vendor because of a regulatory audit commitment. The inspection layer must scale automatically, remain available if an Availability Zone fails, and be transparent to the applications, which must see the original client IP addresses.

Which solution will meet these requirements?

- **A.** Deploy AWS Network Firewall in each Availability Zone and use ingress routing on the internet gateway to send inbound traffic through the firewall endpoints.
- **B.** Deploy the vendor appliances in an Auto Scaling group across Availability Zones behind a Network Load Balancer. Point the application DNS records to the Network Load Balancer.
- **C.** Launch one vendor appliance on a large EC2 instance with source/destination checking turned off. Route inbound traffic through the instance by using ingress routing.
- **D.** Deploy the vendor appliances in an Auto Scaling group across Availability Zones behind a Gateway Load Balancer. Use ingress routing to send inbound traffic through Gateway Load Balancer endpoints.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ Network Firewall is a managed AWS firewall that would scale and stay available. However, it is not the third-party vendor's appliance that the company has committed to use.
- **B** ❌ An NLB delivers traffic to the appliances as its targets, so the appliances would have to act as proxies that forward traffic onward themselves. This is not transparent inline inspection and complicates preserving the original client addresses for the applications.
- **C** ❌ This can inspect traffic inline, but a single instance does not scale automatically and is a single point of failure.
- **D** ✅ Gateway Load Balancer is built for third-party virtual appliances. It forwards traffic transparently (using GENEVE) to a scalable, multi-AZ appliance fleet and returns it to its original path with the source IP preserved.

Gateway Load Balancer is the service for inserting third-party virtual appliances transparently into a traffic path, with scaling and health checks across Availability Zones. AWS Network Firewall is the choice when an AWS-managed firewall is acceptable. An NLB load-balances application traffic and is not a bump-in-the-wire.

</details>

### secure-1.2-15

_Amazon GuardDuty, Amazon EventBridge, AWS Lambda, AWS Organizations_

A company has 40 AWS accounts in AWS Organizations. The security team wants to detect Amazon EC2 instances that communicate with known command-and-control servers or that perform cryptocurrency mining. When such a finding occurs, the affected instance must be isolated automatically by replacing its security groups with a security group that has no rules. The team does not want to install agents on the instances.

Which combination of steps will meet these requirements? (Choose TWO.)

- **A.** Enable Amazon GuardDuty in all accounts by designating a delegated administrator account and turning on auto-enable for member accounts.
- **B.** Enable Amazon Inspector in all accounts and configure it to scan EC2 instances continuously.
- **C.** Create an Amazon EventBridge rule that matches the relevant GuardDuty findings and invokes an AWS Lambda function that replaces the instance's security groups with the isolation security group.
- **D.** Create an AWS Config rule with automatic remediation that removes inbound SSH rules from security groups that allow 0.0.0.0/0.
- **E.** Enable AWS CloudTrail Insights and create an Amazon CloudWatch alarm that sends notifications when unusual API activity is detected.

<details><summary>Answer</summary>

**Correct: A, C**

- **A** ✅ GuardDuty analyzes VPC Flow Logs, DNS logs, and CloudTrail events without agents. It produces findings for command-and-control communication and cryptocurrency mining, and a delegated administrator covers all organization accounts.
- **B** ❌ Amazon Inspector finds software vulnerabilities and unintended network exposure. It does not detect active malicious communication such as command-and-control traffic.
- **C** ✅ GuardDuty publishes findings to EventBridge. A rule that invokes Lambda can isolate the instance automatically within seconds of the finding.
- **D** ❌ This enforces a configuration best practice, but it does not detect malicious communication and does not isolate a compromised instance.
- **E** ❌ CloudTrail Insights detects unusual rates of management API calls. It does not see instance network traffic, and a notification does not isolate the instance.

GuardDuty is the agentless threat detection service for compromised instances and credentials. Its findings flow to EventBridge, where a rule can start automated remediation such as a Lambda function that swaps security groups. Inspector covers vulnerabilities, and Config covers configuration compliance, not active threats.

</details>

### secure-1.2-16

_Amazon Inspector, Amazon ECR, AWS Lambda, Amazon EC2_

A company runs workloads on Amazon EC2 instances, on container images stored in Amazon ECR, and on AWS Lambda functions. The security team must continuously identify software vulnerabilities (CVEs) in all three, including newly published CVEs that affect resources already deployed, and must receive findings prioritized by risk.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Activate Amazon Inspector for EC2, ECR, and Lambda. Ensure the instances are managed by Systems Manager or use agentless scanning.
- **B.** Enable Amazon GuardDuty Runtime Monitoring for EC2 and Amazon ECS, and GuardDuty Malware Protection for EC2 to scan the instances' EBS volumes.
- **C.** Enable Amazon ECR basic scanning on push for container images. Use AWS Systems Manager Patch Manager to patch the EC2 instances on a schedule.
- **D.** Enable AWS Security Hub CSPM with the AWS Foundational Security Best Practices standard in every account and Region that the company uses.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ Amazon Inspector continuously scans EC2 instances, ECR images, and Lambda functions for CVEs, rescans when new CVEs are published, and scores findings by risk.
- **B** ❌ GuardDuty detects active threats and malware on running workloads. It does not inventory the software packages in instances, ECR images, or Lambda functions and match them against CVEs.
- **C** ❌ Basic scanning runs only when an image is pushed, so newly published CVEs in existing images are missed. Patch Manager applies patches but does not report risk-prioritized CVEs, and Lambda is not covered.
- **D** ❌ Security Hub CSPM checks resource configurations against best practices and aggregates findings from other services. It does not scan software for vulnerabilities itself.

Amazon Inspector is the managed vulnerability scanner for EC2, ECR images, and Lambda. It rescans continuously as new CVEs appear and assigns a risk score. GuardDuty detects threats, Security Hub CSPM aggregates findings and checks configuration, and ECR basic scanning runs only on push or on demand.

</details>

### secure-1.2-17

_Amazon Macie, Amazon S3, AWS Organizations_

A company stores data in more than 600 Amazon S3 buckets across 25 AWS accounts in AWS Organizations. Amazon Macie is enabled for the organization with a delegated administrator and runs automated sensitive data discovery. Auditors require the company to find buckets that contain passport numbers, credit card numbers, and the company's internal customer account numbers, which use the format CUST- followed by 10 digits. Macie reports passport and credit card numbers but never reports the account numbers.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Create a Macie allow list with a regular expression that matches the customer account number format. Add the allow list to the automated discovery settings.
- **B.** Create a Macie custom data identifier with a regular expression for the account number format. Add it to the automated discovery settings.
- **C.** Add more managed data identifiers to the automated discovery settings so that Macie detects additional categories of financial account numbers.
- **D.** Configure S3 Event Notifications to invoke an AWS Lambda function that searches each new object for the account number pattern and records matches in DynamoDB.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ An allow list defines text that Macie ignores, even when the text matches a data identifier. Adding the account number pattern would suppress detections instead of creating them.
- **B** ✅ Custom data identifiers detect organization-specific data types by regex, optional keywords, and proximity rules. Automated discovery does not use them by default, so the identifier must be added to its settings.
- **C** ❌ Managed data identifiers detect standard data types, such as bank account numbers for specific countries. They cannot recognize a proprietary format that only this company uses.
- **D** ❌ This requires custom code in every account, inspects only new objects, and does not report on existing data. It has far more operational overhead than configuring Macie.

Macie managed data identifiers cover standard sensitive data such as passport and credit card numbers. Company-specific formats need a custom data identifier, which you must add to the automated discovery settings. Allow lists do the opposite: they tell Macie which matches to ignore.

</details>

### secure-1.2-18

_AWS Security Hub, Amazon GuardDuty, Amazon Inspector, Amazon Macie_

A company uses Amazon GuardDuty, Amazon Inspector, and Amazon Macie in 30 AWS accounts across four AWS Regions. The security team wants a single place to view and prioritize findings from all of these services across all accounts and Regions. The team also wants automated, continuous checks of the accounts against the CIS AWS Foundations Benchmark.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Deploy an AWS Config aggregator in a central account and deploy a conformance pack for the CIS AWS Foundations Benchmark to all accounts.
- **B.** Enable Amazon Security Lake to collect security data from all accounts and Regions into a central Amazon S3 data lake.
- **C.** Enable AWS Security Hub CSPM with a delegated administrator and cross-Region aggregation. Enable the CIS AWS Foundations Benchmark standard in all accounts.
- **D.** Enable Amazon Detective in all accounts with a delegated administrator, and use its behavior graphs to review findings from the other services.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ This provides CIS compliance checks across accounts, but AWS Config does not ingest GuardDuty, Inspector, or Macie findings, so there is still no single view of findings.
- **B** ❌ Security Lake centralizes logs and findings in OCSF format for analysis with other tools. It does not provide a findings dashboard or run CIS benchmark checks.
- **C** ✅ Security Hub CSPM aggregates and prioritizes findings from GuardDuty, Inspector, Macie, and others across accounts and Regions. It also runs automated security standard checks such as the CIS benchmark.
- **D** ❌ Detective helps investigate the root cause of findings. It does not run compliance checks against the CIS benchmark or act as the central findings dashboard.

AWS Security Hub CSPM (formerly named AWS Security Hub) aggregates security findings from AWS services and partners and runs security standards such as CIS and AWS Foundational Security Best Practices. With a delegated administrator and cross-Region aggregation, it gives one view across the organization. Config handles compliance rules only, and Detective handles investigation.

</details>

### secure-1.2-19

_Amazon Detective, Amazon GuardDuty, AWS CloudTrail_

Amazon GuardDuty generated a finding that an IAM role made unusual API calls from an IP address that the company has never used. Security analysts must determine the root cause. They need to see which other resources and IP addresses the role interacted with and how its behavior compares with the previous several weeks. The company does not want to build or maintain a log analytics pipeline.

Which solution will meet these requirements?

- **A.** Create an AWS CloudTrail trail that delivers logs to Amazon S3. Use Amazon Athena to query the role's API activity for the past several weeks.
- **B.** Enable AWS Security Hub and use its findings view to review the GuardDuty finding together with findings from other services.
- **C.** Export GuardDuty findings and VPC Flow Logs to Amazon OpenSearch Service and build dashboards that show the role's activity.
- **D.** Enable Amazon Detective and open the GuardDuty finding in Detective to review the role's activity and related entities.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ Athena can query CloudTrail logs, but analysts must create tables, write queries, and correlate results themselves. This is the log analytics work the company wants to avoid.
- **B** ❌ Security Hub aggregates and prioritizes findings. It does not provide historical behavior graphs or baselines of an entity's activity for investigation.
- **C** ❌ This could visualize the activity, but the company would have to build and run the ingestion pipeline and the OpenSearch domain.
- **D** ✅ Detective automatically builds behavior graphs from CloudTrail, VPC Flow Logs, and GuardDuty findings. Analysts can pivot from a finding to related entities and compare activity with the historical baseline, with no pipeline to manage.

Amazon Detective is the managed investigation service: it links GuardDuty findings to behavior graphs built from CloudTrail and VPC Flow Logs so analysts can find root cause quickly. GuardDuty detects, Security Hub aggregates, and Detective investigates.

</details>

### secure-1.2-20

_AWS Secrets Manager, Amazon RDS, Amazon ECS, AWS Systems Manager_

A company runs an application on Amazon ECS. The application connects to an Amazon RDS for PostgreSQL DB instance as the master user. The password is stored in a configuration file in the container image. A new compliance rule requires the password to be rotated automatically every 30 days. Tasks run for weeks at a time and must keep connecting successfully after each rotation. The company does not want to deploy or maintain any rotation functions.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Store the password in AWS Secrets Manager with 30-day rotation that uses the AWS-provided single-user rotation function for RDS. Retrieve the secret at runtime.
- **B.** Turn on RDS management of the master user password in Secrets Manager with a 30-day rotation schedule. Inject the secret into the containers as an environment variable.
- **C.** Turn on RDS management of the master user password in Secrets Manager with a 30-day rotation schedule. Have the application read the secret when it connects.
- **D.** Store the password as a Parameter Store SecureString parameter. Use EventBridge Scheduler to invoke a Lambda function that changes the password and updates the parameter.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ This works, but the rotation template deploys an AWS Lambda function into the account that the company must operate, monitor, and give network access to the database. The company does not want to maintain rotation functions.
- **B** ❌ RDS-managed rotation needs no rotation function. However, ECS injects secrets as environment variables only when a container starts, so long-running tasks keep the old password after a rotation until they are replaced.
- **C** ✅ RDS generates, stores, and rotates the master user password in Secrets Manager without a Lambda function, and the schedule can be changed from the 7-day default. Reading the secret at connection time always returns the current password.
- **D** ❌ Parameter Store has no built-in rotation. The company would have to write and maintain the rotation function, which it wants to avoid.

RDS integration with Secrets Manager manages and rotates the master user password with no rotation function to deploy, and the rotation schedule is adjustable. Applications must fetch the secret at runtime: an ECS environment variable is set once at container start and does not change when the secret rotates.

</details>

### secure-1.2-21

_AWS Systems Manager, AWS Secrets Manager, AWS KMS_

A company's applications use about 800 configuration values, such as feature flags and service endpoint URLs, organized by environment and application. About 20 of the values are API keys for a third-party service that does not support programmatic key rotation. The API keys must be encrypted at rest, and each value must keep a version history. Each value is smaller than 1 KB.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Store all values as secrets in AWS Secrets Manager, using path-style names for the hierarchy.
- **B.** Store the values as Parameter Store standard parameters in a path hierarchy, using SecureString parameters for the API keys.
- **C.** Store the values as AWS Systems Manager Parameter Store advanced parameters in a path hierarchy. Use SecureString parameters for the API keys.
- **D.** Store the values in an Amazon DynamoDB table encrypted with an AWS KMS key. Add a version attribute and write a new item for each change.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ Secrets Manager encrypts and versions secrets, but each secret has a monthly charge. Its main extra feature, managed rotation, is not needed here, so storing 800 values this way costs far more than necessary.
- **B** ✅ Standard parameters have no storage charge, support hierarchies and version history, and SecureString parameters encrypt the API keys with AWS KMS. This meets every requirement at the lowest cost.
- **C** ❌ Advanced parameters support larger values and parameter policies but are charged per parameter per month. The values are under 4 KB and no policies are needed, so standard parameters are cheaper.
- **D** ❌ This could work, but the company must build versioning and access logic itself. A purpose-built configuration store meets the requirements with less effort and no table costs.

Parameter Store standard parameters are free, hierarchical, and versioned, and SecureString adds KMS encryption for sensitive values. Secrets Manager costs more per secret and is worth it when you need managed rotation or cross-Region replication. Advanced parameters are needed only for values over 4 KB, more than 10,000 parameters, or parameter policies.

</details>

### secure-1.2-22

_AWS Secrets Manager, Amazon Aurora_

A company runs an application in us-east-1 with a disaster recovery (DR) environment in us-west-2. The database is an Amazon Aurora global database. The database credentials are stored in AWS Secrets Manager in us-east-1 and are rotated automatically every 30 days. During a DR event, the application in us-west-2 must retrieve the current credentials even if us-east-1 is completely unavailable.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Configure the application in us-west-2 to retrieve the secret from the Secrets Manager endpoint in us-east-1.
- **B.** Use an Amazon EventBridge rule on the rotation event to invoke an AWS Lambda function that copies the secret value into a separate secret in us-west-2.
- **C.** Replicate the secret to us-west-2 by using Secrets Manager multi-Region secret replication. Configure the DR application to read the replica in us-west-2.
- **D.** Store a copy of the credentials as an AWS Systems Manager Parameter Store SecureString parameter in us-west-2 and update it after each rotation.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ This works only while us-east-1 is reachable. If us-east-1 is unavailable, the DR application cannot get the credentials.
- **B** ❌ This keeps a copy in us-west-2, but the company must write and maintain the copy function and monitor it for failures.
- **C** ✅ Secrets Manager natively replicates a secret to other Regions and keeps replicas in sync when the primary is rotated. The replica can be read, or promoted, if the primary Region fails.
- **D** ❌ Parameter Store has no native cross-Region replication, so someone must update the copy after every rotation. This is manual work and the copy can drift.

Secrets Manager replicate-secret-to-Regions keeps replica secrets in sync with the primary, including rotated values, and replicas can be promoted to standalone secrets during DR. This is a built-in feature that Parameter Store lacks, and it avoids any dependency on the failed Region.

</details>

### secure-1.2-23

_Amazon API Gateway, Amazon Cognito_

A company is building a mobile application for consumers. Users must be able to sign up and sign in, and the backend is a REST API in Amazon API Gateway. Only signed-in users may call the API. The company does not want to write or maintain any authentication or token validation code, and it does not want to run its own user directory.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Create an Amazon Cognito user pool for sign-up and sign-in. Configure an AWS Lambda authorizer that verifies the user pool JWTs on each API request.
- **B.** Create a Cognito user pool and an identity pool. Have the app exchange user pool tokens for temporary AWS credentials and sign API requests with SigV4.
- **C.** Create an Amazon Cognito user pool for sign-up and sign-in. Issue each user an API Gateway API key at sign-up, and require the key on all methods.
- **D.** Create an Amazon Cognito user pool for sign-up and sign-in. Configure a Cognito user pool authorizer on the REST API methods.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ The user pool handles the directory, but the Lambda authorizer is token validation code that the company must write, secure, and maintain.
- **B** ❌ With IAM authorization on the methods, this works, but it adds an identity pool, IAM roles, and request signing in every client. That is more to build and operate than a user pool authorizer.
- **C** ❌ API keys identify clients for usage plans and throttling. They are not an authentication mechanism, and a copied key works without a signed-in user.
- **D** ✅ Cognito user pools provide a managed user directory with sign-up and sign-in. The Cognito authorizer validates the user pool tokens in API Gateway with no custom code.

For consumer sign-up and sign-in with a REST API, pair an Amazon Cognito user pool with a Cognito user pool authorizer, which validates tokens without code. Identity pools are for handing out AWS credentials, which adds IAM roles and SigV4 signing. Lambda authorizers are for custom token schemes, and API keys are for usage plans, not authentication.

</details>

### secure-1.2-24

_Amazon API Gateway, AWS Lambda, Amazon Cognito_

A company is exposing a REST API in Amazon API Gateway to its business partners. Partners authenticate with the company's on-premises legacy identity system, which issues opaque session tokens that are not JWTs. Partners send the token in a custom request header. Before a request is allowed, the token must be validated with the legacy system, and the partner's permitted operations must be looked up in a database. The company cannot migrate the partners to a new identity system.

Which solution will meet these requirements?

- **A.** Configure a Lambda authorizer that validates the header token with the legacy system, looks up the partner's permissions, and returns an IAM policy.
- **B.** Configure an Amazon Cognito user pool authorizer on the API methods and require partners to send their legacy token in the Authorization header.
- **C.** Enable IAM authorization on the API methods and require partners to sign their requests with Signature Version 4.
- **D.** Attach an API Gateway resource policy that allows requests only from each partner's registered IP address ranges, and deny all other source IP addresses.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ A Lambda authorizer can run any custom logic, such as calling the legacy system and a permissions database, and returns a policy that API Gateway enforces. Authorizer result caching can reduce calls to the legacy system.
- **B** ❌ A Cognito authorizer validates only tokens issued by the configured Cognito user pool. It cannot validate opaque tokens from the legacy system.
- **C** ❌ IAM authorization requires callers to have AWS credentials. The partners authenticate with the legacy system, not with IAM, so they cannot sign requests.
- **D** ❌ A resource policy can restrict source IP addresses, but it cannot validate tokens or apply per-partner permissions.

Lambda authorizers are for custom authentication and authorization logic, such as validating tokens from a legacy or third-party system and building per-caller policies. Cognito authorizers validate only Cognito tokens, and IAM authorization requires AWS credentials.

</details>

### secure-1.2-25

_Amazon API Gateway, AWS IAM, Amazon ECS_

A company has a REST API in Amazon API Gateway in Account A. A microservice that runs as Amazon ECS tasks in Account B must call the API. The ECS tasks already use an IAM task role. Only that task role may invoke the API. The security team does not want to create, distribute, or rotate any shared secrets for this integration.

Which solution will meet these requirements?

- **A.** Create an API key in a usage plan for the API. Store the API key in AWS Secrets Manager in Account B and have the tasks send it with each request.
- **B.** Enable IAM authorization on the API. Add a resource policy that allows execute-api:Invoke only for the Account B task role, and sign requests with SigV4.
- **C.** Create an Amazon Cognito user pool app client with the client credentials grant. Store the client secret in Account B and configure a Cognito authorizer on the API.
- **D.** Configure a Lambda authorizer that allows requests whose source IP address matches the Elastic IP address of the NAT gateway in Account B.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ API keys are shared secrets that must be distributed and rotated, and API Gateway does not treat them as authentication. This does not meet the requirement.
- **B** ✅ With IAM authorization, callers sign requests with their temporary role credentials. The resource policy grants cross-account access to that one role, so no shared secret exists.
- **C** ❌ This authenticates machine-to-machine calls, but it relies on a client secret that must be stored, distributed, and rotated.
- **D** ❌ Any workload behind that NAT gateway could call the API, so this does not limit access to the task role. It also breaks if the network path changes.

When the caller is an AWS workload with an IAM role, IAM authorization (SigV4) plus an API resource policy gives cross-account access with temporary credentials and no secrets to manage. Cognito client credentials and API keys both introduce secrets.

</details>

### secure-1.2-26

_Amazon API Gateway, AWS PrivateLink, Amazon VPC_

A company has an internal REST API in Amazon API Gateway that is used only by applications on Amazon EC2 instances in one VPC. The VPC has no internet gateway or NAT gateway. A security review found that the API currently has a Regional endpoint that is reachable from the internet. The API must be reachable only from the VPC.

Which combination of steps will meet these requirements? (Choose TWO.)

- **A.** Change the API endpoint type to private. Attach a resource policy that allows execute-api:Invoke only when the request comes through the company's VPC endpoint.
- **B.** Create an interface VPC endpoint for the execute-api service in the VPC subnets, with a security group that allows HTTPS from the application instances.
- **C.** Create a gateway VPC endpoint for Amazon API Gateway and add it to the route tables of the application subnets.
- **D.** Keep the Regional endpoint and associate an AWS WAF web ACL that allows only requests from the VPC CIDR block.
- **E.** Keep the Regional endpoint and add a NAT gateway. Attach a resource policy that allows only the NAT gateway's Elastic IP address.

<details><summary>Answer</summary>

**Correct: A, B**

- **A** ✅ A private API is not reachable from the internet, and the resource policy limits invocation to requests that arrive through the specified VPC endpoint.
- **B** ✅ Private APIs are reached through an interface VPC endpoint for execute-api. This gives the instances a private path to the API without internet access.
- **C** ❌ Gateway endpoints exist only for Amazon S3 and Amazon DynamoDB. API Gateway is reached privately through an interface endpoint.
- **D** ❌ The Regional endpoint would still be public, and without an internet path the instances cannot reach it at all. Private VPC addresses would also never appear as the source of requests to a public endpoint.
- **E** ❌ This restricts callers by IP address, but the API stays internet-facing and the VPC gains an internet path, which the design avoids.

A private REST API plus an interface VPC endpoint for execute-api is how to make API Gateway reachable only from inside a VPC. The resource policy, usually with aws:SourceVpce, controls which endpoints may invoke it. There is no gateway endpoint for API Gateway.

</details>

### secure-1.2-27

_Amazon CloudFront, Amazon S3, AWS KMS_

A company serves a static website from an Amazon S3 bucket through an Amazon CloudFront distribution. The objects are encrypted with SSE-KMS by using a customer managed key. Users have discovered that they can bypass CloudFront and download objects directly from S3. The company must ensure that the objects can be retrieved only through this CloudFront distribution.

Which solution will meet these requirements in the MOST secure way?

- **A.** Configure a CloudFront origin access identity (OAI). Update the bucket policy to allow s3:GetObject only for the OAI, and block public access to the bucket.
- **B.** Use the S3 static website endpoint as a custom origin. Have CloudFront add a secret Referer header and allow only requests with that header in the bucket policy.
- **C.** Configure CloudFront origin access control (OAC). Allow only this distribution's ARN in the bucket and KMS key policies, and turn on S3 Block Public Access.
- **D.** Update the bucket policy to allow s3:GetObject only from the published CloudFront IP address ranges by using the aws:SourceIp condition key.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ An OAI is the legacy method. It does not support objects encrypted with SSE-KMS, so CloudFront could not retrieve the encrypted objects.
- **B** ❌ Website endpoints require public read access and do not serve SSE-KMS encrypted objects. A Referer header is also a weak control because it can be forged.
- **C** ✅ OAC signs origin requests with SigV4 and supports SSE-KMS. Conditions on AWS:SourceArn limit access to this one distribution, and Block Public Access stops direct downloads.
- **D** ❌ CloudFront IP ranges are shared by all CloudFront distributions, including other customers' distributions, and the list changes over time. This does not limit access to the company's distribution.

Origin access control is the current, recommended way to restrict an S3 origin to a specific CloudFront distribution. Unlike the legacy OAI, it supports SSE-KMS (the key policy must also allow CloudFront). Scope the bucket and key policies with AWS:SourceArn so that only your distribution can read.

</details>

### secure-1.2-28

_Amazon CloudFront, Elastic Load Balancing, Amazon VPC, AWS WAF_

A company uses an Amazon CloudFront distribution in front of an internet-facing Application Load Balancer (ALB). AWS WAF rules are attached to the CloudFront distribution. Attackers have found the ALB's DNS name and are sending requests directly to the ALB to bypass the WAF rules. The company must ensure that the ALB accepts traffic only from CloudFront.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Configure CloudFront origin access control (OAC) for the ALB origin, and update the ALB listener to require signed requests from CloudFront.
- **B.** Subscribe an AWS Lambda function to AWS IP address range change notifications and have it update the ALB subnets' network ACLs with the CloudFront IP ranges.
- **C.** Associate an AWS WAF web ACL with the ALB that allows only an IP set containing the CloudFront IP ranges. Update the IP set when AWS publishes changes.
- **D.** Replace the ALB security group's inbound rules with one rule that allows HTTPS only from the AWS managed prefix list for CloudFront origin-facing servers.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ Origin access control supports origins such as Amazon S3 and Lambda function URLs. It does not apply to ALB origins.
- **B** ❌ This needs custom code, and the CloudFront ranges far exceed the network ACL rule quota. It has high operational overhead.
- **C** ❌ This could block direct traffic, but the IP set must be kept current by hand as CloudFront ranges change, which adds ongoing effort and risk.
- **D** ✅ AWS maintains the CloudFront origin-facing managed prefix list, so the security group stays current automatically. Direct requests from other sources are dropped.

The AWS managed prefix list com.amazonaws.global.cloudfront.origin-facing lets a security group allow only CloudFront, with no maintenance. Origin access control is for S3 and similar origins, not ALBs. A custom header checked by the ALB can be added on top to tie access to a single distribution. For new designs, CloudFront VPC origins can also place the ALB in private subnets that are reachable only through CloudFront.

</details>

### secure-1.2-29

_AWS Systems Manager, Amazon EC2, Amazon S3, Amazon CloudWatch_

Administrators currently connect to Linux Amazon EC2 instances in private subnets by using SSH through a bastion host in a public subnet. The security team wants to remove the bastion host, remove all inbound SSH rules from the instances' security groups, control access through IAM policies, and keep a log of every command that administrators run in each session.

Which solution will meet these requirements?

- **A.** Use Systems Manager Session Manager with an instance profile for the SSM Agent. Log session activity to Amazon S3 and CloudWatch Logs.
- **B.** Use EC2 Instance Connect Endpoint to connect to the instances. Control access with IAM policies on the endpoint.
- **C.** Deploy AWS Client VPN to the VPC. Have administrators connect to the VPN and then use SSH to reach the instances directly.
- **D.** Move the bastion host to a private subnet and connect to it over an AWS Site-to-Site VPN. Enable shell history logging on the bastion host.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ Session Manager opens shell sessions through the SSM Agent's outbound connection, so no inbound ports or bastion are needed. Access is controlled by IAM, and session activity can be logged to S3 and CloudWatch Logs.
- **B** ❌ EC2 Instance Connect Endpoint removes the bastion host, but it still opens SSH connections to the instances, so their security groups must allow inbound port 22 from the endpoint. It also does not log commands.
- **C** ❌ Client VPN removes the public bastion, but SSH must still be allowed inbound on the instances, and commands run in the session are not logged.
- **D** ❌ This keeps a bastion host and inbound SSH rules, which the security team wants to remove, and logs on the bastion can be altered by its users.

Session Manager replaces bastion hosts: the agent connects outbound to Systems Manager, so no inbound ports are opened. IAM governs who can start sessions, and full session logs can go to S3 and CloudWatch Logs. EC2 Instance Connect still uses SSH on port 22.

</details>

### secure-1.2-30

_AWS Systems Manager, Amazon VPC, AWS PrivateLink, Amazon EC2_

A company wants to manage Amazon EC2 instances by using AWS Systems Manager Session Manager. The instances run in private subnets of a VPC that has no internet gateway and no NAT gateway, and security policy forbids adding either. The instances run a current version of the SSM Agent but do not appear as managed nodes in Systems Manager.

Which combination of steps will meet these requirements? (Choose TWO.)

- **A.** Allow inbound TCP port 22 from the VPC CIDR block in the instances' security groups.
- **B.** Create a gateway VPC endpoint for Systems Manager and add it to the route tables of the private subnets.
- **C.** Attach an IAM instance profile that includes the AmazonSSMManagedInstanceCore managed policy to the instances.
- **D.** Create interface VPC endpoints for the ssm, ssmmessages, and ec2messages services, with private DNS enabled and HTTPS allowed from the instances.
- **E.** Assign public IP addresses to the instances and allow outbound HTTPS to 0.0.0.0/0 in their security groups.

<details><summary>Answer</summary>

**Correct: C, D**

- **A** ❌ Session Manager does not use inbound SSH. The SSM Agent connects outbound, so opening port 22 does not register the instances.
- **B** ❌ Gateway endpoints exist only for Amazon S3 and Amazon DynamoDB. Systems Manager is reached privately through interface endpoints.
- **C** ✅ The SSM Agent needs IAM permissions from an instance profile (or Default Host Management Configuration) to register with Systems Manager and open sessions.
- **D** ✅ Without internet access, the SSM Agent reaches Systems Manager through these interface endpoints. The ssmmessages endpoint carries the Session Manager data channel, and current agents use it in place of ec2messages when it is available.
- **E** ❌ Public IP addresses do nothing without an internet gateway, and adding one is forbidden by the policy.

Session Manager needs two things: IAM permissions for the instance (for example, AmazonSSMManagedInstanceCore) and a network path to the Systems Manager endpoints. In a VPC with no internet path, that means interface endpoints for ssm, ssmmessages, and ec2messages. No inbound ports are ever required.

</details>

### secure-1.2-31

_AWS Network Firewall, AWS Transit Gateway, Amazon VPC_

A company has 20 VPCs in one AWS Region that are connected through AWS Transit Gateway. A new security policy requires that all traffic between VPCs and all traffic from the VPCs to the internet be inspected by a stateful firewall. A central network team must manage a single set of firewall rules.

Which solution will meet these requirements in the MOST operationally efficient way?

- **A.** Deploy AWS Network Firewall in each of the 20 VPCs, with a separate firewall policy that each application team manages, and route each VPC's traffic through its local firewall endpoints.
- **B.** Attach an inspection VPC that runs AWS Network Firewall to the transit gateway with appliance mode on. Route inter-VPC and internet traffic through it.
- **C.** Create an inspection VPC with AWS Network Firewall. Peer each of the 20 VPCs with the inspection VPC and route traffic between VPCs through the firewall endpoints.
- **D.** Create an AWS WAF web ACL with the required rules and associate it with the transit gateway so that it inspects all traffic that crosses the transit gateway.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ Per-VPC firewalls can inspect traffic, but 20 separately managed policies conflict with the requirement for one centrally managed rule set and multiply the cost and effort.
- **B** ✅ A centralized inspection VPC lets one firewall policy inspect all east-west and egress traffic. Appliance mode keeps both directions of a flow in the same Availability Zone so stateful inspection works.
- **C** ❌ VPC peering is not transitive and does not support edge-to-edge routing through a peered VPC, so traffic cannot pass through the inspection VPC to another VPC or to the internet.
- **D** ❌ AWS WAF inspects HTTP requests to resources such as ALBs, CloudFront, and API Gateway. It cannot be associated with a transit gateway or inspect general network traffic.

The standard pattern for central inspection is an inspection VPC with AWS Network Firewall (or a Gateway Load Balancer fleet) attached to a transit gateway, with route tables steering traffic through it. Enable appliance mode on that attachment so that stateful inspection sees symmetric flows. Peering cannot do this because it is not transitive.

</details>

### secure-1.2-32

_AWS Shield, Amazon CloudFront, Amazon Route 53, AWS WAF_

A small company hosts a marketing website on Amazon S3 behind an Amazon CloudFront distribution and uses Amazon Route 53 for DNS. The company is concerned about network and transport layer DDoS attacks, such as SYN floods and UDP reflection attacks, against the website and its DNS. The company has a very limited budget.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Subscribe to AWS Shield Advanced and add the CloudFront distribution and the Route 53 hosted zone as protected resources.
- **B.** Subscribe to AWS Shield Advanced but protect only the Route 53 hosted zone, so that the company pays for the fewest protected resources.
- **C.** Rely on AWS Shield Standard, which is applied automatically to CloudFront and Route 53 at no additional charge.
- **D.** Create an AWS WAF web ACL with rate-based rules and associate it with the CloudFront distribution to block floods of requests.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Shield Advanced adds a response team, cost protection, and advanced detection, which the company does not need for common layer 3 and layer 4 attacks. Its monthly subscription fee makes it the most expensive option.
- **B** ❌ The Shield Advanced subscription is a flat monthly fee for the organization, whatever the number of protected resources. Protecting fewer resources does not make it cheap, and the attacks listed are already mitigated by Shield Standard.
- **C** ✅ Shield Standard is turned on for all AWS customers and protects services such as CloudFront and Route 53 against the most common network and transport layer DDoS attacks, at no extra cost.
- **D** ❌ AWS WAF filters application layer (HTTP) requests and is charged per web ACL, rule, and request. It does not address network layer attacks such as SYN floods, which Shield Standard already mitigates.

AWS Shield Standard is free and automatic, and it defends against common layer 3 and layer 4 DDoS attacks, with the strongest protection for edge services such as CloudFront and Route 53. Shield Advanced has a flat organization-level subscription fee. Pay for it only when you need the Shield Response Team, cost protection, or advanced detection and visibility.

</details>

### secure-1.2-33

_Amazon VPC, Elastic Load Balancing, NAT gateway, Amazon EC2_

A company is deploying a web application in a new VPC across two Availability Zones. Internet users will reach the application through an Application Load Balancer (ALB). The application's Amazon EC2 instances must not have public IP addresses and must accept traffic only from the ALB. The instances must be able to download software updates from the internet, and this outbound access must survive the failure of one Availability Zone.

Which combination of steps will meet these requirements? (Choose THREE.)

- **A.** Create an internet-facing ALB in private subnets in both Availability Zones.
- **B.** Create an internet-facing ALB in public subnets in both Availability Zones.
- **C.** Launch the EC2 instances in private subnets in both Availability Zones, with a security group that allows the application port only from the ALB's security group.
- **D.** Launch the EC2 instances in public subnets in both Availability Zones with auto-assigned public IP addresses, and allow the application port only from the ALB's security group.
- **E.** Create a NAT gateway in a public subnet in each Availability Zone, and route 0.0.0.0/0 from each private subnet to the NAT gateway in the same Availability Zone.
- **F.** Create a NAT gateway in each private subnet, and route 0.0.0.0/0 from each private subnet to the NAT gateway in that subnet.

<details><summary>Answer</summary>

**Correct: B, C, E**

- **A** ❌ An internet-facing ALB must be in public subnets whose route tables point to an internet gateway. In private subnets it cannot receive traffic from the internet.
- **B** ✅ Internet-facing load balancers need public subnets with a route to an internet gateway. Using both Availability Zones keeps the entry point highly available.
- **C** ✅ Private subnets keep the instances off the internet, and referencing the ALB security group allows traffic only from the load balancer.
- **D** ❌ The security group would limit inbound traffic, but the instances would have public IP addresses, which the requirements forbid.
- **E** ✅ NAT gateways in public subnets give private instances outbound-only internet access. One per Availability Zone keeps outbound access working if one zone fails.
- **F** ❌ A public NAT gateway must be in a public subnet with a route to the internet gateway. A NAT gateway in a private subnet, routed to itself, has no path to the internet.

The classic secure web tier is an internet-facing ALB in public subnets, instances in private subnets that allow traffic only from the ALB security group, and one NAT gateway per Availability Zone in the public subnets for outbound access. Watch for distractors that put the ALB or the NAT gateway in the wrong subnet type.

</details>

### secure-1.2-34

_Amazon API Gateway, Amazon Cognito, AWS Lambda_

A company is building a new API by using an Amazon API Gateway HTTP API. The company's users already sign in through a third-party OpenID Connect (OIDC) identity provider, and the client applications already receive JWT access tokens from that provider. The API must accept only requests that include a valid, unexpired token that was issued by the provider for this API's audience. The company does not want to write custom authorization code.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Configure an AWS Lambda authorizer that downloads the provider's signing keys, validates each token's signature, issuer, audience, and expiration, and returns an authorization decision.
- **B.** Create an Amazon Cognito user pool federated with the OIDC provider. Change the client applications to obtain tokens from the user pool, and configure a JWT authorizer for the user pool.
- **C.** Enable IAM authorization on the API routes and require the client applications to sign requests with Signature Version 4.
- **D.** Configure a JWT authorizer on the HTTP API routes with the provider's issuer URL and the API's audience.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ A Lambda authorizer can validate the tokens, but it is custom code that the company must write, secure, and maintain, which the company wants to avoid.
- **B** ❌ This would work, but it adds a new user pool and changes the sign-in flow of every client, which is unnecessary when the existing provider's JWTs can be validated directly.
- **C** ❌ IAM authorization requires AWS credentials. The clients hold OIDC tokens, not IAM credentials, so they cannot sign requests without additional infrastructure.
- **D** ✅ HTTP API JWT authorizers natively validate tokens from any OIDC-compliant issuer, including the signature, issuer, audience, and expiration, with no code.

HTTP APIs include a built-in JWT authorizer that validates tokens from any OIDC or OAuth 2.0 issuer, such as Amazon Cognito, Okta, or Auth0. Reach for a Lambda authorizer only when the token format or authorization logic is custom, such as opaque tokens or database lookups.

</details>

### secure-1.2-35

_Amazon VPC, Amazon EC2_

A developer launched an Amazon EC2 instance in a subnet whose route table has a 0.0.0.0/0 route to the VPC's internet gateway. The subnet's setting to auto-assign public IPv4 addresses is turned off, so the instance has only a private IP address. The instance's security group allows all outbound traffic, and the subnet uses the default network ACL. The instance cannot reach the internet. It must be able to initiate connections to the internet and must keep a stable public address that partners can add to their allow lists.

Which solution will meet these requirements?

- **A.** Allocate an Elastic IP address and associate it with the instance.
- **B.** Create a NAT gateway in the same subnet and change the subnet's 0.0.0.0/0 route to point to the NAT gateway.
- **C.** Add an inbound rule to the security group that allows TCP ports 1024-65535 from 0.0.0.0/0 for return traffic.
- **D.** Attach a second internet gateway to the VPC and add a route to it from the subnet's route table.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ An instance in a public subnet needs a public IPv4 address for the internet gateway to translate its traffic. An Elastic IP address provides one that stays the same across stops and starts.
- **B** ❌ A public NAT gateway depends on its subnet's route to the internet gateway. Pointing that same subnet's default route to the NAT gateway removes the NAT gateway's own path to the internet.
- **C** ❌ Security groups are stateful and already allow return traffic for outbound connections. The problem is the missing public IP address, not the security group.
- **D** ❌ A VPC can have only one internet gateway attached. The existing gateway is fine; the instance lacks a public IP address.

A subnet is public because its route table points to an internet gateway, but each instance still needs a public IPv4 address or Elastic IP address to use it. When an instance needs a fixed public address, use an Elastic IP address, because auto-assigned public IPs change when the instance stops and starts.

</details>

### secure-1.2-36

_Amazon VPC, NAT gateway_

A company is moving an application to a dual-stack VPC with both IPv4 and IPv6 CIDR blocks. Application servers in private subnets must initiate outbound connections to internet services over both IPv4 and IPv6. Security policy states that the subnet routing itself, independent of security groups, must prevent connections from being initiated from the internet to the servers over either protocol.

Which combination of steps will meet these requirements? (Choose TWO.)

- **A.** Route ::/0 from the private subnets to a NAT gateway.
- **B.** Create an egress-only internet gateway and route ::/0 from the private subnets to it.
- **C.** Route ::/0 from the private subnets to the internet gateway and allow only outbound traffic in the security groups.
- **D.** Create a NAT gateway in a public subnet and route 0.0.0.0/0 from the private subnets to it.
- **E.** Assign public IPv4 addresses to the servers and route 0.0.0.0/0 from their subnets to the internet gateway.

<details><summary>Answer</summary>

**Correct: B, D**

- **A** ❌ NAT gateways translate private IPv4 addresses (and support NAT64 for IPv6-only clients reaching IPv4). They do not provide general outbound IPv6 internet access for dual-stack servers.
- **B** ✅ An egress-only internet gateway allows outbound IPv6 connections and their responses, and blocks connections initiated from the internet, which is the IPv6 counterpart of NAT.
- **C** ❌ IPv6 addresses are globally routable, so this route lets the internet initiate connections to the servers. Only the security groups would block them, which violates the routing requirement.
- **D** ✅ A NAT gateway gives private IPv4 addresses outbound internet access and does not accept connections initiated from the internet.
- **E** ❌ This makes the servers reachable from the internet over IPv4, relying only on security groups, which violates the policy.

For outbound-only internet access, use a NAT gateway for IPv4 and an egress-only internet gateway for IPv6. IPv6 addresses need no translation, so the egress-only internet gateway provides the one-way behavior that NAT provides for IPv4.

</details>

### secure-1.2-37

_Amazon VPC, Amazon S3, AWS Organizations_

A company processes sensitive data on Amazon EC2 instances in private subnets. The VPC has no internet gateway or NAT gateway, and the instances access Amazon S3 through a gateway VPC endpoint. All of the company's buckets belong to accounts in its organization in AWS Organizations. The security team must prevent data from being copied from the instances to any S3 bucket outside the organization, even if someone on an instance uses access keys from an AWS account that is not in the organization.

Which solution will meet these requirements?

- **A.** Attach a service control policy (SCP) that denies S3 actions unless the aws:ResourceOrgID condition key matches the company's organization ID.
- **B.** Attach an endpoint policy to the gateway VPC endpoint that allows S3 actions only when the aws:ResourceOrgID condition key matches the company's organization ID.
- **C.** Add an outbound rule to the instances' security group that allows HTTPS only to the AWS managed prefix list for Amazon S3.
- **D.** Add a bucket policy to every company bucket that denies requests that do not come through the gateway VPC endpoint.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ SCPs apply only to principals in the organization's accounts. Access keys from an outside account are not governed by the SCP, so data could still be copied to an outside bucket.
- **B** ✅ Every S3 request from the VPC goes through the endpoint, whatever credentials are used. The endpoint policy denies requests to buckets owned outside the organization.
- **C** ❌ The S3 prefix list covers every bucket in the Region, including other companies' buckets, so it cannot distinguish the organization's buckets from outside ones.
- **D** ❌ This protects the company's own buckets from outside access. It does nothing to stop the instances from writing to buckets that the company does not own.

A VPC endpoint policy controls which resources can be reached through the endpoint, regardless of the caller's credentials, which makes it the network perimeter control against data exfiltration. Bucket policies protect your own buckets, and SCPs control only your own principals. Data perimeters combine all three.

</details>

### secure-1.2-38

_AWS Firewall Manager, AWS WAF, AWS Organizations_

A company has 60 AWS accounts in AWS Organizations, and new accounts are created every month. The central security team requires that every Application Load Balancer and every Amazon API Gateway stage in every account, including resources created in the future, be protected by a baseline set of AWS WAF rules. Application teams must be able to add their own rules on top of the baseline.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Use AWS CloudFormation StackSets to deploy a web ACL with the baseline rules to every account and Region. Ask application teams to associate the web ACL with their resources.
- **B.** Enable AWS Security Hub CSPM in all accounts and use its controls to report ALBs and API Gateway stages that have no web ACL. Have the security team remediate findings.
- **C.** Use an AWS Firewall Manager AWS WAF policy with the baseline rule groups, scoped to the organization, with auto remediation for ALBs and API Gateway stages.
- **D.** Subscribe every account to AWS Shield Advanced and turn on automatic application layer DDoS mitigation for all ALBs and API Gateway stages.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ StackSets can create the web ACL everywhere, but association depends on each team, so new resources can go unprotected. Nothing enforces the baseline.
- **B** ❌ Security Hub CSPM detects unprotected resources, but remediation is manual and protection is not applied automatically to new resources.
- **C** ✅ Firewall Manager centrally applies WAF policies across the organization, including new accounts and resources, and lets account owners add their own rules between the first and last rule groups.
- **D** ❌ Shield Advanced focuses on DDoS protection, and its automatic mitigation creates rules only in response to attacks. It does not apply the company's baseline rule set.

AWS Firewall Manager is the service for centrally enforcing AWS WAF, Shield Advanced, security group, and Network Firewall policies across an organization, automatically covering new accounts and resources. StackSets and Security Hub CSPM can deploy or detect, but they do not enforce protection continuously.

</details>

### secure-1.2-39

_AWS WAF, Amazon CloudFront, Lambda@Edge, AWS Shield_

An ecommerce company serves its website through Amazon CloudFront. Competitors use automated scrapers to harvest product prices. The scrapers rotate IP addresses and keep their request rate per IP address low. The company wants to block or challenge common bots and scrapers while continuing to allow verified search engine crawlers that are important for its search ranking.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Add an AWS WAF rate-based rule to a web ACL on the CloudFront distribution that blocks IP addresses that send more than 100 requests in 5 minutes.
- **B.** Subscribe to AWS Shield Advanced and add the CloudFront distribution as a protected resource.
- **C.** Deploy a Lambda@Edge function on viewer requests that inspects the User-Agent header and blocks requests from known scraper user agents.
- **D.** Add the AWS WAF Bot Control managed rule group to the distribution's web ACL, and configure it to block or challenge unverified bots.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ Rate-based rules catch high-volume clients. These scrapers rotate IP addresses and stay under per-IP limits, and the rule cannot tell verified search engine crawlers from other bots.
- **B** ❌ Shield Advanced protects against DDoS attacks. Low-rate scraping is not a DDoS attack, and Shield Advanced does not classify bots.
- **C** ❌ This is custom code that must be maintained, and scrapers can easily set a browser or search engine User-Agent to evade it.
- **D** ✅ Bot Control is an AWS managed rule group that identifies bots, distinguishes verified bots such as search engine crawlers, and can block or challenge the rest, with no code to maintain.

The AWS WAF Bot Control managed rule group classifies bot traffic and verifies legitimate bots such as search engines, so it can block scrapers that stay under rate limits. Rate-based rules address volume per IP, and Shield addresses DDoS.

</details>

### secure-1.2-40

_Amazon GuardDuty, Amazon S3, Amazon EventBridge, Amazon EC2_

A company lets customers upload documents to an Amazon S3 bucket by using presigned URLs. Before a downstream workflow processes a document, every newly uploaded object must be scanned for malware, and the scan result must be recorded on the object. The company does not want to manage servers or maintain antivirus signature updates.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Enable GuardDuty Malware Protection for S3 on the bucket with result tagging turned on. Start the downstream workflow from its scan result events in EventBridge.
- **B.** Enable GuardDuty S3 Protection for the account. Start the downstream workflow from the GuardDuty findings in Amazon EventBridge that reference the bucket.
- **C.** Have EC2 workers download each new object, then run GuardDuty Malware Protection for EC2 on-demand scans of the workers' EBS volumes and tag the object.
- **D.** Send S3 event notifications to an Amazon SQS queue that an Auto Scaling group of EC2 instances processes with open source antivirus software that tags each object.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ GuardDuty Malware Protection for S3 scans new objects automatically with AWS-managed detection, can tag each object with its scan result, and publishes results to EventBridge to trigger the next step.
- **B** ❌ S3 Protection analyzes S3 data events in CloudTrail for suspicious access, such as requests from known malicious IP addresses. It does not scan object contents for malware.
- **C** ❌ On-demand scans target an EC2 instance's EBS volumes, at most once per hour per instance, not individual S3 objects. The company would also manage the workers, which it wants to avoid.
- **D** ❌ This can scan and tag objects, but the company must manage the instances and keep the antivirus signatures up to date, which it wants to avoid.

GuardDuty Malware Protection for S3 is a fully managed scanner for newly uploaded objects, with optional result tagging and EventBridge events for downstream automation. Do not confuse it with GuardDuty S3 Protection, which watches access patterns, or Malware Protection for EC2, which scans EBS volumes.

</details>

## Task 1.3

### secure-1.3-01

_Amazon RDS, AWS KMS_

A company runs a production Amazon RDS for MySQL DB instance that was created without encryption at rest. A new compliance policy requires every production database to be encrypted at rest with a customer managed AWS KMS key. The company can accept a short outage while the application is switched to the compliant database.

Which solution will meet these requirements?

- **A.** Snapshot the DB instance, copy the snapshot with encryption enabled by using the customer managed key, and restore a new DB instance from the copy.
- **B.** Create a read replica of the DB instance and encrypt the replica with the customer managed key. Promote the read replica after replication catches up.
- **C.** Modify the DB instance to enable storage encryption with the customer managed key. Apply the modification during the next maintenance window.
- **D.** Enable Amazon EBS encryption by default in the Region with the customer managed key. Reboot the DB instance so that its storage volumes are re-created as encrypted.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ A snapshot copy can be encrypted with a customer managed key, and a DB instance restored from an encrypted snapshot is encrypted. This is a supported way to encrypt an existing RDS database, and the short cutover fits the accepted outage.
- **B** ❌ Amazon RDS does not allow an encrypted read replica of an unencrypted DB instance. A read replica uses the same encryption state as its source, so this approach cannot produce an encrypted database.
- **C** ❌ Amazon RDS encryption at rest can be enabled only when a DB instance is created. An existing unencrypted DB instance cannot be modified to become encrypted, so this option is not possible.
- **D** ❌ EBS encryption by default applies to new EBS volumes that the account creates for EC2. It does not change the encryption state of an existing RDS DB instance, and a reboot does not re-create its storage.

You cannot turn on encryption for an existing unencrypted RDS DB instance or create an encrypted read replica of it. Snapshot the instance, copy the snapshot with encryption enabled, and restore a new DB instance from the encrypted copy. An RDS Blue/Green deployment with an encrypted green environment is another way to do this with less downtime. Remember: RDS encryption is fixed at creation, so encrypting an existing database means creating a new, encrypted one.

</details>

### secure-1.3-02

_Amazon EBS, AWS KMS, AWS Config_

A company runs 300 Amazon EC2 instances in one AWS Region. Many of the attached Amazon EBS volumes are unencrypted. A new security standard requires that all existing volumes be encrypted at rest. Every volume that any team creates in the future must also be encrypted automatically, without teams changing their launch templates or scripts.

Which combination of steps will meet these requirements with the LEAST operational overhead? (Choose TWO.)

- **A.** Enable Amazon EBS encryption by default for the account in the Region.
- **B.** Use Amazon EBS Elastic Volumes to modify each existing volume and turn on encryption in place.
- **C.** Create a snapshot of each unencrypted volume. Create a new encrypted volume from each snapshot and replace the original volume with the new volume.
- **D.** Deploy the AWS Config managed rule encrypted-volumes to report every unencrypted volume in the account.
- **E.** Attach a service control policy that denies ec2:CreateVolume and ec2:RunInstances requests unless the ec2:Encrypted condition is true.

<details><summary>Answer</summary>

**Correct: A, C**

- **A** ✅ EBS encryption by default makes every new EBS volume and snapshot copy in the Region encrypted, even when the request does not ask for encryption. Teams do not need to change templates, so this meets the requirement for future volumes.
- **B** ❌ Elastic Volumes can change the size, type, IOPS, and throughput of a volume, but it cannot change an unencrypted volume to encrypted. Existing volumes stay unencrypted.
- **C** ✅ A volume created from an unencrypted snapshot can be encrypted. Swapping in the new volume is the supported way to encrypt existing EBS data, so this meets the requirement for existing volumes.
- **D** ❌ The AWS Config rule detects and reports unencrypted attached volumes, but it does not encrypt existing volumes or make future volumes encrypted.
- **E** ❌ The SCP blocks unencrypted volumes, but teams would then have to change their launch templates and scripts to request encryption, which the stem forbids. It also does nothing for existing volumes.

EBS encryption by default handles every future volume with no change for teams, and the snapshot-and-replace process encrypts the existing volumes. An SCP only prevents unencrypted volumes and pushes the work onto teams. Remember: existing EBS volumes cannot be encrypted in place.

</details>

### secure-1.3-03

_Amazon RDS, AWS KMS_

A company runs an Amazon RDS for PostgreSQL DB instance that is encrypted with the AWS managed key aws/rds. For disaster recovery, the company must make a daily snapshot available to a separate AWS account in the same Region. The disaster recovery team must be able to restore a DB instance from the snapshot in its own account.

Which solution will meet these requirements?

- **A.** Share the daily automated snapshot with the disaster recovery account. Edit the key policy of the aws/rds key to allow the disaster recovery account to use the key.
- **B.** Create a daily manual snapshot that is encrypted with the aws/rds key. Share the manual snapshot with the disaster recovery account and have that account copy it with its own key.
- **C.** Copy the snapshot, encrypting the copy with a customer managed key that the disaster recovery account is allowed to use. Share the copy with that account.
- **D.** Export the daily snapshot to an Amazon S3 bucket in Apache Parquet format. Replicate the bucket to a bucket in the disaster recovery account.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Automated snapshots cannot be shared, and the key policy of an AWS managed key cannot be edited. Neither part of this option is possible.
- **B** ❌ Snapshots encrypted with the AWS managed key aws/rds cannot be shared with other accounts, because other accounts can never be granted use of that key.
- **C** ✅ A snapshot encrypted with a customer managed key can be shared when the key policy grants the other account access to the key. The disaster recovery account can then copy or restore the snapshot.
- **D** ❌ A snapshot export to Amazon S3 is meant for analytics. The disaster recovery team cannot restore a DB instance from exported Parquet files.

To share an encrypted RDS snapshot across accounts, the snapshot must be a manual snapshot encrypted with a customer managed key that the other account is allowed to use. Snapshots encrypted with an AWS managed key cannot be shared. Remember: cross-account access to encrypted data needs a customer managed key.

</details>

### secure-1.3-04

_AWS KMS_

A company encrypts application data with customer managed AWS KMS keys that it created with AWS-generated key material. A new security policy requires the key material to be rotated every 180 days. Data that was encrypted before a rotation must still be decryptable, and the company does not want to change application code or re-encrypt existing data.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Re-encrypt all data with AWS managed keys, which AWS rotates automatically.
- **B.** Enable automatic key rotation on each customer managed key and set the rotation period to 180 days.
- **C.** Create an Amazon EventBridge schedule that invokes an AWS Lambda function every 180 days. Configure the function to create a new KMS key and point the application's alias to the new key.
- **D.** Replace the keys with KMS keys that use imported key material. Import new key material every 180 days.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ AWS managed keys rotate automatically every year, and the rotation schedule cannot be changed. This does not meet the 180-day requirement and requires re-encrypting the data.
- **B** ✅ AWS KMS automatic rotation supports a custom rotation period for customer managed keys. KMS keeps earlier key material so that existing ciphertext stays decryptable, and the key ID does not change, so applications need no changes.
- **C** ❌ Pointing an alias to a new key rotates keys manually. It works, but the company must build and run the automation and keep every old key to decrypt old data, which is more overhead than built-in rotation.
- **D** ❌ Keys with imported key material do not support automatic rotation, so the company would run a manual key material process. This adds overhead and requires a migration to new keys.

Automatic rotation for customer managed keys has a configurable period, keeps old key material for decryption, and keeps the same key ID. AWS managed keys rotate yearly on a fixed schedule. Remember: choose a customer managed key when you must control the rotation schedule.

</details>

### secure-1.3-05

_AWS KMS, AWS CloudHSM, Amazon S3_

A financial services company must encrypt data in Amazon S3 and Amazon EBS by using AWS KMS integration. Regulators require that the key material be generated in the company's on-premises hardware security module (HSM). In an emergency, the company must be able to make the key material unusable in AWS immediately, without a waiting period.

Which solution will meet these requirements?

- **A.** Create a customer managed KMS key with AWS-generated key material. In an emergency, schedule the key for deletion with the minimum waiting period.
- **B.** Create an AWS CloudHSM cluster and import the key material into the HSMs. Configure the applications to encrypt data with the CloudHSM PKCS#11 library before storing it.
- **C.** Create an AWS KMS custom key store that is backed by an AWS CloudHSM cluster. Create the KMS keys in the custom key store.
- **D.** Create a KMS key with no key material. Import key material that is generated in the on-premises HSM. In an emergency, delete the imported key material.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ AWS KMS generates this key material, which violates the requirement to generate it on premises. Key deletion also has a minimum waiting period of 7 days.
- **B** ❌ CloudHSM accepts imported keys, but Amazon S3 and Amazon EBS cannot use keys that live only in a CloudHSM cluster. The applications would need to do their own encryption, which loses the required KMS integration.
- **C** ❌ KMS keys in a CloudHSM key store have key material that KMS generates inside the cluster. Key material cannot be imported into these keys, so it would not come from the on-premises HSM.
- **D** ✅ A KMS key with an external origin uses key material that the company generates and imports. It works with S3 and EBS like any KMS key, and deleting the imported key material makes it unusable immediately.

Imported key material (bring your own key) lets the company generate keys in its own HSM and still use KMS integration with S3 and EBS. Deleting imported key material takes effect at once, unlike scheduled key deletion. Remember: imported key material for control over origin and immediate removal; a CloudHSM key store for keys that live in single-tenant HSMs.

</details>

### secure-1.3-06

_AWS CloudHSM, AWS KMS_

A company is migrating an on-premises application that signs documents with private keys stored in a hardware security module (HSM). The application calls the HSM through the PKCS#11 API, and the company does not want to rewrite this code. The company's security policy requires single-tenant HSMs, and the company must have exclusive control of the keys.

Which solution will meet these requirements?

- **A.** Create asymmetric AWS KMS keys for signing. Update the application to call the KMS Sign API.
- **B.** Deploy an AWS CloudHSM cluster with HSMs in two Availability Zones. Import the signing keys and configure the application to use the CloudHSM PKCS#11 library.
- **C.** Create an AWS KMS custom key store that is backed by an AWS CloudHSM cluster. Create signing keys in the custom key store and call the KMS Sign API.
- **D.** Store the private keys in AWS Secrets Manager encrypted with a customer managed KMS key. Load the keys into application memory at startup to sign documents.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ AWS KMS supports asymmetric signing keys, but KMS uses multi-tenant HSMs that AWS manages and does not expose a PKCS#11 interface. This option breaks the single-tenant requirement and requires code changes.
- **B** ✅ CloudHSM provides single-tenant HSMs in the company's VPC that only the company's crypto users can access. It supports the PKCS#11 API, so the application can keep its existing code.
- **C** ❌ A CloudHSM key store supports only symmetric encryption KMS keys, so it cannot hold signing keys. The application would also need to change from PKCS#11 to the KMS API.
- **D** ❌ Secrets Manager stores secrets securely, but the private keys would leave any HSM and be used in application memory. This breaks the requirement to keep the keys in single-tenant HSMs.

CloudHSM is the choice when a workload needs dedicated single-tenant HSMs and standard interfaces such as PKCS#11, JCE, or CNG. AWS KMS is multi-tenant and exposes only its own API. Remember: KMS for AWS service integration, CloudHSM for exclusive HSM control and standard crypto APIs.

</details>

### secure-1.3-07

_AWS KMS, Amazon DynamoDB_

A company runs an application in us-east-1 and eu-west-1. The application encrypts sensitive fields with AWS KMS before writing items to an Amazon DynamoDB global table. If us-east-1 becomes unavailable, the application in eu-west-1 must still decrypt every item, including items written in us-east-1. The company does not want to re-encrypt data as it replicates.

Which solution will meet these requirements?

- **A.** Create a KMS key in each Region with the same alias. Configure the application in each Region to encrypt and decrypt by using the alias.
- **B.** Create a single-Region KMS key in us-east-1. Grant the application in eu-west-1 permission to call the key in us-east-1 for decryption.
- **C.** Create a KMS key in us-east-1. Export its key material and import the key material into a KMS key in eu-west-1.
- **D.** Create a multi-Region primary key in us-east-1 and a replica key in eu-west-1. Have each Region's application use its local key.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ Keys in different Regions with the same alias have different key material and key IDs. Ciphertext produced in us-east-1 cannot be decrypted with the eu-west-1 key.
- **B** ❌ Cross-Region calls to the us-east-1 key would work only while us-east-1 is available. This breaks the requirement to decrypt during a us-east-1 outage.
- **C** ❌ AWS KMS never exports the key material of a KMS key, so this option is not possible.
- **D** ✅ Multi-Region keys share the same key ID and key material, so data encrypted with the primary key can be decrypted with the replica key in another Region without any cross-Region call.

Multi-Region keys are interchangeable sets of keys with the same key material in different Regions. They let data encrypted in one Region be decrypted in another without re-encrypting or calling across Regions. Remember: use multi-Region keys for client-side encryption with global tables and cross-Region disaster recovery.

</details>

### secure-1.3-08

_Amazon S3, AWS KMS_

A company stores a data lake of several hundred million small objects in an Amazon S3 bucket. Each object is encrypted with SSE-KMS by using a customer managed key. Analytics jobs that read many objects have caused high AWS KMS request charges and occasional KMS throttling errors. The company must keep using the same customer managed key.

Which solution will meet these requirements MOST cost-effectively?

- **A.** Enable S3 Bucket Keys for SSE-KMS on the bucket and copy existing objects in place so they use a bucket key.
- **B.** Change the bucket default encryption to server-side encryption with Amazon S3 managed keys (SSE-S3).
- **C.** Request a service quota increase for AWS KMS cryptographic operations in the Region.
- **D.** Change the bucket default encryption to dual-layer server-side encryption with AWS KMS keys (DSSE-KMS).

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ An S3 Bucket Key is a bucket-level key that S3 derives from the KMS key and uses to create data keys for many objects. It cuts KMS requests and their cost, which also relieves throttling, while the customer managed key stays in use.
- **B** ❌ SSE-S3 makes no KMS requests, but it replaces the customer managed key with S3 managed keys. This breaks the requirement to keep using the same key.
- **C** ❌ A higher quota can reduce throttling, but every object request still calls KMS, so the KMS request charges stay high.
- **D** ❌ DSSE-KMS applies two layers of encryption for compliance needs. It does not reduce KMS requests, and it costs more than SSE-KMS.

S3 Bucket Keys reduce traffic from S3 to KMS by using a bucket-level key to generate data keys, which lowers SSE-KMS request costs by a large amount. The customer managed key stays in use. Remember: SSE-KMS plus Bucket Keys for high request volume at low KMS cost.

</details>

### secure-1.3-09

_Amazon S3, AWS KMS, AWS CloudTrail_

A company stores regulated documents in an Amazon S3 bucket. Every object must be encrypted with one specific customer managed AWS KMS key so that each use of the key is recorded in AWS CloudTrail. Upload requests that ask for any other encryption key or method must be rejected.

Which solution will meet these requirements?

- **A.** Configure SSE-S3 as the bucket default encryption. Add a bucket policy that denies s3:PutObject requests that do not include the x-amz-server-side-encryption header.
- **B.** Configure SSE-KMS with the customer managed key as the bucket default encryption. Enable S3 Bucket Keys for the bucket.
- **C.** Set SSE-KMS with the customer managed key as default encryption. Add a bucket policy that denies uploads that request any other encryption method or key.
- **D.** Require clients to use server-side encryption with customer-provided keys (SSE-C). Store the keys in AWS Secrets Manager and rotate them regularly.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ SSE-S3 uses keys that Amazon S3 manages, not the required customer managed key, and S3 managed keys do not record each use in CloudTrail.
- **B** ❌ Default encryption applies only when a request does not specify encryption. A request that asks for SSE-S3 or another KMS key is still accepted, so this option does not reject other methods.
- **C** ✅ Default encryption covers requests that specify nothing, and the bucket policy rejects requests that ask for a different method or key. Every stored object then uses the required key, and KMS calls appear in CloudTrail.
- **D** ❌ With SSE-C the client supplies the key on each request and AWS KMS is not involved. The required customer managed key is not used and KMS key usage is not recorded. Amazon S3 also blocks SSE-C by default on new general purpose buckets.

Default encryption sets the encryption for requests that do not specify one, but it does not override a request that explicitly asks for something else. A bucket policy that denies other methods and keys enforces the single key. Remember: default encryption sets the default; a bucket policy enforces the rule.

</details>

### secure-1.3-10

_Amazon S3, AWS KMS_

A company backs up sensitive research data to Amazon S3. The company's security policy states that AWS must never have access to the plaintext data or to the encryption keys at any time. The company already runs its own key management system on premises.

Which solution will meet these requirements?

- **A.** Use server-side encryption with customer-provided keys (SSE-C). Send the key from the on-premises key management system with each upload and download request.
- **B.** Use SSE-KMS with a KMS key that uses key material imported from the on-premises key management system.
- **C.** Use dual-layer server-side encryption with AWS KMS keys (DSSE-KMS) with a customer managed key.
- **D.** Encrypt the data on premises with keys from the on-premises key management system before upload. Store only the encrypted data in Amazon S3.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ With SSE-C, Amazon S3 receives both the plaintext data and the key with each request and performs the encryption. AWS handles plaintext and keys, which breaks the policy. SSE-C is also blocked by default on new general purpose buckets.
- **B** ❌ With SSE-KMS, Amazon S3 receives plaintext data and AWS KMS holds a copy of the imported key material. AWS still has access to plaintext and keys.
- **C** ❌ DSSE-KMS applies two layers of encryption, but both happen on the server side in AWS. AWS still receives the plaintext data.
- **D** ✅ Client-side encryption means data is already encrypted before it reaches AWS and the keys never leave the company. AWS stores only ciphertext, which meets the policy.

Only client-side encryption keeps both plaintext and keys away from AWS. Every server-side option, including SSE-C, sends plaintext to Amazon S3 for encryption. Remember: if AWS must never see plaintext, encrypt before upload.

</details>

### secure-1.3-11

_Amazon S3_

A brokerage firm must store trade confirmation records in Amazon S3 for 7 years. A regulator requires write once, read many (WORM) storage. During the retention period, no user in the account, including the root user, can be able to overwrite or delete a record.

Which solution will meet these requirements?

- **A.** Enable S3 Versioning and MFA delete on the bucket. Restrict s3:DeleteObjectVersion to the root user.
- **B.** Enable S3 Object Lock on the bucket. Configure a default retention period of 7 years in compliance mode.
- **C.** Enable S3 Object Lock on the bucket. Configure a default retention period of 7 years in governance mode.
- **D.** Add a bucket policy that denies s3:DeleteObject and s3:PutObject for all principals.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ MFA delete adds a step to permanently deleting versions, but the root user with the MFA device can still delete them. It does not provide WORM protection against every user.
- **B** ✅ In compliance mode, no user, including the root user, can overwrite or delete a locked object version or shorten its retention until the period ends. This meets the WORM requirement.
- **C** ❌ In governance mode, users who have the s3:BypassGovernanceRetention permission can delete or change locked objects. This breaks the requirement that no user can delete records.
- **D** ❌ An administrator or the root user can change or remove a bucket policy at any time, so the policy does not give the enforced WORM protection that the regulator requires.

S3 Object Lock compliance mode is the only option that stops every user, including root, from deleting or overwriting a version until its retention date. Governance mode can be bypassed with a special permission. Remember: compliance mode for regulators, governance mode for protection that trusted admins can override.

</details>

### secure-1.3-12

_Amazon S3_

A company stores contracts in an Amazon S3 bucket that has S3 Object Lock enabled with a 1-year default retention in governance mode. The company is now involved in a lawsuit. A specific set of contract objects must be preserved until the case ends, and nobody knows how long that will take. The legal team must be able to release the protection when the case closes. Other objects must keep their current retention.

Which solution will meet these requirements?

- **A.** Change the bucket default retention to compliance mode with a 10-year retention period.
- **B.** Extend the retention date of each affected object version by 10 years in compliance mode.
- **C.** Place an Object Lock legal hold on each affected object version. Grant the legal team the s3:PutObjectLegalHold permission.
- **D.** Use S3 Batch Operations to extend the governance-mode retention of each affected object version by 10 years. Grant the legal team s3:BypassGovernanceRetention.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Default retention applies to new objects in the bucket, not just the contracts in the case. A compliance-mode period also cannot be shortened when the case closes.
- **B** ❌ A fixed compliance-mode date cannot be shortened or removed by anyone, so the legal team could not release the protection when the case ends.
- **C** ✅ A legal hold protects an object version with no expiration date, independent of any retention period. Users with s3:PutObjectLegalHold can remove it when the case closes, and other objects are not affected.
- **D** ❌ A fixed retention date might end before the case does, so it does not preserve the objects for an unknown period. The bypass permission also lets the legal team delete the protected objects, not only release them.

Object Lock legal holds have no retention period and stay in place until a user with permission removes them, which fits litigation of unknown length. Retention periods are fixed dates. Remember: retention period for a known duration, legal hold for an open-ended preservation.

</details>

### secure-1.3-13

_AWS Backup_

A company uses AWS Backup to protect Amazon EFS file systems and Amazon DynamoDB tables in one backup vault. A new audit rule requires every recovery point to be kept for at least 365 days, and no user, including the root user, can delete a recovery point early or remove the control. Before the control becomes permanent, the backup team wants several days to confirm that existing backup plans still succeed, and to be able to undo the control if they do not.

Which solution will meet these requirements?

- **A.** Apply AWS Backup Vault Lock in compliance mode with a minimum retention of 365 days and a grace time of 7 days. Delete the lock during the grace time if jobs fail.
- **B.** Apply AWS Backup Vault Lock in governance mode with a minimum retention of 365 days. Remove the lock if the backup jobs fail during testing.
- **C.** Attach a backup vault access policy that denies backup:DeleteRecoveryPoint. Use an SCP to deny changes to the vault access policy.
- **D.** Set a 365-day retention in each backup plan rule. Use an AWS Backup Audit Manager framework to report recovery points that are deleted early.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ In compliance mode, the lock can be changed or deleted only during the grace time, which must be at least 3 days. After the grace time ends, no user, including the root user, can remove the lock or delete recovery points early.
- **B** ❌ Governance mode allows testing, but users with the right IAM permissions can remove the lock at any time. The control never becomes permanent, so it does not stop privileged users.
- **C** ❌ The two policies block deletion, but an administrator in the management account can change the SCP and then the vault policy. Neither control is immutable.
- **D** ❌ Backup plan retention sets when recovery points expire, but privileged users can still delete them manually. Audit Manager reports on compliance after the fact and does not prevent deletion.

AWS Backup Vault Lock in compliance mode becomes immutable after its grace time, even for the root user. The grace time of at least 72 hours lets the team test the lock and delete it if needed. Governance mode and access policies can always be undone by privileged users. Remember: the compliance-mode grace time is the window for testing before the lock becomes permanent.

</details>

### secure-1.3-14

_Amazon S3, AWS IAM_

A company has one AWS account with 400 Amazon S3 buckets. Developers create new buckets every week. The security team requires a preventive control that stops any bucket or object in the account from ever being made public, including future buckets.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Enable S3 Block Public Access at the account level. Deny the s3:PutAccountPublicAccessBlock action to everyone except the security team.
- **B.** Deploy the AWS Config managed rule s3-bucket-public-read-prohibited with automatic remediation that removes public access.
- **C.** Enable S3 Block Public Access on every existing bucket. Create an Amazon EventBridge rule that invokes an AWS Lambda function to enable it on each new bucket.
- **D.** Enable Amazon Macie to monitor the account and send alerts when a bucket becomes publicly accessible.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ Account-level Block Public Access overrides public bucket policies and ACLs on all current and future buckets. Restricting who can change the setting keeps the preventive control in place with one setting.
- **B** ❌ AWS Config evaluates buckets after a change is made and remediates afterward. This is a detective control and leaves a window when data is public.
- **C** ❌ This protects buckets, but the company must build and maintain the automation, and there is a short window before the function runs. It is more overhead than one account-level setting.
- **D** ❌ Macie reports on bucket security and sensitive data, but it only alerts. It does not prevent buckets from becoming public.

Account-level S3 Block Public Access is a single preventive setting that applies to every existing and future bucket. AWS Config and Macie are detective tools. Remember: to prevent public S3 data, use Block Public Access at the account level, not per-bucket fixes.

</details>

### secure-1.3-15

_AWS Certificate Manager, Amazon CloudFront, Elastic Load Balancing_

A company serves its website at www.example.com through an Amazon CloudFront distribution. The origin is an Application Load Balancer (ALB) in eu-central-1. The company must encrypt traffic from viewers to CloudFront and from CloudFront to the ALB. The company wants AWS to renew all certificates automatically.

Which solution will meet these requirements?

- **A.** Request a public certificate in AWS Certificate Manager (ACM) in eu-central-1. Associate the certificate with both the CloudFront distribution and the ALB HTTPS listener.
- **B.** Request a public certificate in ACM in us-east-1. Associate the certificate with both the CloudFront distribution and the ALB HTTPS listener.
- **C.** Request an ACM certificate in us-east-1 for the CloudFront distribution. Request an ACM certificate in eu-central-1 for the ALB. Set the origin protocol policy to HTTPS only.
- **D.** Import a third-party certificate into IAM for the CloudFront distribution. Request an ACM certificate in eu-central-1 for the ALB. Set the origin protocol policy to HTTPS only.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ CloudFront can use only ACM certificates that are requested in the us-east-1 Region. A certificate in eu-central-1 cannot be associated with the distribution.
- **B** ❌ An ALB can use only ACM certificates in its own Region. A us-east-1 certificate cannot be attached to an ALB in eu-central-1.
- **C** ✅ Each certificate is in the Region that its service requires, ACM renews both automatically, and the HTTPS-only origin policy encrypts the connection from CloudFront to the ALB.
- **D** ❌ This encrypts both connections, but imported third-party certificates are not renewed by AWS. The company would have to renew the CloudFront certificate itself.

CloudFront requires ACM certificates from us-east-1, and an ALB requires an ACM certificate in its own Region. ACM-issued public certificates renew automatically. Remember: CloudFront certificate in us-east-1; regional load balancer certificate in the load balancer's Region.

</details>

### secure-1.3-16

_Elastic Load Balancing, Amazon EC2_

A healthcare company runs an API on Amazon EC2 instances in an Auto Scaling group across three Availability Zones. A regulation requires that TLS sessions from clients be terminated only on the EC2 instances. No intermediate component may decrypt the traffic. The company needs load balancing across the instances.

Which solution will meet these requirements?

- **A.** Deploy an Application Load Balancer with an HTTPS listener that uses an AWS Certificate Manager (ACM) certificate. Forward traffic to the instances over HTTPS.
- **B.** Deploy a Network Load Balancer with a TCP listener on port 443. Forward traffic to a TCP target group, and install the certificates on the instances.
- **C.** Deploy a Network Load Balancer with a TLS listener that uses an ACM certificate. Forward traffic to a TLS target group.
- **D.** Deploy an Amazon CloudFront distribution with the instances as a custom origin. Set the origin protocol policy to HTTPS only.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ The ALB terminates the client TLS session and decrypts the traffic before re-encrypting it to the targets. This breaks the requirement that no intermediate component decrypts traffic.
- **B** ✅ A TCP listener passes the encrypted traffic through without decrypting it, so the TLS session is terminated only on the instances while traffic is still load balanced.
- **C** ❌ A TLS listener terminates the TLS session on the Network Load Balancer, so the load balancer decrypts the traffic.
- **D** ❌ CloudFront terminates the viewer TLS session at the edge location and opens a new session to the origin. The traffic is decrypted at CloudFront.

For end-to-end TLS that only the targets decrypt, use TLS passthrough: a Network Load Balancer with a TCP listener. ALBs, NLB TLS listeners, and CloudFront all terminate TLS. Remember: TCP listener on NLB means passthrough; TLS or HTTPS listener means the load balancer decrypts.

</details>

### secure-1.3-17

_AWS CloudTrail, Amazon S3_

A company delivers AWS CloudTrail logs to a central Amazon S3 bucket. External auditors require proof that no log file was modified or deleted after CloudTrail delivered it. The auditors want to perform the check themselves at any time.

Which solution will meet these requirements?

- **A.** Send the trail to Amazon CloudWatch Logs. Create a metric filter and an alarm for DeleteObject events on the bucket.
- **B.** Configure the trail to encrypt log files with SSE-KMS by using a customer managed key.
- **C.** Enable S3 Versioning on the bucket so that every change to a log file creates a new version.
- **D.** Enable CloudTrail log file integrity validation on the trail. Have the auditors validate the log files against the digest files.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ Object-level S3 events are data events that a trail does not log by default, and an alarm on deletions does not detect modifications. This option does not prove log integrity.
- **B** ❌ SSE-KMS protects the confidentiality of the log files. It does not give auditors a way to prove that files were not modified or deleted.
- **C** ❌ Versioning keeps earlier versions, but anyone with the right permissions can delete versions. It provides no cryptographic proof that a log file is unchanged.
- **D** ✅ With log file integrity validation, CloudTrail delivers digest files that contain SHA-256 hashes of each log file, signed by CloudTrail. Validation shows whether any log file was changed or deleted after delivery.

CloudTrail log file integrity validation uses signed digest files to prove that log files were not modified or deleted after delivery. Encryption and versioning do not prove integrity. Remember: integrity questions about CloudTrail logs point to log file validation.

</details>

### secure-1.3-18

_AWS Config, Amazon EBS_

A company must continuously check that every Amazon EBS volume attached to its EC2 instances is encrypted. Auditors require a history that shows when each volume became compliant or noncompliant. The company wants to avoid building custom tooling.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Create an Amazon EventBridge schedule that runs an AWS Lambda function daily. Configure the function to call DescribeVolumes and write the results to an Amazon DynamoDB table.
- **B.** Enable AWS Config to record EBS volumes. Deploy the AWS Config managed rule encrypted-volumes.
- **C.** Enable Amazon Inspector for the account and review the findings for unencrypted volumes.
- **D.** Enable AWS CloudTrail Insights on the account's trail and review the Insights events for unencrypted volumes.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ This custom tooling collects a daily snapshot of volume state, but the company must build and maintain it, and changes between runs are missed.
- **B** ✅ AWS Config evaluates attached volumes against the rule whenever they change and keeps a timeline of configuration and compliance changes. The managed rule needs no custom code.
- **C** ❌ Amazon Inspector scans workloads for software vulnerabilities and network exposure. It does not evaluate EBS encryption compliance over time.
- **D** ❌ CloudTrail Insights detects unusual rates of API calls. It does not evaluate the encryption state of resources.

AWS Config records resource configurations and evaluates them continuously against rules, with a compliance timeline that auditors can review. CloudTrail records API activity, not resource compliance. Remember: AWS Config answers what a resource looked like and whether it complied.

</details>

### secure-1.3-19

_AWS Backup, AWS Organizations_

After a ransomware attack at a peer company, a company is redesigning its backups. The company uses AWS Backup for Amazon EC2 and Amazon RDS. Recovery points must be immutable for 35 days, so that no one in the account, including the root user, can delete them early. Backups must also remain recoverable if the production account itself is compromised.

Which combination of steps will meet these requirements? (Choose TWO.)

- **A.** Apply AWS Backup Vault Lock in compliance mode to the backup vault with a minimum retention period of 35 days.
- **B.** Apply AWS Backup Vault Lock in governance mode to the backup vault with a minimum retention period of 35 days.
- **C.** Add a copy rule to the backup plan that copies each recovery point to a backup vault in a separate account in the same organization.
- **D.** Enable continuous backups for point-in-time recovery of the RDS databases in the backup plan.
- **E.** Attach a backup vault access policy that denies backup:DeleteRecoveryPoint to all principals.

<details><summary>Answer</summary>

**Correct: A, C**

- **A** ✅ After the grace time ends, a compliance-mode vault lock cannot be changed or removed by anyone, including the root user, and recovery points cannot be deleted before their retention ends.
- **B** ❌ Governance mode can be removed by users who have the right IAM permissions. It does not stop a privileged user or the root user from deleting backups early.
- **C** ✅ A copy in a separate account is out of reach of credentials in the compromised production account, so backups stay recoverable.
- **D** ❌ Continuous backups improve the recovery point objective. They do not make backups immutable or protect them if the account is compromised.
- **E** ❌ An account administrator or the root user can change a vault access policy, so it does not make recovery points immutable.

Vault Lock in compliance mode makes recovery points immutable even for the root user, and cross-account copies protect against a compromised production account. Governance mode and access policies can be undone by privileged users. Remember: compliance-mode Vault Lock plus a copy in a separate account for ransomware resilience.

</details>

### secure-1.3-20

_Amazon Macie, Amazon S3_

A company has several hundred Amazon S3 buckets. Its legal team has named 12 buckets that must be fully scanned within 2 weeks, with a report of every object that contains credit card numbers. For all other buckets, the security team wants ongoing visibility into which buckets are likely to hold personally identifiable information (PII).

Which solution will meet these requirements MOST cost-effectively?

- **A.** Enable Amazon Macie automated sensitive data discovery for the account, and use its findings to report on the 12 named buckets.
- **B.** Create a daily scheduled Amazon Macie sensitive data discovery job that analyzes every bucket in the account.
- **C.** Create a one-time Amazon Macie sensitive data discovery job for the 12 named buckets. Enable Macie automated sensitive data discovery for the account.
- **D.** Create a one-time Amazon Macie sensitive data discovery job for the 12 named buckets. Enable Amazon GuardDuty S3 Protection for the other buckets.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Automated discovery analyzes representative samples of objects, so it gives broad, low-cost visibility. It does not inspect every object in the 12 buckets, so the legal report would be incomplete.
- **B** ❌ The job would find PII, but its first run fully analyzes every object in several hundred buckets. That costs far more than sampling the buckets that do not need a full scan.
- **C** ✅ A one-time job fully analyzes the 12 buckets for the legal report. Automated discovery samples the rest of the buckets continuously at a lower cost, which gives ongoing visibility.
- **D** ❌ The Macie job covers the legal report. GuardDuty S3 Protection detects suspicious access to S3 data, but it does not inspect object contents, so it cannot show which buckets hold PII.

Macie sensitive data discovery jobs perform full, targeted analysis of the buckets that you choose, and automated sensitive data discovery samples the whole S3 estate continuously at a lower cost. Combining a one-time job for the 12 buckets with automated discovery for everything else meets both needs at the lowest cost. Remember: jobs for depth, automated discovery for breadth.

</details>

### secure-1.3-21

_Amazon DynamoDB, AWS KMS_

A company stores customer records in an Amazon DynamoDB table that uses the default encryption at rest with an AWS owned key. A new policy requires the security team to control which principals can use the encryption key through a key policy, to see every use of the key in AWS CloudTrail, and to be able to make the table data inaccessible at once by disabling the key.

Which solution will meet these requirements with the LEAST operational overhead?

- **A.** Change the table encryption to a customer managed KMS key that the security team administers.
- **B.** Change the table encryption to the AWS managed key aws/dynamodb.
- **C.** Create a new table and use the AWS Database Encryption SDK to encrypt items on the client side with a customer managed key. Migrate the data to the new table.
- **D.** Enable point-in-time recovery on the table. Export the table to an Amazon S3 bucket that is encrypted with a customer managed key.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ A DynamoDB table can switch to a customer managed key without downtime. The security team controls the key policy, every use is logged in CloudTrail, and disabling the key makes the data inaccessible.
- **B** ❌ Use of the AWS managed key is logged in CloudTrail, but its key policy cannot be edited and the key cannot be disabled. This breaks two of the requirements.
- **C** ❌ Client-side encryption with a customer managed key gives the required control, but it needs application changes and a data migration. That is far more overhead than changing the table's key.
- **D** ❌ The export would be encrypted with the customer managed key, but the table itself would still use the AWS owned key. The requirements apply to the table data.

DynamoDB encrypts all tables at rest and lets you switch between an AWS owned key, the AWS managed key, and a customer managed key at any time. Only a customer managed key gives key policy control, the ability to disable the key, and CloudTrail records of each use. Remember: control over the key means a customer managed key.

</details>

### secure-1.3-22

_Amazon S3, AWS KMS, AWS IAM_

A company stores reports in an Amazon S3 bucket in Account A. The objects are encrypted with SSE-KMS by using the AWS managed key aws/s3. The bucket policy grants an IAM role in Account B permission to call s3:GetObject. Applications that use the role in Account B receive AccessDenied errors when they read the objects.

Which solution will allow the role in Account B to read the objects?

- **A.** Edit the key policy of the aws/s3 key in Account A to allow the role in Account B to call kms:Decrypt.
- **B.** Add an identity-based policy to the role in Account B that allows kms:Decrypt on the ARN of the aws/s3 key in Account A.
- **C.** Encrypt the objects with a new customer managed key whose key policy allows Account B. Allow kms:Decrypt on that key in the role's IAM policy in Account B.
- **D.** Set S3 Object Ownership to bucket owner enforced on the bucket. Add a bucket policy statement that grants Account B the s3:GetObject permission on all objects.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ The key policy of an AWS managed key cannot be edited, and AWS managed keys can be used only by principals in their own account.
- **B** ❌ Cross-account use of a KMS key requires the key policy to allow the other account. The aws/s3 key policy cannot allow this, so an IAM policy in Account B alone does not work.
- **C** ✅ A customer managed key policy can grant another account access. With the objects re-encrypted under that key and the role's IAM policy allowing kms:Decrypt, both sides of the cross-account permission are in place.
- **D** ❌ Object ownership and the bucket policy already allow the S3 request. The failure comes from AWS KMS, because the role cannot use the aws/s3 key to decrypt the objects.

Reading SSE-KMS objects needs permission both to the object and to the KMS key. AWS managed keys cannot be shared across accounts, so the objects must be encrypted with a customer managed key whose key policy trusts the other account. Remember: cross-account SSE-KMS needs a customer managed key plus permissions in both accounts.

</details>

### secure-1.3-23

_AWS KMS, AWS IAM_

A company is creating customer managed AWS KMS keys for a payments application. The security team must be able to manage the keys, including enabling rotation, disabling keys, and scheduling deletion. Company policy forbids the security team from using the keys to decrypt data. The application's IAM role must be able to encrypt and decrypt data, but it must not be able to change the keys.

Which solution will meet these requirements?

- **A.** Create the keys in a dedicated security account where the security team has kms:* permissions on the keys. Allow the application role cross-account access to encrypt and decrypt with the keys.
- **B.** Write a key policy that enables IAM policies for the account. Attach IAM policies that grant kms:* on the keys to both the security team and the application role.
- **C.** Use the AWS managed keys for the services that the application uses. Grant the security team permission to view the keys in the AWS KMS console.
- **D.** Write a key policy that grants the security team only key administration actions and grants the application role only cryptographic actions such as kms:Encrypt and kms:Decrypt.

<details><summary>Answer</summary>

**Correct: D**

- **A** ❌ A separate account isolates the keys, but kms:* still lets the security team decrypt data. This breaks the policy against the security team using the keys.
- **B** ❌ Granting kms:* to both groups gives the security team permission to decrypt and the application role permission to change the keys. There is no separation of duties.
- **C** ❌ AWS managed keys are managed by AWS. The security team cannot enable rotation settings, disable the keys, or schedule deletion, so it cannot manage the keys.
- **D** ✅ A key policy can separate key administrators from key users. The security team receives only management permissions and the application role receives only cryptographic permissions, which meets both requirements.

KMS key policies separate key administrators, who manage the key, from key users, who perform cryptographic operations. Granting each group only its own actions enforces separation of duties. Remember: managing a key and using a key are different permission sets.

</details>

### secure-1.3-24

_Amazon EFS, AWS DataSync, AWS KMS_

A company runs an application on Amazon EC2 instances that share an Amazon EFS file system. The file system was created without encryption at rest. A new policy requires the data to be encrypted at rest with a customer managed AWS KMS key. The company wants to minimize application downtime.

Which solution will meet these requirements?

- **A.** Edit the existing file system's settings to enable encryption at rest with the customer managed key, and then remount it on the instances.
- **B.** Create an encrypted EFS file system with the customer managed key. Copy the data with AWS DataSync and remount the instances on it.
- **C.** Mount the file system with the Amazon EFS mount helper and the TLS option on every instance.
- **D.** Back up the file system with AWS Backup. Restore the recovery point to a new file system encrypted with the customer managed key, and remount the instances on it.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ Amazon EFS encryption at rest can be enabled only when a file system is created. An existing unencrypted file system cannot be changed to encrypted.
- **B** ✅ Encryption at rest is set when an EFS file system is created, so a new encrypted file system is needed. DataSync copies the data with incremental transfers, which keeps the final cutover short.
- **C** ❌ The TLS mount option encrypts data in transit between the instances and the file system. It does not encrypt the data at rest.
- **D** ❌ The restored file system is encrypted, but writes made after the backup are lost unless the application stops first. The restored files also land in a recovery directory that must be moved, so downtime is longer than with an incremental DataSync copy.

Like RDS, Amazon EFS fixes encryption at rest when the resource is created. To encrypt existing data, create an encrypted file system and migrate with DataSync, whose incremental transfers keep the cutover short. Remember: the TLS mount option is encryption in transit, not at rest.

</details>

### secure-1.3-25

_AWS CloudTrail, Amazon S3, Amazon CloudWatch_

A company stores confidential merger documents in one Amazon S3 bucket. The security team must reliably record the identity of every principal that reads an object from the bucket. The team must be alerted within minutes when a principal that is not on an approved list reads an object.

Which solution will meet these requirements?

- **A.** Create an AWS CloudTrail trail that logs management events. Send the trail to Amazon CloudWatch Logs and create a metric filter and alarm for unapproved readers.
- **B.** Enable S3 server access logging to a separate bucket. Query the logs with Amazon Athena to find unapproved readers.
- **C.** Enable CloudTrail data events for the bucket. Send them to Amazon CloudWatch Logs with a metric filter and alarm for unapproved readers.
- **D.** Enable AWS Config recording for the bucket and create a custom rule that evaluates who accessed the bucket.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ Management events record control plane actions such as bucket configuration changes. Object reads (GetObject) are data events, so they are not in this trail.
- **B** ❌ Server access logs record requests, but delivery is best effort and can take hours, and Athena queries do not raise alerts within minutes.
- **C** ✅ CloudTrail data events record object-level API activity, including GetObject and the identity of the caller. Sending them to CloudWatch Logs supports metric filters and alarms within minutes.
- **D** ❌ AWS Config records resource configuration changes, not object reads, so it cannot report which principals read objects.

Object-level operations such as GetObject are CloudTrail data events, which must be enabled explicitly. With delivery to CloudWatch Logs, metric filters can alarm on them. Remember: management events by default, data events on request.

</details>

### secure-1.3-26

_Amazon S3_

A company's security policy requires that all data sent to and from an Amazon S3 bucket be encrypted in transit. Applications run in a VPC and on premises. Some older applications have been found to use HTTP endpoints. The company wants requests over plain HTTP to be rejected.

Which solution will meet these requirements?

- **A.** Add a bucket policy statement that denies all S3 actions when the aws:SecureTransport condition key is false.
- **B.** Enable S3 Block Public Access on the bucket.
- **C.** Create a gateway VPC endpoint for Amazon S3 and add a bucket policy that allows access only from the endpoint.
- **D.** Add a bucket policy statement that denies all S3 actions when the s3:TlsVersion condition key is less than 1.2.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ The aws:SecureTransport condition key is false for requests made over HTTP. Denying those requests forces every client to use HTTPS, wherever it runs.
- **B** ❌ Block Public Access prevents public access through policies and ACLs. It does not reject authenticated requests that use HTTP.
- **C** ❌ A gateway endpoint keeps VPC traffic on the AWS network, but it does not require TLS. The endpoint-only policy would also block the on-premises applications.
- **D** ❌ The s3:TlsVersion key sets a minimum TLS version for HTTPS requests. A plain HTTP request has no TLS version, so the condition does not match and the deny does not apply. Combine it with aws:SecureTransport to reject HTTP.

A bucket policy that denies requests where aws:SecureTransport is false is the standard way to enforce encryption in transit for Amazon S3. Encryption at rest and network paths do not enforce TLS. Remember: aws:SecureTransport for HTTPS-only access.

</details>

### secure-1.3-27

_AWS KMS, Amazon S3_

A company uses a customer managed AWS KMS key for SSE-KMS encryption of an Amazon S3 bucket in us-east-1. Analysts read the objects through Amazon S3, so their IAM roles allow kms:Decrypt on the key. The security team wants to make sure the analysts cannot call AWS KMS directly to decrypt data keys or other data with this key. Access through Amazon S3 must continue to work.

Which solution will meet these requirements?

- **A.** Add a kms:ViaService condition for s3.us-east-1.amazonaws.com to the key policy statement that lets the analysts use the key.
- **B.** Add an aws:SourceVpce condition to the key policy so that the key can be used only through the company's VPC endpoint.
- **C.** Enable S3 Bucket Keys on the bucket so that Amazon S3 uses a bucket-level key instead of the KMS key for each object.
- **D.** Create a KMS grant for the Amazon S3 service principal and remove kms:Decrypt from the analysts' roles.

<details><summary>Answer</summary>

**Correct: A**

- **A** ✅ The kms:ViaService condition allows use of the key only when the request comes from the named AWS service on the principal's behalf. Direct KMS calls from the analysts are denied while S3 reads still work.
- **B** ❌ This restricts the network path, but an analyst inside the VPC could still call AWS KMS directly through the endpoint and decrypt data outside Amazon S3.
- **C** ❌ S3 Bucket Keys reduce requests to AWS KMS, but the analysts still need kms:Decrypt on the key and could still call KMS directly.
- **D** ❌ With SSE-KMS, Amazon S3 uses the permissions of the requesting principal to call AWS KMS. Without kms:Decrypt, the analysts could no longer read objects through Amazon S3.

The kms:ViaService condition key limits use of a KMS key to requests that an AWS service makes on behalf of a principal. It keeps S3 access working while blocking direct KMS calls. Remember: kms:ViaService restricts which service may use the key; network conditions restrict where requests come from.

</details>

### secure-1.3-28

_Amazon RDS, Amazon RDS Proxy_

A company runs an Amazon RDS for PostgreSQL DB instance. Several applications connect to the database, and the DB instance currently accepts unencrypted connections. A new policy requires every connection to the database to be encrypted in transit. Connections that do not use TLS must be rejected by the database.

Which solution will meet these requirements?

- **A.** Create an Amazon RDS Proxy for the DB instance with the Require Transport Layer Security setting turned on. Point all the applications to the proxy endpoint.
- **B.** Enable encryption at rest for the DB instance with an AWS KMS key.
- **C.** Set the rds.force_ssl parameter to 1 in a custom DB parameter group for the DB instance. Configure clients to trust the RDS certificate authority.
- **D.** Set the require_secure_transport parameter to ON in a custom DB parameter group for the DB instance, and reboot the instance.

<details><summary>Answer</summary>

**Correct: C**

- **A** ❌ RDS Proxy can require TLS for clients that connect through the proxy, but the DB instance still accepts unencrypted connections from clients that connect to it directly.
- **B** ❌ Encryption at rest protects stored data and snapshots. It does not encrypt or control client connections.
- **C** ✅ The rds.force_ssl parameter makes the PostgreSQL engine reject any connection that does not use SSL/TLS, so every connection, from any client, must be encrypted.
- **D** ❌ The require_secure_transport parameter enforces TLS for RDS for MySQL and MariaDB. RDS for PostgreSQL does not have this parameter; it uses rds.force_ssl instead.

To enforce encryption in transit at the database itself, set rds.force_ssl for PostgreSQL (or require_secure_transport for MySQL) in a custom parameter group. A proxy only enforces TLS for clients that use it. Remember: in-transit enforcement for RDS is a parameter group setting.

</details>

### secure-1.3-29

_AWS KMS, AWS CloudHSM, Amazon S3, Amazon EBS_

A company encrypts data in Amazon S3 and Amazon EBS through AWS KMS integration. A new regulation requires the key material to be stored in single-tenant hardware security modules (HSMs) that the company controls inside its VPC. The company also wants HSM audit logs in addition to AWS CloudTrail records. The company wants to keep using the AWS service integrations without changing application code.

Which solution will meet these requirements?

- **A.** Create KMS keys with imported key material. Store the original key material in an on-premises HSM.
- **B.** Create an AWS KMS custom key store backed by an AWS CloudHSM cluster that has HSMs in two Availability Zones. Create the KMS keys in the key store.
- **C.** Create an AWS CloudHSM cluster. Configure the applications to encrypt data with the CloudHSM client libraries before they write it to Amazon S3 and Amazon EBS.
- **D.** Create standard customer managed KMS keys and restrict their key policies to the company's IAM roles.

<details><summary>Answer</summary>

**Correct: B**

- **A** ❌ Imported key material is still stored and used in the multi-tenant HSMs that AWS KMS manages, so the keys are not in single-tenant HSMs that the company controls.
- **B** ✅ KMS keys in a CloudHSM key store have their key material in the company's single-tenant CloudHSM cluster. They work with AWS services like other KMS keys, and both CloudTrail and CloudHSM audit logs record their use.
- **C** ❌ CloudHSM provides single-tenant HSMs, but the applications would perform their own encryption. This requires code changes and gives up the KMS integration with S3 and EBS.
- **D** ❌ Standard KMS keys are protected by HSMs that AWS KMS manages and shares across customers. Restrictive key policies do not make the HSMs single-tenant.

A KMS custom key store backed by AWS CloudHSM combines KMS service integration with key material in single-tenant HSMs that the company controls. Imported key material controls where keys come from, not where they live. Remember: CloudHSM key store when keys must live in your own HSMs but services must still use KMS.

</details>

### secure-1.3-30

_Amazon S3_

A healthcare company stores patient records in a new Amazon S3 bucket. Regulations require each record to be retained for exactly 7 years in a state that no user can delete or modify. To limit legal liability, each record must be deleted automatically when its 7-year period ends.

Which combination of steps will meet these requirements? (Choose TWO.)

- **A.** Enable S3 Object Lock on the bucket with a default retention period of 7 years in compliance mode.
- **B.** Enable S3 Object Lock on the bucket with a default retention period of 7 years in governance mode.
- **C.** Create an S3 Lifecycle rule that transitions objects to S3 Glacier Deep Archive after 7 years.
- **D.** Create an S3 Lifecycle rule that expires objects after 7 years and permanently deletes noncurrent versions 1 day later.
- **E.** Enable MFA delete on the bucket and keep the root user's MFA device in a safe.

<details><summary>Answer</summary>

**Correct: A, D**

- **A** ✅ Compliance mode prevents every user, including the root user, from deleting or overwriting record versions for 7 years. This meets the immutability requirement.
- **B** ❌ Users with the s3:BypassGovernanceRetention permission can delete records early in governance mode, so it does not stop every user.
- **C** ❌ A transition moves records to a cheaper storage class, but it does not delete them. The liability requirement is not met.
- **D** ✅ Lifecycle expiration removes the records automatically once the retention period has ended. Deleting noncurrent versions is needed because Object Lock buckets are versioned.
- **E** ❌ MFA delete adds a step for permanent deletion, but the root user can still delete records, and it does not delete records automatically.

Object Lock in compliance mode enforces the 7-year WORM period, and an S3 Lifecycle expiration rule removes the records when it ends. Lifecycle rules cannot delete locked versions early, so the two controls work together. Remember: Object Lock to keep data, Lifecycle expiration to get rid of it on time.

</details>
