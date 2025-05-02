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


// Настройки
// app.use(cors({
//     origin: 'http://localhost:3000',
//     methods: ['GET', 'POST', 'PUT', 'DELETE'],
//     credentials: true
// }));

const allowedOrigins = [
  'http://localhost:3000',
  'https://cf-coding.onrender.com' // Заменить на реальный URL фронта
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// Подключение к PostgreSQL
// const pool = new Pool({
//     user: 'postgres',
//     host: 'localhost',
//     database: 'cf_platform',
//     password: 'Donthack23_',
//     port: 5432,
// });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});


// Проверка подключения
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Ошибка подключения к БД:', err);
    } else {
        console.log('✅ PostgreSQL подключён:', res.rows[0].now);
    }
});

// Функция проверки email
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
    console.log('❌ Токен не предоставлен');
    return res.status(401).json({ error: 'Authorization required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    req.user = decoded;
    next();
  } catch (err) {
    console.log('❌ Ошибка токена:', err.message);
    res.status(401).json({ error: 'Invalid token' });
  }
}

function checkAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1] || 
                req.query.token || 
                req.cookies.token;
  
  if (!token) {
    console.log('❌ Токен не предоставлен');
    return res.status(401).json({ error: 'Authorization required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    req.user = decoded;
    next();
  } catch (err) {
    console.log('❌ Ошибка токена:', err.message);
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
      const { title, content, language } = req.body;
      
      const result = await pool.query(
          `INSERT INTO tasks (title, content, language, admin_id)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [title, content, language, req.user.id]
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
    const id = parseInt(req.params.id); // Явное преобразование в число
    console.log('🛠️ Запрос задачи с ID:', id, '(Тип:', typeof id + ')');

    const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      console.log('⚠️ Задача не найдена');
      return res.status(404).json({ error: 'Task not found' });
    }

    console.log('✅ Задача найдена:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Ошибка сервера:', err);
    res.status(500).json({ error: 'Database Error' });
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

// Получение всех активных задач (для пользователей)
app.get('/api/active-tasks', async (req, res) => {
  try {
      const { search, language } = req.query;
      let query = `SELECT id, title, content, language 
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
          return res.status(404).json({ error: 'Решение не найдено' });
      }
      
      res.json(result.rows[0]);
  } catch (err) {
      console.error('Error loading solution:', err);
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



app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin.html'));
});

app.get('/profile.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/profile.html'));
});


app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});

