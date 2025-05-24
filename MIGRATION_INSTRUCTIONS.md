# Миграция данных на DigitalOcean PostgreSQL

## Шаг 1: Получите данные подключения

1. Перейдите в DigitalOcean Dashboard
2. Найдите вашу базу данных `cc-platform-db`
3. Скопируйте следующие данные:
   - **Host**: `db-postgresql-fra1-xxxxx-do-user-xxxxx-0.b.db.ondigitalocean.com`
   - **Port**: `25060`
   - **Database**: `defaultdb`
   - **User**: `doadmin`
   - **Password**: `[ваш пароль]`

## Шаг 2: Установите PostgreSQL клиент (если не установлен)

Скачайте и установите PostgreSQL с официального сайта:
https://www.postgresql.org/download/windows/

## Шаг 3: Создайте схему базы данных

Откройте командную строку и выполните:

```bash
psql "postgresql://doadmin:[PASSWORD]@[HOST]:25060/defaultdb?sslmode=require" -f db\schema.sql
```

Замените `[PASSWORD]` и `[HOST]` на ваши данные.

## Шаг 4: Импортируйте данные

Выполните следующие команды по очереди:

### Импорт пользователей:
```bash
psql "postgresql://doadmin:[PASSWORD]@[HOST]:25060/defaultdb?sslmode=require" -c "\copy users(id, username, email, password, is_admin, created_at) FROM 'db/exported_data/users_data.csv' WITH CSV HEADER;"
```

### Импорт задач:
```bash
psql "postgresql://doadmin:[PASSWORD]@[HOST]:25060/defaultdb?sslmode=require" -c "\copy tasks(id, title, content, language, difficulty, admin_id, is_active, created_at, updated_at) FROM 'db/exported_data/tasks_data.csv' WITH CSV HEADER;"
```

### Импорт решений:
```bash
psql "postgresql://doadmin:[PASSWORD]@[HOST]:25060/defaultdb?sslmode=require" -c "\copy solutions(id, task_id, user_id, code, language, status, score, feedback, submitted_at, evaluated_at) FROM 'db/exported_data/solutions_data.csv' WITH CSV HEADER;"
```

### Импорт решенных задач:
```bash
psql "postgresql://doadmin:[PASSWORD]@[HOST]:25060/defaultdb?sslmode=require" -c "\copy user_solved_tasks(user_id, task_id, solution_id, solved_at) FROM 'db/exported_data/user_solved_tasks_data.csv' WITH CSV HEADER;"
```

## Шаг 5: Обновите последовательности

```bash
psql "postgresql://doadmin:[PASSWORD]@[HOST]:25060/defaultdb?sslmode=require" -c "SELECT setval('users_id_seq', (SELECT MAX(id) FROM users)); SELECT setval('tasks_id_seq', (SELECT MAX(id) FROM tasks)); SELECT setval('solutions_id_seq', (SELECT MAX(id) FROM solutions));"
```

## Шаг 6: Обновите переменные окружения в DigitalOcean

В настройках вашего приложения на DigitalOcean App Platform добавьте:

```
DATABASE_URL=postgresql://doadmin:[PASSWORD]@[HOST]:25060/defaultdb?sslmode=require
```

## Альтернативный способ: Использование pgAdmin

1. Установите pgAdmin: https://www.pgadmin.org/download/
2. Подключитесь к вашей DigitalOcean базе данных
3. Выполните скрипт `db/schema.sql`
4. Импортируйте CSV файлы через интерфейс pgAdmin

## Проверка миграции

После миграции проверьте:

1. Подключение к базе данных:
```bash
psql "postgresql://doadmin:[PASSWORD]@[HOST]:25060/defaultdb?sslmode=require" -c "SELECT COUNT(*) FROM users;"
```

2. Количество записей в каждой таблице:
```sql
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'tasks', COUNT(*) FROM tasks
UNION ALL  
SELECT 'solutions', COUNT(*) FROM solutions
UNION ALL
SELECT 'user_solved_tasks', COUNT(*) FROM user_solved_tasks;
```

## Возможные проблемы и решения

### Ошибка подключения:
- Проверьте, что ваш IP добавлен в trusted sources
- Убедитесь, что используете правильный порт (25060)
- Проверьте, что sslmode=require указан в строке подключения

### Ошибка импорта CSV:
- Убедитесь, что пути к файлам правильные
- Проверьте кодировку файлов (должна быть UTF-8)
- Убедитесь, что CSV файлы имеют заголовки

### Ошибка последовательностей:
- Это не критично, но лучше исправить для корректной работы AUTO_INCREMENT
