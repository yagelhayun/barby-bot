import { env } from '../utils/config.js';
import { getArtistShows } from '../services/showsService.js';
import { getArtists } from '../repositories/artistsRepository.js';
import { sendNotificationMessage } from '../clients/telegramClient.js';
import { NoShowsError, TelegramAPIError } from '../utils/errors/index.js';

export const notificationsHandler = async (_event, _context) => {
    try {
        const artists = await getArtists();
        const artistShows = await getArtistShows(Object.keys(artists));
        const messages = artistShows.flatMap(({ artist, shows }) => {
            const chatId = artists[artist];

            return shows.map(async (show) => {
                await sendNotificationMessage(show, chatId);
            });
        });

        await Promise.all(messages);
        console.log('Successfully sent all show messages');

        return { statusCode: 200, body: 'Notifications sent successfully' };
    } catch (error) {
        if (error instanceof NoShowsError) {
            try {
                const { artists } = error;

                console.warn(error.message);
                console.info('Sending health check message');
                await sendNotificationMessage(`אין הופעות לאף אחד מ${artists.join('/')} כעת :(`, env.HEALTH_CHAT_ID);
                return { statusCode: 300, body: 'No shows to notify, sent health check message' };
            } catch (sendError) {
                console.error('Failed to send health check message', sendError);
                return { statusCode: 502, body: 'Telegram API error' };
            }
        } else if (error instanceof TelegramAPIError) {
            console.error('Failed to send notification message:', error);
            return { statusCode: 502, body: 'Telegram API error' };
        } else {
            return { statusCode: 500, body: 'An unexpected error occurred' };
        }
    }
}
