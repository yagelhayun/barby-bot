variable "NODE_ENV" {
    type = string
    default = "production"
}

variable "AWS_REGION" {
    type = string
    default = "il-central-1"
}

variable "BOT_TOKEN" {
    type = string
    sensitive = true
    description = "Bot token from BotFather"
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
