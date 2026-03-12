import sql from "./db.js"

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
