"""Celery worker configuration."""

from celery import Celery

# Configuration - à adapter avec les variables d'environnement
redis_url = "redis://localhost:6379/0"

app = Celery(
    "lynara-campaign",
    broker=redis_url,
    backend=redis_url,
    include=["app.tasks"],
)

app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,
    worker_prefetch_multiplier=1,
)
