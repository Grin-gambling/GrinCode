import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'grincode',
  password: 'password123', // Remeber this shit
  port: 5432,
});

export default {
  connect: () => pool.connect(),
  query: (text, params) => pool.query(text, params),
};