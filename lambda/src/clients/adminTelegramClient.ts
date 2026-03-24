import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import type { Logger as GramJsLogger } from 'telegram/extensions/Logger.js';
import { env, logger } from '../utils/config';

let telegramClient: TelegramClient | undefined;

export const getTelegramClient = async (): Promise<TelegramClient> => {
    if (telegramClient) {
        return telegramClient;
    }

    const apiId: number = env.OWNER_TG_API_ID;
    const apiHash: string = env.OWNER_TG_API_HASH;
    const session: string = env.OWNER_TG_STRING_SESSION;

    const baseLogger: GramJsLogger = logger.child({ module: 'AdminTelegramClient' }) as unknown as GramJsLogger;

    telegramClient = new TelegramClient(new StringSession(session), apiId, apiHash, {
        connectionRetries: 5,
        baseLogger,
    });

    if (!telegramClient.connected) {
        await telegramClient.connect();
    }

    return telegramClient;
};
