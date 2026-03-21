import { env, logger } from '../utils/config.js';
import { buildHandlerResponse } from '../utils/helpers.js';
import { getArtistShows } from '../services/showsService.js';
import { getArtists } from '../services/artistsService.js';
import { sendNotificationMessage } from '../clients/telegramClient.js';
import { NoShowsError, UnableToSendBotMessageError } from '../utils/errors/index.js';

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

            return shows.map(async (show) => {
                await sendNotificationMessage(show, chatId);
            });
        });

        await Promise.all(messages);
        logger.info('Successfully sent all show messages');

        return buildHandlerResponse(200, 'Notifications sent successfully');
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
        } else if (error instanceof UnableToSendBotMessageError) {
            logger.error('Failed to send notification message:', error);
            return buildHandlerResponse(502, 'Telegram API error');
        } else {
            return buildHandlerResponse(500, 'An unexpected error occurred');
        }
    }
}
