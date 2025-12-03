export class NoShowsError extends Error {
    constructor(artist) {
        super(`אין הופעות של ${artist} כעת :(`);
    }
}

export class BarbyAPIError extends Error {
    constructor(error) {
        super('Unable to fetch the Barby API');
        
        if (error.response) {
            this.type = 'HTTP Error';
            this.status = error.response.status;
        } else {
            this.type = 'Network Error';
        }
    }
}

export class TelegramAPIError extends Error {
    constructor(error) {
        super('Unable to send message');
        
        if (error.response) {
            this.type = 'HTTP Error';
            this.status = error.response.status;
            this.reason = error.response.data.description;
        } else {
            this.type = 'Network Error';
        }
    }
}
