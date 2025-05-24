-- Export data from local PostgreSQL database
-- Run this script to export all data for migration to DigitalOcean

-- Export users data
COPY (SELECT id, username, email, password, is_admin, created_at FROM users) TO STDOUT WITH CSV HEADER;

-- Export tasks data  
COPY (SELECT id, title, content, language, difficulty, admin_id, is_active, created_at FROM tasks) TO STDOUT WITH CSV HEADER;

-- Export solutions data
COPY (SELECT id, task_id, user_id, code, language, status, score, feedback, submitted_at, evaluated_at FROM solutions) TO STDOUT WITH CSV HEADER;

-- Export user_solved_tasks data
COPY (SELECT user_id, task_id, solution_id, solved_at FROM user_solved_tasks) TO STDOUT WITH CSV HEADER;
