import 'dotenv/config';
import { env, logger } from '../src/utils/config';
import { main } from '../src';

const mode = process.argv[2];

interface TelegramEntity {
    offset: number;
    length: number;
    type: string;
}

interface TelegramMessage {
    message_id: number;
    from: { id: number; is_bot: boolean };
    chat: { id: number; type: string };
    date: number;
    entities: TelegramEntity[];
    text: string;
}

interface ScheduledEvent {
    source: string;
}

interface HttpEvent {
    version: string;
    routeKey: string;
    headers: Record<string, string>;
    body: string;
    isBase64Encoded: boolean;
}

const event: ScheduledEvent | HttpEvent =
    mode === 'notifications'
        ? { source: 'aws.events' }
        : {
              version: '2.0',
              routeKey: 'POST /telegram',
              headers: {
                  'content-type': 'application/json',
                  'x-telegram-bot-api-secret-token': env.BOT_AUTH_SECRET_TOKEN,
              },
              body: JSON.stringify({
                  update_id: 1,
                  message: {
                      message_id: 1,
                      from: { id: parseInt(env.OWNER_TG_USER_ID, 10), is_bot: false },
                      chat: { id: parseInt(env.OWNER_TG_USER_ID, 10), type: 'private' },
                      date: Math.floor(Date.now() / 1000),
                      entities: [{ offset: 0, length: 7, type: 'bot_command' }],
                      text: '/create ליילי',
                  } satisfies TelegramMessage,
              }),
              isBase64Encoded: false,
          };

main(event, {})
    .then(() => {
        logger.debug('Execution completed successfully');
        process.exit(0);
    })
    .catch((err: unknown) => {
        logger.error('Error during execution:', err);
        process.exit(1);
    });
