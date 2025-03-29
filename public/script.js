// const { json } = require("body-parser");

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
    console.log('Начало обработки входа');
    const username = document.querySelector('.login input[type="text"]').value;
    const password = document.querySelector('.login input[type="password"]').value;
    
    try {
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка сервера');
      }
    
      const data = await response.json();
      console.log('Данные ответа:', data);

      if (data.success) {
        console.log('Сохранение пользователя:', data.user);
        alert('Вход выполнен!');
        localStorage.setItem('user', JSON.stringify(data.user));//перенаправляем на profile.html
        console.log('Перенаправляем...');
        window.location.href = 'http://localhost:3000/profile.html';
      } else {
        alert(data.error || 'Неверный email или пароль');
      }
    } catch (error) {
      console.error('Полная Ошибка:', error);
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