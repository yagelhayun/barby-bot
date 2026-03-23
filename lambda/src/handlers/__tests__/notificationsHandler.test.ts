import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NoShowsError } from '../../utils/errors';

vi.mock('../../services/artistsService.js', () => ({ getArtists: vi.fn() }));
vi.mock('../../services/showsService.js', () => ({ getArtistShows: vi.fn() }));
vi.mock('../../clients/telegramClient.js', () => ({ sendMessage: vi.fn() }));
vi.mock('../../utils/config.js', () => ({
    env: { HEALTH_CHAT_ID: '999888' },
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const { notificationsHandler } = await import('../notificationsHandler.js');
const { getArtists } = await import('../../services/artistsService.js');
const { getArtistShows } = await import('../../services/showsService.js');
const { sendMessage } = await import('../../clients/telegramClient.js');
const { logger } = await import('../../utils/config.js');

describe('notificationsHandler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('success', () => {
        it('sends a notification per show and returns 200', async () => {
            (getArtists as ReturnType<typeof vi.fn>).mockResolvedValue({ 'Artist1': 111, 'Artist2': 222 });
            (getArtistShows as ReturnType<typeof vi.fn>).mockResolvedValue([
                { artist: 'Artist1', shows: ['Show A', 'Show B'] },
                { artist: 'Artist2', shows: ['Show C'] },
            ]);
            (sendMessage as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            const res = await notificationsHandler({}, {});

            expect(getArtistShows).toHaveBeenCalledWith(['Artist1', 'Artist2']);
            expect(sendMessage).toHaveBeenCalledTimes(3);
            expect(sendMessage).toHaveBeenCalledWith('Show A', 111);
            expect(sendMessage).toHaveBeenCalledWith('Show B', 111);
            expect(sendMessage).toHaveBeenCalledWith('Show C', 222);
            expect(res).toEqual({ statusCode: 200, body: 'Notifications sent successfully' });
        });

        it('returns 200 and sends no messages when all show lists are empty', async () => {
            (getArtists as ReturnType<typeof vi.fn>).mockResolvedValue({ 'Artist1': 111 });
            (getArtistShows as ReturnType<typeof vi.fn>).mockResolvedValue([{ artist: 'Artist1', shows: [] }]);

            const res = await notificationsHandler({}, {});

            expect(sendMessage).not.toHaveBeenCalled();
            expect(res).toEqual({ statusCode: 200, body: 'Notifications sent successfully' });
        });
    });

    describe('partial and full failures', () => {
        it('returns 200 when some messages fail but not all', async () => {
            (getArtists as ReturnType<typeof vi.fn>).mockResolvedValue({ 'Artist1': 111 });
            (getArtistShows as ReturnType<typeof vi.fn>).mockResolvedValue([{ artist: 'Artist1', shows: ['Show A', 'Show B'] }]);
            (sendMessage as ReturnType<typeof vi.fn>)
                .mockResolvedValueOnce(undefined)
                .mockRejectedValueOnce(new Error('Send failed'));

            const res = await notificationsHandler({}, {});

            expect(res).toEqual({ statusCode: 200, body: 'Notifications sent successfully' });
        });

        it('returns 502 when all messages fail', async () => {
            (getArtists as ReturnType<typeof vi.fn>).mockResolvedValue({ 'Artist1': 111, 'Artist2': 222 });
            (getArtistShows as ReturnType<typeof vi.fn>).mockResolvedValue([
                { artist: 'Artist1', shows: ['Show A'] },
                { artist: 'Artist2', shows: ['Show B'] },
            ]);
            (sendMessage as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Telegram down'));

            const res = await notificationsHandler({}, {});

            expect(res).toEqual({ statusCode: 502, body: 'All notifications failed to send' });
        });

        it('logs each failed message individually', async () => {
            (getArtists as ReturnType<typeof vi.fn>).mockResolvedValue({ 'Artist1': 111 });
            (getArtistShows as ReturnType<typeof vi.fn>).mockResolvedValue([{ artist: 'Artist1', shows: ['Show A', 'Show B'] }]);
            (sendMessage as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Send failed'));

            await notificationsHandler({}, {});

            expect((logger as unknown as { error: ReturnType<typeof vi.fn> }).error).toHaveBeenCalledTimes(2);
        });
    });

    describe('NoShowsError', () => {
        it('sends a health check message and returns 300', async () => {
            (getArtists as ReturnType<typeof vi.fn>).mockResolvedValue({ 'Artist1': 111, 'Artist2': 222 });
            (getArtistShows as ReturnType<typeof vi.fn>).mockRejectedValue(new NoShowsError(['Artist1', 'Artist2']));
            (sendMessage as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            const res = await notificationsHandler({}, {});

            expect(sendMessage).toHaveBeenCalledOnce();
            expect(sendMessage).toHaveBeenCalledWith(
                expect.stringContaining('Artist1/Artist2'),
                '999888'
            );
            expect(res).toEqual({ statusCode: 300, body: 'No shows to notify, sent health check message' });
        });

        it('returns 502 when the health check message itself fails to send', async () => {
            (getArtists as ReturnType<typeof vi.fn>).mockResolvedValue({ 'Artist1': 111 });
            (getArtistShows as ReturnType<typeof vi.fn>).mockRejectedValue(new NoShowsError(['Artist1']));
            (sendMessage as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Telegram down'));

            const res = await notificationsHandler({}, {});

            expect(res).toEqual({ statusCode: 502, body: 'Telegram API error' });
        });
    });

    describe('unexpected errors', () => {
        it('returns 500 when getArtists throws', async () => {
            (getArtists as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('DB connection failed'));

            const res = await notificationsHandler({}, {});

            expect(res).toEqual({ statusCode: 500, body: 'An unexpected error occurred' });
            expect(sendMessage).not.toHaveBeenCalled();
        });

        it('returns 500 when getArtistShows throws a non-NoShows error', async () => {
            (getArtists as ReturnType<typeof vi.fn>).mockResolvedValue({ 'Artist1': 111 });
            (getArtistShows as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Barby API down'));

            const res = await notificationsHandler({}, {});

            expect(res).toEqual({ statusCode: 500, body: 'An unexpected error occurred' });
        });

        it('logs unexpected errors', async () => {
            (getArtists as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Something went wrong'));

            await notificationsHandler({}, {});

            expect((logger as unknown as { error: ReturnType<typeof vi.fn> }).error).toHaveBeenCalled();
        });
    });
});
