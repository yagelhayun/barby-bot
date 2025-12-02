import axios from 'axios';

const BARBY_URL = 'https://barby.co.il';

const fetchArtistShows = async (artist) => {
    try {
        console.log(`Fetching shows from ${BARBY_URL}`);

        const response = await axios.get(`${BARBY_URL}/api/shows/find`, {
            headers: {
                'referer': BARBY_URL,
                // 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
            },
        });

        console.log("Received shows data");

        const shows = response
            .data
            .returnShow
            .show
            .filter(({ showName, showSold, showSoldMaxBuy }) => showName.includes(artist) && showSold < showSoldMaxBuy);

        return shows;
    } catch (error) {
        if (error.response) {
            console.error('HTTP Error:', error.response.status);
            console.error(error.response.data);
        } else {
            console.error('Network Error:', error.message);
        }

        throw error;
    }
}

export const getShows = async (artist) => {
    const shows = await fetchArtistShows(artist);

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
        return [`אין הופעות של ${artist} כעת :(`];
    }
}
