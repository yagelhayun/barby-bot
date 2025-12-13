import { BarbyAPIError, NoShowsError } from "./errors.js";

const BARBY_URL = 'https://barby.co.il';

const getShows = async () => {
    console.log(`Fetching shows from ${BARBY_URL}`);

    const res = await fetch(`${BARBY_URL}/api/shows/find`, {
        method: 'GET',
        headers: {
            'referer': BARBY_URL,
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
        },
    });

    if (!res.ok) {
        throw new BarbyAPIError(res);
    }

    const data = await res.json();
    console.log("Received shows data");

    return data?.returnShow?.show;
}

const generateMessage = ({ showName, showDate, showTime, showPrice, showId }) => `
שם המופע: ${showName}
תאריך: ${showDate}
שעה: ${showTime}
מחיר: ${showPrice}₪
קישור: ${BARBY_URL}/show/${showId}
`.trimStart().trimEnd()

export const getArtistShows = async (artists) => {
    const allShows = await getShows();
    const relevantData = allShows.filter(({ showName, showSold, showSoldMaxBuy }) => artists.some(artist => showName.includes(artist)) && showSold < showSoldMaxBuy);

    if (!relevantData.length) {
        throw new NoShowsError(artists);
    }

    return artists.map(artist => ({
        artist,
        shows: relevantData.filter(({ showName }) => showName.includes(artist)).map(generateMessage)
    }));
}
