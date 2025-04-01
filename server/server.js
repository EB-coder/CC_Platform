require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

const app = express();
const port = 3000;

// Настройки
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT'],
    credentials: true
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// Настройка загрузки файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

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

// Middleware для проверки админа
function checkAdmin(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
        if (!decoded.isAdmin) {
            return res.status(403).json({ error: 'Недостаточно прав' });
        }
        req.user = decoded;
        next();
    } catch (err) {
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

// Админ-роуты
app.get('/api/admin/tasks', checkAdmin, async (req, res) => {
    try {
        const tasks = await pool.query(`
            SELECT t.*, u.username as admin_name 
            FROM tasks t
            JOIN users u ON t.admin_id = u.id
            ORDER BY t.created_at DESC
        `);
        res.json(tasks.rows);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка загрузки задач' });
    }
});

app.post('/api/admin/tasks', checkAdmin, upload.single('image'), async (req, res) => {
    try {
        const { title, content, rating } = req.body;
        const imageUrl = req.file ? '/uploads/' + req.file.filename : null;
        
        const newTask = await pool.query(
            `INSERT INTO tasks 
            (title, content, rating, image_url, admin_id) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING *`,
            [title, content, rating, imageUrl, req.user.id]
        );
        
        res.json(newTask.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка создания задачи' });
    }
});

app.put('/api/admin/tasks/:id/visibility', checkAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        
        const updatedTask = await pool.query(
            'UPDATE tasks SET is_active = $1 WHERE id = $2 RETURNING *',
            [isActive, id]
        );
        
        res.json(updatedTask.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка обновления задачи' });
    }
});

// Публичные роуты
app.get('/api/tasks/active', async (req, res) => {
    try {
        const tasks = await pool.query(`
            SELECT * FROM tasks 
            WHERE is_active = TRUE
            ORDER BY created_at DESC
        `);
        res.json(tasks.rows);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка загрузки задач' });
    }
});

app.get('/api/task', async (req, res) => {
    try {
        const taskId = req.query.id;
        const task = await pool.query(
            'SELECT * FROM tasks WHERE id = $1',
            [taskId]
        );
        
        if (task.rows.length === 0) {
            return res.status(404).json({ error: 'Задача не найдена' });
        }
        
        res.json({
            success: true,
            task: task.rows[0]
        });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка загрузки задачи' });
    }
});

app.post('/api/submit', async (req, res) => {
    try {
        const { taskId, userId, answer } = req.body;
        
        const newAnswer = await pool.query(
            `INSERT INTO task_answers 
            (task_id, user_id, answer) 
            VALUES ($1, $2, $3) 
            RETURNING *`,
            [taskId, userId, answer]
        );
        
        res.json({ success: true, answer: newAnswer.rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка отправки решения' });
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