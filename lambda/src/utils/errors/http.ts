export class FetchError extends Error {
    public readonly status: number;
    public readonly reason: string;

    constructor(message: string, res: Response) {
        super(message);

        const { status, statusText } = res;

        this.status = status;
        this.reason = statusText;
    }
}

export class BarbyAPIError extends FetchError {
    constructor(res: Response) {
        super('Unable to fetch the Barby API', res);
    }
}
