export type TelegramEntity = {
    offset: number;
    length: number;
    type: string;
};

export type TelegramMessage = {
    chat: { id: number; type: string };
    text: string;
    entities?: TelegramEntity[];
};

export type TelegramWebhookBody = {
    message: TelegramMessage;
};
