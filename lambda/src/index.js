import 'dotenv/config';
import { closeDb } from './clients/dbClient.js';
import { logger } from './utils/config.js';
import { buildHandlerResponse } from './utils/helpers.js';
import { adminHandler, notificationsHandler } from './handlers/index.js';

const logHandlerResult = (name, result) => {
    if (result.statusCode >= 500) {
        logger.error(`${name} failed`, result);
    } else if (result.statusCode >= 400) {
        logger.warn(`${name} rejected request`, result);
    } else {
        logger.debug(`${name} response`, result);
    }
};

export const main = async (event, context) => {
    try {
        if (event.source === "aws.events") {
            logger.info('Notifications handler invoked');
            const result = await notificationsHandler(event, context);
            logHandlerResult('Notifications handler', result);

            return result;
        } else if (event.version === "2.0") {
            // Always return 200 to Telegram — non-2xx causes aggressive retries
            logger.info('Admin handler invoked');
            const result = await adminHandler(event, context);
            logHandlerResult('Admin handler', result);

            return buildHandlerResponse(200, "Request processed");
        }
    } finally {
        await closeDb();
    }
}
