#!/bin/sh
set -e

# Settings come from environment variables only (no .env file in the image).
if [ -z "$APP_KEY" ]; then
    echo 'APP_KEY is not set. Generate one with: echo "base64:$(openssl rand -base64 32)"' >&2
    exit 1
fi

# Cache config and routes for speed. Runs at start because the values come from the runtime environment.
php artisan config:cache
php artisan route:cache
chown -R www-data:www-data storage bootstrap/cache

exec "$@"
