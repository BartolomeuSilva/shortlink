
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

async function testAuth() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('Testing Supabase Connection...');
  console.log('URL:', supabaseUrl);
  console.log('Service Role Key defined:', !!supabaseServiceRoleKey);

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  // Teste de consulta à tabela User
  const { data: user, error } = await supabaseAdmin
    .from('User')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error querying User table:', error);
    return;
  }

  console.log('Successfully queried User table. Found', user?.length, 'users.');
  if (user && user.length > 0) {
      console.log('Fields in User table:', Object.keys(user[0]));
  }
}

testAuth();
