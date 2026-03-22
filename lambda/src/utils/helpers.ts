import type { HandlerResponse } from '../types';

export type { HandlerResponse };

export const buildHandlerResponse = (statusCode: number, body: string): HandlerResponse => ({
    statusCode,
    body,
});
