# Lambda Tuna Concert in Barby (Terraform + GitHub Actions)


This repo deploys a Node.js AWS Lambda that calls the Barby API and notifies a Telegram group via bot when Tuna concerts availability changes. It uses Terraform to create the Lambda and EventBridge schedule, and GitHub Actions to automate packaging and deployment.


### What you need


- An AWS account and an IAM user with permissions to create Lambda, IAM roles, EventBridge, CloudWatch logs.
- Terraform installed locally if you want to run it manually.
- GitHub repository and GitHub Actions enabled.
- Telegram Bot token and target chat ID.


### Required GitHub Secrets


Set the following repository secrets in GitHub settings > Secrets & variables > Actions:

- `AWS_REGION`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_EVENTS_CHAT_ID`
- `TELEGRAM_HEALTH_CHAT_ID` (Used to signal that everything works)


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


Open this in a browser: https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
