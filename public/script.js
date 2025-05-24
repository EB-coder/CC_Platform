const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');
const API_BASE = window.location.origin;

registerBtn.addEventListener('click', () => {
    container.classList.add('active');
    document.body.classList.add('register-bg');
});

loginBtn.addEventListener('click', () => {
    container.classList.remove('active');
    document.body.classList.remove('register-bg');
});

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.querySelector('.login input[type="text"]').value;
    const password = document.querySelector('.login input[type="password"]').value;

    if (!isValidEmail(email)) {
        alert('Please enter a valid email');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/login`, {
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

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Server error');
        }

        const data = await response.json();

        if (data.success) {
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token || '');

            if (data.user.isAdmin) {
                window.location.href = `${API_BASE}/admin.html`;
            } else {
                window.location.href = `${API_BASE}/profile.html`;
            }
        } else {
            alert(data.error || 'Login error');
        }
    } catch (error) {
        alert(error.message || 'Incorrect email or password');
    }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.querySelector('.register input[type="text"]').value;
    const email = document.querySelector('.register input[type="email"]').value;
    const password = document.querySelector('.register input[type="password"]').value;

    if (!isValidEmail(email)) {
        alert('Please enter a valid email');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/register`, {
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

        if (data.success) {
            alert('Registration successful! Please log in.');
            container.classList.remove('active');
            document.body.classList.remove('register-bg');
        }
    } catch (error) {
        alert(error.message || 'This email is already in use, please use another');
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
