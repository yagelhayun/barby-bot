import sql from '../clients/dbClient.js';

export const getArtists = async () => {
    const artists = await sql`
        SELECT name, chat_id
        FROM artists
    `;

    return artists;
}

export const addArtist = async (name, chatId) => {
    const result = await sql`
        INSERT INTO artists (name, chat_id)
        VALUES (${name}, ${chatId})
    `;

    return result;
}

export const getGroupChatIdByArtistName = async (name) => {
    const result = await sql`
        SELECT chat_id
        FROM artists
        WHERE name = ${name}
    `;

    return result;
}

export const deleteArtist = async (name) => {
    const result = await sql`
        DELETE FROM artists
        WHERE name = ${name}
    `;
}

export const updateArtistChatId = async (name, chatId) => {
    const result = await sql`
        UPDATE artists
        SET chat_id = ${chatId}
        WHERE name = ${name}
    `;
}