const container = document.querySelector('.container')
const registerBtn = document.querySelector('.register-btn')
const loginBtn = document.querySelector('.login-btn')

registerBtn.addEventListener('click',() => {
    container.classList.add('active');
})

loginBtn.addEventListener('click',() => {
    container.classList.remove('active');
})

// ... ваш предыдущий код ...

// Отправка формы входа
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.querySelector('.login input[type="text"]').value;
    const password = document.querySelector('.login input[type="password"]').value;
    
    try {
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Вход выполнен!');
        // Можно перенаправить пользователя: window.location.href = '/profile.html';
      } else {
        alert(data.error || 'Ошибка входа');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Что-то пошло не так');
    }
  });
  
  // Отправка формы регистрации
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.querySelector('.register input[type="text"]').value;
    const email = document.querySelector('.register input[type="email"]').value;
    const password = document.querySelector('.register input[type="password"]').value;
    
    try {
      const response = await fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Регистрация успешна! Теперь войдите.');
        container.classList.remove('active');
      } else {
        alert(data.error || 'Ошибка регистрации');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Что-то пошло не так');
    }
  });