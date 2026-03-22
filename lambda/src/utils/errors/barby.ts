export class NoShowsError extends Error {
    public readonly artists: string[];

    constructor(artists: string[]) {
        super('No shows found for the specified artists');

        this.artists = artists;
    }
}
