#!/bin/bash
# Script para manejar el frontend con docker-compose

set -e

case "${1:-start}" in
  start)
    echo "Iniciando frontend..."
    docker-compose up -d
    echo "Frontend iniciado en http://localhost:3000"
    echo "Para ver logs: docker-compose logs -f"
    ;;
  stop)
    echo "Deteniendo frontend..."
    docker-compose down
    echo "Frontend detenido"
    ;;
  restart)
    echo "Reiniciando frontend..."
    docker-compose restart
    echo "Frontend reiniciado"
    ;;
  logs)
    docker-compose logs -f
    ;;
  build)
    echo "Reconstruyendo frontend..."
    docker-compose build --no-cache
    docker-compose up -d
    echo "Frontend reconstruido y iniciado"
    ;;
  *)
    echo "Uso: $0 {start|stop|restart|logs|build}"
    echo "  start   - Iniciar el frontend"
    echo "  stop    - Detener el frontend"
    echo "  restart - Reiniciar el frontend"
    echo "  logs    - Ver logs del frontend"
    echo "  build   - Reconstruir e iniciar"
    exit 1
    ;;
esac 