variable "BOT_TOKEN" {
    type = string
    description = "Bot token from BotFather"
}
variable "YONIBLOCH_EVENTS_CHAT_ID" {
    type = string
    description = "Yoni Bloch events group chat ID"
}

variable "TUNA_EVENTS_CHAT_ID" {
    type = string
    description = "Tuna events group chat ID"
}

variable "DUDUTASA_EVENTS_CHAT_ID" {
    type = string
    description = "Dudu Tasa events group chat ID"
}

variable "HEALTH_CHAT_ID" {
    type = string
    description = "Health group chat ID"
}

variable "NODE_ENV" {
    type = string
    default = "production"
}

variable "AWS_REGION" {
    type = string
    default = "il-central-1"
}
