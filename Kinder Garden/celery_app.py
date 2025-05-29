from celery import Celery
from kombu import Exchange, Queue
from datetime import timedelta

celery_app = Celery(
    'tasks',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/0',
    broker_connection_retry=True,
    broker_connection_retry_on_startup=True,
    broker_connection_max_retries=10
)

# Celery Configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    enable_utc=True,
    
    # Queue settings
    task_queues=(
        Queue('default', Exchange('default'), routing_key='default'),
    ),
    task_default_queue='default',
    task_default_exchange='default',
    task_default_routing_key='default',
    
    # Worker settings
    worker_concurrency=1,  # Single worker for Windows
    worker_pool_restarts=True,
    worker_cancel_long_running_tasks_on_connection_loss=True,
    
    # Connection settings
    broker_connection_timeout=30,
    broker_connection_retry_on_startup=True,
    broker_connection_max_retries=None,
    broker_heartbeat=10,
    
    # Result settings
    result_expires=3600,
    task_track_started=True,
    task_time_limit=300,
    task_soft_time_limit=240,
    
    # Beat settings (for scheduled tasks)
    beat_schedule={
        'check-ingredients-every-hour': {
            'task': 'tasks.check_ingredients_quantity',
            'schedule': timedelta(hours=1),
        }
    }
)