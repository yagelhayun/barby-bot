import postgres from 'postgres';
import { env } from '../utils/config';

const sql = postgres({
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

export const closeDb = (): Promise<void> => sql.end();

export default sql;
