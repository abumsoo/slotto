import pgPromise from 'pg-promise';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pgp = pgPromise({});
const db = pgp(process.env.DATABASE_URL);

export default db;
