import 'dotenv/config';
import { env, logger } from './utils/config.js';
import { buildHandlerResponse } from './utils/helpers.js';
import { adminHandler, notificationsHandler } from './handlers/index.js';

export const main = async (event, context) => {
    if (event.source === "aws.events") {
        logger.info('Notifications handler invoked');
        const notificationsResult = await notificationsHandler(event, context);
        logger.debug('Notifications handler response (ignored by HTTP return)', notificationsResult);
    } else if (event.version === "2.0") {
        logger.info('Admin handler invoked');
        const adminResult = await adminHandler(event, context);
        logger.debug('Admin handler response (ignored by HTTP return)', adminResult);
    }

    return buildHandlerResponse(200, "Request processed");
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
                        text: '/create Artist Name',
                    },
                }),
                isBase64Encoded: false,
              };
    const context = {};

    main(event, context)
        .then(() => {
            logger.info('Execution completed successfully');
            process.exit(0);
        })
        .catch((err) => {
            logger.error('Error during execution:', err);
            process.exit(1);
        });
}
