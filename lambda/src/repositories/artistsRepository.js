import sql from '../clients/dbClient.js';
import { FailedToAddArtistError } from '../utils/errors/index.js';

export const getArtists = async () => {
    const artists = await sql`
        SELECT name, chat_id
        FROM artists
    `;

    return artists.reduce((acc, { name, chat_id }) => {
        acc[name] = chat_id;
        return acc;
    }, {});
}

export const addArtist = async (name, chatId) => {
    const result = await sql`
        INSERT INTO artists (name, chat_id)
        VALUES (${name}, ${chatId})
    `;

    if (result.count === 0) {
        throw new FailedToAddArtistError(name);
    }

    return result;
}
