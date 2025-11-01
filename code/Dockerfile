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

# Install Flask
RUN pip install --no-cache-dir Flask scikit-learn torch transformers einops huggingface_hub sentence-transformers

# Install Deno
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - && \
    apt-get install -y nodejs

# Repo
WORKDIR /app
# State
RUN mkdir -p /state

# Expose Flask default port
EXPOSE 4200

# Default command (interactive shell)
CMD ["/bin/bash", "--rcfile", "/app/code/env.source"]
