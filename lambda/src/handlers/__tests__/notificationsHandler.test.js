import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NoShowsError, TelegramAPIError } from '../../utils/errors/index.js';

vi.mock('../../repositories/artistsRepository.js', () => ({ getArtists: vi.fn() }));
vi.mock('../../services/showsService.js', () => ({ getArtistShows: vi.fn() }));
vi.mock('../../clients/telegramClient.js', () => ({ sendNotificationMessage: vi.fn() }));
vi.mock('../../utils/config.js', () => ({
    env: { HEALTH_CHAT_ID: '999888' },
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const { notificationsHandler } = await import('../notificationsHandler.js');
const { getArtists } = await import('../../repositories/artistsRepository.js');
const { getArtistShows } = await import('../../services/showsService.js');
const { sendNotificationMessage } = await import('../../clients/telegramClient.js');

describe('notificationsHandler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('success', () => {
        it('fetches artists, fetches shows, sends a notification per show and returns 200', async () => {
            getArtists.mockResolvedValue({ 'Artist1': 111, 'Artist2': 222 });
            getArtistShows.mockResolvedValue([
                { artist: 'Artist1', shows: ['Show A', 'Show B'] },
                { artist: 'Artist2', shows: ['Show C'] },
            ]);
            sendNotificationMessage.mockResolvedValue(undefined);

            const res = await notificationsHandler({}, {});

            expect(getArtists).toHaveBeenCalledOnce();
            expect(getArtistShows).toHaveBeenCalledWith(['Artist1', 'Artist2']);
            expect(sendNotificationMessage).toHaveBeenCalledTimes(3);
            expect(sendNotificationMessage).toHaveBeenCalledWith('Show A', 111);
            expect(sendNotificationMessage).toHaveBeenCalledWith('Show B', 111);
            expect(sendNotificationMessage).toHaveBeenCalledWith('Show C', 222);
            expect(res).toEqual({ statusCode: 200, body: 'Notifications sent successfully' });
        });

        it('sends no messages when there are artists but no shows (getArtistShows returns empty arrays)', async () => {
            getArtists.mockResolvedValue({ 'Artist1': 111 });
            getArtistShows.mockResolvedValue([{ artist: 'Artist1', shows: [] }]);

            const res = await notificationsHandler({}, {});

            expect(sendNotificationMessage).not.toHaveBeenCalled();
            expect(res).toEqual({ statusCode: 200, body: 'Notifications sent successfully' });
        });

        it('handles single artist with single show', async () => {
            getArtists.mockResolvedValue({ 'Queen': 123 });
            getArtistShows.mockResolvedValue([{ artist: 'Queen', shows: ['One show'] }]);
            sendNotificationMessage.mockResolvedValue(undefined);

            const res = await notificationsHandler({}, {});

            expect(sendNotificationMessage).toHaveBeenCalledOnce();
            expect(sendNotificationMessage).toHaveBeenCalledWith('One show', 123);
            expect(res.statusCode).toBe(200);
        });

        it('handles empty artists map by calling getArtistShows with empty array', async () => {
            getArtists.mockResolvedValue({});
            getArtistShows.mockResolvedValue([]);

            const res = await notificationsHandler({}, {});

            expect(getArtistShows).toHaveBeenCalledWith([]);
            expect(res.statusCode).toBe(200);
        });
    });

    describe('NoShowsError', () => {
        it('sends health check message and returns 300 when getArtistShows throws NoShowsError', async () => {
            getArtists.mockResolvedValue({ 'Artist1': 111, 'Artist2': 222 });
            getArtistShows.mockRejectedValue(new NoShowsError(['Artist1', 'Artist2']));
            sendNotificationMessage.mockResolvedValue(undefined);

            const res = await notificationsHandler({}, {});

            expect(sendNotificationMessage).toHaveBeenCalledOnce();
            expect(sendNotificationMessage).toHaveBeenCalledWith(
                'אין הופעות לאף אחד מArtist1/Artist2 כעת :(',
                '999888'
            );
            expect(res).toEqual({ statusCode: 300, body: 'No shows to notify, sent health check message' });
        });

        it('returns 502 when NoShowsError is thrown but sending health message fails', async () => {
            getArtists.mockResolvedValue({ 'Artist1': 111 });
            getArtistShows.mockRejectedValue(new NoShowsError(['Artist1']));
            sendNotificationMessage.mockRejectedValue(new TelegramAPIError({ status: 429, statusText: 'Too Many Requests' }));

            const res = await notificationsHandler({}, {});

            expect(res).toEqual({ statusCode: 502, body: 'Telegram API error' });
        });
    });

    describe('TelegramAPIError', () => {
        it('returns 502 when sendNotificationMessage throws TelegramAPIError', async () => {
            getArtists.mockResolvedValue({ 'Artist1': 111 });
            getArtistShows.mockResolvedValue([{ artist: 'Artist1', shows: ['Show text'] }]);
            sendNotificationMessage.mockRejectedValue(new TelegramAPIError({ status: 403, statusText: 'Forbidden' }));

            const res = await notificationsHandler({}, {});

            expect(res).toEqual({ statusCode: 502, body: 'Telegram API error' });
        });
    });

    describe('unexpected errors', () => {
        it('returns 500 when getArtists throws', async () => {
            getArtists.mockRejectedValue(new Error('DB connection failed'));

            const res = await notificationsHandler({}, {});

            expect(res).toEqual({ statusCode: 500, body: 'An unexpected error occurred' });
            expect(sendNotificationMessage).not.toHaveBeenCalled();
        });

        it('returns 500 when getArtistShows throws a non-NoShows error', async () => {
            getArtists.mockResolvedValue({ 'Artist1': 111 });
            getArtistShows.mockRejectedValue(new Error('Barby API down'));

            const res = await notificationsHandler({}, {});

            expect(res).toEqual({ statusCode: 500, body: 'An unexpected error occurred' });
        });
    });
});
