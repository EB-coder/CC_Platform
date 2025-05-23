# 🚀 CC Platform Deployment on DigitalOcean Droplet

## 📋 Quick Setup Guide

### 1. Create Droplet
- **Image**: Ubuntu 22.04 LTS
- **Size**: Basic $6/month (1GB RAM)
- **Region**: Choose closest to you
- **Authentication**: SSH Key or Password

### 2. Connect to Droplet
```bash
ssh root@YOUR_DROPLET_IP
```

### 3. Run Setup Commands
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PostgreSQL and other tools
apt install -y postgresql postgresql-contrib git nginx ufw
npm install -g pm2

# Configure PostgreSQL
sudo -u postgres psql -c "CREATE DATABASE cf_platform;"
sudo -u postgres psql -c "CREATE USER cf_user WITH PASSWORD 'cf_password_123';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE cf_platform TO cf_user;"

# Configure firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# Clone project
cd /root
git clone https://github.com/EB-coder/CC_Platform.git
cd CC_Platform
npm install

# Create .env file
cat > .env << 'EOL'
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cf_platform
DB_USER=cf_user
DB_PASSWORD=cf_password_123
JWT_SECRET=your_super_secret_jwt_key_production_12345
OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE
EOL

# IMPORTANT: Edit .env and add your real OpenAI API key
nano .env

# Initialize database
node init-db.js

# Configure Nginx
cat > /etc/nginx/sites-available/cc-platform << 'EOL'
server {
    listen 80;
    server_name _;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOL

ln -sf /etc/nginx/sites-available/cc-platform /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Start application
pm2 start server/server.js --name "cc-platform"
pm2 startup
pm2 save
```

### 4. Access Your Application
- **URL**: `http://YOUR_DROPLET_IP`
- **Health Check**: `http://YOUR_DROPLET_IP/health`

### 5. Useful Commands
```bash
# Check status
pm2 status
systemctl status nginx

# View logs
pm2 logs cc-platform

# Restart app
pm2 restart cc-platform

# Update code
cd /root/CC_Platform
git pull origin main
npm install
pm2 restart cc-platform
```

## 🔑 Important Notes
1. **Replace YOUR_OPENAI_API_KEY_HERE** with your actual OpenAI API key
2. **Change default passwords** in production
3. **Setup SSL certificate** for HTTPS (optional)
4. **Configure domain name** instead of IP (optional)

## 🛡️ Security Tips
- Change PostgreSQL password
- Setup fail2ban
- Configure proper firewall rules
- Use SSH keys instead of passwords
- Regular system updates
