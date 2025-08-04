# Dockerfile for React Frontend
FROM node:20-bullseye

# Set working directory
WORKDIR /app

# Solo instalar serve globalmente
RUN npm install -g serve

# Construir el frontend con las variables de entorno correctas
ARG BACKEND_URL=api-scoring-engine_scoring-api_1
ARG BACKEND_PORT=8080
ENV BACKEND_URL=$BACKEND_URL
ENV BACKEND_PORT=$BACKEND_PORT

# Reemplazar las variables en el bundle (si existe)
RUN if [ -f ./packages/spa-apiscoringviewer/dist/bundle.f29c9e9f708e62ca17b0.js ]; then \
    sed -i "s|http://localhost:8080|http://$BACKEND_URL:$BACKEND_PORT|g" ./packages/spa-apiscoringviewer/dist/bundle.f29c9e9f708e62ca17b0.js; \
  fi

# Copiar solo el build local generado
COPY packages/spa-apiscoringviewer/dist ./packages/spa-apiscoringviewer/dist
COPY packages/spa-apiscoringviewer/package.json ./packages/spa-apiscoringviewer/package.json
# Copiar el ZIP de ejemplo al dist para que el frontend pueda enviarlo al backend
COPY packages/spa-apiscoringviewer/admin-PizzaShackAPI-1.0.0.zip ./packages/spa-apiscoringviewer/dist/admin-PizzaShackAPI-1.0.0.zip

# Exponer el puerto
EXPOSE 3001

# Servir el build estático
CMD ["serve", "-s", "packages/spa-apiscoringviewer/dist", "-l", "3001"] 