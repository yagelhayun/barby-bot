import postgres from 'postgres';
import { env, logger } from '../utils/config';
import { DatabaseConnectionError } from '../utils/errors';

let _sql: postgres.Sql | null = null;

const createSql = (): postgres.Sql =>
    postgres({
        host: env.DATABASE_HOST,
        port: env.DATABASE_PORT,
        database: env.DATABASE_NAME,
        username: env.DATABASE_USER,
        password: env.DATABASE_PASSWORD,
        ssl: 'require',
        max: 1,
        idle_timeout: 20,
        connect_timeout: 10,
    });

export const getDb = (): postgres.Sql => {
    if (!_sql) {
        logger.debug('Initializing database connection');
        _sql = createSql();
    }
    return _sql;
};

export const closeDb = async (): Promise<void> => {
    if (_sql) {
        await _sql.end({ timeout: 5 });
        _sql = null;
    }
};

const CONNECTION_ERROR_CODES = new Set(['CONNECTION_ENDED', 'CONNECTION_DESTROYED', 'CONNECTION_CLOSED']);

const isConnectionError = (err: unknown): err is Error =>
    err instanceof Error &&
    'code' in err &&
    CONNECTION_ERROR_CODES.has(String((err as Record<string, unknown>).code));

export const runQuery = async <T>(fn: (sql: postgres.Sql) => Promise<T>): Promise<T> => {
    try {
        return await fn(getDb());
    } catch (err) {
        if (isConnectionError(err)) {
            throw new DatabaseConnectionError(err);
        }
        throw err;
    }
};
