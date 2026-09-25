FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    EMBEDDING_CACHE_DIR=/models

WORKDIR /app

# Production images get runtime packages only; docker-compose.yml (dev) passes requirements-dev.txt for pytest.
ARG REQUIREMENTS=requirements.txt
COPY requirements.txt requirements-dev.txt ./
RUN pip install --no-cache-dir -r ${REQUIREMENTS}

RUN useradd --system --create-home --uid 10001 app && mkdir -p /models && chown app /models
USER app

# Bake the embedding model (~130 MB) into the image so the server needs no Hugging Face access at runtime.
COPY --chown=app app/config.py app/config.py
RUN python -c "from fastembed import TextEmbedding; from app.config import settings; TextEmbedding(model_name=settings.embedding_model, cache_dir='/models')"

COPY --chown=app . .

EXPOSE 8001
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8001/health', timeout=4)"
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
