const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');
const API_BASE = 'https://https://cf-coding.onrender.com';

// Переключение форм + смена фона
registerBtn.addEventListener('click', () => {
    container.classList.add('active');
    document.body.classList.add('register-bg');
});

loginBtn.addEventListener('click', () => {
    container.classList.remove('active');
    document.body.classList.remove('register-bg');
});

// Функция проверки email
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}
// Обработка формы входа по email
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Начало обработки входа');
    
    const email = document.querySelector('.login input[type="text"]').value;
    const password = document.querySelector('.login input[type="password"]').value;

    if (!isValidEmail(email)) {
      alert('Please, enter correct email');
      return;
    }

    try {
        console.log('Отправка запроса на вход для email:', email);
        // const response = await fetch('http://localhost:3000/login'
        const response = await fetch('${API_BASE}/login, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ 
                username: email,
                password 
            }),
            credentials: 'include'
        });

        console.log('Статус ответа:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Server error');
        }

        const data = await response.json();
        console.log('Ответ сервера:', data);
        
        if (data.success) {
        console.log('Успешный вход, данные пользователя:', data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token || '');

            if (data.user.isAdmin) {
                window.location.href = '/admin.html';
            } else {
                window.location.href = '/profile.html';
            }
        } else {
            alert(data.error || 'login error');
        }
    } catch (error) {
        console.error('Ошибка входа:', error);
        alert(error.message || 'Incorrect Email or Password');
    }
});

// Обработка формы регистрации
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Начало обработки регистрации');
    
    const username = document.querySelector('.register input[type="text"]').value;
    const email = document.querySelector('.register input[type="email"]').value;
    const password = document.querySelector('.register input[type="password"]').value;
    
    // Проверка email при регистрации
    if (!isValidEmail(email)) {
      alert('Please, enter correct email');
      return;
    }
    
    try {
        console.log('Отправка запроса на регистрацию для email:', email);
        const response = await fetch('http://localhost:3000/register', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ username, email, password })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Server error');
        }

        const data = await response.json();
        console.log('Ответ сервера:', data);
        
        if (data.success) {
            alert('Registration success! Please log In.');
            container.classList.remove('active');
        }
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        alert(error.message || 'This email olready in use, please use another');
    }
});


const canvas = document.getElementById('matrix');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const letters = "01";
const fontSize = 16;
const columns = canvas.width / fontSize;

const drops = Array.from({ length: columns }, () => 1);

function drawMatrix() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const matrixColor = getComputedStyle(document.body).getPropertyValue('--matrix-color') || "#0F0";
ctx.fillStyle = matrixColor.trim();

    ctx.font = fontSize + "px monospace";

    drops.forEach((y, i) => {
        const text = letters[Math.floor(Math.random() * letters.length)];
        const x = i * fontSize;
        ctx.fillText(text, x, y * fontSize);

        if (y * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }

        drops[i]++;
    });
}

setInterval(drawMatrix, 33);
