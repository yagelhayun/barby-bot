export type ArtistRow = {
    name: string;
    chat_id: string;
};

export type ArtistMap = Record<string, string>;

export type ArtistShows = {
    artist: string;
    shows: string[];
};
