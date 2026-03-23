import { cleanEnv, str, num } from 'envalid';
import { createLogger, Logger } from '@yagelhayun/logger/server';

export const env = cleanEnv(process.env, {
    NODE_ENV: str({ choices: ['development', 'test', 'production'] }),
    LOG_LEVEL: str({ choices: ['error', 'warn', 'info', 'debug', 'verbose'] }),

    DATABASE_HOST: str(),
    DATABASE_PORT: num(),
    DATABASE_NAME: str(),
    DATABASE_USER: str(),
    DATABASE_PASSWORD: str(),

    OWNER_TG_USER_ID: str(),
    OWNER_TG_API_ID: num(),
    OWNER_TG_API_HASH: str(),
    OWNER_TG_STRING_SESSION: str(),

    ADMIN_BOT_API_AUTH_TOKEN: str(),
    ADMIN_BOT_USERNAME: str(),
    ADMIN_BOT_TOKEN: str(),
    NOTIFICATIONS_BOT_TOKEN: str(),
    NOTIFICATIONS_BOT_USERNAME: str(),

    HEALTH_CHAT_ID: str(),
});

export const logger: Logger = createLogger({
    minLogLevel: env.LOG_LEVEL,
    isLocal: env.NODE_ENV === 'development',
    redactValues: [
        env.NOTIFICATIONS_BOT_TOKEN,
        env.ADMIN_BOT_API_AUTH_TOKEN,
        env.ADMIN_BOT_TOKEN,
        env.OWNER_TG_API_ID.toString(),
        env.OWNER_TG_API_HASH,
        env.OWNER_TG_STRING_SESSION,
        env.DATABASE_PASSWORD
    ]
});
