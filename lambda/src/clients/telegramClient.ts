import { env, logger } from '../utils/config';
import { UnableToSendBotMessageError } from '../utils/errors';

const sendMessage = (token: string) => async (message: string, chatId: string | number): Promise<void> => {
    logger.info(`Sending message to chat ID ${chatId}`);

    const requestUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const requestOptions: RequestInit = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: message,
        }),
    };

    logger.debug(`Fetching URL '${requestUrl}' with options`, { requestOptions });
    const res: Response = await fetch(requestUrl, requestOptions);

    if (!res.ok) {
        throw new UnableToSendBotMessageError(res);
    }

    logger.info('Message sent successfully');
};

export const sendNotificationMessage = sendMessage(env.NOTIFICATIONS_BOT_TOKEN);
export const sendAdminMessage = sendMessage(env.ADMIN_BOT_TOKEN);
