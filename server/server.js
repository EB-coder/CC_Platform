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
          'SELECT id FROM tasks WHERE id = $1 AND is_active = true',
          [task_id]
      );
      
      if (taskCheck.rows.length === 0) {
          return res.status(404).json({ error: 'Задача не найдена или неактивна' });
      }

      // Сохраняем решение
      const result = await pool.query(
          `INSERT INTO submissions 
           (task_id, user_id, language, code, status) 
           VALUES ($1, $2, $3, $4, 'pending') 
           RETURNING *`,
          [task_id, user_id, language, code]
      );

      res.json({ 
          success: true,
          submission: result.rows[0]
      });

  } catch (err) {
      console.error('Ошибка при сохранении решения:', err);
      res.status(500).json({ error: 'Ошибка сервера' });
  }
});

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

