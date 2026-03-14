import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';

let telegramClient;

export const getTelegramClient = async () => {
    if (telegramClient) {
        return telegramClient;
    }

    const apiId = parseInt(process.env.ADMIN_TG_API_ID ?? '', 10);
    const apiHash = process.env.ADMIN_TG_API_HASH;
    const session = process.env.ADMIN_TG_STRING_SESSION;

    telegramClient = new TelegramClient(new StringSession(session), apiId, apiHash, {
        connectionRetries: 5,
    });

    if (!telegramClient.connected) {
        await telegramClient.connect();
    }

    return telegramClient;
};
