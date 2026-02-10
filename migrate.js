import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read environment variables
const projectId = 'xzgqmhmvkryayaewpknr';
const supabaseUrl = `https://${projectId}.supabase.co`;
const supabaseAnonKey = 'sb_publishable_hyrPr77SdNIRBctkMCAozQ_I_xDRRyt';

// Note: This uses the anon key - for production, use service_role_key
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Read and split migrations
const migrationsPath = path.join(process.cwd(), 'combined-migrations.sql');
const migrationContent = fs.readFileSync(migrationsPath, 'utf-8');

// Split by semicolons and filter empty statements
const statements = migrationContent
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

console.log(`Found ${statements.length} SQL statements to execute`);

// Execute migrations one by one
let executed = 0;
for (const statement of statements) {
  try {
    const result = supabase.rpc('exec_sql', { sql: statement });
    console.log(`✓ Executed statement ${++executed}`);
  } catch (error) {
    console.error(`✗ Error executing statement:`, error.message);
  }
}

console.log(`\nMigration complete! Executed ${executed} statements.`);
