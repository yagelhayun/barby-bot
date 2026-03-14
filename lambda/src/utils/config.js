// TODO: initialize a logger

import { cleanEnv, str, num } from "envalid";

export const env = cleanEnv(process.env, {
    NODE_ENV: str({ choices: ["development", "test", "production"] }),

    DATABASE_HOST: str(),
    DATABASE_PORT: num(),
    DATABASE_NAME: str(),
    DATABASE_USER: str(),
    DATABASE_PASSWORD: str(),
    
    ADMIN_BOT_USERNAME: str(),
    ADMIN_BOT_SECRET_TOKEN: str(),
    ADMIN_BOT_OWNER_ID: str(),
    ADMIN_BOT_TOKEN: str(),

    // ADMIN_TG_API_ID: str(),
    // ADMIN_TG_API_HASH: str(),
    // ADMIN_TG_STRING_SESSION: str(),

    NOTIFICATIONS_BOT_TOKEN: str(),
    NOTIFICATIONS_BOT_USERNAME: str(),
    HEALTH_CHAT_ID: str(),
});
