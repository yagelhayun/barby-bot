import 'dotenv/config';
import axios, { AxiosError } from 'axios';
import { generateShowMessage } from './shows.js';
import { BarbyAPIError, NoShowsError, TelegramAPIError } from './errors.js';

const sendMessage = async (message, chatId) => {
    try {
        await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: chatId,
            text: message
        });
    } catch (error) {
        if (error instanceof AxiosError) {
            throw new TelegramAPIError(error);
        }
    }
}

const main = async () => {
    const artist = "טונה";

    try {
        const shows = await generateShowMessage(artist);
        const messages = shows.map(async (show) => {
            await sendMessage(show, process.env.TELEGRAM_EVENTS_CHAT_ID);
            console.log('Successfully sent message');
        });

        await Promise.all(messages);
    } catch (error) {
        if (error instanceof NoShowsError) {
            try {
                await sendMessage(error.message, process.env.TELEGRAM_HEALTH_CHAT_ID);
            } catch (err) {
                if (err instanceof TelegramAPIError) {
                    console.error(err);
                }
            }
        } else if (error instanceof BarbyAPIError || error instanceof TelegramAPIError) {
            console.error(error);
        }
    }
}

main();
