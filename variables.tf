variable "NODE_ENV" {
    type = string
    default = "production"
}

variable "AWS_REGION" {
    type = string
    default = "il-central-1"
}

variable "NOTIFICATIONS_BOT_TOKEN" {
    type = string
    sensitive = true
    description = "Notifications bot token from BotFather"
}

variable "ADMIN_BOT_TOKEN" {
    type = string
    sensitive = true
    description = "Admin bot token from BotFather"
}

variable "ADMIN_BOT_SECRET_TOKEN" {
    type = string
    sensitive = true
    description = "Secret token for Telegram Bot API webhook verification"
}

variable "HEALTH_CHAT_ID" {
    type = string
    description = "Health group chat ID"
}

variable "DATABASE_USER" {
    type = string
}

variable "DATABASE_PASSWORD" {
    type = string
    sensitive = true
}

variable "DATABASE_HOST" {
    type = string
}

variable "DATABASE_PORT" {
    type = number
}

variable "DATABASE_NAME" {
    type = string
}
