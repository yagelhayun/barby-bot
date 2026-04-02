import { setLogMetadata } from '@yagelhayun/logger/server';
import { env, logger } from '../utils/config';
import { buildHandlerResponse } from '../utils/helpers';
import { getArtistShows } from '../services/showsService';
import { getArtists, filterValidArtists } from '../services/artistsService';
import { sendNotificationMessage } from '../clients/telegramClient';
import { DatabaseConnectionError, NoShowsError } from '../utils/errors';
import type { HandlerResponse, ArtistMap, ArtistShows } from '../types';

const isRejected = (result: PromiseSettledResult<unknown>): result is PromiseRejectedResult =>
    result.status === 'rejected';

/**
 * Notifications handler: sends telegram messages and returns a status object
 * for test/direct invocation. Top-level main always returns the final Lambda response.
 */
export const notificationsHandler = async (_event?: unknown, _context?: unknown): Promise<HandlerResponse> => {
    try {
        const artists: ArtistMap = await getArtists();
        setLogMetadata('artistCount', Object.keys(artists).length);

        const validArtists: ArtistMap = await filterValidArtists(artists);

        const artistShows: ArtistShows[] = await getArtistShows(Object.keys(validArtists));
        const messages: Promise<void>[] = artistShows.flatMap(({ artist, shows }: ArtistShows) => {
            const chatId: string = validArtists[artist];
            return shows.map((show: string) => sendNotificationMessage(show, chatId));
        });
        setLogMetadata('messageCount', messages.length);

        const results: PromiseSettledResult<void>[] = await Promise.allSettled(messages);
        const failed: PromiseRejectedResult[] = results.filter(isRejected);
        const succeeded: number = results.length - failed.length;

        if (failed.length > 0) {
            failed.forEach(({ reason }: PromiseRejectedResult) =>
                logger.error('Failed to send notification', { reason }));
        }

        logger.info(`Sent ${succeeded}/${results.length} notifications`);

        return results.length > 0 && failed.length === results.length
            ? buildHandlerResponse(502, 'All notifications failed to send')
            : buildHandlerResponse(200, 'Notifications sent successfully');
    } catch (error) {
        if (error instanceof NoShowsError) {
            try {
                const { artists }: NoShowsError = error;

                logger.warn('No shows found for any artist', { artists });
                logger.info('Sending health check message');
                await sendNotificationMessage(`אין הופעות לאף אחד מ${artists.join('/')} כעת :(`, env.HEALTH_CHAT_ID);
                return buildHandlerResponse(300, 'No shows to notify, sent health check message');
            } catch (sendError) {
                logger.error('Failed to send health check message', { error: sendError });
                return buildHandlerResponse(502, 'Telegram API error');
            }
        } else if (error instanceof DatabaseConnectionError) {
            logger.error('Database connection failed in notifications handler', { error });
            return buildHandlerResponse(503, 'Database unavailable');
        } else {
            logger.error('Unexpected error in notifications handler', { error });
            return buildHandlerResponse(500, 'An unexpected error occurred');
        }
    }
};
