import {
    TelegramGroupCreationError,
    TelegramAddBotError,
    FailedToAddArtistError,
    CommandValidationError,
    TelegramAPIError
} from '../utils/errors/index.js';
import { env } from '../utils/config.js';
import { sendAdminMessage } from '../clients/telegramClient.js';
import { addArtist } from '../repositories/artistsRepository.js';
import { parseCreateCommand } from '../services/adminCommandsService.js';
import { addNotificationsBot, createGroup } from '../services/telegramService.js';

export const adminHandler = async (event, _context) => {
    // console.debug('Received event:', JSON.stringify(event, null, 2));

    const { message } = JSON.parse(event.body);
    const { chat, text, entities } = message;

    if (
        event.headers['x-telegram-bot-api-secret-token'] !== env.ADMIN_BOT_SECRET_TOKEN ||
        chat?.id !== parseInt(env.ADMIN_BOT_OWNER_ID, 10)
    ) {
        console.error('Unauthorized access attempt detected');
        return { statusCode: 401, body: 'Unauthorized' };
    }

    try {
        const artistName = parseCreateCommand(text, entities);
        console.debug(`Parsed artist name: "${artistName}"`);
        const groupChat = await createGroup(artistName);
        console.debug(`Created Telegram group with ID: ${groupChat.id}`);
        await addNotificationsBot(groupChat);
        console.debug('Added notifications bot to the group');
        await addArtist(artistName, groupChat.id);
        console.debug('Artist added to the database');

        const successMessage =
            `Successfully created group for "${artistName}". ` +
            'The notifications bot will start sending updates when there are shows for this artist.';

        await sendAdminMessage(successMessage, chat.id);

        return { statusCode: 200, body: 'Successfully added artist' };
    } catch (error) {
        let res;

        if (error instanceof CommandValidationError) {
            console.error('Invalid command received:', error);
            res = { statusCode: 400, body: 'Invalid command' };
        } else if (
            error instanceof TelegramGroupCreationError ||
            error instanceof TelegramAddBotError ||
            error instanceof FailedToAddArtistError
        ) {
            console.error('Error during artist addition process:', error);
            res = { statusCode: 500, body: 'Failed to add artist' };
        } else if (error instanceof TelegramAPIError) {
            console.error('Telegram API error:', error);
            res = { statusCode: 502, body: 'Telegram API error' };
        } else {
            res = { statusCode: 500, body: 'An unexpected error occurred' };
        }

        try {
            await sendAdminMessage('חלה שגיאה ביצירת קבוצה', chat.id);
        } catch (err) {
            console.error('Failed to send validation error message:', err);
        }

        return res;
    }
};

