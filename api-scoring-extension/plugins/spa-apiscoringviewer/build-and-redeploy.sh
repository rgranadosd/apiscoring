#!/bin/bash
set -e

# 1. Limpiar y construir el frontend localmente
cd packages/spa-apiscoringviewer
rm -rf node_modules dist .parcel-cache
pnpm install
pnpm run build
cd ../..

# 2. Borrar la imagen anterior (si existe)
IMAGE_NAME=localhost/spa-apiscoringviewer_api-scoring-frontend:latest
if podman images | grep -q "spa-apiscoringviewer_api-scoring-frontend"; then
  podman rmi -f $IMAGE_NAME || true
fi

# 3. Construir la nueva imagen
podman build -t spa-apiscoringviewer_api-scoring-frontend .

# 4. Levantar el contenedor actualizado
podman rm -f api-scoring-frontend || true
podman run -d --name api-scoring-frontend -p 3000:3000 spa-apiscoringviewer_api-scoring-frontend

echo "Build y despliegue completados. El frontend está actualizado y sirviendo el build local." 