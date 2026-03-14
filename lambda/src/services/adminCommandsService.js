import {
    MissingBotCommandError,
    MissingArtistNameError,
    UnsupportedCommandError,
} from '../utils/errors/index.js';

export const parseCreateCommand = (text, entities) => {
    if (!entities || entities[0]?.type !== 'bot_command') {
        throw new MissingBotCommandError();
    }

    const [command, ...rest] = text.trim().split(/\s+/);

    if (command !== '/create') {
        throw new UnsupportedCommandError(command);
    }

    const artistName = rest.join(' ').trim();

    if (!artistName) {
        throw new MissingArtistNameError();
    }

    return artistName;
};

