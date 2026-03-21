export class TelegramGroupCreationError extends Error {
    constructor(artistName, error) {
        super(`Failed to create Telegram group for artist "${artistName}"`);
        this.cause = error;
    }
}
