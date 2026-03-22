export type ScheduledEvent = {
    source: string;
};

export type HttpEvent = {
    version: string;
    headers: Record<string, string | undefined>;
    body: string;
};

export type LambdaEvent = ScheduledEvent | HttpEvent;
