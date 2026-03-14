export class CommandValidationError extends Error {
    constructor(message) {
        super(message);
    }
}

export class MissingBotCommandError extends CommandValidationError {
    constructor() {
        super('Message must start with a bot command.');
    }
}

export class UnsupportedCommandError extends CommandValidationError {
    constructor(command) {
        super(`Unsupported command "${command}".`);
    }
}

export class MissingArtistNameError extends CommandValidationError {
    constructor() {
        super('Artist name is required. Usage: /create <artist name>');
    }
}

