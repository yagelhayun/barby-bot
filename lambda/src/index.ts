import 'dotenv/config';
import { closeDb } from './clients/dbClient';
import { logger } from './utils/config';
import { buildHandlerResponse } from './utils/helpers';
import { adminHandler, notificationsHandler } from './handlers';
import type { HandlerResponse, LambdaEvent } from './types';

const logHandlerResult = (name: string, result: HandlerResponse | undefined): void => {
    if (!result) return;
    if (result.statusCode >= 500) {
        logger.error(`${name} failed`, result);
    } else if (result.statusCode >= 400) {
        logger.warn(`${name} rejected request`, result);
    } else {
        logger.debug(`${name} response`, result);
    }
};

export const main = async (event: LambdaEvent, context: unknown): Promise<HandlerResponse | undefined> => {
    try {
        if ('source' in event && event.source === 'aws.events') {
            logger.info('Notifications handler invoked');
            const result: HandlerResponse = await notificationsHandler(event, context);
            logHandlerResult('Notifications handler', result);

            return result;
        } else if ('version' in event && event.version === '2.0') {
            // Always return 200 to Telegram — non-2xx causes aggressive retries
            logger.info('Admin handler invoked');
            const result: HandlerResponse | undefined = await adminHandler(event, context);
            logHandlerResult('Admin handler', result);

            return buildHandlerResponse(200, 'Request processed');
        }
    } finally {
        await closeDb();
    }
};
