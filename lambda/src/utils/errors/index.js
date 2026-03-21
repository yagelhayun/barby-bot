export * from './http.js';
export * from './database.js';
export * from './commands.js';
export * from './validation.js';
export * from './telegramClient.js';

export class NoShowsError extends Error {
    constructor(artists) {
        super('No shows found for the specified artists');

        this.artists = artists;
    }
}
