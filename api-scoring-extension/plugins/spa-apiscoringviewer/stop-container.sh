#!/bin/bash

# Script para parar el contenedor del frontend API Scoring

echo "Parando contenedor API Scoring Frontend..."

# Parar el contenedor
docker stop api-scoring-frontend

echo "Contenedor parado!"
echo ""
echo "Para iniciarlo de nuevo: ./start-container.sh" 