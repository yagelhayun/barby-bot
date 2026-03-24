import { setLogMetadata } from '@yagelhayun/logger/server';
import { env, logger } from '../utils/config';
import { buildHandlerResponse } from '../utils/helpers';
import {
    parseCommand,
    handleCreateArtist,
    handleDeleteArtist,
} from '../services/adminService';
import { notificationsHandler } from './notificationsHandler';
import { Command } from '../types';
import { sendAdminMessage } from '../clients/telegramClient';
import {
    CommandValidationError,
    DatabaseConnectionError,
    TelegramGroupCreationError,
    TelegramGroupDeletionError,
    FailedToAddArtistError,
    GroupNotFoundInDatabaseError,
    UnableToSendBotMessageError,
    ArtistAlreadyExistsError,
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
export const adminHandler = async (event: HttpEvent, _context: unknown): Promise<HandlerResponse> => {
    logger.debug('Admin handler event received', { event });

    const body: TelegramWebhookBody = JSON.parse(event.body);
    const { message } = body;

    if (!message) {
        logger.info('Update has no message field, ignoring');
        return buildHandlerResponse(200, 'Update ignored');
    }

    const { chat, text, entities } = message;

    setLogMetadata('chatId', chat.id);

    if (
        event.headers['x-telegram-bot-api-secret-token'] !== env.ADMIN_BOT_API_AUTH_TOKEN ||
        chat?.id !== parseInt(env.OWNER_TG_USER_ID, 10)
    ) {
        logger.error('Unauthorized access attempt');
        return buildHandlerResponse(401, 'Unauthorized');
    }

    try {
        const parsed: ParsedCommand = parseCommand(text, entities);
        logger.debug('Command parsed', { command: parsed.command });
        setLogMetadata('command', parsed.command);

        switch (parsed.command) {
            case Command.CREATE: {
                setLogMetadata('artistName', parsed.artistName);
                await handleCreateArtist(parsed.artistName);
                await sendAdminMessage(`נוצרה קבוצה חדשה עבור "${parsed.artistName}" בהצלחה`, chat.id);
                return buildHandlerResponse(200, 'Successfully added artist');
            }
            case Command.DELETE: {
                setLogMetadata('artistName', parsed.artistName);
                await handleDeleteArtist(parsed.artistName);
                await sendAdminMessage(`האמן "${parsed.artistName}" נמחק בהצלחה`, chat.id);
                return buildHandlerResponse(200, 'Successfully deleted artist');
            }
            case Command.NOTIFY: {
                const result = await notificationsHandler();
                await sendAdminMessage(`שליחת עידכוני הופעות הושלמה בהצלחה`, chat.id);
                return result;
            }
        }
    } catch (error) {
        let response: HandlerResponse;
        let userMessage: string;

        if (error instanceof ArtistAlreadyExistsError) {
            response = buildHandlerResponse(200, 'Artist already exists');
            userMessage = `האמן "${error.artistName}" כבר קיים ומסונכרן`;
        } else if (error instanceof CommandValidationError) {
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
            await sendAdminMessage(userMessage, chat.id);
        } catch (err) {
            logger.error('Failed to send error message to admin:', err);
        }

        return response;
    }
};
