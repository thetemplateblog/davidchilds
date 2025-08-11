#!/bin/bash

# Server Setup Script for Statamic on EC2
# Run this once when setting up a new server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Statamic Server Setup Script${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Function to check command success
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
    else
        echo -e "${RED}✗ $1 failed${NC}"
        exit 1
    fi
}

# Update system
echo -e "${YELLOW}Updating system packages...${NC}"
sudo apt-get update
sudo apt-get upgrade -y
check_status "System update"

# Install required packages
echo -e "${YELLOW}Installing required packages...${NC}"
sudo apt-get install -y \
    nginx \
    php8.2-fpm \
    php8.2-cli \
    php8.2-common \
    php8.2-mysql \
    php8.2-zip \
    php8.2-gd \
    php8.2-mbstring \
    php8.2-curl \
    php8.2-xml \
    php8.2-bcmath \
    php8.2-intl \
    php8.2-sqlite3 \
    composer \
    nodejs \
    npm \
    git \
    supervisor \
    redis-server \
    certbot \
    python3-certbot-nginx \
    unzip \
    htop
check_status "Package installation"

# Configure PHP
echo -e "${YELLOW}Configuring PHP...${NC}"
sudo sed -i 's/upload_max_filesize = 2M/upload_max_filesize = 100M/' /etc/php/8.2/fpm/php.ini
sudo sed -i 's/post_max_size = 8M/post_max_size = 100M/' /etc/php/8.2/fpm/php.ini
sudo sed -i 's/memory_limit = 128M/memory_limit = 256M/' /etc/php/8.2/fpm/php.ini
sudo sed -i 's/max_execution_time = 30/max_execution_time = 300/' /etc/php/8.2/fpm/php.ini
sudo systemctl restart php8.2-fpm
check_status "PHP configuration"

# Create deployment directory
echo -e "${YELLOW}Creating deployment directory...${NC}"
DEPLOY_USER=${DEPLOY_USER:-ubuntu}
DEPLOY_PATH=${DEPLOY_PATH:-/var/www/statamic}

sudo mkdir -p $DEPLOY_PATH
sudo chown -R $DEPLOY_USER:www-data $DEPLOY_PATH
sudo chmod -R 775 $DEPLOY_PATH
check_status "Deployment directory"

# Create Nginx configuration
echo -e "${YELLOW}Creating Nginx configuration...${NC}"
DOMAIN=${DOMAIN:-example.com}

sudo tee /etc/nginx/sites-available/statamic > /dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    root $DEPLOY_PATH/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";

    index index.php;

    charset utf-8;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    # Statamic Control Panel
    location /cp {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    # Statamic Static Caching
    location /static {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    # Security for Statamic files
    location ~* \.(?:env|yaml|md)$ {
        deny all;
    }

    client_max_body_size 100M;
}
EOF

sudo ln -sf /etc/nginx/sites-available/statamic /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
check_status "Nginx configuration"

# Create queue worker service (optional)
echo -e "${YELLOW}Creating queue worker service...${NC}"
sudo tee /etc/systemd/system/statamic-queue.service > /dev/null <<EOF
[Unit]
Description=Statamic Queue Worker
After=network.target

[Service]
Type=simple
User=$DEPLOY_USER
Group=www-data
WorkingDirectory=$DEPLOY_PATH
ExecStart=/usr/bin/php $DEPLOY_PATH/artisan queue:work --sleep=3 --tries=3
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
check_status "Queue worker service"

# Create deployment scripts directory
echo -e "${YELLOW}Creating deployment structure...${NC}"
cd $DEPLOY_PATH
mkdir -p backups scripts
check_status "Deployment structure"

# Set up log rotation
echo -e "${YELLOW}Configuring log rotation...${NC}"
sudo tee /etc/logrotate.d/statamic > /dev/null <<EOF
$DEPLOY_PATH/storage/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 $DEPLOY_USER www-data
    sharedscripts
    postrotate
        systemctl reload php8.2-fpm > /dev/null
    endscript
}
EOF
check_status "Log rotation"

# Create .env template
echo -e "${YELLOW}Creating .env template...${NC}"
if [ ! -f "$DEPLOY_PATH/.env" ]; then
    cat > $DEPLOY_PATH/.env.example <<EOF
APP_NAME="Statamic Site"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://$DOMAIN

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=error

DB_CONNECTION=sqlite
DB_DATABASE=$DEPLOY_PATH/database/database.sqlite

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120

MEMCACHED_HOST=127.0.0.1

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="\${APP_NAME}"

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=
AWS_USE_PATH_STYLE_ENDPOINT=false

STATAMIC_LICENSE_KEY=
STATAMIC_THEME=

STATAMIC_API_ENABLED=false
STATAMIC_REVISIONS_ENABLED=false

STATAMIC_PRO=false

STATAMIC_GIT_ENABLED=false
STATAMIC_GIT_PUSH=false
STATAMIC_GIT_DISPATCH_DELAY=5
EOF
    echo -e "${YELLOW}Please edit .env file with your configuration${NC}"
fi
check_status ".env template"

# Final permissions
echo -e "${YELLOW}Setting final permissions...${NC}"
sudo chown -R $DEPLOY_USER:www-data $DEPLOY_PATH
sudo chmod -R 775 $DEPLOY_PATH/storage
sudo chmod -R 775 $DEPLOY_PATH/bootstrap/cache
check_status "Permissions"

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Server setup completed!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Configure your .env file: nano $DEPLOY_PATH/.env"
echo "2. Set up SSL: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo "3. Deploy your application using GitHub Actions"
echo "4. Run: php artisan key:generate"
echo "5. Run: php artisan storage:link"
echo ""
echo -e "${YELLOW}GitHub Secrets needed:${NC}"
echo "- PROD_DEPLOY_HOST: Your server IP/hostname"
echo "- PROD_DEPLOY_USER: $DEPLOY_USER"
echo "- PROD_DEPLOY_SSH_KEY: Your deployment SSH private key"
echo "- PROD_DEPLOY_PATH: $DEPLOY_PATH"
echo "- PROD_SITE_URL: https://$DOMAIN"