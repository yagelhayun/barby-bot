import {
    MissingBotCommandError,
    MissingArtistNameError,
    UnsupportedCommandError,
} from '../utils/errors';
import { logger } from '../utils/config';
import { addArtist, alignTelegramAndDBStates, alignTelegramAndDBStatesForDeletion, deleteArtist } from '../services/artistsService';
import { createGroup, deleteGroup, getGroupChatIdByArtistName } from '../services/telegramService';
import { Command } from '../types';
import type { TelegramEntity, ParsedCommand } from '../types';

export const parseCommand = (text: string | undefined, entities: TelegramEntity[] | undefined): ParsedCommand => {
    if (!entities || entities[0]?.type !== 'bot_command' || !text) {
        throw new MissingBotCommandError();
    }

    const [command, ...rest]: string[] = text.trim().split(/\s+/);

    if (!Object.values(Command).includes(command as Command)) {
        throw new UnsupportedCommandError(command);
    }

    const artistName: string = rest.join(' ').trim();

    if (!artistName) {
        throw new MissingArtistNameError();
    }

    return { command: command as Command, artistName };
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

export const handleDeleteArtist = async (artistName: string): Promise<void> => {
    const { shouldDeleteFromTelegram, shouldDeleteFromDb } = await alignTelegramAndDBStatesForDeletion(artistName);

    if (shouldDeleteFromTelegram) {
        await deleteGroup(artistName);
    }

    if (shouldDeleteFromDb) {
        await deleteArtist(artistName);
    }
};
