# Use official Python base image
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install dependencies
RUN apt-get update && apt-get install -y \
    sqlite3 \
    vim \
    curl \
    unzip \
    git \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - && \
    apt-get install -y nodejs

WORKDIR /app

COPY requirements.txt /app

RUN pip install --no-cache-dir -r /app/requirements.txt

COPY frontend /app/frontend
COPY backend /app/backend
COPY env.source /app

RUN npm --prefix /app/frontend install
RUN npm --prefix /app/frontend run build
RUN mkdir -p /state
EXPOSE 4200

#CMD ["python", "/app/backend/app.py"]
CMD ["/bin/bash", "-c", "source /app/env.source && exec python /app/backend/app.py"]
#CMD ["/bin/bash", "--rcfile", "/app/code/env.source"]