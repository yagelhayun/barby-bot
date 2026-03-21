import { FetchError } from './http.js';

export class TelegramGroupCreationError extends Error {
    constructor(artistName, error) {
        super(`Failed to create Telegram group for artist "${artistName}"`);
        this.cause = error;
    }
}

export class UnableToSendBotMessageError extends FetchError {
    constructor(res) {
        super('Unable to send Telegram message', res);
    }
}
