import 'dotenv/config';
import { NoShowsError } from './errors.js';
import { sendMessage } from './telegram.js';
import { generateShowMessage } from './shows.js';

export const main = async () => {
    const artist = "טונה"; // yoni bloch

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
                console.error(err);
            }
        } else {
            console.error(error);
        }
    }
}

if (process.env.NODE_ENV === 'development') {
    main();
}
