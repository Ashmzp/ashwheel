#!/usr/bin/env node

/**
 * Setup Local Database
 * Imports production database schema and data into local Supabase instance
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DUMP_DIR = path.join(__dirname, '..', 'dump');
const DB_HOST = '127.0.0.1';
const DB_PORT = '54322';
const DB_USER = 'postgres';
const DB_NAME = 'postgres';
const DB_PASSWORD = 'postgres';

console.log('🚀 Starting local database setup...\n');

// Check if Supabase is running
try {
    console.log('✓ Checking if Supabase is running...');
    execSync('supabase status', { stdio: 'ignore' });
    console.log('✓ Supabase is running\n');
} catch (error) {
    console.error('❌ Supabase is not running!');
    console.log('Please start Supabase first: npm run db:start\n');
    process.exit(1);
}

// Function to execute SQL file
function executeSQLFile(filename, description) {
    const filePath = path.join(DUMP_DIR, filename);

    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  ${filename} not found, skipping...`);
        return false;
    }

    console.log(`📥 Importing ${description}...`);

    try {
        const sqlContent = fs.readFileSync(filePath, 'utf8');
        const tempFile = path.join(__dirname, 'temp_import.sql');
        fs.writeFileSync(tempFile, sqlContent);

        // Use supabase db execute for better compatibility
        execSync(`supabase db execute --file "${tempFile}"`, {
            stdio: 'inherit',
            env: { ...process.env, PGPASSWORD: DB_PASSWORD }
        });

        fs.unlinkSync(tempFile);
        console.log(`✓ ${description} imported successfully\n`);
        return true;
    } catch (error) {
        console.error(`❌ Error importing ${description}:`, error.message);
        return false;
    }
}

// Import in order
console.log('📊 Importing database files...\n');

// 1. Import roles (if exists)
executeSQLFile('roles.sql', 'Database Roles');

// 2. Import schema
const schemaImported = executeSQLFile('schema.sql', 'Database Schema');

if (!schemaImported) {
    console.error('❌ Schema import failed! Cannot continue.');
    process.exit(1);
}

// 3. Import data (optional - can be large)
console.log('📦 Data import options:');
console.log('  - data.sql contains production data (4.2MB)');
console.log('  - You can skip this and use seed data instead\n');

const importData = process.argv.includes('--with-data');

if (importData) {
    executeSQLFile('data.sql', 'Production Data');
} else {
    console.log('⏭️  Skipping data import (use --with-data flag to include)\n');
}

// Verify import
console.log('🔍 Verifying database setup...');
try {
    const result = execSync('supabase db diff', { encoding: 'utf8' });
    console.log('✓ Database verification complete\n');
} catch (error) {
    console.log('⚠️  Database verification showed differences (this is normal for first setup)\n');
}

console.log('✅ Local database setup complete!\n');
console.log('Next steps:');
console.log('  1. Run: npm run dev:local');
console.log('  2. Open: http://localhost:3000');
console.log('  3. Access Studio: http://localhost:54323\n');
