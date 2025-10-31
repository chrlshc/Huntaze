require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set in environment');
    process.exit(1);
  }

  console.log('📦 Initializing Huntaze database...\n');
  console.log('Using DATABASE_URL:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('\n🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');
    
    // Read SQL file
    const sqlPath = path.join(__dirname, 'create-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.includes('SELECT')) {
        // This is the verification query
        const result = await client.query(statement);
        console.log('\n📊 Tables created:');
        result.rows.forEach(row => {
          console.log(`  ✓ ${row.table_name} (${row.column_count} columns)`);
        });
      } else {
        await client.query(statement);
        console.log(`  ✓ Statement ${i + 1} executed`);
      }
    }
    
    console.log('\n✅ Database initialized successfully!');
    console.log('\n📋 Summary:');
    console.log('  • users table created');
    console.log('  • sessions table created');
    console.log('  • indexes created for performance');
    console.log('\n🎉 Ready to accept user registrations!\n');
    
  } catch (error) {
    console.error('\n❌ Error initializing database:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Tip: Make sure your database is running and accessible');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('\n💡 Tip: Check your network connection and database firewall rules');
    } else if (error.code === '3D000') {
      console.error('\n💡 Tip: The database does not exist. Create it first.');
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled error:', error);
  process.exit(1);
});

initDatabase();
