import { setLogMetadata } from '@yagelhayun/logger/server';
import { env, logger } from '../utils/config';
import { buildHandlerResponse } from '../utils/helpers';
import {
    commands,
    parseCommand,
    handleCreateArtist,
    handleDeleteArtist,
} from '../services/adminService';
import { sendMessage } from '../clients/telegramClient';
import {
    CommandValidationError,
    DatabaseConnectionError,
    TelegramGroupCreationError,
    TelegramGroupDeletionError,
    FailedToAddArtistError,
    GroupNotFoundInDatabaseError,
    UnableToSendBotMessageError,
} from '../utils/errors';
import type {
    HandlerResponse,
    HttpEvent,
    TelegramWebhookBody,
    ParsedCommand
} from '../types';

/**
 * Admin handler: performs business work and returns a standard status response.
 * In AWS Lambda, the top-level `main` always returns the final HTTP response.
 * This return value is still useful for unit tests and local invocation.
 */
export const adminHandler = async (event: HttpEvent, _context: unknown): Promise<HandlerResponse | undefined> => {
    logger.debug('Admin handler event received', { event });

    const body: TelegramWebhookBody = JSON.parse(event.body);
    const { message }: TelegramWebhookBody = body;
    const { chat, text, entities } = message;

    setLogMetadata('chatId', chat.id);

    if (
        event.headers['x-telegram-bot-api-secret-token'] !== env.BOT_AUTH_SECRET_TOKEN ||
        chat?.id !== parseInt(env.OWNER_TG_USER_ID, 10)
    ) {
        logger.error('Unauthorized access attempt');
        return buildHandlerResponse(401, 'Unauthorized');
    }

    try {
        const { command, artistName }: ParsedCommand = parseCommand(text, entities);
        logger.debug('Command parsed', { command, artistName });
        setLogMetadata('command', command);
        setLogMetadata('artistName', artistName);

        switch (command) {
            case commands.CREATE: {
                await handleCreateArtist(artistName);
                await sendMessage(`נוצרה קבוצה חדשה עבור "${artistName}" בהצלחה`, chat.id);
                return buildHandlerResponse(200, 'Successfully added artist');
            }
            case commands.DELETE: {
                await handleDeleteArtist(artistName);
                await sendMessage(`האמן "${artistName}" נמחק בהצלחה`, chat.id);
                return buildHandlerResponse(200, 'Successfully deleted artist');
            }
        }
    } catch (error) {
        let response: HandlerResponse;
        let userMessage: string;

        if (error instanceof CommandValidationError) {
            response = buildHandlerResponse(400, 'Unsupported command');
            userMessage = `פקודה לא חוקית`;
        } else if (error instanceof DatabaseConnectionError) {
            response = buildHandlerResponse(503, 'Database unavailable');
            userMessage = `שגיאה בהתחברות למסד הנתונים, נסה שוב`;
        } else if (error instanceof GroupNotFoundInDatabaseError) {
            response = buildHandlerResponse(404, 'Artist not found');
            userMessage = `האמן לא נמצא במסד הנתונים`;
        } else if (error instanceof TelegramGroupCreationError) {
            response = buildHandlerResponse(500, 'Failed to create artist group on Telegram');
            userMessage = `שגיאה ביצירת הקבוצה בטלגרם`;
        } else if (error instanceof TelegramGroupDeletionError) {
            response = buildHandlerResponse(500, 'Failed to delete artist group on Telegram');
            userMessage = `שגיאה במחיקת הקבוצה בטלגרם`;
        } else if (error instanceof FailedToAddArtistError) {
            response = buildHandlerResponse(500, 'Failed to add artist to database');
            userMessage = `שגיאה בהוספת האמן למסד הנתונים`;
        } else if (error instanceof UnableToSendBotMessageError) {
            response = buildHandlerResponse(502, 'Telegram API error');
            userMessage = `שגיאה בתקשורת עם טלגרם`;
        } else {
            response = buildHandlerResponse(500, 'An unexpected error occurred');
            userMessage = 'שגיאה לא צפויה';
        }

        logger.error(error);

        try {
            await sendMessage(userMessage, chat.id);
        } catch (err) {
            logger.error('Failed to send error message to admin:', err);
        }

        return response;
    }
};
