const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://chtfqkriruyxvjxmmazl.supabase.co'; // Inferido del token o proyecto?
// Wait, I should read the URL from environment.ts
const envPath = path.join(__dirname, '../src/environments/environment.ts');
const envContent = fs.readFileSync(envPath, 'utf8');
const urlMatch = envContent.match(/supabaseUrl:\s*'([^']+)'/);
const supabaseUrlMatch = urlMatch ? urlMatch[1] : null;

const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrlMatch || !supabaseKey) {
  console.error('Faltan credenciales');
  process.exit(1);
}

const supabase = createClient(supabaseUrlMatch, supabaseKey);

async function inspect() {
  const { data, error } = await supabase.from('pedidos').select('*').limit(1);
  console.log(data, error);
}

inspect();
