# Развертывание CC_Platform в DigitalOcean App Platform

Это руководство поможет вам развернуть проект CC_Platform в DigitalOcean App Platform с переносом всех данных из локальной PostgreSQL базы данных.

## Предварительные требования

1. Аккаунт DigitalOcean
2. Локальная PostgreSQL база данных с данными проекта
3. Git репозиторий на GitHub: `https://github.com/EB-coder/CC_Platform`
4. API ключи для OpenAI

## Шаг 1: Экспорт данных из локальной базы данных

### Автоматический экспорт (рекомендуется)

Запустите PowerShell скрипт для автоматического экспорта:

```powershell
.\scripts\export-local-data.ps1
```

### Ручной экспорт

Если автоматический скрипт не работает, выполните команды вручную:

```powershell
# Установите переменную окружения для пароля
$env:PGPASSWORD="Donthack23_"

# Создайте папку для экспорта
mkdir db\exported_data

# Экспортируйте каждую таблицу
psql -U postgres -d cf_platform -c "\copy (SELECT id, username, email, password, is_admin, created_at FROM users) TO 'db\exported_data\users_data.csv' WITH CSV HEADER"

psql -U postgres -d cf_platform -c "\copy (SELECT id, title, content, language, difficulty, admin_id, is_active, created_at FROM tasks) TO 'db\exported_data\tasks_data.csv' WITH CSV HEADER"

psql -U postgres -d cf_platform -c "\copy (SELECT id, task_id, user_id, code, language, status, score, feedback, submitted_at, evaluated_at FROM solutions) TO 'db\exported_data\solutions_data.csv' WITH CSV HEADER"

psql -U postgres -d cf_platform -c "\copy (SELECT user_id, task_id, solution_id, solved_at FROM user_solved_tasks) TO 'db\exported_data\user_solved_tasks_data.csv' WITH CSV HEADER"
```

## Шаг 2: Подготовка GitHub репозитория

1. Убедитесь, что все изменения зафиксированы в Git:
```bash
git add .
git commit -m "Prepare for DigitalOcean deployment"
git push origin main
```

## Шаг 3: Создание приложения в DigitalOcean App Platform

1. Войдите в панель управления DigitalOcean
2. Перейдите в раздел "Apps"
3. Нажмите "Create App"
4. Выберите "GitHub" как источник
5. Выберите репозиторий `EB-coder/CC_Platform`
6. Выберите ветку `main`
7. DigitalOcean автоматически обнаружит файл `.do/app.yaml`

## Шаг 4: Настройка переменных окружения

В настройках приложения добавьте следующие секреты:

1. **OPENAI_API_KEY**: Ваш API ключ OpenAI
2. **JWT_SECRET**: Секретный ключ для JWT токенов (например: `your_super_secret_jwt_key_2024`)

## Шаг 5: Развертывание приложения

1. Нажмите "Create Resources"
2. Дождитесь завершения развертывания (обычно 5-10 минут)
3. Приложение будет доступно по URL, который предоставит DigitalOcean

## Шаг 6: Импорт данных в DigitalOcean PostgreSQL

### Получение данных подключения к базе данных

1. В панели управления приложением перейдите в раздел "Components"
2. Найдите компонент базы данных
3. Скопируйте строку подключения (DATABASE_URL)

### Подключение к базе данных DigitalOcean

```bash
# Используйте строку подключения из панели управления
psql "postgresql://username:password@host:port/database?sslmode=require"
```

### Создание схемы базы данных

```sql
-- Выполните SQL скрипт для создания схемы
\i db/schema.sql
```

### Импорт данных

1. Загрузите CSV файлы на сервер DigitalOcean или используйте локальные файлы
2. Выполните команды импорта:

```sql
-- Импорт пользователей
\copy users(id, username, email, password, is_admin, created_at) FROM 'users_data.csv' WITH CSV HEADER;

-- Импорт задач
\copy tasks(id, title, content, language, difficulty, admin_id, is_active, created_at) FROM 'tasks_data.csv' WITH CSV HEADER;

-- Импорт решений
\copy solutions(id, task_id, user_id, code, language, status, score, feedback, submitted_at, evaluated_at) FROM 'solutions_data.csv' WITH CSV HEADER;

-- Импорт решенных задач
\copy user_solved_tasks(user_id, task_id, solution_id, solved_at) FROM 'user_solved_tasks_data.csv' WITH CSV HEADER;

-- Обновление последовательностей
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('tasks_id_seq', (SELECT MAX(id) FROM tasks));
SELECT setval('solutions_id_seq', (SELECT MAX(id) FROM solutions));
```

## Шаг 7: Проверка развертывания

1. Откройте URL приложения
2. Попробуйте войти в систему с существующими учетными данными
3. Проверьте, что все задачи и решения отображаются корректно
4. Протестируйте создание новых задач (для админов)
5. Протестируйте отправку решений

## Возможные проблемы и решения

### Проблема: Ошибка подключения к базе данных
**Решение**: Проверьте, что переменная DATABASE_URL правильно настроена в настройках приложения

### Проблема: Ошибки CORS
**Решение**: Убедитесь, что FRONTEND_URL правильно настроен в переменных окружения

### Проблема: Ошибки импорта данных
**Решение**: Проверьте формат CSV файлов и убедитесь, что схема базы данных создана

### Проблема: Ошибки OpenAI API
**Решение**: Проверьте, что OPENAI_API_KEY правильно настроен и имеет достаточный баланс

## Мониторинг и логи

1. В панели управления приложением перейдите в раздел "Runtime Logs"
2. Мониторьте логи для выявления ошибок
3. Используйте раздел "Insights" для мониторинга производительности

## Масштабирование

При необходимости вы можете:
1. Увеличить размер инстанса приложения
2. Увеличить размер базы данных
3. Добавить дополнительные инстансы для балансировки нагрузки

## Резервное копирование

Настройте автоматическое резервное копирование базы данных в настройках DigitalOcean для защиты ваших данных.
