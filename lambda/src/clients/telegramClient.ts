import { env, logger } from '../utils/config';
import { UnableToSendBotMessageError } from '../utils/errors';

export const sendMessage = async (message: string, chatId: string | number): Promise<void> => {
    logger.info('Sending Telegram message', { chatId });

    const requestUrl = `https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`;
    const requestOptions: RequestInit = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: message,
        }),
    };

    logger.debug('Sending request to Telegram API', { url: requestUrl });
    const res: Response = await fetch(requestUrl, requestOptions);

    if (!res.ok) {
        throw new UnableToSendBotMessageError(res);
    }

    logger.debug('Telegram message sent', { chatId });
};
