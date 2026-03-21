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
  excludes = [
    ".env",
    "vitest.config.js",
    "package-lock.json",
    "scripts",
    "supabase",
    "src/handlers/__tests__",
  ]
}

resource "aws_lambda_function" "barby_bot" {
  function_name = "barby_bot"
  filename      = data.archive_file.lambda_zip.output_path
  handler       = "src/index.main"
  runtime       = "nodejs24.x"

  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  role = aws_iam_role.lambda_role.arn

  timeout = 10

  environment {
    variables = {
      NODE_ENV                    = var.NODE_ENV
      LOG_LEVEL                   = var.LOG_LEVEL
      NOTIFICATIONS_BOT_TOKEN     = var.NOTIFICATIONS_BOT_TOKEN
      NOTIFICATIONS_BOT_USERNAME  = var.NOTIFICATIONS_BOT_USERNAME
      ADMIN_BOT_USERNAME          = var.ADMIN_BOT_USERNAME
      ADMIN_BOT_TOKEN             = var.ADMIN_BOT_TOKEN
      ADMIN_BOT_SECRET_TOKEN      = var.ADMIN_BOT_SECRET_TOKEN
      ADMIN_BOT_OWNER_ID          = var.ADMIN_BOT_OWNER_ID
      ADMIN_TG_API_ID             = var.ADMIN_TG_API_ID
      ADMIN_TG_API_HASH           = var.ADMIN_TG_API_HASH
      ADMIN_TG_STRING_SESSION     = var.ADMIN_TG_STRING_SESSION
      DATABASE_USER               = var.DATABASE_USER
      DATABASE_PASSWORD           = var.DATABASE_PASSWORD
      DATABASE_HOST               = var.DATABASE_HOST
      DATABASE_PORT               = var.DATABASE_PORT
      DATABASE_NAME               = var.DATABASE_NAME
      HEALTH_CHAT_ID              = var.HEALTH_CHAT_ID
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

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.barby_bot.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.schedule.arn
}

resource "aws_apigatewayv2_api" "barby_api" {
  name          = "barby-bot-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = aws_apigatewayv2_api.barby_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.barby_bot.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "telegram_webhook" {
  api_id    = aws_apigatewayv2_api.barby_api.id
  route_key = "POST /telegram"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.barby_api.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "allow_apigateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.barby_bot.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.barby_api.execution_arn}/*/*"
}

output "lambda_function_name" {
  value = aws_lambda_function.barby_bot.function_name
}

output "schedule_rule" {
  value = aws_cloudwatch_event_rule.schedule.name
}

output "telegram_webhook_url" {
  value = "${aws_apigatewayv2_api.barby_api.api_endpoint}/telegram"
}
