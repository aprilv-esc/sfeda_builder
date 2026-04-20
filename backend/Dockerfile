FROM python:3.11-slim

WORKDIR /app

# Install system dependencies required for PyMuPDF and Pillow
RUN apt-get update && apt-get install -y \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY . .

# Start the application using shell form to expand $PORT
# We use 8080 as primary, but fallback to 80 if necessary for Railway ingress
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}
