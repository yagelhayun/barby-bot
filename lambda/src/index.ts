import 'dotenv/config';
import { randomUUID } from 'crypto';
import { attachLogContext, setLogMetadata } from '@yagelhayun/logger/server';
import { closeDb } from './clients/dbClient';
import { logger } from './utils/config';
import { buildHandlerResponse } from './utils/helpers';
import { adminHandler, notificationsHandler } from './handlers';
import type { HandlerResponse, LambdaEvent } from './types';

const logHandlerResult = (result: HandlerResponse | undefined): void => {
    if (!result) return;
    if (result.statusCode >= 500) {
        logger.error('Handler failed', result);
    } else if (result.statusCode >= 400) {
        logger.warn('Handler rejected request', result);
    } else {
        logger.debug('Handler response', result);
    }
};

const handleEvent = async (event: LambdaEvent, context: unknown): Promise<HandlerResponse> => {
    try {
        setLogMetadata('uuid', randomUUID());

        if ('source' in event && event.source === 'aws.events') {
            setLogMetadata('handler', 'notifications');
            logger.info('Notifications handler invoked');
            const result: HandlerResponse = await notificationsHandler();
            logHandlerResult(result);
            return result;
        } else if ('version' in event && event.version === '2.0') {
            setLogMetadata('handler', 'admin');
            logger.info('Admin handler invoked');
            const result: HandlerResponse = await adminHandler(event, context);
            logHandlerResult(result);
            return buildHandlerResponse(200, 'Admin Request processed');
        } else {
            logger.warn('Unknown event caught', { event });
            return buildHandlerResponse(200, 'Nothing processed');
        }
    } finally {
        await closeDb();
    }
};

export const main = (event: LambdaEvent, context: unknown): Promise<HandlerResponse | undefined> =>
    new Promise((resolve, reject) => {
        attachLogContext(() => handleEvent(event, context).then(resolve, reject));
    });
