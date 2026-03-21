export class GroupNotFoundError extends Error {
    constructor(message) {
        super(message);
    }
}

export class GroupNotFoundInTelegramError extends GroupNotFoundError {
    constructor(groupName) {
        super(`Group "${groupName}" not found in Telegram.`);
    }
}

export class GroupNotFoundInDatabaseError extends GroupNotFoundError {
    constructor(groupName) {
        super(`Group "${groupName}" not found in database.`);
    }
}
