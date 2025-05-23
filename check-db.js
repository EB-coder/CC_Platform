require('dotenv').config();
const { Pool } = require('pg');

// Database configuration - use DATABASE_URL for production
const pool = new Pool(
    process.env.DATABASE_URL ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    } : {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'cf_platform',
        password: process.env.DB_PASSWORD || 'Donthack23_',
        port: process.env.DB_PORT || 5432,
    }
);

async function checkDatabase() {
    try {
        console.log('🔍 Checking database connection...');
        
        // Test connection
        const timeResult = await pool.query('SELECT NOW()');
        console.log('✅ Database connected at:', timeResult.rows[0].now);
        
        // Check if tables exist
        console.log('\n📋 Checking tables...');
        const tablesResult = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        
        if (tablesResult.rows.length === 0) {
            console.log('❌ No tables found in database');
        } else {
            console.log('✅ Found tables:');
            tablesResult.rows.forEach(row => {
                console.log(`   - ${row.table_name}`);
            });
        }
        
        // Check users table
        try {
            const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
            console.log(`\n👥 Users table: ${usersResult.rows[0].count} users`);
        } catch (err) {
            console.log('\n❌ Users table not found or error:', err.message);
        }
        
        // Check tasks table
        try {
            const tasksResult = await pool.query('SELECT COUNT(*) as count FROM tasks');
            console.log(`📝 Tasks table: ${tasksResult.rows[0].count} tasks`);
        } catch (err) {
            console.log('❌ Tasks table not found or error:', err.message);
        }
        
        // Check solutions table
        try {
            const solutionsResult = await pool.query('SELECT COUNT(*) as count FROM solutions');
            console.log(`💡 Solutions table: ${solutionsResult.rows[0].count} solutions`);
        } catch (err) {
            console.log('❌ Solutions table not found or error:', err.message);
        }
        
        console.log('\n✅ Database check completed!');
        
    } catch (err) {
        console.error('❌ Database check failed:', err.message);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

checkDatabase();
