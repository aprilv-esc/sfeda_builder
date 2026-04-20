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

# Explicitly expose port 8000 for Railway
EXPOSE 8000

# Start the application on Port 8000 to match the Railway Public Networking setting
CMD uvicorn main:app --host 0.0.0.0 --port 8000
