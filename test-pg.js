
const { Client } = require('pg');

async function testConnection() {
  const connectionString = 'postgresql://postgres:BCczry11@!!@@db.ifstampptcvffajbvqhs.supabase.co:5432/postgres?sslmode=require';
  
  // O problema do @ é resolvido quando passamos a string direto para o driver ou usamos um objeto de config
  // Mas vamos tentar o objeto de config para ser mais seguro
  const client = new Client({
    user: 'postgres',
    host: 'db.ifstampptcvffajbvqhs.supabase.co',
    database: 'postgres',
    password: 'BCczry11@!!@@',
    port: 5432,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database directly via node-postgres');
    const res = await client.query('SELECT count(*) FROM "User"');
    console.log('User count:', res.rows[0].count);
    await client.end();
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  }
}

testConnection();
