import { env, logger } from '../utils/config';
import { buildHandlerResponse } from '../utils/helpers';
import { getArtistShows } from '../services/showsService';
import { getArtists } from '../services/artistsService';
import { sendNotificationMessage } from '../clients/telegramClient';
import { NoShowsError } from '../utils/errors';
import type { HandlerResponse, ArtistMap, ArtistShows } from '../types';

const isRejected = (result: PromiseSettledResult<unknown>): result is PromiseRejectedResult =>
    result.status === 'rejected';

/**
 * Notifications handler: sends telegram messages and returns a status object
 * for test/direct invocation. Top-level main always returns the final Lambda response.
 */
export const notificationsHandler = async (_event: unknown, _context: unknown): Promise<HandlerResponse> => {
    try {
        const artists: ArtistMap = await getArtists();
        const artistShows: ArtistShows[] = await getArtistShows(Object.keys(artists));
        const messages: Promise<void>[] = artistShows.flatMap(({ artist, shows }: ArtistShows) => {
            const chatId: string = artists[artist];
            return shows.map((show: string) => sendNotificationMessage(show, chatId));
        });

        const results: PromiseSettledResult<void>[] = await Promise.allSettled(messages);
        const failed: PromiseRejectedResult[] = results.filter(isRejected);
        const succeeded: number = results.length - failed.length;

        if (failed.length > 0) {
            failed.forEach(({ reason }: PromiseRejectedResult) =>
                logger.error('Failed to send notification message:', reason));
        }

        logger.info(`Sent ${succeeded}/${results.length} notification messages`);

        return results.length > 0 && failed.length === results.length
            ? buildHandlerResponse(502, 'All notifications failed to send')
            : buildHandlerResponse(200, 'Notifications sent successfully');
    } catch (error) {
        if (error instanceof NoShowsError) {
            try {
                const { artists }: { artists: string[] } = error;

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
};
