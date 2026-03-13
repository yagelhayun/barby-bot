import { getArtists } from '../repositories/artistsRepository.js';
import { getArtistShows } from '../services/showsService.js';
import { sendMessage } from '../clients/telegramClient.js';
import { NoShowsError } from '../utils/errors.js';

export const notificationsHandler = async (_event, _context) => {
    const artists = await getArtists();

    try {
        const artistShows = await getArtistShows(Object.keys(artists));
        const messages = artistShows.flatMap(({ artist, shows }) => {
            const chatId = artists[artist];

            return shows.map(async (show) => {
                await sendMessage(show, chatId);
            });
        });

        await Promise.all(messages);
        console.log('Successfully sent all show messages');
    } catch (error) {
        if (error instanceof NoShowsError) {
            try {
                console.info('Sending health check message');
                await sendMessage(error.message, process.env.HEALTH_CHAT_ID);
            } catch (err) {
                throw err;
            }
        } else {
            throw error;
        }
    }
}
