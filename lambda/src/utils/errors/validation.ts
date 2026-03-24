export class ArtistAlreadyExistsError extends Error {
    public readonly artistName: string;

    constructor(artistName: string) {
        super(`Artist "${artistName}" already exists and is in sync.`);
        this.artistName = artistName;
    }
}

export class GroupNotFoundError extends Error {
    constructor(message: string) {
        super(message);
    }
}

export class GroupNotFoundInTelegramError extends GroupNotFoundError {
    constructor(groupName: string) {
        super(`Group "${groupName}" not found in Telegram.`);
    }
}

export class GroupNotFoundInDatabaseError extends GroupNotFoundError {
    constructor(groupName: string) {
        super(`Group "${groupName}" not found in database.`);
    }
}
