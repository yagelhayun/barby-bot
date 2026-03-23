import {
    getArtists as getArtistsFromDB,
    addArtist as addArtistToDB,
    deleteArtist as deleteArtistFromDB,
    getGroupChatIdByArtistName as getGroupChatIdByArtistNameFromDB,
    updateArtistChatId as updateArtistChatIdInDB,
} from '../repositories/artistsRepository';
import { FailedToAddArtistError, GroupNotFoundError, GroupNotFoundInDatabaseError } from '../utils/errors';
import {
    getGroupChatIdByArtistName as getGroupChatIdByArtistNameFromTelegram,
} from './telegramService';
import { logger } from '../utils/config';
import type { ArtistMap } from '../types';

export const getArtists = async (): Promise<ArtistMap> => {
    const artists = await getArtistsFromDB();

    return artists.reduce<ArtistMap>((acc, { name, chat_id }) => {
        acc[name] = chat_id;
        return acc;
    }, {});
};

export const addArtist = async (name: string, chatId: string): Promise<void> => {
    const result = await addArtistToDB(name, chatId);

    if (result.count === 0) {
        throw new FailedToAddArtistError(name);
    }
};

export const getGroupChatIdByArtistName = async (name: string): Promise<string> => {
    const result = await getGroupChatIdByArtistNameFromDB(name);

    if (result.length === 0) {
        throw new GroupNotFoundInDatabaseError(name);
    }

    return result[0].chat_id;
};

export const deleteArtist = async (name: string): Promise<void> => {
    const result = await deleteArtistFromDB(name);

    if (result.count === 0) {
        throw new GroupNotFoundInDatabaseError(name);
    }

    logger.info('Artist deleted from database');
};

export const updateArtistChatId = async (name: string, chatId: string): Promise<void> => {
    const result = await updateArtistChatIdInDB(name, chatId);

    if (result.count === 0) {
        throw new GroupNotFoundInDatabaseError(name); // TODO: not sure if this is the right error to throw here, since the artist does exist but the update failed. Maybe a new error type is needed?
    }
};

const tryGetId = async (getter: () => Promise<string>): Promise<string | null> => {
    try {
        return await getter();
    } catch (err) {
        if (err instanceof GroupNotFoundError) return null;
        throw err;
    }
};

export const alignTelegramAndDBStates = async (artistName: string): Promise<boolean> => {
    const [telegramId, dbId]: [string | null, string | null] = await Promise.all([
        tryGetId(() => getGroupChatIdByArtistNameFromTelegram(artistName)),
        tryGetId(() => getGroupChatIdByArtistName(artistName)),
    ]);

    if (!telegramId && !dbId) {
        logger.info('Artist not found anywhere, proceeding with creation');
        return true;
    }

    if (telegramId && dbId) {
        if (dbId !== telegramId) {
            logger.info('Chat ID mismatch, syncing DB with Telegram', { dbId, telegramId });
            await updateArtistChatId(artistName, telegramId);
        } else {
            logger.info('Artist already in sync, no action needed');
        }
        return false;
    }

    if (!dbId && telegramId) {
        logger.info('Artist found in Telegram but not in DB, adding to DB');
        await addArtist(artistName, telegramId);
    } else {
        logger.info('Artist found in DB but not in Telegram, removing from DB');
        await deleteArtist(artistName);
    }

    return false;
};
