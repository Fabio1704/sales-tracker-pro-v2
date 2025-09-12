import os
from celery import Celery

# Configuration Django pour Celery
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sales_tracker.settings')

app = Celery('sales_tracker')

# Configuration depuis settings.py
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-découverte des tâches dans les apps Django
app.autodiscover_tasks()

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
