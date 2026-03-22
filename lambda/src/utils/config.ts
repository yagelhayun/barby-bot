import { cleanEnv, str, num } from 'envalid';
import { createLogger } from '@yagelhayun/logger/server';
import type { Logger } from 'winston';

export const env = cleanEnv(process.env, {
    NODE_ENV: str({ choices: ['development', 'test', 'production'] }),
    LOG_LEVEL: str({ choices: ['error', 'warn', 'info', 'debug', 'verbose'] }),

    DATABASE_HOST: str(),
    DATABASE_PORT: num(),
    DATABASE_NAME: str(),
    DATABASE_USER: str(),
    DATABASE_PASSWORD: str(),

    ADMIN_BOT_USERNAME: str(),
    ADMIN_BOT_SECRET_TOKEN: str(),
    ADMIN_BOT_OWNER_ID: str(),
    ADMIN_BOT_TOKEN: str(),

    ADMIN_TG_API_ID: num(),
    ADMIN_TG_API_HASH: str(),
    ADMIN_TG_STRING_SESSION: str(),

    NOTIFICATIONS_BOT_TOKEN: str(),
    NOTIFICATIONS_BOT_USERNAME: str(),
    HEALTH_CHAT_ID: str(),
});

export const logger: Logger = createLogger({
    minLogLevel: env.LOG_LEVEL,
    isLocal: env.NODE_ENV === 'development',
});
