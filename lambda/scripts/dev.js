import 'dotenv/config';
import { env, logger } from '../src/utils/config.js';
import { main } from '../src/index.js';

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
                    text: '/create ליילי',
                },
            }),
            isBase64Encoded: false,
          };

main(event, {})
    .then(() => {
        logger.debug('Execution completed successfully');
        process.exit(0);
    })
    .catch((err) => {
        logger.error('Error during execution:', err);
        process.exit(1);
    });
