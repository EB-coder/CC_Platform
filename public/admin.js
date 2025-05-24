const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : window.location.origin;

let currentSection = 'tasks';

// Toast notification system
function showToast(type, title, message, duration = 3000) {
    const toastContainer = document.getElementById('toastContainer');

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'exclamation-triangle'}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;

    toastContainer.appendChild(toast);

    // Add event listener to close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });

    // Auto-remove after duration
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Проверка авторизации админа
document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.isAdmin) {
        showToast('error', 'Access Denied', 'You do not have permission to access this page.');
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
        return;
    }

    // Display current user
    document.getElementById('currentUser').innerHTML = `
        <i class="fas fa-user-circle"></i> ${user.username || user.email}
    `;

    // Add event listeners for search functionality
    document.getElementById('searchBtn').addEventListener('click', () => {
        const searchTerm = document.getElementById('searchInput').value.trim();
        loadTasks(searchTerm);
    });

    document.getElementById('clearSearchBtn').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        loadTasks();
    });

    // Add event listener for Enter key in search input
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const searchTerm = document.getElementById('searchInput').value.trim();
            loadTasks(searchTerm);
        }
    });

    loadTasks();
});

// Загрузка всех задач
async function loadTasks(searchTerm = '') {
    try {
        // Show loading state
        const container = document.getElementById('tasksContainer');
        container.innerHTML = '<div class="text-center" style="padding: 20px;"><i class="fas fa-spinner fa-spin fa-2x"></i><p style="margin-top: 10px;">Loading tasks...</p></div>';

        // Build URL with search parameter if provided
        let url = `${API_BASE}/api/tasks`;
        if (searchTerm) {
            url += `?search=${encodeURIComponent(searchTerm)}`;
        }

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Problems loading tasks');
        }

        const tasks = await response.json();
        renderTasks(tasks, searchTerm);
    } catch (error) {
        console.error('Error:', error);
        showToast('error', 'Loading Error', 'Could not load tasks. Please try again.');
    }
}

function renderTasks(tasks, searchTerm = '') {
    const container = document.getElementById('tasksContainer');
    container.innerHTML = '';

    if (tasks.length === 0) {
        if (searchTerm) {
            container.innerHTML = `
                <div style="text-align: center; padding: 30px;">
                    <i class="fas fa-search fa-3x" style="color: var(--gray-color); margin-bottom: 15px;"></i>
                    <h3>No Results Found</h3>
                    <p>No tasks found matching "${searchTerm}"</p>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div style="text-align: center; padding: 30px;">
                    <i class="fas fa-tasks fa-3x" style="color: var(--gray-color); margin-bottom: 15px;"></i>
                    <h3>No Tasks Available</h3>
                    <p>Create your first task using the form above.</p>
                </div>
            `;
        }
        return;
    }

    // Create a task list
    const taskList = document.createElement('div');
    taskList.className = 'task-list';

    tasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = `task-item ${!task.is_active ? 'hidden' : ''}`;

        // Highlight the search term in the title if it exists
        let title = task.title;
        if (searchTerm) {
            const regex = new RegExp(`(${searchTerm})`, 'gi');
            title = title.replace(regex, '<span style="background-color: yellow;">$1</span>');
        }

        // Format the date
        const createdDate = new Date(task.created_at);
        const formattedDate = createdDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        // Truncate content for preview
        const truncatedContent = task.content.length > 150
            ? task.content.substring(0, 150) + '...'
            : task.content;

        taskElement.innerHTML = `
            <div class="task-content">
                <div class="task-title">
                    ${title}
                    <span class="task-badge ${task.is_active ? 'badge-active' : 'badge-inactive'}">
                        ${task.is_active ? 'Active' : 'Hidden'}
                    </span>
                </div>
                <div class="task-meta">
                    <span><i class="fas fa-code"></i> ${getLanguageName(task.language)}</span>
                    <span><i class="fas fa-signal"></i> ${getDifficultyLabel(task.difficulty)}</span>
                    <span><i class="fas fa-calendar-alt"></i> ${formattedDate}</span>
                    <span><i class="fas fa-user"></i> ${task.admin_name || 'Admin'}</span>
                </div>
                <div class="task-description">${truncatedContent}</div>
            </div>
            <div class="task-actions">
                <button class="btn btn-sm ${task.is_active ? 'btn-success' : 'btn-warning'}"
                    onclick="toggleTaskVisibility('${task.id}', ${!task.is_active})">
                    <i class="fas fa-${task.is_active ? 'eye-slash' : 'eye'}"></i>
                    ${task.is_active ? 'Hide' : 'Show'}
                </button>
                <button class="btn btn-sm btn-warning" onclick="editTask('${task.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteTask('${task.id}')">
                    <i class="fas fa-trash-alt"></i> Delete
                </button>
            </div>
        `;

        taskList.appendChild(taskElement);
    });

    container.appendChild(taskList);
}

