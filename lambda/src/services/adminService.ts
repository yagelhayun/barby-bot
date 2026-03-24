import {
    MissingBotCommandError,
    MissingArtistNameError,
    UnsupportedCommandError,
    ArtistAlreadyExistsError,
} from '../utils/errors';
import { logger } from '../utils/config';
import { addArtist, alignTelegramAndDBStatesForCreation, alignTelegramAndDBStatesForDeletion, deleteArtist } from '../services/artistsService';
import { createGroup, deleteGroup } from '../services/telegramService';
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

    if (command === Command.NOTIFY) {
        return { command: Command.NOTIFY };
    }

    const artistName: string = rest.join(' ').trim();

    if (!artistName) {
        throw new MissingArtistNameError();
    }

    return { command: command as Command.CREATE | Command.DELETE, artistName };
};

export const handleCreateArtist = async (artistName: string): Promise<void> => {
    const actionNeeded: boolean = await alignTelegramAndDBStatesForCreation(artistName);

    if (!actionNeeded) throw new ArtistAlreadyExistsError(artistName);

    const groupChatId: string = await createGroup(artistName);

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
