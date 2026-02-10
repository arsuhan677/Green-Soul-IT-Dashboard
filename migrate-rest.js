#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import https from 'https';

const PROJECT_ID = 'xzgqmhmvkryayaewpknr';
const SUPABASE_URL = `https://${PROJECT_ID}.supabase.co`;
const DB_PASSWORD = process.env.DB_PASSWORD;

if (!DB_PASSWORD) {
  console.error('❌ Error: DB_PASSWORD environment variable required!');
  console.error('Run: $env:DB_PASSWORD="your_password"; node migrate-rest.js');
  process.exit(1);
}

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║    Supabase Database Migration (REST API Method)          ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');
console.log(`📍 Project: ${PROJECT_ID}`);
console.log(`🔑 Using Supabase REST API\n`);

async function executeSql(sql) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: `${PROJECT_ID}.supabase.co`,
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DB_PASSWORD}`,
        'apikey': DB_PASSWORD,
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data });
        } else {
          reject({ 
            statusCode: res.statusCode, 
            message: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify({ sql }));
    req.end();
  });
}

async function runMigrations() {
  try {
    const migrationFile = path.join(process.cwd(), 'migration-clean.sql');
    
    if (!fs.existsSync(migrationFile)) {
      throw new Error('migration-clean.sql not found!');
    }

    const sql = fs.readFileSync(migrationFile, 'utf-8');
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`🚀 Found ${statements.length} SQL statements\n`);
    console.log('Note: This uses the REST API method. For large migrations,');
    console.log('      please use the SQL Editor in Supabase dashboard.\n');

    let executed = 0;
    
    // Execute first 5 statements as a test
    for (let i = 0; i < Math.min(5, statements.length); i++) {
      try {
        const stmt = statements[i];
        if (stmt.length < 200) {
          console.log(`  ${i + 1}. ${stmt.substring(0, 50)}...`);
        }
        
        await executeSql(stmt);
        executed++;
      } catch (err) {
        if (err.statusCode === 400 || err.statusCode === 404) {
          // This method doesn't support direct SQL execution
          throw new Error('REST API method not available. Please use manual SQL Editor method.');
        }
      }
    }
    
    console.log(`\n✅ ${executed} test statements executed successfully!\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.statusCode) {
      console.error(`   Status: ${error.statusCode}`);
    }
    process.exit(1);
  }
}

runMigrations();
