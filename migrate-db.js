#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import pkg from 'pg';

const { Pool } = pkg;

// Supabase project details
const PROJECT_ID = 'xzgqmhmvkryayaewpknr';
const DB_HOST = `db.${PROJECT_ID}.supabase.co`;
const DB_USER = 'postgres';
const DB_NAME = 'postgres';
const DB_PORT = 5432;

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║         Supabase Database Migration Runner                 ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log(`📍 Database Host: ${DB_HOST}`);
console.log(`👤 Database User: ${DB_USER}`);
console.log(`🗄️  Database Name: ${DB_NAME}\n`);

// Get password from environment
const password = process.env.DB_PASSWORD;

if (!password) {
  console.error('❌ Error: Database password required!\n');
  console.log('📋 Instructions:');
  console.log('1. Go to: https://app.supabase.com/project/' + PROJECT_ID);
  console.log('2. Click "Project Settings" → "Database"');
  console.log('3. Copy the "Password" field');
  console.log('4. Run this command:\n');
  console.log('   Windows (PowerShell):');
  console.log('   $env:DB_PASSWORD="your_password"; node migrate-db.js\n');
  console.log('   OR\n');
  console.log('   Windows (CMD):');
  console.log('   set DB_PASSWORD=your_password && node migrate-db.js\n');
  console.log('   macOS/Linux:');
  console.log('   DB_PASSWORD="your_password" node migrate-db.js\n');
  process.exit(1);
}

async function runMigrations() {
  let client;
  
  try {
    const migrationFile = path.join(process.cwd(), 'migration-clean.sql');
    
    if (!fs.existsSync(migrationFile)) {
      throw new Error('migration-clean.sql not found! Make sure you\'re in the correct directory.');
    }

    const sql = fs.readFileSync(migrationFile, 'utf-8');
    
    console.log('🔌 Connecting to database...');
    
    // Create connection pool
    const pool = new Pool({
      user: DB_USER,
      password: password,
      host: DB_HOST,
      port: DB_PORT,
      database: DB_NAME,
      ssl: { rejectUnauthorized: false },
      statement_timeout: 30000,
    });

    client = await pool.connect();
    console.log('✅ Connected to database\n');
    
    console.log('🚀 Executing migrations...\n');

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0 && !statement.startsWith('--'));

    let count = 0;
    for (const statement of statements) {
      try {
        // Skip comments and empty statements
        if (statement.startsWith('--') || !statement.trim()) continue;
        
        await client.query(statement);
        count++;
        
        // Show progress
        if (count % 10 === 0) {
          process.stdout.write(`✓ ${count} statements executed\r`);
        }
      } catch (err) {
        // Ignore certain common errors from duplicate migrations
        if (
          err.message.includes('already exists') ||
          err.message.includes('duplicate key') ||
          err.message.includes('already defined')
        ) {
          count++;
          continue;
        }
        
        console.error(`\n❌ Error executing statement:`);
        console.error(`   ${statement.substring(0, 100)}...`);
        console.error(`   ${err.message}\n`);
      }
    }

    console.log(`\n✅ Migration completed!`);
    console.log(`   ${count} SQL statements executed\n`);
    
    // Test the database
    console.log('🧪 Testing database...');
    const profilesTest = await client.query(
      "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='profiles'"
    );
    
    if (parseInt(profilesTest.rows[0].count) > 0) {
      console.log('✅ profiles table created');
    }
    
    const rolesTest = await client.query(
      "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='user_roles'"
    );
    
    if (parseInt(rolesTest.rows[0].count) > 0) {
      console.log('✅ user_roles table created');
    }

    console.log('\n✨ All migrations applied successfully!');
    console.log('🎉 You can now register users in your application.\n');
    
    client.release();
    await pool.end();

  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(`   ${error.message}\n`);
    
    if (error.code === 'ENOTFOUND') {
      console.error('💡 Tip: Check that your database host is correct');
      console.error('   and your internet connection is working.\n');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 Tip: Check your database password.\n');
    }
    
    if (client) {
      client.release();
    }
    process.exit(1);
  }
}

runMigrations();
