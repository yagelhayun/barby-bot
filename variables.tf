variable "bot_token" {
    type = string
    description = "Bot token from BotFather"
}
variable "yonibloch_events_chat_id" {
    type = string
    description = "Yoni Bloch events group chat ID"
}

variable "tuna_events_chat_id" {
    type = string
    description = "Tuna events group chat ID"
}

variable "health_chat_id" {
    type = string
    description = "Health group chat ID"
}

variable "node_env" {
    type = string
    default = "production"
}

variable "aws_region" {
    type = string
    default = "il-central-1"
}
