import sql from '../clients/dbClient';
import type { RowList } from 'postgres';
import type { ArtistRow } from '../types';

export const getArtists = async (): Promise<RowList<ArtistRow[]>> => {
    const result: RowList<ArtistRow[]> = await sql<ArtistRow[]>`
        SELECT name, chat_id
        FROM artists
    `;

    return result;
};

export const getGroupChatIdByArtistName = async (name: string): Promise<RowList<Pick<ArtistRow, 'chat_id'>[]>> => {
    const result: RowList<Pick<ArtistRow, 'chat_id'>[]> = await sql<Pick<ArtistRow, 'chat_id'>[]>`
        SELECT chat_id
        FROM artists
        WHERE name = ${name}
    `;

    return result;
};

export const addArtist = async (name: string, chatId: string): Promise<RowList<never[]>> => {
    const result: RowList<never[]> = await sql`
        INSERT INTO artists (name, chat_id)
        VALUES (${name}, ${chatId})
    `;

    return result;
};

export const deleteArtist = async (name: string): Promise<RowList<never[]>> => {
    const result: RowList<never[]> = await sql`
        DELETE FROM artists
        WHERE name = ${name}
    `;

    return result;
};

export const updateArtistChatId = async (name: string, chatId: string): Promise<RowList<never[]>> => {
    const result: RowList<never[]> = await sql`
        UPDATE artists
        SET chat_id = ${chatId}
        WHERE name = ${name}
    `;

    return result;
};
