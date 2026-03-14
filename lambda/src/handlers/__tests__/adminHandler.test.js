import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
    MissingBotCommandError,
    UnsupportedCommandError,
    MissingArtistNameError,
    TelegramGroupCreationError,
    TelegramAddBotError,
    FailedToAddArtistError,
    TelegramAPIError,
} from '../../utils/errors/index.js';

vi.mock('../../repositories/artistsRepository.js', () => ({ addArtist: vi.fn() }));
vi.mock('../../clients/telegramClient.js', () => ({ sendAdminMessage: vi.fn() }));
vi.mock('../../services/adminCommandsService.js', () => ({ parseCreateCommand: vi.fn() }));
vi.mock('../../services/telegramService.js', () => ({
    createGroup: vi.fn(),
    addNotificationsBot: vi.fn(),
}));
vi.mock('../../utils/config.js', () => ({
    env: {
        ADMIN_BOT_SECRET_TOKEN: 'test-secret',
        ADMIN_BOT_OWNER_ID: '12345',
    },
}));

const { adminHandler } = await import('../adminHandler.js');
const { addArtist } = await import('../../repositories/artistsRepository.js');
const { sendAdminMessage } = await import('../../clients/telegramClient.js');
const { parseCreateCommand } = await import('../../services/adminCommandsService.js');
const { createGroup, addNotificationsBot } = await import('../../services/telegramService.js');

