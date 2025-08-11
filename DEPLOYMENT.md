# Deployment Guide for Statamic Site

This guide covers the deployment setup for your Statamic site on EC2 using GitHub Actions.

## 📁 Project Structure

```
.github/
├── workflows/
│   ├── deploy-prod.yml    # Production deployment workflow
│   └── deploy-dev.yml     # Development deployment workflow
├── dependabot.yml         # Automated dependency updates
scripts/
├── deploy.sh              # Manual deployment script
├── rollback.sh            # Rollback to previous version
├── setup-server.sh        # Initial server setup
└── health-check.sh        # Health monitoring script
```

## 🚀 Quick Start

### 1. Initial Server Setup

SSH into your EC2 instance and run:

```bash
# Download and run the setup script
curl -o setup-server.sh https://raw.githubusercontent.com/[your-repo]/main/scripts/setup-server.sh
chmod +x setup-server.sh
./setup-server.sh
```

### 2. Configure GitHub Secrets

Go to your GitHub repository Settings → Secrets → Actions and add:

#### Production Secrets
- `PROD_DEPLOY_HOST`: Your EC2 instance IP or domain
- `PROD_DEPLOY_USER`: Ubuntu or your deployment user
- `PROD_DEPLOY_SSH_KEY`: Your SSH private key
- `PROD_DEPLOY_PATH`: `/var/www/statamic`
- `PROD_SITE_URL`: `https://yourdomain.com`

#### Development Secrets (if using)
- `DEV_DEPLOY_HOST`: Development server IP
- `DEV_DEPLOY_USER`: Development user
- `DEV_DEPLOY_SSH_KEY`: Development SSH key
- `DEV_DEPLOY_PATH`: `/var/www/statamic-dev`
- `DEV_SITE_URL`: `https://dev.yourdomain.com`

### 3. Environment Configuration

Create `.env` file on your server:

```bash
cd /var/www/statamic
cp .env.example .env
nano .env

# Generate application key
php artisan key:generate
```

## 📦 Deployment Workflows

### Automatic Deployment

**Production**: Pushes to `main` branch trigger automatic deployment with manual approval
**Development**: Pushes to `development` branch trigger automatic deployment

### Manual Deployment

From your server:

```bash
cd /var/www/statamic
./scripts/deploy.sh production
# or
./scripts/deploy.sh development
```

### GitHub Actions Workflow

The deployment process:
1. Checks out code
2. Installs PHP and Node dependencies
3. Builds assets
4. Runs tests
5. Creates deployment archive
6. Backs up current deployment
7. Deploys new version
8. Runs health checks
9. Notifies status

## 🔄 Rollback Procedure

If something goes wrong:

```bash
cd /var/www/statamic

# List available backups
ls -la backups/

# Rollback to specific backup
./scripts/rollback.sh backups/20240315_143022
```

## 🏗️ Server Requirements

- **OS**: Ubuntu 20.04/22.04 LTS
- **PHP**: 8.2 or higher
- **Web Server**: Nginx or Apache
- **Database**: SQLite/MySQL/PostgreSQL
- **Node.js**: 18.x or higher
- **Composer**: 2.x
- **Redis**: Optional for caching

## 🔧 Configuration Files

### Nginx Configuration

Located at `/etc/nginx/sites-available/statamic`:
- Handles Statamic routing
- PHP-FPM integration
- Security headers
- File upload limits

### PHP Configuration

Key settings in `/etc/php/8.2/fpm/php.ini`:
- `upload_max_filesize = 100M`
- `post_max_size = 100M`
- `memory_limit = 256M`
- `max_execution_time = 300`

## 🔐 Security

### SSL/TLS Setup

```bash
# Install SSL certificate with Let's Encrypt
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### File Permissions

```bash
# Correct permissions
sudo chown -R ubuntu:www-data /var/www/statamic
sudo chmod -R 775 /var/www/statamic/storage
sudo chmod -R 775 /var/www/statamic/bootstrap/cache
```

### Firewall Rules

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

## 📊 Monitoring

### Health Checks

Run health checks:

```bash
cd /var/www/statamic
./scripts/health-check.sh https://yourdomain.com
```

### Logs

Check logs for issues:

```bash
# Application logs
tail -f storage/logs/laravel.log

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# PHP-FPM logs
sudo tail -f /var/log/php8.2-fpm.log
```

## 🔄 Maintenance

### Update Dependencies

```bash
# Update Composer packages
composer update

# Update NPM packages
npm update

# Update Statamic
php please update:run
```

### Clear Caches

```bash
php artisan cache:clear
php artisan config:clear
php artisan view:clear
php please stache:clear
php please static:clear
```

### Database Backup

```bash
# SQLite
cp database/database.sqlite backups/db_$(date +%Y%m%d).sqlite

# MySQL
mysqldump -u root -p statamic > backups/db_$(date +%Y%m%d).sql
```

## 🚨 Troubleshooting

### Common Issues

1. **Permission Denied**
   ```bash
   sudo chown -R ubuntu:www-data /var/www/statamic
   sudo chmod -R 775 storage bootstrap/cache
   ```

2. **502 Bad Gateway**
   ```bash
   sudo systemctl restart php8.2-fpm
   sudo systemctl restart nginx
   ```

3. **Statamic License Issues**
   - Add your license key to `.env`: `STATAMIC_LICENSE_KEY=your-key`

4. **Memory Errors**
   - Increase PHP memory limit in `php.ini`
   - Consider upgrading server resources

### Debug Mode

Enable debug mode temporarily:

```bash
# In .env file
APP_DEBUG=true
APP_ENV=local

# Remember to disable in production!
```

## 📝 Deployment Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] Assets compiled for production
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Backup created
- [ ] SSL certificate installed
- [ ] Security headers configured
- [ ] Error logging configured
- [ ] Monitoring setup
- [ ] Documentation updated

## 🤝 Support

For issues or questions:
1. Check application logs
2. Review server logs
3. Run health checks
4. Check GitHub Actions logs
5. Review this documentation

## 📚 Additional Resources

- [Statamic Documentation](https://statamic.dev)
- [Laravel Documentation](https://laravel.com/docs)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)