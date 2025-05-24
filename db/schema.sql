-- PostgreSQL database schema for CC_Platform
-- This file contains the complete database schema

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    language VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'medium',
    admin_id INTEGER NOT NULL REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create solutions table
CREATE TABLE IF NOT EXISTS solutions (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id),
    user_id INTEGER REFERENCES users(id),
    code TEXT NOT NULL,
    language VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    score INTEGER,
    feedback TEXT,
    submitted_at TIMESTAMP DEFAULT NOW(),
    evaluated_at TIMESTAMP
);

-- Create user_solved_tasks table
CREATE TABLE IF NOT EXISTS user_solved_tasks (
    user_id INTEGER NOT NULL REFERENCES users(id),
    task_id INTEGER NOT NULL REFERENCES tasks(id),
    solution_id INTEGER REFERENCES solutions(id),
    solved_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, task_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_admin_id ON tasks(admin_id);
CREATE INDEX IF NOT EXISTS idx_tasks_is_active ON tasks(is_active);
CREATE INDEX IF NOT EXISTS idx_solutions_task_id ON solutions(task_id);
CREATE INDEX IF NOT EXISTS idx_solutions_user_id ON solutions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_solved_tasks_user_id ON user_solved_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_solved_tasks_task_id ON user_solved_tasks(task_id);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password, is_admin) 
VALUES ('admin', 'admin@cc-platform.com', 'admin123', TRUE)
ON CONFLICT (email) DO NOTHING;
