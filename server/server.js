require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Настройки
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// Подключение к PostgreSQL
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'cf_platform',
    password: 'Donthack23_',
    port: 5432,
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
        throw new Error('Некорректный формат email');
    }
}

function checkAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1] || 
                req.query.token || 
                req.cookies.token;
  
  if (!token) {
    console.log('❌ Токен не предоставлен');
    return res.status(401).json({ error: 'Требуется авторизация' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    req.user = decoded;
    next();
  } catch (err) {
    console.log('❌ Ошибка токена:', err.message);
    res.status(401).json({ error: 'Недействительный токен' });
  }
}

function checkAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1] || 
                req.query.token || 
                req.cookies.token;
  
  if (!token) {
    console.log('❌ Токен не предоставлен');
    return res.status(401).json({ error: 'Требуется авторизация' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    req.user = decoded;
    next();
  } catch (err) {
    console.log('❌ Ошибка токена:', err.message);
    res.status(401).json({ error: 'Недействительный токен' });
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
            return res.status(400).json({ error: 'Пользователь c таким email уже существует' });
        }
        
        const newUser = await pool.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *',
            [username, email, password]
        );
        
        res.json({ success: true, user: newUser.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
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
            return res.status(401).json({ error: 'Неверный email или пароль' });
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
        res.status(500).json({ error: 'Ошибка сервера' });
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
        res.status(500).json({ error: 'Ошибка загрузки задач' });
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
          error: 'Ошибка создания задачи',
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
      return res.status(404).json({ error: 'Задача не найдена' });
    }

    console.log('✅ Задача найдена:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Ошибка сервера:', err);
    res.status(500).json({ error: 'Ошибка базы данных' });
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
            return res.status(404).json({ error: 'Задача не найдена' });
        }
        
        res.json({ success: true });
    } catch (err) {
        console.error('Ошибка удаления задачи:', err);
        res.status(500).json({ error: 'Ошибка удаления задачи' });
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
      res.status(500).json({ error: 'Ошибка сервера' });
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
          return res.status(404).json({ error: 'Задача не найдена или неактивна' });
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
              const evaluation = await evaluateWithDeepSeek(
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
              if (evaluation.score >= 70) { // Порог успешности
                  await pool.query(
                      `INSERT INTO user_solved_tasks (user_id, task_id, solution_id)
                       VALUES ($1, $2, $3)
                       ON CONFLICT (user_id, task_id) DO UPDATE
                       SET solution_id = $3, solved_at = NOW()`,
                      [user_id, task_id, solutionResult.rows[0].id]
                  );
              }
          } catch (e) {
              console.error('Ошибка оценки решения:', e);
          }
      }, 0);

      res.json({ 
          success: true,
          solution: solutionResult.rows[0]
      });

  } catch (err) {
      console.error('Ошибка при сохранении решения:', err);
      res.status(500).json({ error: 'Ошибка сервера' });
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
          return res.status(404).json({ error: 'Задача не найдена' });
      }
      
      res.json({ success: true, task: result.rows[0] });
  } catch (err) {
      console.error('Ошибка обновления видимости:', err);
      res.status(500).json({ error: 'Ошибка сервера' });
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
      console.error('Ошибка загрузки решений:', err);
      res.status(500).json({ error: 'Ошибка сервера' });
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
      console.error('Ошибка загрузки решения:', err);
      res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Интеграция с DeepSeek для оценки решений
// async function evaluateWithDeepSeek(code, language, taskContent) {
//   try {
//       const response = await fetch('https://api.deepseek.com/v1/evaluate', {
//           method: 'POST',
//           headers: {
//               'Content-Type': 'application/json',
//               'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
//           },
//           body: JSON.stringify({
//               code,
//               language,
//               task_description: taskContent
//           })
//       });
      
//       if (!response.ok) {
//           throw new Error('Ошибка оценки решения');
//       }
      
//       return await response.json();
//   } catch (error) {
//       console.error('DeepSeek API error:', error);
//       return {
//           score: 0,
//           feedback: "Не удалось оценить решение",
//           status: "error"
//       };
//   }
// }

async function evaluateWithDeepSeek(code, language, taskContent) {
  // Имитация задержки API (1-3 секунды)
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  // Генерация "реалистичного" фидбека
  const randomScore = Math.floor(Math.random() * 30) + 50; // 50-80%
  const feedbacks = [
      "Код работает, но есть возможности для оптимизации.",
      "Отличное решение! Все тесты пройдены.",
      "Есть небольшие ошибки в логике выполнения.",
      `Решение на ${language} соответствует заданию, но можно улучшить читаемость.`,
      "Проблемы с производительностью в отдельных случаях."
  ];
  
  return {
      score: randomScore,
      feedback: feedbacks[Math.floor(Math.random() * feedbacks.length)],
      status: randomScore > 70 ? "completed" : "partial"
  };
}


// Статические файлы
app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin.html'));
});

app.get('/profile.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/profile.html'));
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});

