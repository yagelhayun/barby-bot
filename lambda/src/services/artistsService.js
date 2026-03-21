import {
    getArtists as getArtistsFromDB,
    addArtist as addArtistToDB,
    deleteArtist as deleteArtistFromDB,
    getGroupChatIdByArtistName as getGroupChatIdByArtistNameFromDB,
    updateArtistChatId as updateArtistChatIdInDB
} from "../repositories/artistsRepository.js";
import { FailedToAddArtistError, GroupNotFoundError } from '../utils/errors/index.js';
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

export const alignTelegramAndDBStates = async (artistName) => {
    let telegramId;
    let dbId;
    try {
        telegramId = await getGroupChatIdByArtistNameFromTelegram(artistName);
    } catch (err) {
        if (!(err instanceof GroupNotFoundError)) {
            throw err;
        }
    }
    
    try {
        dbId = (await getGroupChatIdByArtistNameFromDB(artistName))[0]?.chat_id;
    } catch (err) {
    }

    if (!!dbId && !!telegramId && dbId === telegramId) {
        logger.info(`Artist "${artistName}" already exists in both Telegram and DB with matching chat IDs. No action needed.`);
        return false;
    } else if (!!dbId && !!telegramId && dbId !== telegramId) {
        logger.info(`Mismatch between Telegram and DB states for artist "${artistName}". Updating DB with Telegram chat ID.`);
        await updateArtistChatIdInDB(artistName, telegramId);
        return false;
    } else if (!dbId && !!telegramId) {
        logger.info(`Artist "${artistName}" exists in Telegram but not in DB. Adding to DB.`);
        await addArtistToDB(artistName, telegramId);
        return false;
    } else if (!!dbId && !telegramId) {
        logger.info(`Artist "${artistName}" exists in DB but not in Telegram. Deleting from DB.`);
        await deleteArtistFromDB(artistName);
        return false;
    } else {
        logger.info(`Artist "${artistName}" does not exist in either Telegram or DB. Proceeding with creation.`);
        return true;
    }
}
