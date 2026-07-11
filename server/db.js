const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS submissions (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      gender TEXT,
      phone_country_code TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      birth_year TEXT,
      birth_month TEXT,
      birth_day TEXT,
      email TEXT,
      address_type TEXT NOT NULL DEFAULT 'TW',
      county TEXT,
      district TEXT,
      address_detail TEXT,
      marketing_consent BOOLEAN NOT NULL DEFAULT FALSE,
      language TEXT,
      processed BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

async function insertSubmission(data) {
  await pool.query(
    `INSERT INTO submissions (
      name, gender, phone_country_code, phone_number,
      birth_year, birth_month, birth_day, email,
      address_type, county, district, address_detail,
      marketing_consent, language
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
    [
      data.name, data.gender, data.phone_country_code, data.phone_number,
      data.birth_year, data.birth_month, data.birth_day, data.email,
      data.address_type, data.county, data.district, data.address_detail,
      data.marketing_consent, data.language,
    ],
  );
}

async function listSubmissions() {
  const { rows } = await pool.query('SELECT * FROM submissions ORDER BY id DESC');
  return rows;
}

async function setProcessed(id, processed) {
  await pool.query('UPDATE submissions SET processed = $1 WHERE id = $2', [processed, id]);
}

module.exports = { init, insertSubmission, listSubmissions, setProcessed };
