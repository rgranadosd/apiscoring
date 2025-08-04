#!/bin/bash

# Script para construir y ejecutar el contenedor del frontend API Scoring

echo "Construyendo contenedor Docker para API Scoring Frontend..."

# Construir la imagen
docker build -t api-scoring-frontend .

echo "Iniciando contenedor en puerto 3000..."

# Ejecutar el contenedor
docker run -d \
  --name api-scoring-frontend \
  -p 3000:3000 \
  --rm \
  api-scoring-frontend

echo "Contenedor iniciado!"
echo "Frontend disponible en: http://localhost:3000"
echo ""
echo "Comandos utiles:"
echo "  - Ver logs: docker logs api-scoring-frontend"
echo "  - Parar contenedor: docker stop api-scoring-frontend"
echo "  - Reiniciar: docker restart api-scoring-frontend" 