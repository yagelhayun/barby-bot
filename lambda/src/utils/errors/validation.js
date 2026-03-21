export class ArtistAlreadyExistsError extends Error {
    constructor(artistName) {
        super(`Artist "${artistName}" already exists in the system.`);
    }
}

export class ArtistAlreadyExistsInTelegramError extends Error {
    constructor(artistName) {
        super(`Artist "${artistName}" already exists in Telegram.`);
    }
}

export class ArtistAlreadyExistsInDBError extends Error {
    constructor(artistName) {
        super(`Artist "${artistName}" already exists in the database.`);
    }
}

export class GroupNotFoundError extends Error {
    constructor(groupName) {
        super(`Telegram group "${groupName}" not found.`);
    }
}
