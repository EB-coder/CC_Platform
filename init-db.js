require('dotenv').config();
const { Pool } = require('pg');

// Database configuration - use DATABASE_URL for production
const pool = new Pool(
    process.env.DATABASE_URL ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    } : {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'cf_platform',
        password: process.env.DB_PASSWORD || 'Donthack23_',
        port: process.env.DB_PORT || 5432,
    }
);

async function initDatabase() {
    try {
        console.log('🔄 Initializing database...');

        // Create users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                is_admin BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Users table created');

        // Create tasks table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                language VARCHAR(50) NOT NULL,
                difficulty VARCHAR(20) DEFAULT 'medium',
                admin_id INTEGER REFERENCES users(id),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Tasks table created');

        // Create solutions table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS solutions (
                id SERIAL PRIMARY KEY,
                task_id INTEGER REFERENCES tasks(id),
                user_id INTEGER REFERENCES users(id),
                language VARCHAR(50) NOT NULL,
                code TEXT NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                score INTEGER DEFAULT 0,
                feedback TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Solutions table created');

        // Create default admin user
        await pool.query(`
            INSERT INTO users (username, email, password, is_admin) 
            VALUES ('admin', 'admin@cfplatform.com', 'admin123', TRUE)
            ON CONFLICT (email) DO NOTHING
        `);
        console.log('✅ Default admin user created');

        // Create indexes
        await pool.query('CREATE INDEX IF NOT EXISTS idx_tasks_difficulty ON tasks(difficulty)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_tasks_active ON tasks(is_active)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_solutions_user_id ON solutions(user_id)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_solutions_task_id ON solutions(task_id)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_solutions_status ON solutions(status)');
        console.log('✅ Indexes created');

        console.log('🎉 Database initialization completed successfully!');
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Run initialization
initDatabase().catch(console.error);
