import { NoShowsError } from '../utils/errors';
import { getShows, BARBY_URL } from '../clients/barbyClient';
import type { Show, ArtistShows } from '../types';

const generateMessage = ({ showName, showDate, showTime, showPrice, showId }: Show): string => `
שם המופע: ${showName}
תאריך: ${showDate}
שעה: ${showTime}
מחיר: ${showPrice}₪
קישור: ${BARBY_URL}/show/${showId}
`.trimStart().trimEnd();

export const getArtistShows = async (artists: string[]): Promise<ArtistShows[]> => {
    const allShows: Show[] = await getShows();
    const relevantData: Show[] = allShows.filter(({ showName, showSold, showSoldMaxBuy }: Show) =>
        artists.some((artist: string) => showSold < showSoldMaxBuy && showName.includes(artist)));

    if (!relevantData.length) {
        throw new NoShowsError(artists);
    }

    return artists.map((artist: string): ArtistShows => ({
        artist,
        shows: relevantData
            .filter(({ showName }: Show) => showName.includes(artist))
            .map(generateMessage),
    }));
};
