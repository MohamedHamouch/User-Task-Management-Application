FROM php:8.3-fpm-alpine

# Install system dependencies and PHP extensions
RUN apk add --no-cache \
    curl \
    nginx \
    supervisor \
    mysql-client \
    && docker-php-ext-install pdo pdo_mysql

# Install Composer
COPY --from=composer:2.10 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy and install dependencies first (leverages Docker layer cache)
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --no-interaction

# Copy remaining application files
COPY . .

# Run composer post-install
RUN composer dump-autoload --optimize

# Configure Nginx
RUN printf 'server {\n\
    listen 8000;\n\
    root /var/www/html/public;\n\
    index index.php;\n\
    location / {\n\
        try_files $uri $uri/ /index.php?$query_string;\n\
    }\n\
    location ~ \.php$ {\n\
        fastcgi_pass 127.0.0.1:9000;\n\
        fastcgi_index index.php;\n\
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;\n\
        include fastcgi_params;\n\
    }\n\
}\n' > /etc/nginx/http.d/default.conf

# Configure Supervisor to run php-fpm and nginx together
RUN printf '[supervisord]\n\
nodaemon=true\n\
[program:php-fpm]\n\
command=/usr/local/sbin/php-fpm\n\
autostart=true\n\
autorestart=true\n\
[program:nginx]\n\
command=/usr/sbin/nginx -g "daemon off;"\n\
autostart=true\n\
autorestart=true\n' > /etc/supervisord.conf

# Storage and bootstrap cache must be writable
RUN mkdir -p /var/www/html/storage/framework/sessions \
             /var/www/html/storage/framework/views \
             /var/www/html/storage/framework/cache \
             /var/www/html/storage/logs \
             /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache \
    && chown -R www-data:www-data /var/www/html

EXPOSE 8000

CMD ["supervisord", "-c", "/etc/supervisord.conf"]
