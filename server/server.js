require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 3000;
const path = require('path');


// Настройки
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET','POST'],
    credentials: true
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public'))); // Указываем путь к HTML/CSS/JS

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

// Регистрация
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  
  try {
    // Серверная проверка email
    validateEmail(email);
    // Проверяем, нет ли такого пользователя
    const checkUser = await pool.query(
      'SELECT * FROM users WHERE  email = $1',
      [email]
    );
    
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: 'Пользователь c таким email уже существует' });
    }
    
    // Добавляем нового пользователя
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
  console.log('Получен запрос на вход:', req.body);
  
  try {
    // Проверка email при входе
    validateEmail(username);
    const user = await pool.query(
      'SELECT id, username, email FROM users WHERE email = $1 AND password = $2',
      [username, password]
    );
    
    if (user.rows.length === 0) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    res.json({ success: true, user: user.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/profile.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/profile.html'));
});

app.get('/api/cf-problems', async (req, res) => {
    try {
        const response = await fetch('https://codeforces.com/api/problemset.problems');
        const data = await response.json();
        res.json(data);
    } catch (err) {
        console.error('Ошибка при запросе к Codeforces:', err);
        res.status(500).json({ error: 'Не удалось загрузить задачи' });
    }
});
//-------------------------------------------------------------------------
// Маршрут для получения информации о задаче
app.get('/api/task', async (req, res) => {
    try {
        const taskId = req.query.id;
        // Здесь должен быть запрос к API Codeforces для получения полного условия
        // Временная заглушка:
        res.json({
            success: true,
            task: {
                id: taskId,
                title: `Задача ${taskId}`,
                content: `Полное условие задачи ${taskId}...`,
                rating: 1500,
                solvedCount: 1234
            }
        });
    } catch (err) {
        console.error('Ошибка при запросе задачи:', err);
        res.status(500).json({ error: 'Не удалось загрузить задачу' });
    }
});

// Маршрут для отправки решения
app.post('/api/submit', async (req, res) => {
    try {
        const { taskId, language, code } = req.body;
        // Здесь должна быть логика отправки решения в Codeforces
        console.log('Получено решение:', { taskId, language, code });
        res.json({ success: true, message: 'Решение отправлено на проверку' });
    } catch (err) {
        console.error('Ошибка при отправке решения:', err);
        res.status(500).json({ error: 'Не удалось отправить решение' });
    }
});

//-------------------------------------------------------------------------------------

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});