async function toggleTaskVisibility(taskId, isVisible) {
    try {
        const response = await fetch(`${API_BASE}/api/tasks/${taskId}/visibility`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ is_active: isVisible })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error updating visibility');
        }

        await response.json(); // Process response but we don't need the data

        showToast(
            'success',
            'Task Updated',
            `Task has been successfully ${isVisible ? 'made visible' : 'hidden'}.`
        );

        loadTasks();
    } catch (error) {
        console.error('Error:', error);
        showToast('error', 'Update Failed', error.message);
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

// Get difficulty label with proper formatting
function getDifficultyLabel(difficulty) {
    if (!difficulty) return 'Medium';

    const labels = {
        'easy': 'Easy',
        'medium': 'Medium',
        'hard': 'Hard'
    };

    return labels[difficulty.toLowerCase()] || 'Medium';
}

async function submitTask() {
    const taskId = document.getElementById('taskId').value;
    const title = document.getElementById('taskTitle').value.trim();
    const content = document.getElementById('taskContent').value.trim();
    const language = document.getElementById('taskLanguage').value;
    const difficulty = document.getElementById('taskDifficulty').value;

    if (!title || !content) {
        showToast('warning', 'Validation Error', 'The title and task requirements are required fields.');
        return;
    }

    const submitBtn = document.getElementById('submitBtn');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitBtn.disabled = true;

    try {
        const isUpdate = taskId && taskId.trim() !== '';
        const url = isUpdate ? `${API_BASE}/api/tasks/${taskId}` : `${API_BASE}/api/tasks`;
        const method = isUpdate ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ title, content, language, difficulty })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Server Error');
        }

        await response.json();

        showToast(
            'success',
            isUpdate ? 'Task Updated' : 'Task Created',
            isUpdate ? 'The task has been successfully updated.' : 'A new task has been created successfully.'
        );

        resetForm();
        loadTasks();
    } catch (error) {
        console.error('Error:', error);
        showToast('error', 'Operation Failed', error.message);
    } finally {
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
    }
}

