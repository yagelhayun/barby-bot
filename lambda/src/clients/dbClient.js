import postgres from "postgres";
import { env } from '../utils/config.js';

const sql = postgres({
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    database: env.DATABASE_NAME,
    username: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    ssl: 'require',
    max: 1,           // Lambda runs one request at a time — no pool needed
    idle_timeout: 20, // close idle connections after 20s
    connect_timeout: 10,
});

export const closeDb = () => sql.end();

export default sql;
