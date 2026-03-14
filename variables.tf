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
}

variable "ADMIN_BOT_TOKEN" {
    type = string
    sensitive = true
}

variable "ADMIN_BOT_SECRET_TOKEN" {
    type = string
    sensitive = true
    description = "Secret token for Telegram Bot API webhook verification"
}

variable "ADMIN_BOT_OWNER_ID" {
    type = string
    description = "Telegram User ID of Yagel Hayun"
}

variable "HEALTH_CHAT_ID" {
    type = string
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