function buildEvent(overrides = {}) {
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
        vi.clearAllMocks();
    });

    describe('authorization', () => {
        it('returns 401 when x-telegram-bot-api-secret-token is missing', async () => {
            const event = buildEvent({
                headers: { 'x-telegram-bot-api-secret-token': undefined, 'content-type': 'application/json' },
            });

            const res = await adminHandler(event, {});

            expect(res).toEqual({ statusCode: 401, body: 'Unauthorized' });
            expect(parseCreateCommand).not.toHaveBeenCalled();
        });

        it('returns 401 when x-telegram-bot-api-secret-token does not match env', async () => {
            const event = buildEvent({
                headers: { 'x-telegram-bot-api-secret-token': 'wrong-secret', 'content-type': 'application/json' },
            });

            const res = await adminHandler(event, {});

            expect(res).toEqual({ statusCode: 401, body: 'Unauthorized' });
            expect(parseCreateCommand).not.toHaveBeenCalled();
        });

        it('returns 401 when chat id does not match ADMIN_BOT_OWNER_ID', async () => {
            const event = buildEvent({
                message: { chat: { id: 99999, type: 'private' }, text: '/create Foo', entities: [{ type: 'bot_command' }], message_id: 1, date: 1 },
            });

            const res = await adminHandler(event, {});

            expect(res).toEqual({ statusCode: 401, body: 'Unauthorized' });
            expect(parseCreateCommand).not.toHaveBeenCalled();
        });
    });

    describe('command validation', () => {
        it('returns 400 and sends error reply when message has no bot_command entity', async () => {
            parseCreateCommand.mockImplementation(() => {
                throw new MissingBotCommandError();
            });
            const event = buildEvent();

            const res = await adminHandler(event, {});

            expect(res).toEqual({ statusCode: 400, body: 'Invalid command' });
            expect(sendAdminMessage).toHaveBeenCalledWith(
                expect.stringContaining("Error: text: '/create Queen', date: '1234567890', message_id: '1'"),
                12345
            );
        });

        it('returns 400 and sends error reply when command is not /create', async () => {
            parseCreateCommand.mockImplementation(() => {
                throw new UnsupportedCommandError('/other');
            });
            const event = buildEvent();

            const res = await adminHandler(event, {});

            expect(res).toEqual({ statusCode: 400, body: 'Invalid command' });
            expect(sendAdminMessage).toHaveBeenCalledWith(
                expect.stringContaining("Error: text: '/create Queen'"),
                12345
            );
        });

        it('returns 400 and sends error reply when artist name is missing', async () => {
            parseCreateCommand.mockImplementation(() => {
                throw new MissingArtistNameError();
            });
            const event = buildEvent();

            const res = await adminHandler(event, {});

            expect(res).toEqual({ statusCode: 400, body: 'Invalid command' });
            expect(sendAdminMessage).toHaveBeenCalledWith(
                expect.stringContaining("Error: text: '/create Queen'"),
                12345
            );
        });

        it('does not call createGroup or addArtist when validation fails', async () => {
            parseCreateCommand.mockImplementation(() => {
                throw new MissingArtistNameError();
            });
            const event = buildEvent();

            await adminHandler(event, {});

            expect(createGroup).not.toHaveBeenCalled();
            expect(addArtist).not.toHaveBeenCalled();
        });
    });

    describe('success flow', () => {
        it('parses command, creates group, adds bot, adds artist, sends success message and returns 200', async () => {
            const artistName = 'Queen';
            const groupChat = { id: 98765, title: artistName };
            parseCreateCommand.mockReturnValue(artistName);
            createGroup.mockResolvedValue(groupChat);
            addNotificationsBot.mockResolvedValue(undefined);
            addArtist.mockResolvedValue({});
            sendAdminMessage.mockResolvedValue(undefined);

            const event = buildEvent();
            const res = await adminHandler(event, {});

            expect(parseCreateCommand).toHaveBeenCalledWith('/create Queen', expect.any(Array));
            expect(createGroup).toHaveBeenCalledWith(artistName);
            expect(addNotificationsBot).toHaveBeenCalledWith(groupChat);
            expect(addArtist).toHaveBeenCalledWith(artistName, 98765);
            expect(sendAdminMessage).toHaveBeenCalledWith(
                `Successfully created group for "${artistName}". The notifications bot will start sending updates when there are shows for this artist.`,
                12345
            );
            expect(res).toEqual({ statusCode: 200, body: 'Successfully added artist' });
        });

        it('sends success message with correct artist name for Hebrew name', async () => {
            parseCreateCommand.mockReturnValue('רון חיון');
            createGroup.mockResolvedValue({ id: 111, title: 'רון חיון' });
            addNotificationsBot.mockResolvedValue(undefined);
            addArtist.mockResolvedValue({});
            sendAdminMessage.mockResolvedValue(undefined);

            const event = buildEvent({ message: { text: '/create רון חיון', entities: [{ type: 'bot_command' }], chat: { id: 12345 }, message_id: 1, date: 1 } });
            const res = await adminHandler(event, {});

            expect(sendAdminMessage).toHaveBeenCalledWith(
                'Successfully created group for "רון חיון". The notifications bot will start sending updates when there are shows for this artist.',
                12345
            );
            expect(res.statusCode).toBe(200);
        });
    });

    describe('errors during create flow', () => {
        it('returns 500 and sends error when createGroup throws TelegramGroupCreationError', async () => {
            parseCreateCommand.mockReturnValue('Queen');
            createGroup.mockRejectedValue(new TelegramGroupCreationError('Queen', new Error('API error')));
            sendAdminMessage.mockResolvedValue(undefined);

            const event = buildEvent();
            const res = await adminHandler(event, {});

            expect(res).toEqual({ statusCode: 500, body: 'Failed to add artist' });
            expect(addArtist).not.toHaveBeenCalled();
            expect(sendAdminMessage).toHaveBeenCalled();
            expect(sendAdminMessage.mock.calls[0][0]).toContain('Error:');
        });

        it('returns 500 when addNotificationsBot throws TelegramAddBotError', async () => {
            const groupChat = { id: 98765, title: 'Queen' };
            parseCreateCommand.mockReturnValue('Queen');
            createGroup.mockResolvedValue(groupChat);
            addNotificationsBot.mockRejectedValue(new TelegramAddBotError('Queen', new Error('Add failed')));
            sendAdminMessage.mockResolvedValue(undefined);

            const event = buildEvent();
            const res = await adminHandler(event, {});

            expect(res).toEqual({ statusCode: 500, body: 'Failed to add artist' });
            expect(addArtist).not.toHaveBeenCalled();
            expect(sendAdminMessage).toHaveBeenCalled();
        });

        it('returns 500 when addArtist throws FailedToAddArtistError', async () => {
            const groupChat = { id: 98765, title: 'Queen' };
            parseCreateCommand.mockReturnValue('Queen');
            createGroup.mockResolvedValue(groupChat);
            addNotificationsBot.mockResolvedValue(undefined);
            addArtist.mockRejectedValue(new FailedToAddArtistError('Queen'));
            sendAdminMessage.mockResolvedValue(undefined);

            const event = buildEvent();
            const res = await adminHandler(event, {});

            expect(res).toEqual({ statusCode: 500, body: 'Failed to add artist' });
            expect(sendAdminMessage).toHaveBeenCalled();
        });

        it('returns 502 when sendAdminMessage throws TelegramAPIError', async () => {
            parseCreateCommand.mockReturnValue('Queen');
            createGroup.mockResolvedValue({ id: 1, title: 'Queen' });
            addNotificationsBot.mockResolvedValue(undefined);
            addArtist.mockResolvedValue({});
            sendAdminMessage.mockRejectedValue(new TelegramAPIError({ status: 429, statusText: 'Too Many Requests' }));

            const event = buildEvent();
            const res = await adminHandler(event, {});

            expect(res).toEqual({ statusCode: 502, body: 'Telegram API error' });
        });

        it('returns 500 for unexpected errors', async () => {
            parseCreateCommand.mockReturnValue('Queen');
            createGroup.mockRejectedValue(new Error('Unexpected failure'));
            sendAdminMessage.mockResolvedValue(undefined);

            const event = buildEvent();
            const res = await adminHandler(event, {});

            expect(res).toEqual({ statusCode: 500, body: 'An unexpected error occurred' });
            expect(sendAdminMessage).toHaveBeenCalled();
        });

        it('still sends error reply when sendAdminMessage fails after a validation error', async () => {
            parseCreateCommand.mockImplementation(() => {
                throw new MissingArtistNameError();
            });
            sendAdminMessage.mockRejectedValue(new Error('Network error'));

            const event = buildEvent();
            const res = await adminHandler(event, {});

            expect(res).toEqual({ statusCode: 400, body: 'Invalid command' });
        });
    });
});
