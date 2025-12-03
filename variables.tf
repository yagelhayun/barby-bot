variable "bot_token" {
    type = string
    description = "Telegram bot token from BotFather"
}

variable "events_chat_id" {
    type = string
    description = "Telegram events group chat ID"
}

variable "health_chat_id" {
    type = string
    description = "Telegram health group chat ID"
}

variable "aws_region" {
    type = string
    default = "il-central-1"
}
