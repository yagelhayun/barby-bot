class DatabaseError extends Error {
    constructor(message: string) {
        super(message);
    }
}

export class FailedToAddArtistError extends DatabaseError {
    public readonly artist: string;

    constructor(artist: string) {
        super(`Failed to add artist ${artist} to database`);
        this.artist = artist;
    }
}

export class DatabaseConnectionError extends DatabaseError {
    public override readonly cause: Error;

    constructor(cause: Error) {
        super('Database connection failed');
        this.cause = cause;
    }
}
