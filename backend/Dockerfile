# Usar imagen oficial de Python ligera
FROM python:3.11-slim

# Evitar que Python escriba archivos .pyc en el disco y habilitar logs instantáneos
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Instalar dependencias del sistema necesarias para compilar paquetes
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Configurar el directorio de trabajo
WORKDIR /app

# Copiar el archivo de requerimientos e instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código fuente
COPY . .

# Exponer el puerto por el que escuchará FastAPI
EXPOSE 8080

# Cloud Run inyecta el puerto en la variable de entorno $PORT (por defecto 8080)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
