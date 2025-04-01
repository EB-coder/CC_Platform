// Проверка авторизации админа
document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    
    if (!user || !user.isAdmin || !token) {
        alert('Доступ запрещен!');
        window.location.href = '/';
    }
    
    loadTasks();
});

// Загрузка задач для админ-панели
async function loadTasks() {
    try {
        const response = await fetch('http://localhost:3000/api/admin/tasks', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Ошибка загрузки задач');
        }
        
        const tasks = await response.json();
        renderTasks(tasks);
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось загрузить задачи');
    }
}

// Отображение задач в админ-панели
function renderTasks(tasks) {
    const container = document.getElementById('tasksContainer');
    container.innerHTML = '';
    
    tasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        taskElement.innerHTML = `
            <h3>${task.title}</h3>
            <p>${task.content}</p>
            ${task.image_url ? `<img src="${task.image_url}" width="200">` : ''}
            <p>Рейтинг: ${task.rating || 'Не указан'}</p>
            <p>Статус: ${task.is_active ? 'Активна' : 'Скрыта'}</p>
            <button onclick="toggleTaskVisibility(${task.id}, ${!task.is_active})">
                ${task.is_active ? 'Скрыть' : 'Показать'}
            </button>
            <hr>
        `;
        container.appendChild(taskElement);
    });
}

// Переключение видимости задачи
window.toggleTaskVisibility = async (taskId, isActive) => {
    try {
        const response = await fetch(`http://localhost:3000/api/admin/tasks/${taskId}/visibility`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ isActive })
        });
        
        if (!response.ok) {
            throw new Error('Ошибка обновления задачи');
        }
        
        loadTasks(); // Перезагружаем список задач
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось обновить задачу');
    }
};

// Выход из системы
window.logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/';
};