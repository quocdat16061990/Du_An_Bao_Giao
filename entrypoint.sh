#!/bin/bash
set -e

if [ -d /app/media_seed ]; then
  echo "==> Seeding media files..."
  mkdir -p /app/media
  cp -an /app/media_seed/. /app/media/ 2>/dev/null || true
fi

echo "==> Running migrations..."
python manage.py migrate --noinput

echo "==> Collecting static files..."
python manage.py collectstatic --noinput

echo "==> Starting Gunicorn..."
exec gunicorn backend.wsgi:application -b 0.0.0.0:8000 -w 4
