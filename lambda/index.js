import 'dotenv/config';
import { getArtists } from './artists.js';
import { NoShowsError } from './errors.js';
import { sendMessage } from './telegram.js';
import { getArtistShows } from './shows.js';

export const main = async () => {
    const artists = await getArtists();

    try {
        const artistShows = await getArtistShows(Object.keys(artists));
        const messages = artistShows.flatMap(({ artist, shows }) => {
            const chatId = artists[artist];

            return shows.map(async (show) => {
                await sendMessage(show, chatId)
            });
        });

        await Promise.all(messages);
        console.log('Successfully sent all show messages');
    } catch (error) {
        if (error instanceof NoShowsError) {
            try {
                await sendMessage(error.message, process.env.HEALTH_CHAT_ID);
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
