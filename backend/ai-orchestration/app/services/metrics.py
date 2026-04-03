"""Metrics tracking for AI orchestration jobs."""
import time
from collections import defaultdict
from threading import Lock
from app.config.settings import ENABLE_METRICS


class MetricsTracker:
    """Track job metrics: count, duration, errors."""

    def __init__(self):
        self._lock = Lock()
        self._jobs_total = defaultdict(int)
        self._jobs_success = defaultdict(int)
        self._jobs_error = defaultdict(int)
        self._durations = defaultdict(list)
        self._active_jobs = defaultdict(int)

    def job_started(self, company_id: str):
        if not ENABLE_METRICS:
            return
        with self._lock:
            self._jobs_total[company_id] += 1
            self._active_jobs[company_id] += 1
        print(f"[METRICS] Job started for {company_id} — total: {self._jobs_total[company_id]}")

    def job_completed(self, company_id: str, duration_seconds: float):
        if not ENABLE_METRICS:
            return
        with self._lock:
            self._jobs_success[company_id] += 1
            self._active_jobs[company_id] = max(0, self._active_jobs[company_id] - 1)
            self._durations[company_id].append(duration_seconds)
        print(f"[METRICS] Job completed for {company_id} in {duration_seconds:.2f}s")

    def job_failed(self, company_id: str, duration_seconds: float, error: str):
        if not ENABLE_METRICS:
            return
        with self._lock:
            self._jobs_error[company_id] += 1
            self._active_jobs[company_id] = max(0, self._active_jobs[company_id] - 1)
            self._durations[company_id].append(duration_seconds)
        print(f"[METRICS] Job failed for {company_id} in {duration_seconds:.2f}s — error: {error}")

    def get_metrics(self, company_id: str) -> dict:
        """Get metrics summary for a company."""
        with self._lock:
            total = self._jobs_total[company_id]
            success = self._jobs_success[company_id]
            errors = self._jobs_error[company_id]
            durations = self._durations[company_id]
            active = self._active_jobs[company_id]

        avg_duration = round(sum(durations) / len(durations), 2) if durations else 0
        error_rate = round((errors / total * 100), 1) if total > 0 else 0

        return {
            "total_jobs": total,
            "successful_jobs": success,
            "failed_jobs": errors,
            "active_jobs": active,
            "avg_duration_seconds": avg_duration,
            "error_rate_percent": error_rate,
        }

    def get_all_metrics(self) -> dict:
        """Get metrics for all companies."""
        all_companies = set(
            list(self._jobs_total.keys()) +
            list(self._jobs_success.keys()) +
            list(self._jobs_error.keys())
        )
        return {company: self.get_metrics(company) for company in all_companies}


# Global metrics instance
metrics = MetricsTracker()