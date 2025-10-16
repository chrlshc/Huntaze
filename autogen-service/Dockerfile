FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

COPY app /app/app

EXPOSE 8000
CMD ["/bin/sh", "-lc", "if [ \"$ENABLE_OTEL\" = \"true\" ]; then opentelemetry-instrument uvicorn app.main:app --host 0.0.0.0 --port 8000; else uvicorn app.main:app --host 0.0.0.0 --port 8000; fi"]
