export class TelegramGroupCreationError extends Error {
    constructor(artistName, cause) {
        super(`Failed to create Telegram group for artist "${artistName}"`);
        this.cause = cause;
    }
}

export class TelegramAddBotError extends Error {
    constructor(artistName, cause) {
        super(`Failed to add notifications bot to group for artist "${artistName}"`);
        this.cause = cause;
    }
}
