import { FetchError } from './http';

export class TelegramGroupCreationError extends Error {
    public override readonly cause: Error;

    constructor(artistName: string, error: Error) {
        super(`Failed to create Telegram group for artist "${artistName}"`);
        this.cause = error;
    }
}

export class UnableToSendBotMessageError extends FetchError {
    constructor(res: Response) {
        super('Unable to send Telegram message', res);
    }
}
