import { TelegramAPIError } from '../utils/errors.js';

export const sendMessage = async (message, chatId) => {
    console.log(`Sending message to chat ID ${chatId}`);

    const res = await fetch(`https://api.telegram.org/bot${process.env.NOTIFICATIONS_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: message
        })
    });

    if (!res.ok) {
        throw new TelegramAPIError(res);
    }

    console.log('Message sent successfully');
}
