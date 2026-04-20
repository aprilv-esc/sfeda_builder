FROM python:3.11

WORKDIR /app

# Install system dependencies required for PyMuPDF (fitz) pixmap rendering
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

# Explicitly expose port 8080 for Railway
EXPOSE 8080

# Start the application using shell form to expand $PORT
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}
