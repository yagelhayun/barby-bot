import { env, logger } from '../utils/config';
import { buildHandlerResponse } from '../utils/helpers';
import {
    commands,
    parseCommand,
    handleCreateArtist,
    handleDeleteArtist,
} from '../services/adminService';
import { sendAdminMessage } from '../clients/telegramClient';
import {
    CommandValidationError,
    TelegramGroupCreationError,
    FailedToAddArtistError,
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
    logger.debug('adminHandler event:', event);

    const body: TelegramWebhookBody = JSON.parse(event.body);
    const { message }: TelegramWebhookBody = body;
    const { chat, text, entities } = message;

    if (
        event.headers['x-telegram-bot-api-secret-token'] !== env.ADMIN_BOT_SECRET_TOKEN ||
        chat?.id !== parseInt(env.ADMIN_BOT_OWNER_ID, 10)
    ) {
        logger.error('Unauthorized access attempt detected');
        return buildHandlerResponse(401, 'Unauthorized');
    }

    try {
        const { command, artistName }: ParsedCommand = parseCommand(text, entities);
        logger.debug(`Parsed artist name: "${artistName}"`);

        switch (command) {
            case commands.CREATE: {
                await handleCreateArtist(artistName);
                await sendAdminMessage(`נוצרה קבוצה חדשה עבור "${artistName}" בהצלחה`, chat.id);
                return buildHandlerResponse(200, 'Successfully added artist');
            }
            case commands.DELETE: {
                await handleDeleteArtist(artistName);
                await sendAdminMessage(`הפקודה /delete עדיין לא זמינה`, chat.id);
                return buildHandlerResponse(200, 'Not implemented');
            }
        }
    } catch (error) {
        let response: HandlerResponse;
        let userMessage: string;

        if (error instanceof CommandValidationError) {
            response = buildHandlerResponse(400, 'Unsupported command');
            userMessage = `פקודה לא חוקית`;
        } else if (error instanceof TelegramGroupCreationError) {
            response = buildHandlerResponse(500, 'Failed to create artist group on Telegram');
            userMessage = `שגיאה ביצירת הקבוצה בטלגרם`;
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
