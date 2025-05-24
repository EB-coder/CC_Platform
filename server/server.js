require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { OpenAI } = require('openai');


const app = express();
const port = process.env.PORT || 3000;

const allowedOrigins = [
  'http://localhost:3000',
  'https://cf-coding.onrender.com',
  'https://cc-platform-algnu.ondigitalocean.app',
  process.env.FRONTEND_URL || 'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // In production, be more strict
    if (process.env.NODE_ENV === 'production') {
      return callback(new Error('Not allowed by CORS'));
    }

    // In development, allow all origins
    return callback(null, true);
  },
  credentials: true
}));

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// Database configuration - use DATABASE_URL for production
const pool = new Pool(
    process.env.DATABASE_URL ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false,
            require: true
        }
    } : {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'cf_platform',
        password: process.env.DB_PASSWORD || 'Donthack23_',
        port: process.env.DB_PORT || 5432,
    }
);

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('✅ PostgreSQL connected:', res.rows[0].now);
    }
});

// Database initialization endpoint
app.post('/api/init-database', async (req, res) => {
    try {
        // Create users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                is_admin BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Create tasks table
        await pool.query(`
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
            )
        `);

        // Create solutions table
        await pool.query(`
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
            )
        `);

        // Create user_solved_tasks table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_solved_tasks (
                user_id INTEGER NOT NULL REFERENCES users(id),
                task_id INTEGER NOT NULL REFERENCES tasks(id),
                solution_id INTEGER REFERENCES solutions(id),
                solved_at TIMESTAMP DEFAULT NOW(),
                PRIMARY KEY (user_id, task_id)
            )
        `);

        // Create indexes
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_tasks_admin_id ON tasks(admin_id);
            CREATE INDEX IF NOT EXISTS idx_tasks_is_active ON tasks(is_active);
            CREATE INDEX IF NOT EXISTS idx_solutions_task_id ON solutions(task_id);
            CREATE INDEX IF NOT EXISTS idx_solutions_user_id ON solutions(user_id);
            CREATE INDEX IF NOT EXISTS idx_user_solved_tasks_user_id ON user_solved_tasks(user_id);
            CREATE INDEX IF NOT EXISTS idx_user_solved_tasks_task_id ON user_solved_tasks(task_id);
        `);

        // Insert sample data
        await pool.query(`
            INSERT INTO users (id, username, email, password, is_admin, created_at) VALUES
            (1, 'elmir', 'bekmurzaev@mail.ru', 'test123', true, '2025-03-30 01:59:50.108409'),
            (2, 'dava', 'bekmurza@mail.ru', 'test1234', false, '2025-03-30 03:58:24.029095'),
            (3, 'Islam', 'islam@mail.ru', 'test', false, '2025-03-30 04:32:44.852935'),
            (4, 'David', 'David@mail.ru', 'test123', false, '2025-04-04 01:58:54.885508'),
            (5, 'Alymbek', 'alym@mail.ru', 'test123', false, '2025-05-23 20:35:00.846139'),
            (6, 'admin', 'admin@admin.com', 'admin123', true, '2025-05-24 05:38:02.28222')
            ON CONFLICT (email) DO NOTHING
        `);

        await pool.query(`
            INSERT INTO tasks (id, title, content, language, difficulty, admin_id, is_active, created_at) VALUES
            (6, 'hello world', 'print ''hello wordl''', 'python', 'medium', 1, true, '2025-04-03 01:07:44.400465'),
            (12, 'pentagon', 'print "pentagon"', 'java', 'medium', 1, true, '2025-04-03 23:17:07.608163'),
            (13, 'Fibonachi', 'This is the fibonachi related task !fhklsd', 'java', 'medium', 1, false, '2025-04-04 01:45:00.746277'),
            (16, 'Additional', 'nothing now', 'python', 'medium', 1, false, '2025-04-15 17:45:03.255572'),
            (18, 'hello world test', 'print hello world in python', 'python', 'medium', 1, false, '2025-04-16 04:10:10.377787'),
            (21, 'Level_test', 'just the level testing', 'python', 'easy', 1, true, '2025-05-23 01:24:25.149283')
            ON CONFLICT (id) DO NOTHING
        `);

        // Update sequences
        await pool.query(`
            SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
            SELECT setval('tasks_id_seq', (SELECT MAX(id) FROM tasks));
        `);

        res.json({ success: true, message: 'Database initialized successfully' });
    } catch (err) {
        console.error('Database initialization error:', err);
        res.status(500).json({ error: 'Database initialization failed', details: err.message });
    }
});

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) {
        throw new Error('Incorrect email format');
    }
}

function checkAdmin(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1] ||
                  req.query.token ||
                  req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'Authorization required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
}

function checkAuth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1] ||
                  req.query.token ||
                  req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'Authorization required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
}


