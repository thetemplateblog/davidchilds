export COMPOSER_ALLOW_SUPERUSER=1
composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev

rm -rf node_modules
npm install
npm run build

echo "🚀 Application deployed!"

php artisan cache:clear
php artisan config:cache
php artisan route:cache
php artisan statamic:stache:warm
php artisan statamic:search:update --all
php artisan statamic:static:clear
php artisan statamic:assets:generate-presets
#chown davidchilds:www-data -R /var/www/davidchilds.dev/html/
#find . -type d -exec chmod -R 775 {} \;
#find . -type f -exec chmod -R 664 {} \;
