import {
    getArtists as getArtistsFromDB,
    addArtist as addArtistToDB,
    deleteArtist as deleteArtistFromDB,
    getGroupChatIdByArtistName as getGroupChatIdByArtistNameFromDB,
    updateArtistChatId as updateArtistChatIdInDB
} from "../repositories/artistsRepository.js";
import { FailedToAddArtistError, GroupNotFoundError, GroupNotFoundInDatabaseError } from '../utils/errors/index.js';
import { 
    getGroupChatIdByArtistName as getGroupChatIdByArtistNameFromTelegram
} from './telegramService.js';
import { logger } from "../utils/config.js";

export const getArtists = async () => {
    const artists = await getArtistsFromDB();

    return artists.reduce((acc, { name, chat_id }) => {
        acc[name] = chat_id;
        return acc;
    }, {});
}

export const addArtist = async (name, chatId) => {
    const result = await addArtistToDB(name, chatId);

    if (result.count === 0) {
        throw new FailedToAddArtistError(name);
    }
}

export const getGroupChatIdByArtistName = async (name) => {
    const result = await getGroupChatIdByArtistNameFromDB(name);

    if (result.length === 0) {
        throw new GroupNotFoundInDatabaseError(name);
    }

    return result[0].chat_id;
}

export const deleteArtist = async (name) => {
    const result = await deleteArtistFromDB(name);

    if (result.count === 0) {
        throw new GroupNotFoundInDatabaseError(name);
    }

    logger.info(result);
}

export const updateArtistChatId = async (name, chatId) => {
    const result = await updateArtistChatIdInDB(name, chatId);
    
    if (result.count === 0) {
        throw new GroupNotFoundInDatabaseError(name); // TODO: not sure if this is the right error to throw here, since the artist does exist but the update failed. Maybe a new error type is needed?
    }
}

const tryGetId = async (getter) => {
    try {
        return await getter();
    } catch (err) {
        if (err instanceof GroupNotFoundError) return null;
        throw err;
    }
};

export const alignTelegramAndDBStates = async (artistName) => {
    const [telegramId, dbId] = await Promise.all([
        tryGetId(() => getGroupChatIdByArtistNameFromTelegram(artistName)),
        tryGetId(() => getGroupChatIdByArtistName(artistName)),
    ]);

    if (!telegramId && !dbId) {
        logger.info(`Artist "${artistName}" not found anywhere. Proceeding with creation.`);
        return true;
    }

    if (telegramId && dbId) {
        if (dbId !== telegramId) {
            logger.info(`Chat ID mismatch for "${artistName}". Syncing DB with Telegram.`);
            await updateArtistChatId(artistName, telegramId);
        } else {
            logger.info(`Artist "${artistName}" already in sync. No action needed.`);
        }
        return false;
    }

    if (!dbId) {
        logger.info(`Artist "${artistName}" found in Telegram but not in DB. Adding to DB.`);
        await addArtist(artistName, telegramId);
    } else {
        logger.info(`Artist "${artistName}" found in DB but not in Telegram. Removing from DB.`);
        await deleteArtist(artistName);
    }

    return false;
}
