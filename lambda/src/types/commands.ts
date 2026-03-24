export enum Command {
    CREATE = '/create',
    DELETE = '/delete',
    NOTIFY = '/notify',
}

export type ParsedCommand =
    | { command: Command.CREATE | Command.DELETE; artistName: string }
    | { command: Command.NOTIFY };
