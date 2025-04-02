// Проверка авторизации админа
document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.isAdmin) {
        alert('Доступ запрещен!');
        window.location.href = '/';
        return;
    }
    
    loadTasks();
});

// Загрузка всех задач
async function loadTasks() {
    try {
        const response = await fetch('/api/tasks', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Ошибка загрузки задач');
        
        const tasks = await response.json();
        renderTasks(tasks);
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось загрузить задачи');
    }
}

// Отображение задач
function renderTasks(tasks) {
    const container = document.getElementById('tasksContainer');
    container.innerHTML = '';
    
    if (tasks.length === 0) {
        container.innerHTML = '<p>Нет созданных задач</p>';
        return;
    }
    
    tasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        taskElement.innerHTML = `
            <div>
                <h3>${task.title}</h3>
                <p>Язык: ${getLanguageName(task.language)}</p>
                <p>${task.content}</p>
            </div>
            <div class="task-actions">
                <button class="btn edit-btn" onclick="editTask('${task.id}')">Редактировать</button>
                <button class="btn delete-btn" onclick="deleteTask('${task.id}')">Удалить</button>
            </div>
        `;
        container.appendChild(taskElement);
    });
}

// Получение названия языка по коду
function getLanguageName(code) {
    const languages = {
        'cpp': 'C++',
        'python': 'Python',
        'java': 'Java',
        'javascript': 'JavaScript'
    };
    return languages[code] || code;
}

// Создание/обновление задачи
async function submitTask() {
    const taskId = document.getElementById('taskId').value;
    const title = document.getElementById('taskTitle').value.trim();
    const content = document.getElementById('taskContent').value.trim();
    const language = document.getElementById('taskLanguage').value;

    if (!title || !content) {
        alert('Название и условие задачи обязательны!');
        return;
    }

    try {
        const response = await fetch(taskId ? `/api/tasks/${taskId}` : '/api/tasks', {
            method: taskId ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ title, content, language })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка сервера');
        }

        const result = await response.json();
        alert(taskId ? 'Задача обновлена!' : 'Задача создана!');
        resetForm();
        loadTasks();
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка: ' + error.message);
    }
}

async function editTask(taskId) {
    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Ошибка загрузки задачи');
        
        const task = await response.json();
        
        document.getElementById('taskId').value = task.id;
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskContent').value = task.content;
        document.getElementById('taskLanguage').value = task.language;
        
        document.getElementById('submitBtn').textContent = 'Обновить задачу';
        document.getElementById('cancelBtn').style.display = 'inline-block';
        
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось загрузить задачу: ' + error.message);
    }
}

function resetForm() {
    document.getElementById('taskId').value = '';
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskContent').value = '';
    document.getElementById('taskLanguage').value = 'cpp';
    document.getElementById('submitBtn').textContent = 'Создать задачу';
    document.getElementById('cancelBtn').style.display = 'none';
}

function resetForm() {
    document.getElementById('taskId').value = '';
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskContent').value = '';
    document.getElementById('taskLanguage').value = 'cpp';
    document.getElementById('submitBtn').textContent = 'Создать задачу';
    document.getElementById('cancelBtn').style.display = 'none';
}

// Редактирование задачи
async function editTask(taskId) {
    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Ошибка загрузки задачи');
        
        const task = await response.json();
        
        document.getElementById('taskId').value = task.id;
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskContent').value = task.content;
        document.getElementById('taskLanguage').value = task.language;
        
        document.getElementById('submitBtn').textContent = 'Обновить задачу';
        document.getElementById('cancelBtn').style.display = 'inline-block';
        
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось загрузить задачу: ' + error.message);
    }
}

// Удаление задачи
async function deleteTask(taskId) {
    if (!confirm('Вы уверены, что хотите удалить эту задачу?')) return;
    
    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Ошибка удаления задачи');
        
        alert('Задача удалена!');
        loadTasks();
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось удалить задачу');
    }
}

// Сброс формы
function resetForm() {
    document.getElementById('taskId').value = '';
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskContent').value = '';
    document.getElementById('taskLanguage').value = 'cpp';
    document.getElementById('submitBtn').textContent = 'Создать задачу';
    document.getElementById('cancelBtn').style.display = 'none';
}

// Отмена редактирования
function cancelEdit() {
    resetForm();
}

// Выход из системы
function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/';
}