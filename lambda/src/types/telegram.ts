export interface TelegramEntity {
    offset: number;
    length: number;
    type: string;
}

export interface TelegramMessage {
    chat: { id: number; type: string };
    text: string;
    entities?: TelegramEntity[];
}

export interface TelegramWebhookBody {
    message: TelegramMessage;
}