async function editTask(taskId) {
    try {
        if (!taskId) {
            throw new Error('Task ID is missing or invalid');
        }

        document.querySelector('.card').scrollIntoView({ behavior: 'smooth' });

        const formTitle = document.getElementById('formTitle');
        formTitle.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading Task...';

        const response = await fetch(`${API_BASE}/api/tasks/${taskId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const task = await response.json();

        document.getElementById('taskId').value = task.id;
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskContent').value = task.content;
        document.getElementById('taskLanguage').value = task.language;
        document.getElementById('taskDifficulty').value = task.difficulty || 'medium';

        formTitle.textContent = 'Edit Task';
        document.getElementById('submitBtn').innerHTML = '<i class="fas fa-save"></i> Update Task';
        document.getElementById('cancelBtn').style.display = 'inline-flex';

        showToast('info', 'Edit Mode', 'You are now editing an existing task.');
    } catch (error) {
        console.error('Error editing task:', error);
        showToast('error', 'Edit Failed', error.message);
        document.getElementById('formTitle').textContent = 'Create a Task';
    }
}

// Сброс формы
function resetForm() {
    document.getElementById('taskId').value = '';
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskContent').value = '';
    document.getElementById('taskLanguage').value = 'cpp';
    document.getElementById('taskDifficulty').value = 'medium';
    document.getElementById('formTitle').textContent = 'Create a Task';
    document.getElementById('submitBtn').innerHTML = '<i class="fas fa-save"></i> Create Task';
    document.getElementById('cancelBtn').style.display = 'none';
}

// Удаление задачи
async function deleteTask(taskId) {
    // Create a modal for confirmation
    const modalContainer = document.createElement('div');
    modalContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background-color: white;
        border-radius: 8px;
        padding: 20px;
        max-width: 400px;
        width: 100%;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;

    modalContent.innerHTML = `
        <h3 style="margin-top: 0; color: var(--danger-color);">Confirm Deletion</h3>
        <p>Are you sure you want to delete this task? This action cannot be undone.</p>
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
            <button class="btn btn-light" id="cancelDelete">Cancel</button>
            <button class="btn btn-danger" id="confirmDelete">
                <i class="fas fa-trash-alt"></i> Delete
            </button>
        </div>
    `;

    modalContainer.appendChild(modalContent);
    document.body.appendChild(modalContainer);

    // Add event listeners
    document.getElementById('cancelDelete').addEventListener('click', () => {
        document.body.removeChild(modalContainer);
    });

    document.getElementById('confirmDelete').addEventListener('click', async () => {
        try {
            // Show loading state
            document.getElementById('confirmDelete').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
            document.getElementById('confirmDelete').disabled = true;
            document.getElementById('cancelDelete').disabled = true;

            const response = await fetch(`${API_BASE}/api/tasks/${taskId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Error deleting task');

            // Remove modal
            document.body.removeChild(modalContainer);

            showToast('success', 'Task Deleted', 'The task has been successfully deleted.');
            loadTasks();
        } catch (error) {
            console.error('Error:', error);
            document.getElementById('confirmDelete').innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
            document.getElementById('confirmDelete').disabled = false;
            document.getElementById('cancelDelete').disabled = false;
            showToast('error', 'Delete Failed', error.message);
        }
    });
}

// Отмена редактирования
function cancelEdit() {
    resetForm();
    showToast('info', 'Edit Cancelled', 'Task editing has been cancelled.');
}

// Mobile sidebar toggle
function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.querySelector('.mobile-menu-toggle i');

    sidebar.classList.toggle('mobile-open');

    // Change icon
    if (sidebar.classList.contains('mobile-open')) {
        menuToggle.className = 'fas fa-times';
    } else {
        menuToggle.className = 'fas fa-bars';
    }
}

// Close mobile sidebar when clicking outside
document.addEventListener('click', function(event) {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.querySelector('.mobile-menu-toggle');

    if (window.innerWidth <= 768 &&
        !sidebar.contains(event.target) &&
        !menuToggle.contains(event.target) &&
        sidebar.classList.contains('mobile-open')) {
        sidebar.classList.remove('mobile-open');
        document.querySelector('.mobile-menu-toggle i').className = 'fas fa-bars';
    }
});

// Выход из системы
function logout() {
    showToast('info', 'Logging Out', 'You are being logged out...');

    setTimeout(() => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/';
    }, 1000);
}

// Section switching functionality
function showSection(section) {
    currentSection = section;

    // Update sidebar active state
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.classList.remove('active');
    });

    // Hide all sections
    document.getElementById('tasksSection').style.display = 'none';
    document.getElementById('usersSection').style.display = 'none';

    if (section === 'tasks') {
        document.getElementById('tasksSection').style.display = 'block';
        document.getElementById('sectionTitle').textContent = 'Task Management';
        document.querySelector('.sidebar-menu a[onclick="showSection(\'tasks\')"]').classList.add('active');
        loadTasks();
    } else if (section === 'users') {
        document.getElementById('usersSection').style.display = 'block';
        document.getElementById('sectionTitle').textContent = 'User Management';
        document.querySelector('.sidebar-menu a[onclick="showSection(\'users\')"]').classList.add('active');
        loadUsers();
    }
}

