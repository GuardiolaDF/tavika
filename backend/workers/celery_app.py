import os
from celery import Celery

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
    # Celery limits to prevent spam behavior accidentally triggering too fast
    task_default_rate_limit="50/m",
)
