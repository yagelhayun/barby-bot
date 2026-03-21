import {
    MissingBotCommandError,
    MissingArtistNameError,
    UnsupportedCommandError,
    TelegramGroupCreationError,
    FailedToAddArtistError,
    UnableToSendBotMessageError
} from '../utils/errors/index.js';
import { logger } from '../utils/config.js';
import { buildHandlerResponse } from '../utils/helpers.js';
import { sendAdminMessage } from '../clients/telegramClient.js';
import { addArtist, alignTelegramAndDBStates } from '../services/artistsService.js';
import { createGroup, getGroupChatIdByArtistName } from '../services/telegramService.js';

export const commands = {
    CREATE: '/create',
    DELETE: '/delete'
}

export const parseCommand = (text, entities) => {
    if (!entities || entities[0]?.type !== 'bot_command') {
        throw new MissingBotCommandError();
    }

    const [command, ...rest] = text.trim().split(/\s+/);

    if (!Object.values(commands).includes(command)) {
        throw new UnsupportedCommandError(command);
    }

    const artistName = rest.join(' ').trim();

    if (!artistName) {
        throw new MissingArtistNameError();
    }

    return { command, artistName };
};

export const handleCreateArtist = async (artistName, adminChatId) => {
    try {
        const actionNeeded = await alignTelegramAndDBStates(artistName);

        if (actionNeeded) {
            await createGroup(artistName);
            logger.info('Created Telegram group with the notifications bot');
            const groupChatId = await getGroupChatIdByArtistName(artistName);

            await addArtist(artistName, groupChatId);
            logger.info('Artist added to the database');

            await sendAdminMessage(`נוצרה קבוצה חדשה עבור "${artistName}" בהצלחה`, adminChatId);   
        }

        return buildHandlerResponse(200, 'Successfully added artist');
    } catch (error) {
        let response;
        let reason;

        if (error instanceof TelegramGroupCreationError) {
            response = buildHandlerResponse(500, 'Failed to create artist group on Telegram');
            reason = `שגיאה ביצירת הקבוצה בטלגרם`;
        } else if  (error instanceof FailedToAddArtistError) {
            response = buildHandlerResponse(500, 'Failed to add artist to database');
            reason = `שגיאה בהוספת האמן למסד הנתונים`;
        } else if (error instanceof UnableToSendBotMessageError) {
            response = buildHandlerResponse(502, 'Telegram API error');
            reason = `שגיאה בתקשורת עם טלגרם`;
        } else {
            response = buildHandlerResponse(500, 'An unexpected error occurred');
            reason = 'שגיאה לא צפויה';
        }

        logger.error(error);

        try {
            await sendAdminMessage(`חלה שגיאה ביצירת קבוצה עבור "${artistName}". סיבה: ${reason}`, adminChatId);
        } catch (err) {
            logger.error('Failed to send error message:', err);
        }

        return response;
    }
}

export const handleDeleteArtist = async (artistName, adminChatId) => {
    await sendAdminMessage(`הפקודה /delete עדיין לא זמינה`, adminChatId);
    return buildHandlerResponse(501, 'Not implemented');
}
