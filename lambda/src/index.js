import 'dotenv/config';
import { adminHandler } from './handlers/adminHandler.js';
import { notificationsHandler } from './handlers/notificationsHandler.js';

export const main = async (event, context) => {
    if (event.source === "aws.events") {
        console.log('Notifications handler invoked');
        return await notificationsHandler(event, context);
    }

    if (event.version === "2.0") {
        console.log('Admin handler invoked');
        return await adminHandler(event, context);
    }

    return { statusCode: 200, body: "Request ignored" };
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
