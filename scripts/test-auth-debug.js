// Test auth flow
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function test() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const result = await pool.query(
      'SELECT id, email, password FROM users WHERE LOWER(email) = LOWER($1)',
      ['ceo@huntaze.com']
    );
    
    console.log('Found:', result.rows.length, 'users');
    if (result.rows[0]) {
      const user = result.rows[0];
      const valid = await bcrypt.compare('betatest123', user.password);
      console.log('Password valid:', valid);
      console.log('User ID:', user.id);
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
  
  await pool.end();
}

test();
