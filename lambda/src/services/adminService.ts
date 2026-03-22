import {
    MissingBotCommandError,
    MissingArtistNameError,
    UnsupportedCommandError,
    TelegramGroupCreationError,
    FailedToAddArtistError,
    UnableToSendBotMessageError,
} from '../utils/errors';
import { logger } from '../utils/config';
import { buildHandlerResponse } from '../utils/helpers';
import { sendAdminMessage } from '../clients/telegramClient';
import { addArtist, alignTelegramAndDBStates } from '../services/artistsService';
import { createGroup, getGroupChatIdByArtistName } from '../services/telegramService';
import type { HandlerResponse, TelegramEntity, ParsedCommand } from '../types';

export enum commands {
    CREATE = '/create',
    DELETE = '/delete',
}

export const parseCommand = (text: string, entities: TelegramEntity[] | undefined): ParsedCommand => {
    if (!entities || entities[0]?.type !== 'bot_command') {
        throw new MissingBotCommandError();
    }

    const [command, ...rest]: string[] = text.trim().split(/\s+/);

    if (!Object.values(commands).includes(command as commands)) {
        throw new UnsupportedCommandError(command);
    }

    const artistName: string = rest.join(' ').trim();

    if (!artistName) {
        throw new MissingArtistNameError();
    }

    return { command, artistName };
};

export const handleCreateArtist = async (artistName: string, adminChatId: number): Promise<HandlerResponse> => {
    try {
        const actionNeeded: boolean = await alignTelegramAndDBStates(artistName);

        if (actionNeeded) {
            await createGroup(artistName);
            logger.info('Created Telegram group with the notifications bot');
            const groupChatId: string = await getGroupChatIdByArtistName(artistName);

            await addArtist(artistName, groupChatId);
            logger.info('Artist added to the database');

            await sendAdminMessage(`נוצרה קבוצה חדשה עבור "${artistName}" בהצלחה`, adminChatId);
        }

        return buildHandlerResponse(200, 'Successfully added artist');
    } catch (error) {
        let response: HandlerResponse;
        let reason: string;

        if (error instanceof TelegramGroupCreationError) {
            response = buildHandlerResponse(500, 'Failed to create artist group on Telegram');
            reason = `שגיאה ביצירת הקבוצה בטלגרם`;
        } else if (error instanceof FailedToAddArtistError) {
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
};

export const handleDeleteArtist = async (artistName: string, adminChatId: number): Promise<HandlerResponse> => {
    await sendAdminMessage(`הפקודה /delete עדיין לא זמינה`, adminChatId);
    return buildHandlerResponse(501, 'Not implemented');
};
