export class CommandValidationError extends Error {
    constructor(message: string) {
        super(message);
    }
}

export class MissingBotCommandError extends CommandValidationError {
    constructor() {
        super('Message must start with a bot command.');
    }
}

export class UnsupportedCommandError extends CommandValidationError {
    public readonly command: string;

    constructor(command: string) {
        super(`Unsupported command "${command}".`);
        this.command = command;
    }
}

export class MissingArtistNameError extends CommandValidationError {
    constructor() {
        super('Artist name is missing.');
    }
}
