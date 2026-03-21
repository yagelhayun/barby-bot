import 'dotenv/config';
import { closeDb } from './clients/dbClient.js';
import { env, logger } from './utils/config.js';
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

if (env.NODE_ENV === 'development') {
    const mode = process.argv[2];
    const event =
        mode === 'notifications'
            ? { source: 'aws.events' }
            : {
                version: '2.0',
                routeKey: 'POST /telegram',
                headers: {
                    'content-type': 'application/json',
                    'x-telegram-bot-api-secret-token': env.ADMIN_BOT_SECRET_TOKEN,
                },
                body: JSON.stringify({
                    update_id: 1,
                    message: {
                        message_id: 1,
                        from: { id: parseInt(env.ADMIN_BOT_OWNER_ID, 10), is_bot: false },
                        chat: { id: parseInt(env.ADMIN_BOT_OWNER_ID, 10), type: 'private' },
                        date: Math.floor(Date.now() / 1000),
                        entities: [{ offset: 0, length: 7, type: 'bot_command' }],
                        text: '/create מרסדס בנד',
                    },
                }),
                isBase64Encoded: false,
              };
    const context = {};

    main(event, context)
        .then(() => {
            logger.debug('Execution completed successfully');
            process.exit(0);
        })
        .catch((err) => {
            logger.error('Error during execution:', err);
            process.exit(1);
        });
}
