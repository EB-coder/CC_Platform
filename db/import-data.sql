-- Import data to DigitalOcean PostgreSQL database
-- This script should be run after the schema is created

-- First, create the schema if it doesn't exist
\i schema.sql

-- Import users data
\copy users(id, username, email, password, is_admin, created_at) FROM 'db/exported_data/users_data.csv' WITH CSV HEADER;

-- Import tasks data
\copy tasks(id, title, content, language, difficulty, admin_id, is_active, created_at, updated_at) FROM 'db/exported_data/tasks_data.csv' WITH CSV HEADER;

-- Import solutions data
\copy solutions(id, task_id, user_id, code, language, status, score, feedback, submitted_at, evaluated_at) FROM 'db/exported_data/solutions_data.csv' WITH CSV HEADER;

-- Import user_solved_tasks data
\copy user_solved_tasks(user_id, task_id, solution_id, solved_at) FROM 'db/exported_data/user_solved_tasks_data.csv' WITH CSV HEADER;

-- Update sequences to match the imported data
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('tasks_id_seq', (SELECT MAX(id) FROM tasks));
SELECT setval('solutions_id_seq', (SELECT MAX(id) FROM solutions));
