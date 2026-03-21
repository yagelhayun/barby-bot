import { logger } from '../utils/config.js';
import { BarbyAPIError } from '../utils/errors/index.js';

export const BARBY_URL = 'https://barby.co.il';

export const getShows = async () => {
    logger.info(`Fetching shows from ${BARBY_URL}`);

    const requestUrl = `${BARBY_URL}/api/shows/find`;
    const requestOptions = {
        method: 'GET',
        headers: {
            'referer': BARBY_URL,
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
        },
    };

    logger.debug(`Fetching URL '${requestUrl}' with options`, requestOptions);
    const res = await fetch(requestUrl, requestOptions);

    if (!res.ok) {
        throw new BarbyAPIError(res);
    }

    const data = await res.json();
    logger.info("Received shows data");

    return data?.returnShow?.show;
}
