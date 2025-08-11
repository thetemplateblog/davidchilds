#!/bin/bash

# Health Check Script for Statamic
# Can be used for monitoring and deployment verification

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SITE_URL=${1:-http://localhost}
ERRORS=0

echo -e "${GREEN}Running Health Checks${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Function to check endpoint
check_endpoint() {
    local url=$1
    local expected_code=$2
    local description=$3
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" = "$expected_code" ]; then
        echo -e "${GREEN}✓ $description (HTTP $response)${NC}"
    else
        echo -e "${RED}✗ $description (Expected: $expected_code, Got: $response)${NC}"
        ((ERRORS++))
    fi
}

# Check main site
check_endpoint "$SITE_URL" "200" "Main site"

# Check Statamic CP (should return 200 or 302 for login)
cp_response=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL/cp")
if [ "$cp_response" = "200" ] || [ "$cp_response" = "302" ]; then
    echo -e "${GREEN}✓ Statamic Control Panel (HTTP $cp_response)${NC}"
else
    echo -e "${RED}✗ Statamic Control Panel (HTTP $cp_response)${NC}"
    ((ERRORS++))
fi

# Check robots.txt
check_endpoint "$SITE_URL/robots.txt" "200" "Robots.txt"

# Check PHP configuration
echo -e "${YELLOW}Checking PHP configuration...${NC}"
php_version=$(php -v | head -n 1 | cut -d " " -f 2 | cut -d "." -f 1,2)
if [ "$php_version" = "8.2" ] || [ "$php_version" = "8.3" ]; then
    echo -e "${GREEN}✓ PHP version: $php_version${NC}"
else
    echo -e "${RED}✗ PHP version: $php_version (Expected: 8.2+)${NC}"
    ((ERRORS++))
fi

# Check required PHP extensions
required_extensions=("mbstring" "xml" "ctype" "json" "bcmath" "curl" "gd" "intl" "pdo_sqlite" "zip")
for ext in "${required_extensions[@]}"; do
    if php -m | grep -q "^$ext$"; then
        echo -e "${GREEN}✓ PHP extension: $ext${NC}"
    else
        echo -e "${RED}✗ PHP extension: $ext missing${NC}"
        ((ERRORS++))
    fi
done

# Check file permissions
echo -e "${YELLOW}Checking file permissions...${NC}"
if [ -w "storage" ] && [ -w "bootstrap/cache" ]; then
    echo -e "${GREEN}✓ Storage permissions${NC}"
else
    echo -e "${RED}✗ Storage permissions issue${NC}"
    ((ERRORS++))
fi

# Check .env file
if [ -f ".env" ]; then
    echo -e "${GREEN}✓ .env file exists${NC}"
else
    echo -e "${RED}✗ .env file missing${NC}"
    ((ERRORS++))
fi

# Check database connection
echo -e "${YELLOW}Checking database connection...${NC}"
if php artisan tinker --execute="DB::connection()->getPdo();" 2>/dev/null; then
    echo -e "${GREEN}✓ Database connection${NC}"
else
    echo -e "${RED}✗ Database connection failed${NC}"
    ((ERRORS++))
fi

# Check Statamic
echo -e "${YELLOW}Checking Statamic...${NC}"
if php please list > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Statamic CLI working${NC}"
else
    echo -e "${RED}✗ Statamic CLI error${NC}"
    ((ERRORS++))
fi

# Check disk space
echo -e "${YELLOW}Checking disk space...${NC}"
disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$disk_usage" -lt 80 ]; then
    echo -e "${GREEN}✓ Disk usage: ${disk_usage}%${NC}"
else
    echo -e "${YELLOW}⚠ Disk usage: ${disk_usage}% (High usage)${NC}"
fi

# Summary
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}All health checks passed!${NC}"
    exit 0
else
    echo -e "${RED}Health checks failed with $ERRORS errors${NC}"
    exit 1
fi