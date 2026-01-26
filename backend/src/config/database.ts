import pgPromise from 'pg-promise';

const pgp = pgPromise({});

const config = {
  host: 'localhost',
  port: 5432,
  database: 'dailyposts',
  user: 'dev',
  password: 'dev',
};

const db = pgp(config);

export default db;
