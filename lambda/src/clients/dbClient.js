import postgres from "postgres";
import { env } from '../utils/config.js';

const {
    DATABASE_HOST,
    DATABASE_PORT,
    DATABASE_NAME,
    DATABASE_USER,
    DATABASE_PASSWORD,
} = env;

const connectionString = `postgresql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}`;
const sql = postgres(connectionString);

export default sql;
