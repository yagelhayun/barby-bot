import { env, logger } from '../utils/config.js';
import { buildHandlerResponse } from '../utils/helpers.js';
import { 
    commands,
    parseCommand,
    handleCreateArtist,
    handleDeleteArtist
} from '../services/adminService.js';

/**
 * Admin handler: performs business work and returns a standard status response.
 * In AWS Lambda, the top-level `main` always returns the final HTTP response.
 * This return value is still useful for unit tests and local invocation.
 */
export const adminHandler = async (event, _context) => {
    logger.debug('adminHandler event:', event);

    const { message } = JSON.parse(event.body);
    const { chat, text, entities } = message;

    if (
        event.headers['x-telegram-bot-api-secret-token'] !== env.ADMIN_BOT_SECRET_TOKEN ||
        chat?.id !== parseInt(env.ADMIN_BOT_OWNER_ID, 10)
    ) {
        logger.error('Unauthorized access attempt detected');
        return buildHandlerResponse(401, 'Unauthorized');
    }

    try {
        const { command, artistName } = parseCommand(text, entities);
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
        let response;
        let reason;

        if (error instanceof CommandValidationError) {
            response = buildHandlerResponse(400, 'Unsupported command');
            reason = `פקודה לא חוקית`;
        } else {
            response = buildHandlerResponse(500, 'An unexpected error occurred');
            reason = 'שגיאה לא צפויה';
        }

        logger.error(error);

        try {
            await sendAdminMessage(`חלה שגיאה ביצירת קבוצה עבור "${artistName}". סיבה: ${reason}`, chat.id);
        } catch (err) {
            logger.error('Failed to send error message:', err);
        }

        return response;
    }
};
