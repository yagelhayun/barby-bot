export interface ScheduledEvent {
    source: string;
}

export interface HttpEvent {
    version: string;
    headers: Record<string, string | undefined>;
    body: string;
}

export type LambdaEvent = ScheduledEvent | HttpEvent;
