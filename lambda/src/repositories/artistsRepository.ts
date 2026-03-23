import { runQuery } from '../clients/dbClient';
import type { RowList } from 'postgres';
import type { ArtistRow } from '../types';

export const getArtists = async (): Promise<RowList<ArtistRow[]>> =>
    runQuery(sql => sql<ArtistRow[]>`SELECT name, chat_id FROM artists`);

export const getGroupChatIdByArtistName = async (name: string): Promise<RowList<Pick<ArtistRow, 'chat_id'>[]>> =>
    runQuery(sql => sql<Pick<ArtistRow, 'chat_id'>[]>`
        SELECT chat_id FROM artists WHERE name = ${name}
    `);

export const addArtist = async (name: string, chatId: string): Promise<RowList<never[]>> =>
    runQuery(sql => sql`INSERT INTO artists (name, chat_id) VALUES (${name}, ${chatId})`);

export const deleteArtist = async (name: string): Promise<RowList<never[]>> =>
    runQuery(sql => sql`DELETE FROM artists WHERE name = ${name}`);

export const updateArtistChatId = async (name: string, chatId: string): Promise<RowList<never[]>> =>
    runQuery(sql => sql`UPDATE artists SET chat_id = ${chatId} WHERE name = ${name}`);
