import axios from 'axios';
import { BarbyAPIError, NoShowsError } from "./errors.js";

const BARBY_URL = 'https://barby.co.il';

const getShows = async () => {
    try {
        console.log(`Fetching shows from ${BARBY_URL}`);

        const response = await axios.get(`${BARBY_URL}/api/shows/find`, {
            headers: {
                'referer': BARBY_URL,
                // 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
            },
        });

        console.log("Received shows data");

        return response
            .data
            .returnShow
            .show;
    } catch (error) {
        throw new BarbyAPIError(error);
    }
}

const getArtistShows = async (artist) => {
    const allShows = await getShows();
    return allShows.filter(({ showName, showSold, showSoldMaxBuy }) => showName.includes(artist) && showSold < showSoldMaxBuy);
}

export const generateShowMessage = async (artist) => {
    const shows = await getArtistShows(artist);

    if (shows.length) {
        const relevantData = shows.map(({ showDate, showTime, showPrice, showName, showId }) => (`
שם המופע: ${showName}
תאריך: ${showDate}
שעה: ${showTime}
מחיר: ${showPrice}
קישור: ${BARBY_URL}/show/${showId}
            `.trimStart().trimEnd()
        ));

        return relevantData;
    } else {
        throw new NoShowsError(artist);
    }
}
