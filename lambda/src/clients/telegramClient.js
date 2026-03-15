import { env, logger } from '../utils/config.js';
import { TelegramAPIError } from '../utils/errors/index.js';

const sendMessage = async (token, message, chatId) => {
    logger.info(`Sending message to chat ID ${chatId}`);

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: message,
        }),
    });

    if (!res.ok) {
        throw new TelegramAPIError(res);
    }

    logger.info('Message sent successfully');
};

export const sendNotificationMessage = async (message, chatId) => {
    await sendMessage(env.NOTIFICATIONS_BOT_TOKEN, message, chatId);
};

export const sendAdminMessage = async (message, chatId) => {
    await sendMessage(env.ADMIN_BOT_TOKEN, message, chatId);
};
