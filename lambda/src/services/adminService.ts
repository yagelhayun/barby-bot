import {
    MissingBotCommandError,
    MissingArtistNameError,
    UnsupportedCommandError,
} from '../utils/errors';
import { logger } from '../utils/config';
import { addArtist, alignTelegramAndDBStates } from '../services/artistsService';
import { createGroup, getGroupChatIdByArtistName } from '../services/telegramService';
import type { TelegramEntity, ParsedCommand } from '../types';

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

export const handleCreateArtist = async (artistName: string): Promise<void> => {
    const actionNeeded: boolean = await alignTelegramAndDBStates(artistName);

    if (!actionNeeded) return;

    await createGroup(artistName);
    logger.info('Telegram group created');
    const groupChatId: string = await getGroupChatIdByArtistName(artistName);

    await addArtist(artistName, groupChatId);
    logger.info('Artist added to database');
};

export const handleDeleteArtist = async (_artistName: string): Promise<void> => {
    throw new Error('Not implemented');
};
