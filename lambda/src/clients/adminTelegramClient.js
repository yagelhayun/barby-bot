import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { env, logger } from '../utils/config.js';

let telegramClient;

export const getTelegramClient = async () => {
    if (telegramClient) {
        return telegramClient;
    }

    const apiId = env.ADMIN_TG_API_ID;
    const apiHash = env.ADMIN_TG_API_HASH;
    const session = env.ADMIN_TG_STRING_SESSION;

    telegramClient = new TelegramClient(new StringSession(session), apiId, apiHash, {
        connectionRetries: 5,
        baseLogger: logger
    });

    if (!telegramClient.connected) {
        await telegramClient.connect();
    }

    return telegramClient;
};
