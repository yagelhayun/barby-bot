import 'dotenv/config';
import { notificationsHandler } from './handlers/notificationsHandler.js';

export const main = async (event, context) => {
    return notificationsHandler(event, context);
}

if (process.env.NODE_ENV === 'development') {
    notificationsHandler()
        .then(() => {
            console.log('Execution completed successfully');
            process.exit(0);
        })
        .catch((err) => {
            console.error('Error during execution:', err);
            process.exit(1);
        });
}
