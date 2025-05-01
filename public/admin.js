// Проверка авторизации админа
document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.isAdmin) {
        alert('Access Denied!');
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
        
        if (!response.ok) throw new Error('Problems loading error');
        
        const tasks = await response.json();
        renderTasks(tasks);
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Could not load problems');
    }
}


function renderTasks(tasks) {
    const container = document.getElementById('tasksContainer');
    container.innerHTML = '';
    
    tasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        taskElement.innerHTML = `
            <div>
                <h3>${task.title} ${task.is_active ? '' : '(hidden)'}</h3>
                <p>Язык: ${getLanguageName(task.language)}</p>
                <p>${task.content}</p>
            </div>
            <div class="task-actions">
                <button class="btn visibility-btn" 
                    onclick="toggleTaskVisibility('${task.id}', ${!task.is_active})"
                    style="background: ${task.is_active ? '#2ecc71' : '#e74c3c'}">
                    ${task.is_active ? 'Hide' : 'Unhide'}
                </button>
                <button class="btn edit-btn" onclick="editTask('${task.id}')">Edit Task</button>
                <button class="btn delete-btn" onclick="deleteTask('${task.id}')">Delete</button>
            </div>
        `;
        container.appendChild(taskElement);
    });
}

async function toggleTaskVisibility(taskId, isVisible) {
    if (!confirm(`Are you shure, you want to ${isVisible ? 'Unhide' : 'Hide'} this task?`)) return;
    
    try {
        const response = await fetch(`/api/tasks/${taskId}/visibility`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ is_active: isVisible })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка обновления');
        }
        
        const data = await response.json();
        alert(`Successfuly ${isVisible ? 'Unhidden' : 'Hidden'}`);
        loadTasks();
    } catch (error) {
        console.error('Ошибка:', error);
        alert(`Ошибка: ${error.message}`);
    }
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
        alert('The title and the task conditions are required.!');
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
            throw new Error(error.error || 'Server Error');
        }

        const result = await response.json();
        alert(taskId ? 'Task Updated!' : 'Task Created!');
        resetForm();
        loadTasks();
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка: ' + error.message);
    }
}

// Редактирование задачи (исправленная версия)
async function editTask(taskId) {
    try {
        console.log(`Запрос задачи для редактирования, ID: ${taskId}`);
        const response = await fetch(`http://localhost:3000/api/tasks/${taskId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            try {
                const errorData = await response.json();
                throw new Error(errorData.error || `Ошибка сервера: ${response.status}`);
            } catch (e) {
                throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
            }
        }

        const task = await response.json();
        console.log('Полученные данные задачи:', task);
        
        // Заполнение формы
        document.getElementById('taskId').value = task.id;
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskContent').value = task.content;
        document.getElementById('taskLanguage').value = task.language;
        
        document.getElementById('submitBtn').textContent = 'Обновить задачу';
        document.getElementById('cancelBtn').style.display = 'inline-block';
    } catch (error) {
        console.error('Ошибка при редактировании:', error);
        alert(error.message);
    }
}
// Сброс формы
function resetForm() {
    document.getElementById('taskId').value = '';
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskContent').value = '';
    document.getElementById('taskLanguage').value = 'cpp';
    document.getElementById('submitBtn').textContent = 'Create Task';
    document.getElementById('cancelBtn').style.display = 'none';
}

// Удаление задачи
async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Error deleting task');
        
        alert('Task deleted!');
        loadTasks();
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Failed to delete task');
    }
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