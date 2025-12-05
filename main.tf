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
  region = var.aws_region
}

resource "aws_iam_role" "lambda_role" {
  name = "tuna_barby_lambda_role"

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

resource "aws_lambda_function" "tuna_barby" {
  function_name = "tuna_barby"
  filename      = data.archive_file.lambda_zip.output_path
  handler       = "index.main"
  runtime       = "nodejs24.x"

  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  role = aws_iam_role.lambda_role.arn

  timeout = 10

  environment {
    variables = {
      TELEGRAM_BOT_TOKEN = var.bot_token
      TELEGRAM_EVENTS_CHAT_ID   = var.events_chat_id
      TELEGRAM_HEALTH_CHAT_ID   = var.health_chat_id
    }
  }
}

resource "aws_cloudwatch_event_rule" "schedule" {
  name                = "tuna_barby_schedule"
  schedule_expression = "cron(0 */8 * * ? *)"
}

resource "aws_cloudwatch_event_target" "target" {
  rule      = aws_cloudwatch_event_rule.schedule.name
  target_id = "lambda"
  arn       = aws_lambda_function.tuna_barby.arn
}

# Permission for EventBridge to invoke Lambda
resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.tuna_barby.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.schedule.arn
}

output "lambda_function_name" {
  value = aws_lambda_function.tuna_barby.function_name
}

output "schedule_rule" {
  value = aws_cloudwatch_event_rule.schedule.name
}
