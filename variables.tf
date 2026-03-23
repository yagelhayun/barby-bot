variable "AWS_REGION" {
    type = string
    default = "il-central-1"
}

variable "NODE_ENV" {
    type = string
    default = "production"
}

variable "LOG_LEVEL" {
    type = string
    default = "debug"
}

variable "NOTIFICATIONS_BOT_USERNAME" {
    type = string
}

variable "NOTIFICATIONS_BOT_TOKEN" {
    type = string
    sensitive = true
}

variable "ADMIN_BOT_USERNAME" {
    type = string
}

variable "ADMIN_BOT_TOKEN" {
    type = string
    sensitive = true
}

variable "ADMIN_BOT_API_AUTH_TOKEN" {
    type = string
    sensitive = true
    description = "Secret token for Telegram Bot API webhook verification"
}

variable "OWNER_TG_USER_ID" {
    type = string
    description = "Telegram User ID of Yagel Hayun"
}

variable "OWNER_TG_API_ID" {
  type = number
  sensitive = true
}

variable "OWNER_TG_API_HASH" {
  type = string
  sensitive = true
}

variable "OWNER_TG_STRING_SESSION" {
  type = string
  sensitive = true
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
