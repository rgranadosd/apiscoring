#!/bin/bash

# Script para iniciar el contenedor simple usando nginx

echo "Iniciando contenedor API Scoring Frontend (version simple)..."

# Construir e iniciar el contenedor
docker-compose -f docker-compose.simple.yml up -d --build

echo "Contenedor iniciado!"
echo "Frontend disponible en: http://localhost:3000"
echo ""
echo "Comandos utiles:"
echo "  - Ver logs: docker-compose -f docker-compose.simple.yml logs -f"
echo "  - Parar: docker-compose -f docker-compose.simple.yml down"
echo "  - Reiniciar: docker-compose -f docker-compose.simple.yml restart" 