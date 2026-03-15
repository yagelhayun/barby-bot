import {
    TelegramGroupCreationError,
    TelegramAddBotError,
    FailedToAddArtistError,
    CommandValidationError,
    TelegramAPIError
} from '../utils/errors/index.js';
import { env, logger } from '../utils/config.js';
import { buildHandlerResponse } from '../utils/helpers.js';
import { sendAdminMessage } from '../clients/telegramClient.js';
import { addArtist } from '../repositories/artistsRepository.js';
import { parseCreateCommand } from '../services/adminCommandsService.js';
import { addNotificationsBot, createGroup } from '../services/telegramService.js';

/**
 * Admin handler: performs business work and returns a standard status response.
 * In AWS Lambda, the top-level `main` always returns the final HTTP response.
 * This return value is still useful for unit tests and local invocation.
 */
export const adminHandler = async (event, _context) => {
    logger.debug('adminHandler event:', event);

    const { message } = JSON.parse(event.body);
    const { chat, text, entities, date, message_id } = message;

    if (
        event.headers['x-telegram-bot-api-secret-token'] !== env.ADMIN_BOT_SECRET_TOKEN ||
        chat?.id !== parseInt(env.ADMIN_BOT_OWNER_ID, 10)
    ) {
        logger.error('Unauthorized access attempt detected');
        return buildHandlerResponse(401, 'Unauthorized');
    }

    try {
        const artistName = parseCreateCommand(text, entities);
        logger.debug(`Parsed artist name: "${artistName}"`);
        const groupChat = await createGroup(artistName);
        logger.debug(`Created Telegram group with ID: ${groupChat.id}`);
        await addNotificationsBot(groupChat);
        logger.debug('Added notifications bot to the group');
        await addArtist(artistName, groupChat.id);
        logger.debug('Artist added to the database');

        const successMessage =
            `Successfully created group for "${artistName}".`;

        await sendAdminMessage(successMessage, chat.id);

        return buildHandlerResponse(200, 'Successfully added artist');
    } catch (error) {
        let res;

        if (error instanceof CommandValidationError) {
            logger.error('Invalid command received:', error);
            res = { statusCode: 400, body: 'Invalid command' };
        } else if (
            error instanceof TelegramGroupCreationError ||
            error instanceof TelegramAddBotError ||
            error instanceof FailedToAddArtistError
        ) {
            logger.error('Error during artist addition process:', error);
            res = { statusCode: 500, body: 'Failed to add artist' };
        } else if (error instanceof TelegramAPIError) {
            logger.error('Telegram API error:', error);
            res = { statusCode: 502, body: 'Telegram API error' };
        } else {
            res = { statusCode: 500, body: 'An unexpected error occurred' };
        }

        try {
            await sendAdminMessage(`Error: text: '${text}', date: '${date}', message_id: '${message_id}'`, chat.id);
            // await sendAdminMessage('חלה שגיאה ביצירת קבוצה', chat.id);
        } catch (err) {
            logger.error('Failed to send validation error message:', err);
        }

        return res;
    }
};
