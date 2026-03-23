import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
    MissingBotCommandError,
    UnsupportedCommandError,
    MissingArtistNameError,
} from '../../utils/errors';

vi.mock('../../services/adminService.js', () => ({
    commands: { CREATE: '/create', DELETE: '/delete' },
    parseCommand: vi.fn(),
    handleCreateArtist: vi.fn(),
    handleDeleteArtist: vi.fn(),
}));
vi.mock('../../clients/telegramClient.js', () => ({
    sendAdminMessage: vi.fn(),
}));
vi.mock('../../utils/config.js', () => ({
    env: {
        BOT_API_AUTH_TOKEN: 'test-secret',
        OWNER_TG_USER_ID: '12345',
    },
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const { adminHandler } = await import('../adminHandler.js');
const { parseCommand, handleCreateArtist, handleDeleteArtist } = await import('../../services/adminService.js');
const { sendAdminMessage } = await import('../../clients/telegramClient.js');

function buildEvent(overrides: {
    message?: Partial<{
        message_id: number;
        from: { id: number; is_bot?: boolean };
        chat: { id: number; type: string };
        date: number;
        entities: Array<{ offset?: number; length?: number; type: string }>;
        text: string;
    }>;
    headers?: Record<string, string | undefined>;
    event?: Record<string, unknown>;
} = {}) {
    const ownerId = 12345;
    const message = {
        message_id: 1,
        from: { id: ownerId, is_bot: false },
        chat: { id: ownerId, type: 'private' },
        date: 1234567890,
        entities: [{ offset: 0, length: 7, type: 'bot_command' }],
        text: '/create Queen',
        ...overrides.message,
    };
    return {
        version: '2.0',
        headers: {
            'x-telegram-bot-api-secret-token': 'test-secret',
            'content-type': 'application/json',
            ...overrides.headers,
        },
        body: JSON.stringify({ message }),
        ...overrides.event,
    };
}

describe('adminHandler', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe('authorization', () => {
        it('returns 401 when secret token is missing', async () => {
            const event = buildEvent({ headers: { 'x-telegram-bot-api-secret-token': undefined } });

            const res = await adminHandler(event, {});

            expect(res).toEqual({ statusCode: 401, body: 'Unauthorized' });
            expect(parseCommand).not.toHaveBeenCalled();
        });

        it('returns 401 when secret token does not match', async () => {
            const event = buildEvent({ headers: { 'x-telegram-bot-api-secret-token': 'wrong-secret' } });

            const res = await adminHandler(event, {});

            expect(res).toEqual({ statusCode: 401, body: 'Unauthorized' });
            expect(parseCommand).not.toHaveBeenCalled();
        });

        it('returns 401 when chat id does not match owner', async () => {
            const event = buildEvent({ message: { chat: { id: 99999, type: 'private' }, text: '/create Foo', entities: [{ type: 'bot_command' }], message_id: 1, date: 1, from: { id: 99999 } } });

            const res = await adminHandler(event, {});

            expect(res).toEqual({ statusCode: 401, body: 'Unauthorized' });
            expect(parseCommand).not.toHaveBeenCalled();
        });

        it('does not notify admin on unauthorized requests', async () => {
            const event = buildEvent({ headers: { 'x-telegram-bot-api-secret-token': 'wrong' } });

            await adminHandler(event, {});

            expect(sendAdminMessage).not.toHaveBeenCalled();
        });
    });

    describe('command validation', () => {
        it('returns 400 and notifies admin when bot command entity is missing', async () => {
            (parseCommand as ReturnType<typeof vi.fn>).mockImplementation(() => { throw new MissingBotCommandError(); });

            const res = await adminHandler(buildEvent(), {});

            expect(res).toEqual({ statusCode: 400, body: 'Unsupported command' });
            expect(sendAdminMessage).toHaveBeenCalledWith(expect.any(String), 12345);
        });

        it('returns 400 and notifies admin for unsupported command', async () => {
            (parseCommand as ReturnType<typeof vi.fn>).mockImplementation(() => { throw new UnsupportedCommandError('/unknown'); });

            const res = await adminHandler(buildEvent(), {});

            expect(res).toEqual({ statusCode: 400, body: 'Unsupported command' });
            expect(sendAdminMessage).toHaveBeenCalledWith(expect.any(String), 12345);
        });

        it('returns 400 and notifies admin when artist name is missing', async () => {
            (parseCommand as ReturnType<typeof vi.fn>).mockImplementation(() => { throw new MissingArtistNameError(); });

            const res = await adminHandler(buildEvent(), {});

            expect(res).toEqual({ statusCode: 400, body: 'Unsupported command' });
            expect(sendAdminMessage).toHaveBeenCalledWith(expect.any(String), 12345);
        });

        it('returns 400 even when the admin notification itself fails', async () => {
            (parseCommand as ReturnType<typeof vi.fn>).mockImplementation(() => { throw new MissingArtistNameError(); });
            (sendAdminMessage as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

            const res = await adminHandler(buildEvent(), {});

            expect(res).toEqual({ statusCode: 400, body: 'Unsupported command' });
        });

        it('does not call handleCreateArtist or handleDeleteArtist when validation fails', async () => {
            (parseCommand as ReturnType<typeof vi.fn>).mockImplementation(() => { throw new MissingArtistNameError(); });

            await adminHandler(buildEvent(), {});

            expect(handleCreateArtist).not.toHaveBeenCalled();
            expect(handleDeleteArtist).not.toHaveBeenCalled();
        });
    });

    describe('/create command', () => {
        it('calls handleCreateArtist with the parsed artist name', async () => {
            (parseCommand as ReturnType<typeof vi.fn>).mockReturnValue({ command: '/create', artistName: 'Queen' });

            await adminHandler(buildEvent(), {});

            expect(handleCreateArtist).toHaveBeenCalledWith('Queen');
        });

        it('returns 200 and notifies admin on success', async () => {
            (parseCommand as ReturnType<typeof vi.fn>).mockReturnValue({ command: '/create', artistName: 'Queen' });

            const res = await adminHandler(buildEvent(), {});

            expect(res).toEqual({ statusCode: 200, body: 'Successfully added artist' });
            expect(sendAdminMessage).toHaveBeenCalledWith(expect.any(String), 12345);
        });

        it('works with Hebrew artist names', async () => {
            (parseCommand as ReturnType<typeof vi.fn>).mockReturnValue({ command: '/create', artistName: 'רון חיון' });
            const event = buildEvent({ message: { text: '/create רון חיון', entities: [{ type: 'bot_command' }], chat: { id: 12345, type: 'private' }, message_id: 1, date: 1, from: { id: 12345 } } });

            const res = await adminHandler(event, {});

            expect(handleCreateArtist).toHaveBeenCalledWith('רון חיון');
            expect(res?.statusCode).toBe(200);
        });
    });

    describe('/delete command', () => {
        it('calls handleDeleteArtist with the parsed artist name', async () => {
            (parseCommand as ReturnType<typeof vi.fn>).mockReturnValue({ command: '/delete', artistName: 'Queen' });
            (handleDeleteArtist as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
            const event = buildEvent({ message: { text: '/delete Queen', entities: [{ type: 'bot_command' }], chat: { id: 12345, type: 'private' }, message_id: 1, date: 1, from: { id: 12345 } } });

            await adminHandler(event, {});

            expect(handleDeleteArtist).toHaveBeenCalledWith('Queen');
        });

        it('returns 200 and notifies admin on success', async () => {
            (parseCommand as ReturnType<typeof vi.fn>).mockReturnValue({ command: '/delete', artistName: 'Queen' });
            const event = buildEvent({ message: { text: '/delete Queen', entities: [{ type: 'bot_command' }], chat: { id: 12345, type: 'private' }, message_id: 1, date: 1, from: { id: 12345 } } });

            const res = await adminHandler(event, {});

            expect(res).toEqual({ statusCode: 200, body: 'Successfully deleted artist' });
            expect(sendAdminMessage).toHaveBeenCalledWith(expect.any(String), 12345);
        });
    });

    describe('unexpected errors', () => {
        it('returns 500 and notifies admin when handleCreateArtist throws', async () => {
            (parseCommand as ReturnType<typeof vi.fn>).mockReturnValue({ command: '/create', artistName: 'Queen' });
            (handleCreateArtist as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Unexpected failure'));
            (sendAdminMessage as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            const res = await adminHandler(buildEvent(), {});

            expect(res).toEqual({ statusCode: 500, body: 'An unexpected error occurred' });
            expect(sendAdminMessage).toHaveBeenCalled();
        });

        it('returns 500 even when the admin notification itself also fails', async () => {
            (parseCommand as ReturnType<typeof vi.fn>).mockReturnValue({ command: '/create', artistName: 'Queen' });
            (handleCreateArtist as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Unexpected failure'));
            (sendAdminMessage as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Also broken'));

            const res = await adminHandler(buildEvent(), {});

            expect(res).toEqual({ statusCode: 500, body: 'An unexpected error occurred' });
        });
    });
});
