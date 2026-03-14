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
    const { chat, text, entities, date, message_id } = message;

    if (
        event.headers['x-telegram-bot-api-secret-token'] !== env.ADMIN_BOT_SECRET_TOKEN ||
        chat?.id !== parseInt(env.ADMIN_BOT_OWNER_ID, 10)
    ) {
        console.error('Unauthorized access attempt detected');
        // return { statusCode: 401, body: 'Unauthorized' };
        return;
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
            `Successfully created group for "${artistName}". `;

        await sendAdminMessage(successMessage, chat.id);
    } catch (error) {
        if (error instanceof CommandValidationError) {
            console.error('Invalid command received:', error);
        } else if (
            error instanceof TelegramGroupCreationError ||
            error instanceof TelegramAddBotError ||
            error instanceof FailedToAddArtistError
        ) {
            console.error('Error during artist addition process:', error);
        } else if (error instanceof TelegramAPIError) {
            console.error('Telegram API error:', error);
        } else {
            console.error('An unexpected error occurred:', error);
        }

        try {
            await sendAdminMessage(`Error: text: '${text}', date: '${date}', message_id: '${message_id}'`, chat.id);
            // await sendAdminMessage('חלה שגיאה ביצירת קבוצה', chat.id);
        } catch (err) {
            console.error('Failed to send validation error message:', err);
        }
    }
};
