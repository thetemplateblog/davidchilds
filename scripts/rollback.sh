#!/bin/bash

# Statamic Rollback Script
# Usage: ./scripts/rollback.sh [backup_directory]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR=${1:-}
DEPLOY_PATH=$(pwd)

echo -e "${YELLOW}Statamic Deployment Rollback${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Function to check command success
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
    else
        echo -e "${RED}✗ $1 failed${NC}"
        exit 1
    fi
}

# Check if backup directory provided
if [ -z "$BACKUP_DIR" ]; then
    echo -e "${YELLOW}Available backups:${NC}"
    ls -la backups/ 2>/dev/null || echo "No backups found"
    echo ""
    echo -e "${RED}Usage: $0 <backup_directory>${NC}"
    echo "Example: $0 backups/20240315_143022"
    exit 1
fi

# Check if backup exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${RED}Backup directory not found: $BACKUP_DIR${NC}"
    exit 1
fi

# Confirm rollback
echo -e "${YELLOW}You are about to rollback to: ${RED}$BACKUP_DIR${NC}"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo -e "${YELLOW}Rollback cancelled${NC}"
    exit 0
fi

# Stop services
echo -e "${YELLOW}Stopping services...${NC}"
if systemctl is-active --quiet statamic-queue; then
    sudo systemctl stop statamic-queue
fi

# Create current state backup before rollback
ROLLBACK_BACKUP="backups/rollback_$(date +%Y%m%d_%H%M%S)"
mkdir -p $ROLLBACK_BACKUP

echo -e "${YELLOW}Backing up current state to $ROLLBACK_BACKUP...${NC}"
tar -czf $ROLLBACK_BACKUP/current.tar.gz \
    --exclude=vendor \
    --exclude=node_modules \
    --exclude=storage/logs/* \
    app config content database public resources routes
cp .env $ROLLBACK_BACKUP/.env.current 2>/dev/null || true
check_status "Current state backup"

# Extract backup
echo -e "${YELLOW}Restoring from backup...${NC}"
tar -xzf $BACKUP_DIR/backup.tar.gz
check_status "Backup extraction"

# Restore environment file
if [ -f "$BACKUP_DIR/.env.backup" ]; then
    cp $BACKUP_DIR/.env.backup .env
    check_status "Environment file restore"
fi

# Reinstall dependencies
echo -e "${YELLOW}Reinstalling dependencies...${NC}"
composer install --no-dev --optimize-autoloader --no-interaction
npm ci
npm run build
check_status "Dependencies"

# Clear caches
echo -e "${YELLOW}Clearing caches...${NC}"
php artisan config:clear
php artisan cache:clear
php artisan view:clear
php artisan route:clear
check_status "Cache clear"

# Rebuild caches
echo -e "${YELLOW}Rebuilding caches...${NC}"
php artisan config:cache
php artisan route:cache
php artisan view:cache
php please cache:clear
php please stache:warm
check_status "Cache rebuild"

# Set permissions
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
check_status "Permissions"

# Restart services
echo -e "${YELLOW}Restarting services...${NC}"

# PHP-FPM
if systemctl is-active --quiet php8.2-fpm; then
    sudo systemctl reload php8.2-fpm
elif systemctl is-active --quiet php-fpm; then
    sudo systemctl reload php-fpm
fi

# Web server
if systemctl is-active --quiet nginx; then
    sudo nginx -t && sudo systemctl reload nginx
elif systemctl is-active --quiet apache2; then
    sudo apache2ctl -t && sudo systemctl reload apache2
fi

# Queue worker
if [ -f "/etc/systemd/system/statamic-queue.service" ]; then
    sudo systemctl start statamic-queue
fi

check_status "Services restart"

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Rollback completed successfully!${NC}"
echo -e "${GREEN}Restored from: ${YELLOW}$BACKUP_DIR${NC}"
echo -e "${GREEN}Current state backed up to: ${YELLOW}$ROLLBACK_BACKUP${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"