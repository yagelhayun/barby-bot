import type { HandlerResponse } from '../types';

export const buildHandlerResponse = (statusCode: number, body: string): HandlerResponse => ({
    statusCode,
    body,
});
