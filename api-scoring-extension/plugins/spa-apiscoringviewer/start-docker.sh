#!/bin/bash

# Script para iniciar el contenedor usando docker-compose

echo "Iniciando contenedor API Scoring Frontend con docker-compose..."

# Construir e iniciar el contenedor
docker-compose up -d --build

echo "Contenedor iniciado!"
echo "Frontend disponible en: http://localhost:3000"
echo ""
echo "Comandos utiles:"
echo "  - Ver logs: docker-compose logs -f"
echo "  - Parar: docker-compose down"
echo "  - Reiniciar: docker-compose restart" 