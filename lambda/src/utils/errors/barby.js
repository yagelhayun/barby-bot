export class NoShowsError extends Error {
    constructor(artists) {
        super('No shows found for the specified artists');

        this.artists = artists;
    }
}
