export enum Command {
    CREATE = '/create',
    DELETE = '/delete',
}

export type ParsedCommand = {
    command: Command;
    artistName: string;
};
