terraform {
  required_version = ">= 1.0"

  backend "remote" {
    organization = "TunaBarby"

    workspaces {
      name = "tuna-barby"
    }
  }
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.0"
    }
  }
}

provider "aws" {
  region = var.AWS_REGION
}

resource "aws_iam_role" "lambda_role" {
  name = "barby_bot_lambda_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/lambda.zip"
}

resource "aws_lambda_function" "barby_bot" {
  function_name = "barby_bot"
  filename      = data.archive_file.lambda_zip.output_path
  handler       = "index.main"
  runtime       = "nodejs24.x"

  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  role = aws_iam_role.lambda_role.arn

  timeout = 10

  environment {
    variables = {
      NOTIFICATIONS_BOT_TOKEN = var.NOTIFICATIONS_BOT_TOKEN
      ADMIN_BOT_TOKEN         = var.ADMIN_BOT_TOKEN
      NODE_ENV                = var.NODE_ENV
      DATABASE_USER           = var.DATABASE_USER
      DATABASE_PASSWORD       = var.DATABASE_PASSWORD
      DATABASE_HOST           = var.DATABASE_HOST
      DATABASE_PORT           = var.DATABASE_PORT
      DATABASE_NAME           = var.DATABASE_NAME
      HEALTH_CHAT_ID          = var.HEALTH_CHAT_ID
    }
  }
}

resource "aws_cloudwatch_event_rule" "schedule" {
  name                = "barby_bot_schedule"
  schedule_expression = "cron(0 */8 * * ? *)"
}

resource "aws_cloudwatch_event_target" "target" {
  rule      = aws_cloudwatch_event_rule.schedule.name
  target_id = "lambda"
  arn       = aws_lambda_function.barby_bot.arn
}

# Permission for EventBridge to invoke Lambda
resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.barby_bot.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.schedule.arn
}

resource "aws_lambda_function_url" "barby_bot_url" {
  function_name      = aws_lambda_function.barby_bot.function_name
  authorization_type = "NONE"

  cors {
    allow_origins = ["*"]
    allow_methods = ["POST"]
  }
}

resource "aws_lambda_permission" "allow_public_url" {
  statement_id  = "AllowPublicAccessFunctionURL"
  action        = "lambda:InvokeFunctionUrl"
  function_name = aws_lambda_function.barby_bot.function_name
  principal     = "*"

  function_url_auth_type = "NONE"
}

output "lambda_function_name" {
  value = aws_lambda_function.barby_bot.function_name
}

output "schedule_rule" {
  value = aws_cloudwatch_event_rule.schedule.name
}

output "lambda_function_url" {
  value = aws_lambda_function_url.barby_bot_url.function_url
}