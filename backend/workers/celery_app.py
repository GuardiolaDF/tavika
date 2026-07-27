import os
from celery import Celery
from celery.schedules import crontab

# Redis is required as the message broker for Celery.
# Locally we will use a local redis instance, in production Railway will provide a REDIS_URL
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "docentespro_worker",
    broker=redis_url,
    backend=redis_url,
    include=["workers.email_worker"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Argentina/Buenos_Aires",
    enable_utc=True,
    task_default_rate_limit="50/m",
    beat_schedule={
        "daily_campaign_sender": {
            "task": "workers.email_worker.daily_campaign_scheduler",
            # Ejecutar todos los días a las 09:00 AM hora de Argentina
            "schedule": crontab(hour=9, minute=0),
        },
    }
)