// Регистрация
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        validateEmail(email);
        const checkUser = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (checkUser.rows.length > 0) {
            return res.status(400).json({ error: 'A user with this email already exists' });
        }

        const newUser = await pool.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *',
            [username, email, password]
        );

        res.json({ success: true, user: newUser.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Вход
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        validateEmail(username);
        const user = await pool.query(
            'SELECT id, username, email, is_admin FROM users WHERE email = $1 AND password = $2',
            [username, password]
        );

        if (user.rows.length === 0) {
            return res.status(401).json({ error: 'Incorrect email or password' });
        }

        const userData = user.rows[0];
        const token = jwt.sign(
            {
                id: userData.id,
                isAdmin: userData.is_admin
            },
            process.env.JWT_SECRET || 'your_secret_key',
            { expiresIn: '1h' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: userData.id,
                username: userData.username,
                email: userData.email,
                isAdmin: userData.is_admin
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Получение всех задач
app.get('/api/tasks', checkAdmin, async (req, res) => {
    try {
        const tasks = await pool.query(`
            SELECT t.*, u.username as admin_name
            FROM tasks t
            JOIN users u ON t.admin_id = u.id
            ORDER BY t.created_at DESC
        `);
        res.json(tasks.rows);
    } catch (err) {
        console.error('Ошибка загрузки задач:', err);
        res.status(500).json({ error: 'Error loading tasks' });
    }
});

// Создание задачи
app.post('/api/tasks', checkAdmin, async (req, res) => {
  try {
      const { title, content, language, difficulty } = req.body;

      const result = await pool.query(
          `INSERT INTO tasks (title, content, language, difficulty, admin_id)
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [title, content, language, difficulty || 'medium', req.user.id]
      );

      res.status(201).json(result.rows[0]);
  } catch (err) {
      console.error('Error:', err);
      res.status(500).json({
          error: 'Error creating task',
          details: err.message
      });
  }
});

app.get('/api/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'Task ID is required' });
        }

        const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database Error', details: err.message });
    }
});

app.put('/api/tasks/:id', checkAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, language, difficulty } = req.body;

        if (!id) {
            return res.status(400).json({ error: 'Task ID is required' });
        }

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        const result = await pool.query(
            `UPDATE tasks
             SET title = $1, content = $2, language = $3, difficulty = $4
             WHERE id = $5 RETURNING *`,
            [title, content, language, difficulty || 'medium', id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating task:', err);
        res.status(500).json({ error: 'Error updating task', details: err.message });
    }
});
// Удаление задачи
app.delete('/api/tasks/:id', checkAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'DELETE FROM tasks WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Ошибка удаления задачи:', err);
        res.status(500).json({ error: 'Error deleting task' });
    }
});

// Получить всех пользователей (только для админов)
app.get('/api/users', checkAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, created_at, is_admin FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.put('/api/users/:id', checkAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { username, password } = req.body;

        const userExists = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
        if (userExists.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        let query, params;

        if (password && password.trim() !== '') {
            query = `UPDATE users SET username = $1, password = $2 WHERE id = $3 RETURNING id, username, email, created_at, is_admin`;
            params = [username, password, id];
        } else {
            query = `UPDATE users SET username = $1 WHERE id = $2 RETURNING id, username, email, created_at, is_admin`;
            params = [username, id];
        }

        const result = await pool.query(query, params);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Получение всех активных задач (для пользователей)
app.get('/api/active-tasks', async (req, res) => {
  try {
      const { search, language } = req.query;
      let query = `SELECT id, title, content, language, difficulty
                   FROM tasks WHERE is_active = true`;

      const params = [];

      if (search) {
          query += ` AND (title ILIKE $${params.length + 1} OR content ILIKE $${params.length + 1})`;
          params.push(`%${search}%`);
      }

      if (language) {
          query += ` AND language = $${params.length + 1}`;
          params.push(language);
      }

      query += ' ORDER BY created_at DESC';

      const result = await pool.query(query, params);
      res.json(result.rows);
  } catch (err) {
      console.error('Ошибка при получении задач:', err);
      res.status(500).json({ error: 'Server error' });
  }
});
// Отправка решения
app.post('/api/submissions', async (req, res) => {
  try {
      const { task_id, language, code, user_id } = req.body;

      // Проверяем существование задачи
      const taskCheck = await pool.query(
          'SELECT id, content FROM tasks WHERE id = $1 AND is_active = true',
          [task_id]
      );

      if (taskCheck.rows.length === 0) {
          return res.status(404).json({ error: 'Task not found or inactive' });
      }

      // Сохраняем решение
      const solutionResult = await pool.query(
          `INSERT INTO solutions
           (task_id, user_id, language, code, status)
           VALUES ($1, $2, $3, $4, 'pending')
           RETURNING *`,
          [task_id, user_id, language, code]
      );

      // Асинхронно отправляем на оценку в DeepSeek
      setTimeout(async () => {
          try {
              const evaluation = await evaluateWithGPT(
                  code,
                  language,
                  taskCheck.rows[0].content
              );

              await pool.query(
                  `UPDATE solutions SET
                   status = $1, score = $2, feedback = $3, evaluated_at = NOW()
                   WHERE id = $4`,
                  [evaluation.status, evaluation.score, evaluation.feedback, solutionResult.rows[0].id]
              );

              // Если решение успешное, добавляем в решенные
              if (evaluation.score >= 70) {
                  await pool.query(
                      `INSERT INTO user_solved_tasks (user_id, task_id, solution_id)
                       VALUES ($1, $2, $3)
                       ON CONFLICT (user_id, task_id) DO UPDATE
                       SET solution_id = $3, solved_at = NOW()`,
                      [user_id, task_id, solutionResult.rows[0].id]
                  );
              }
          } catch (e) {
              console.error('Solution evaluation error:', e);
          }
      }, 0);

      res.json({
          success: true,
          solution: solutionResult.rows[0]
      });

  } catch (err) {
      console.error('Error saving solution:', err);
      res.status(500).json({ error: 'Server error' });
  }
});

// Обновление видимости задачи
app.patch('/api/tasks/:id/visibility', checkAdmin, async (req, res) => {
  try {
      const { id } = req.params;
      const { is_active } = req.body;

      const result = await pool.query(
          'UPDATE tasks SET is_active = $1 WHERE id = $2 RETURNING *',
          [is_active, id]
      );

      if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Task not found' });
      }

      res.json({ success: true, task: result.rows[0] });
  } catch (err) {
      console.error('Ошибка обновления видимости:', err);
      res.status(500).json({ error: 'Server error' });
  }
});

// Получение решенных задач пользователя
app.get('/api/user-solutions', checkAuth, async (req, res) => {
  try {
      const result = await pool.query(`
          SELECT s.*, t.title as task_title
          FROM solutions s
          JOIN tasks t ON s.task_id = t.id
          WHERE s.user_id = $1
          ORDER BY s.submitted_at DESC
      `, [req.user.id]);

      res.json(result.rows);
  } catch (err) {
      console.error('Error loading solutions:', err);
      res.status(500).json({ error: 'Server error' });
  }
});

// Получение конкретного решения с фидбеком
app.get('/api/solutions/:id', checkAuth, async (req, res) => {
  try {
      const result = await pool.query(`
          SELECT s.*, t.title as task_title, t.content as task_content
          FROM solutions s
          JOIN tasks t ON s.task_id = t.id
          WHERE s.id = $1 AND s.user_id = $2
      `, [req.params.id, req.user.id]);

      if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Solution not found' });
      }

      res.json(result.rows[0]);
  } catch (err) {
      console.error('Error loading solution:', err);
      res.status(500).json({ error: 'Server error' });
  }
});

// Get user statistics
app.get('/api/user-stats', checkAuth, async (req, res) => {
  try {
      // Get count of solved tasks
      const solvedResult = await pool.query(`
          SELECT COUNT(*) as solved
          FROM user_solved_tasks
          WHERE user_id = $1
      `, [req.user.id]);

      // Get last active date from solutions
      const lastActiveResult = await pool.query(`
          SELECT MAX(submitted_at) as last_active
          FROM solutions
          WHERE user_id = $1
      `, [req.user.id]);

      res.json({
          solved: parseInt(solvedResult.rows[0].solved) || 0,
          lastActive: lastActiveResult.rows[0].last_active || new Date()
      });
  } catch (err) {
      console.error('Error loading user stats:', err);
      res.status(500).json({ error: 'Server error' });
  }
});

// Check if a task is solved by the user
app.get('/api/check-solved', checkAuth, async (req, res) => {
  try {
      const { task_id } = req.query;

      if (!task_id) {
          return res.status(400).json({ error: 'Task ID is required' });
      }

      const result = await pool.query(`
          SELECT solution_id
          FROM user_solved_tasks
          WHERE user_id = $1 AND task_id = $2
      `, [req.user.id, task_id]);

      if (result.rows.length === 0) {
          return res.json({ solved: false });
      }

      res.json({
          solved: true,
          solution_id: result.rows[0].solution_id
      });
  } catch (err) {
      console.error('Error checking solved status:', err);
      res.status(500).json({ error: 'Server error' });
  }
});
//ChatGPT integration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function evaluateWithGPT(code, language, taskContent) {
  try {
    const prompt = `
    Analyze the code on ${language} for the task:
    "${taskContent}"

    Code:
    \`\`\`${language}
    ${code}
    \`\`\`

    Rate the code on the following criteria (from 0 to 100%) and give brief feedback:

    1. **Solution Correctness** – How correctly the problem is solved.
    2. **Code Optimality** – How efficiently the code is written.
    3. **Readability** – How easy it is to read and understand the code.

    ⚠️ At the end of the answer **be sure to add a line strictly in the format**:
    Overall Grade: XX
    where XX is a number from 0 to 100 corresponding to the overall rating for the code.
    `;


    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    const feedback = response.choices[0].message.content;
    const scoreMatch = feedback.match(/Overall Grade[^0-9]*(\d{1,3})/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 70;

    return {
      score,
      feedback,
      status: score >= 70 ? "completed" : "needs_improvement"
    };

  } catch (error) {
    console.error('OpenAI API error:', error);
    return { score: 0, feedback: "Grading error", status: "error" };
  }
}



app.get('/admin.html', (_, res) => {
    res.sendFile(path.join(__dirname, '../public/admin.html'));
});

app.get('/profile.html', (_, res) => {
    res.sendFile(path.join(__dirname, '../public/profile.html'));
});


app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});

