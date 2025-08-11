#!/bin/bash

# Statamic Deployment Script
# Usage: ./scripts/deploy.sh [production|development]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${GREEN}Starting deployment for ${YELLOW}$ENVIRONMENT${NC}"

# Function to check command success
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
    else
        echo -e "${RED}✗ $1 failed${NC}"
        exit 1
    fi
}

# Pull latest changes
echo -e "${YELLOW}Pulling latest changes...${NC}"
git pull origin main
check_status "Git pull"

# Install/update Composer dependencies
echo -e "${YELLOW}Installing PHP dependencies...${NC}"
if [ "$ENVIRONMENT" = "production" ]; then
    composer install --no-dev --optimize-autoloader --no-interaction
else
    composer install --optimize-autoloader --no-interaction
fi
check_status "Composer install"

# Install/update NPM dependencies
echo -e "${YELLOW}Installing Node dependencies...${NC}"
npm ci
check_status "NPM install"

# Build assets
echo -e "${YELLOW}Building assets...${NC}"
if [ "$ENVIRONMENT" = "production" ]; then
    npm run build
else
    npm run build
fi
check_status "Asset build"

# Clear all caches
echo -e "${YELLOW}Clearing caches...${NC}"
php artisan config:clear
php artisan cache:clear
php artisan view:clear
php artisan route:clear
check_status "Cache clear"

# Run database migrations
echo -e "${YELLOW}Running migrations...${NC}"
if [ "$ENVIRONMENT" = "production" ]; then
    php artisan migrate --force
else
    php artisan migrate
fi
check_status "Database migrations"

# Cache configuration for production
if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${YELLOW}Caching configuration...${NC}"
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
    check_status "Configuration cache"
fi

# Statamic specific commands
echo -e "${YELLOW}Running Statamic commands...${NC}"
php please cache:clear
php please stache:warm
php please static:clear
check_status "Statamic cache"

# Set proper permissions
echo -e "${YELLOW}Setting permissions...${NC}"
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
check_status "Permissions"

# Reload services
echo -e "${YELLOW}Reloading services...${NC}"

# Reload PHP-FPM
if systemctl is-active --quiet php8.2-fpm; then
    sudo systemctl reload php8.2-fpm
    check_status "PHP-FPM reload"
elif systemctl is-active --quiet php-fpm; then
    sudo systemctl reload php-fpm
    check_status "PHP-FPM reload"
fi

# Reload web server
if systemctl is-active --quiet nginx; then
    sudo nginx -t && sudo systemctl reload nginx
    check_status "Nginx reload"
elif systemctl is-active --quiet apache2; then
    sudo apache2ctl -t && sudo systemctl reload apache2
    check_status "Apache reload"
fi

# Queue worker restart (if using queues)
if systemctl is-active --quiet statamic-queue; then
    sudo systemctl restart statamic-queue
    check_status "Queue worker restart"
fi

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "${GREEN}Timestamp: ${YELLOW}$TIMESTAMP${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"