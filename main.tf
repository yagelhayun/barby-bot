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
  source_dir  = "${path.module}/lambda/dist"
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
      NODE_ENV                    = var.NODE_ENV
      LOG_LEVEL                   = var.LOG_LEVEL
      NOTIFICATIONS_BOT_TOKEN     = var.NOTIFICATIONS_BOT_TOKEN
      NOTIFICATIONS_BOT_USERNAME  = var.NOTIFICATIONS_BOT_USERNAME
      ADMIN_BOT_TOKEN             = var.ADMIN_BOT_TOKEN
      ADMIN_BOT_USERNAME          = var.ADMIN_BOT_USERNAME
      ADMIN_BOT_API_AUTH_TOKEN    = var.ADMIN_BOT_API_AUTH_TOKEN
      OWNER_TG_USER_ID            = var.OWNER_TG_USER_ID
      OWNER_TG_API_ID             = var.OWNER_TG_API_ID
      OWNER_TG_API_HASH           = var.OWNER_TG_API_HASH
      OWNER_TG_STRING_SESSION     = var.OWNER_TG_STRING_SESSION
      DATABASE_USER               = var.DATABASE_USER
      DATABASE_PASSWORD           = var.DATABASE_PASSWORD
      DATABASE_HOST               = var.DATABASE_HOST
      DATABASE_PORT               = var.DATABASE_PORT
      DATABASE_NAME               = var.DATABASE_NAME
      HEALTH_CHAT_ID              = var.HEALTH_CHAT_ID
    }
  }
}

resource "aws_iam_role" "scheduler_role" {
  name = "barby_bot_scheduler_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "scheduler.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "scheduler_lambda_invoke" {
  name = "barby_bot_scheduler_invoke"
  role = aws_iam_role.scheduler_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "lambda:InvokeFunction"
      Resource = aws_lambda_function.barby_bot.arn
    }]
  })
}

resource "aws_scheduler_schedule" "barby_bot" {
  name = "barby_bot_schedule"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression          = "cron(0 */8 * * ? *)"
  schedule_expression_timezone = "Asia/Jerusalem"

  target {
    arn      = aws_lambda_function.barby_bot.arn
    role_arn = aws_iam_role.scheduler_role.arn
    input    = jsonencode({ source = "aws.scheduler" })
  }
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
  value = aws_scheduler_schedule.barby_bot.name
}

output "telegram_webhook_url" {
  value = "${aws_apigatewayv2_api.barby_api.api_endpoint}/telegram"
}
