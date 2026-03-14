export class NoShowsError extends Error {
    constructor(artists) {
        this.artists = artists;
        super('No shows found for the specified artists');
    }
}

class FetchError extends Error {
    constructor(message, res) {
        super(message);
        
        const { status, statusText } = res;

        this.status = status;
        this.reason = statusText;
    }
}

export class BarbyAPIError extends FetchError {
    constructor(res) {
        super('Unable to fetch the Barby API', res);
    }
}

export class TelegramAPIError extends FetchError {
    constructor(res) {
        super('Unable to send Telegram message', res);
    }
}

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
