import { env, logger } from '../utils/config.js';
import { buildHandlerResponse } from '../utils/helpers.js';
import { getArtistShows } from '../services/showsService.js';
import { getArtists } from '../services/artistsService.js';
import { sendNotificationMessage } from '../clients/telegramClient.js';
import { NoShowsError } from '../utils/errors/index.js';

/**
 * Notifications handler: sends telegram messages and returns a status object
 * for test/direct invocation. Top-level main always returns the final Lambda response.
 */
export const notificationsHandler = async (_event, _context) => {
    try {
        const artists = await getArtists();
        const artistShows = await getArtistShows(Object.keys(artists));
        const messages = artistShows.flatMap(({ artist, shows }) => {
            const chatId = artists[artist];
            return shows.map((show) => sendNotificationMessage(show, chatId));
        });

        const results = await Promise.allSettled(messages);
        const failed = results.filter(({ status }) => status === 'rejected');
        const succeeded = results.length - failed.length;

        if (failed.length > 0) {
            failed.forEach(({ reason }) => logger.error('Failed to send notification message:', reason));
        }

        logger.info(`Sent ${succeeded}/${results.length} notification messages`);

        return results.length > 0 && failed.length === results.length
            ? buildHandlerResponse(502, 'All notifications failed to send')
            : buildHandlerResponse(200, 'Notifications sent successfully');
    } catch (error) {
        if (error instanceof NoShowsError) {
            try {
                const { artists } = error;

                logger.warn(error.message);
                logger.info('Sending health check message');
                await sendNotificationMessage(`אין הופעות לאף אחד מ${artists.join('/')} כעת :(`, env.HEALTH_CHAT_ID);
                return buildHandlerResponse(300, 'No shows to notify, sent health check message');
            } catch (sendError) {
                logger.error('Failed to send health check message', sendError);
                return buildHandlerResponse(502, 'Telegram API error');
            }
        } else {
            logger.error('Unexpected error in notifications handler:', error);
            return buildHandlerResponse(500, 'An unexpected error occurred');
        }
    }
}
