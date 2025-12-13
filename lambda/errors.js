export class NoShowsError extends Error {
    constructor(artist) {
        super(`אין הופעות של ${artist} כעת :(`);
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
