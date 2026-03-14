import { NoShowsError } from '../utils/errors.js';
import { getShows, BARBY_URL } from '../clients/barbyClient.js';

const generateMessage = ({ showName, showDate, showTime, showPrice, showId }) => `
שם המופע: ${showName}
תאריך: ${showDate}
שעה: ${showTime}
מחיר: ${showPrice}₪
קישור: ${BARBY_URL}/show/${showId}
`.trimStart().trimEnd();

export const getArtistShows = async (artists) => {
    const allShows = await getShows();
    const relevantData = allShows.filter(({ showName, showSold, showSoldMaxBuy }) =>
        artists.some(artist => showSold < showSoldMaxBuy && showName.includes(artist)));

    if (!relevantData.length) {
        throw new NoShowsError(artists);
    }

    return artists.map(artist => ({
        artist,
        shows: relevantData
            .filter(({ showName }) => showName.includes(artist))
            .map(generateMessage)
    }));
}
