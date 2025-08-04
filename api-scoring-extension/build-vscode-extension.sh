#!/bin/bash
# Script para compilar y empaquetar la extensión de VS Code API Scoring
# Ejecuta este script desde la carpeta api-scoring-extension

set -e

EXT_PATH="plugins/vscode-apiscoring/code"
PKG_JSON="$EXT_PATH/package.json"

if [ ! -d "$EXT_PATH" ]; then
  echo "No se encontró la ruta de la extensión: $EXT_PATH"
  exit 1
fi

if [ ! -f "$PKG_JSON" ]; then
  echo "No se encontró package.json en $EXT_PATH"
  exit 1
fi

# Incrementar el fix de la versión
CURR_VERSION=$(jq -r .version "$PKG_JSON")
IFS='.' read -r MAJOR MINOR FIX <<< "$CURR_VERSION"
NEW_FIX=$((FIX+1))
NEW_VERSION="$MAJOR.$MINOR.$NEW_FIX"

jq ".version = \"$NEW_VERSION\"" "$PKG_JSON" > "$PKG_JSON.tmp" && mv "$PKG_JSON.tmp" "$PKG_JSON"
echo "Versión incrementada: $CURR_VERSION -> $NEW_VERSION"

cd "$EXT_PATH"
echo "Instalando dependencias en $EXT_PATH..."
npm install
echo "Compilando extensión en $EXT_PATH..."
npm run build

echo "Empaquetando extensión VS Code (.vsix)..."
if ! command -v vsce &> /dev/null; then
  echo "vsce no está instalado. Instalando vsce globalmente..."
  npm install -g vsce
fi
vsce package
echo "Empaquetado completado. Archivo .vsix generado en $EXT_PATH." 