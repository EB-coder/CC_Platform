#!/bin/bash

# Скрипт деплоя для CF Platform на DigitalOcean
# Выполните этот скрипт на вашем droplet

echo "🚀 Начинаем деплой CF Platform..."

# Переход в директорию проекта
cd /home/CC_Platform

# Остановка приложения если оно запущено
pm2 stop cf-platform 2>/dev/null || true

# Обновление кода из GitHub
echo "📥 Обновляем код из GitHub..."
git pull origin main

# Установка/обновление зависимостей
echo "📦 Устанавливаем зависимости..."
npm install
cd server && npm install && cd ..

# Создание директории для логов
mkdir -p logs

# Запуск приложения через PM2
echo "🔄 Запускаем приложение..."
pm2 start ecosystem.config.js

# Сохранение конфигурации PM2
pm2 save
pm2 startup

echo "✅ Деплой завершен!"
echo "🌐 Приложение доступно по адресу: http://YOUR_DROPLET_IP:3000"

# Показать статус
pm2 status
