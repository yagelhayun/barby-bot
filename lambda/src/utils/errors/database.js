class DatabaseError extends Error {
    constructor(message) {
        super(message);
    }
}

export class FailedToAddArtistError extends DatabaseError {
    constructor(artist) {
        super(`Failed to add artist ${artist} to database`);
        this.artist = artist;
    }
}
