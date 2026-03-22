import { logger } from '../utils/config';
import { BarbyAPIError } from '../utils/errors';
import type { Show, BarbyApiResponse } from '../types';

export const BARBY_URL: string = 'https://barby.co.il';

export const getShows = async (): Promise<Show[]> => {
    logger.info(`Fetching shows from ${BARBY_URL}`);

    const requestUrl: string = `${BARBY_URL}/api/shows/find`;
    const requestOptions: RequestInit = {
        method: 'GET',
        headers: {
            referer: BARBY_URL,
            'user-agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
        },
    };

    const res: Response = await fetch(requestUrl, requestOptions);

    if (!res.ok) {
        throw new BarbyAPIError(res);
    }

    const data: BarbyApiResponse = await res.json();
    logger.info('Received shows data');

    return data?.returnShow?.show ?? [];
};
