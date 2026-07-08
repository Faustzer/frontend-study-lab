# Slim image sized for a ~1 GB free-tier instance
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY alembic.ini .
COPY alembic ./alembic
COPY app ./app

EXPOSE 8000

# Run migrations (with retries: the platform's private network / DB
# may come up a few seconds after the container), then serve with a
# single worker (free-tier memory).
# --proxy-headers: trust X-Forwarded-* from the platform's edge proxy.
CMD ["sh", "-c", "until alembic upgrade head; do echo 'migration failed, retrying in 3s...'; sleep 3; done && exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --proxy-headers --forwarded-allow-ips='*'"]
