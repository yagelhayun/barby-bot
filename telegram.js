import 'dotenv/config';
import axios from 'axios';
import { getShows } from './shows.js';

const sendMessage = async (show) => {
    await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: show
    });
}

const main = async () => {
    const shows = await getShows("טונה");

    const messages = shows.map(async (show) => {
        try {
            await sendMessage(show);
            console.log('Successfully sent message');
        } catch (error) {
            console.error("Couldn't send message", error);
        }
    });

    await Promise.all(messages);
}

main();
