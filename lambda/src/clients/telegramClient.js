import { env, logger } from '../utils/config.js';
import { UnableToSendBotMessageError } from '../utils/errors/index.js';

const sendMessage = (token) => async (message, chatId) => {
    logger.info(`Sending message to chat ID ${chatId}`);

    const requestUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: message,
        }),
    };

    logger.debug(`Fetching URL '${requestUrl}' with options`, requestOptions);
    const res = await fetch(requestUrl, requestOptions);

    if (!res.ok) {
        throw new UnableToSendBotMessageError(res);
    }

    logger.info('Message sent successfully');
};

export const sendNotificationMessage = sendMessage(env.NOTIFICATIONS_BOT_TOKEN);
export const sendAdminMessage = sendMessage(env.ADMIN_BOT_TOKEN);
