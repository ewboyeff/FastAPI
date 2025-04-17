from celery import Celery

celery_app = Celery("tasks", broker="redis://localhost:6380/0")

@celery_app.task
def send_notification(message: str):
    print(f"Notification: {message}")