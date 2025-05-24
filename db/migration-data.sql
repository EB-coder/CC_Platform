-- Complete data migration for CC Platform
-- This file contains schema creation and all data inserts

-- Create schema first
\i schema.sql

-- Insert users data
INSERT INTO users (id, username, email, password, is_admin, created_at) VALUES
(2, 'dava', 'bekmurza@mail.ru', 'test1234', false, '2025-03-30 03:58:24.029095'),
(4, 'David', 'David@mail.ru', 'test123', false, '2025-04-04 01:58:54.885508'),
(3, 'Islam', 'islam@mail.ru', 'test', false, '2025-03-30 04:32:44.852935'),
(1, 'elmir', 'bekmurzaev@mail.ru', 'test123', true, '2025-03-30 01:59:50.108409'),
(5, 'Alymbek', 'alym@mail.ru', 'test123', false, '2025-05-23 20:35:00.846139'),
(6, 'admin', 'admin@admin.com', 'admin123', true, '2025-05-24 05:38:02.28222')
ON CONFLICT (email) DO NOTHING;

-- Insert tasks data
INSERT INTO tasks (id, title, content, language, difficulty, admin_id, is_active, created_at) VALUES
(13, 'Fibonachi', 'This is the fibonachi related task !fhklsd', 'java', 'medium', 1, false, '2025-04-04 01:45:00.746277'),
(16, 'Additional', 'nothing now', 'python', 'medium', 1, false, '2025-04-15 17:45:03.255572'),
(18, 'hello world test', 'print hello world in python', 'python', 'medium', 1, false, '2025-04-16 04:10:10.377787'),
(6, 'hello world', 'print ''hello wordl''', 'python', 'medium', 1, true, '2025-04-03 01:07:44.400465'),
(12, 'pentagon', 'print "pentagon"', 'java', 'medium', 1, true, '2025-04-03 23:17:07.608163'),
(21, 'Level_test', 'just the level testing', 'python', 'easy', 1, true, '2025-05-23 01:24:25.149283');

-- Update sequences
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('tasks_id_seq', (SELECT MAX(id) FROM tasks));

-- Note: Add solutions and user_solved_tasks data if needed
