import { env, logger } from '../utils/config';
import { buildHandlerResponse } from '../utils/helpers';
import {
    commands,
    parseCommand,
    handleCreateArtist,
    handleDeleteArtist,
} from '../services/adminService';
import { sendAdminMessage } from '../clients/telegramClient';
import { CommandValidationError } from '../utils/errors';
import type { HandlerResponse, HttpEvent, TelegramWebhookBody, TelegramMessage } from '../types';

/**
 * Admin handler: performs business work and returns a standard status response.
 * In AWS Lambda, the top-level `main` always returns the final HTTP response.
 * This return value is still useful for unit tests and local invocation.
 */
export const adminHandler = async (event: HttpEvent, _context: unknown): Promise<HandlerResponse | undefined> => {
    logger.debug('adminHandler event:', event);

    const body: TelegramWebhookBody = JSON.parse(event.body);
    const { message }: { message: TelegramMessage } = body;
    const { chat, text, entities } = message;

    if (
        event.headers['x-telegram-bot-api-secret-token'] !== env.ADMIN_BOT_SECRET_TOKEN ||
        chat?.id !== parseInt(env.ADMIN_BOT_OWNER_ID, 10)
    ) {
        logger.error('Unauthorized access attempt detected');
        return buildHandlerResponse(401, 'Unauthorized');
    }

    try {
        const { command, artistName }: { command: string; artistName: string } = parseCommand(text, entities);
        logger.debug(`Parsed artist name: "${artistName}"`);

        switch (command) {
            case commands.CREATE: {
                return await handleCreateArtist(artistName, chat.id);
            }
            case commands.DELETE: {
                return await handleDeleteArtist(artistName, chat.id);
            }
            default: {
                break;
            }
        }
    } catch (error) {
        let response: HandlerResponse;
        let reason: string;

        if (error instanceof CommandValidationError) {
            response = buildHandlerResponse(400, 'Unsupported command');
            reason = `פקודה לא חוקית`;
        } else {
            response = buildHandlerResponse(500, 'An unexpected error occurred');
            reason = 'שגיאה לא צפויה';
        }

        logger.error(error);

        try {
            await sendAdminMessage(`חלה שגיאה ביצירת קבוצה. סיבה: ${reason}`, chat.id);
        } catch (err) {
            logger.error('Failed to send error message:', err);
        }

        return response;
    }
};
