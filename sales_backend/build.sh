#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input

# Create migrations and migrate
python manage.py makemigrations accounts
python manage.py migrate

echo "✅ Build completed successfully with migrations"
