class DatabaseError extends Error {
    constructor(message) {
        super(message);
    }
}

export class ArtistNotFoundError extends DatabaseError {
    constructor(artist) {
        super(`Artist ${artist} not found in database`);
    }
}

export class ArtistAlreadyExistsError extends DatabaseError {
    constructor(artist) {
        super(`Artist ${artist} already exists in database`);
    }
}

export class FailedToAddArtistError extends DatabaseError {
    constructor(artist) {
        super(`Failed to add artist ${artist} to database`);
    }
}

