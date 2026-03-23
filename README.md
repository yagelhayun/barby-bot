# Lambda Barby Bot


This repo deploys a Node.js AWS Lambda that calls the Barby API and notifies a Telegram group via bot when desired artists concerts availability changes. It uses Terraform to create the Lambda and EventBridge schedule, and GitHub Actions to automate packaging and deployment.


### What you need to know

<!-- Todo: explain that this lambda must run in the israeli region since the barby site is unreachable in other regions -->

### What you need


- An AWS account and an IAM user with permissions to create Lambda, IAM roles, EventBridge, CloudWatch logs.
- Terraform installed locally if you want to run it manually.
- GitHub repository and GitHub Actions enabled.
- Telegram Bot token and target chat ID.


### Required GitHub Secrets

<!-- TODO: Update this -->

### How it works


1. GitHub Actions workflow runs on push to `main`.
2. It installs Node deps inside `lambda/`, zips the folder into `lambda.zip`.
3. Terraform uses `data.archive_file` to pack the `lambda/` directory (CI ensures the zip is present) and deploys the Lambda and EventBridge rule.


### Local deploy


If you want to run Terraform locally:


```bash
cd repo
cd lambda && npm install && cd ..
terraform init
terraform apply
```


### How to retrieve the group chat ID in Telegram


Open this in a browser: https://api.telegram.org/bot<BOT_TOKEN>/getUpdates

## How to set a webhook with auth token

curl --location 'https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?secret_token=<AUTH_TOKEN>' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'url=<API_URL>'
