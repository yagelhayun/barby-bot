import sql from '../clients/dbClient';
import type postgres from 'postgres';
import type { ArtistRow } from '../types';

export type { ArtistRow };

export const getArtists = async (): Promise<postgres.RowList<ArtistRow[]>> => {
    const result: postgres.RowList<ArtistRow[]> = await sql<ArtistRow[]>`
        SELECT name, chat_id
        FROM artists
    `;

    return result;
};

export const getGroupChatIdByArtistName = async (name: string): Promise<postgres.RowList<Pick<ArtistRow, 'chat_id'>[]>> => {
    const result: postgres.RowList<Pick<ArtistRow, 'chat_id'>[]> = await sql<Pick<ArtistRow, 'chat_id'>[]>`
        SELECT chat_id
        FROM artists
        WHERE name = ${name}
    `;

    return result;
};

export const addArtist = async (name: string, chatId: string): Promise<postgres.RowList<never[]>> => {
    const result: postgres.RowList<never[]> = await sql`
        INSERT INTO artists (name, chat_id)
        VALUES (${name}, ${chatId})
    `;

    return result;
};

export const deleteArtist = async (name: string): Promise<postgres.RowList<never[]>> => {
    const result: postgres.RowList<never[]> = await sql`
        DELETE FROM artists
        WHERE name = ${name}
    `;

    return result;
};

export const updateArtistChatId = async (name: string, chatId: string): Promise<postgres.RowList<never[]>> => {
    const result: postgres.RowList<never[]> = await sql`
        UPDATE artists
        SET chat_id = ${chatId}
        WHERE name = ${name}
    `;

    return result;
};
