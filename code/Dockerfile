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
    && rm -rf /var/lib/apt/lists/*

# Install Flask
RUN pip install --no-cache-dir Flask

# Install Deno
RUN curl -fsSL curl -fsSL https://deno.land/install.sh | sh && \
    mv /root/.deno/bin/deno /usr/local/bin/deno

# Set working directory
WORKDIR /app

# Expose Flask default port
EXPOSE 5000

# Default command (interactive shell)
CMD ["/bin/bash"]