// Load all users
async function loadUsers() {
    try {
        const container = document.getElementById('usersContainer');
        container.innerHTML = '<div class="text-center" style="padding: 20px;"><i class="fas fa-spinner fa-spin fa-2x"></i><p style="margin-top: 10px;">Loading users...</p></div>';

        const response = await fetch(`${API_BASE}/api/users`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load users');
        }

        const users = await response.json();
        renderUsers(users);
    } catch (error) {
        console.error('Error:', error);
        showToast('error', 'Loading Error', 'Could not load users. Please try again.');
    }
}

// Render users list
function renderUsers(users) {
    const container = document.getElementById('usersContainer');
    container.innerHTML = '';

    if (users.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 30px;">
                <i class="fas fa-users fa-3x" style="color: var(--gray-color); margin-bottom: 15px;"></i>
                <h3>No Users Found</h3>
                <p>No registered users in the system.</p>
            </div>
        `;
        return;
    }

    users.forEach(user => {
        const userElement = document.createElement('div');
        userElement.className = 'user-item';

        const createdDate = new Date(user.created_at);
        const formattedDate = createdDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        userElement.innerHTML = `
            <div class="user-content">
                <div class="user-name">
                    ${user.username}
                    ${user.is_admin ? '<span class="admin-badge">Admin</span>' : ''}
                </div>
                <div class="user-email">${user.email}</div>
                <div class="user-meta">
                    <span><i class="fas fa-calendar-alt"></i> Joined ${formattedDate}</span>
                    <span><i class="fas fa-key"></i> ID: ${user.id}</span>
                </div>
            </div>
            <div class="user-actions">
                <button class="btn btn-sm btn-warning" onclick="editUser('${user.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
            </div>
        `;

        container.appendChild(userElement);
    });
}

async function editUser(userId) {
    try {
        if (!userId) {
            throw new Error('User ID is missing or invalid');
        }

        document.getElementById('editUserCard').style.display = 'block';
        document.getElementById('editUserCard').scrollIntoView({ behavior: 'smooth' });

        const userItems = document.querySelectorAll('.user-item');
        let userData = null;

        userItems.forEach(item => {
            const userIdFromMeta = item.querySelector('.user-meta span:last-child').textContent.replace('ID: ', '').trim();
            if (userIdFromMeta === userId.toString()) {
                const userNameElement = item.querySelector('.user-name');
                let username = userNameElement.textContent;

                const adminBadge = userNameElement.querySelector('.admin-badge');
                if (adminBadge) {
                    username = username.replace(adminBadge.textContent, '').trim();
                }

                userData = {
                    id: userId,
                    username: username,
                    email: item.querySelector('.user-email').textContent.trim()
                };
            }
        });

        if (!userData) {
            throw new Error('User data not found. Please refresh the page and try again.');
        }

        document.getElementById('userId').value = userData.id;
        document.getElementById('userUsername').value = userData.username;
        document.getElementById('userPassword').value = '';

        showToast('info', 'Edit Mode', 'You are now editing a user.');
    } catch (error) {
        console.error('Error editing user:', error);
        showToast('error', 'Edit Failed', error.message);
    }
}

async function submitUser() {
    const userId = document.getElementById('userId').value;
    const username = document.getElementById('userUsername').value.trim();
    const password = document.getElementById('userPassword').value.trim();

    if (!username) {
        showToast('warning', 'Validation Error', 'Username is required.');
        return;
    }

    if (!userId) {
        showToast('warning', 'Validation Error', 'User ID is missing.');
        return;
    }

    try {
        const requestBody = { username };
        if (password) {
            requestBody.password = password;
        }

        const response = await fetch(`${API_BASE}/api/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        await response.json();

        showToast('success', 'User Updated', 'The user has been successfully updated.');
        cancelUserEdit();
        loadUsers();
    } catch (error) {
        console.error('Error updating user:', error);
        showToast('error', 'Update Failed', error.message);
    }
}

// Cancel user edit
function cancelUserEdit() {
    document.getElementById('editUserCard').style.display = 'none';
    document.getElementById('userId').value = '';
    document.getElementById('userUsername').value = '';
    document.getElementById('userPassword').value = '';
}
