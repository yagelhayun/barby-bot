export interface ArtistRow {
    name: string;
    chat_id: string;
}

/** Maps artist name to Telegram group chat ID */
export type ArtistMap = Record<string, string>;

export interface ArtistShows {
    artist: string;
    shows: string[];
}
