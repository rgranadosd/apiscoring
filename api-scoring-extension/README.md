# API Scoring IDE Extension

Esta extensión permite evaluar la calidad de APIs directamente desde tu IDE (VSCode/Cursor) utilizando el sistema de scoring de APICURIOS.

## 📋 Prerrequisitos

- **Node.js** (versión 16 o superior)
- **pnpm** (gestor de paquetes)
- **VSCode** o **Cursor** como IDE
- **Git** (para clonar el repositorio)

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd api-scoring-ide-plugins-fix-dependencies
```

### 2. Instalar dependencias

```bash
# Instalar dependencias del frontend
cd plugins/spa-apiscoringviewer
pnpm install

# Instalar dependencias del backend
cd ../../api-scoring-engine/packages/certification-service/code
npm install
```

### 3. Instalar la extensión en VSCode/Cursor

#### Instalación desde archivo VSIX
```bash
# Compilar la extensión
cd plugins/vscode-apiscoring/code
npm run compile

# Instalar la extensión
code --install-extension vscode-apiscoring-1.0.1.vsix
```

**Nota:** La extensión no está disponible en el marketplace de VSCode, por lo que debe instalarse desde el archivo VSIX compilado.

## 🔧 Configuración

### 1. Configurar las URLs de los servicios

Crear o editar el archivo `.vscode/settings.json` en tu workspace:

```json
{
    "apiScoring.certification.frontend.url": "http://localhost:3000/",
    "apiScoring.certification.service.url": "http://localhost:8080/apifirst/v1"
}
```

### 2. Verificar la configuración

- **Frontend URL**: `http://localhost:3000/` (servidor de desarrollo)
- **Backend URL**: `http://localhost:8080/apifirst/v1` (servicio de certificación)

## 🖥️ Servidores Requeridos

### Opción 1: Usar el script del ecosistema (Recomendado)

**Script que levanta todo el ecosistema:**
```bash
./start-ecosystem.sh
```

Este script:
- Inicia el backend API (puerto 8080)
- Inicia el frontend SPA (puerto 3000)
- Instala la extensión de VS Code automáticamente
- Verifica que todos los servicios estén funcionando

**Para detener todo el ecosistema:**
```bash
./stop-ecosystem.sh
```

### Opción 2: Levantar servicios manualmente

#### 1. Servidor de Desarrollo (Frontend)

**Puerto:** 3000  
**Comando:**
```bash
cd plugins/spa-apiscoringviewer/packages/spa-apiscoringviewer
pnpm exec parcel serve index.html --port 3000
```

**Verificación:**
```bash
curl http://localhost:3000
# Debería devolver HTML del frontend
```

#### 2. Servidor de Certificación (Backend)

**Puerto:** 8080  
**Comando:**
```bash
cd api-scoring-engine/packages/certification-service/code
node index.js
```

**Verificación:**
```bash
curl http://localhost:8080/health
# Debería devolver "Alive!"
```

## 📁 Estructura del Proyecto

Para que la extensión funcione correctamente, tu proyecto debe tener uno de estos archivos:

### Opción A: Archivo metadata.yml
```yaml
apis:
  - name: "Mi API"
    api-spec-type: "REST"
    definition-file: "openapi.yml"
```

### Opción B: Proyecto WSO2
- Carpeta `wso2_extracted/` con APIs de WSO2
- O archivo ZIP de WSO2 en la raíz

## 🎯 Uso

### 1. Abrir un proyecto con API

Asegúrate de que tu proyecto contenga:
- Un archivo `metadata.yml` en la raíz, O
- Una carpeta `wso2_extracted/` con APIs, O
- Un archivo ZIP de WSO2

### 2. Ejecutar la validación

1. Abrir la paleta de comandos (`Cmd+Shift+P` en Mac, `Ctrl+Shift+P` en Windows/Linux)
2. Buscar y ejecutar: **"APIScoring: Validate local APIs & Open APIScoring Application"**
3. La extensión abrirá una nueva pestaña con los resultados

### 3. Ver resultados

La extensión mostrará:
- **Score global** de la API
- **Análisis por categorías**: Diseño, Seguridad, Documentación
- **Problemas detectados** con detalles y ubicaciones
- **Gráfico radar** con las puntuaciones

## 🔍 Troubleshooting

### Problema: "No se encontró un proyecto API válido"
**Solución:**
- Verificar que existe un archivo `metadata.yml` en la raíz
- O que hay una carpeta `wso2_extracted/` con APIs
- O que hay un archivo ZIP de WSO2

### Problema: "Certification service URL is not configured"
**Solución:**
- Verificar que el backend está ejecutándose en el puerto 8080
- Comprobar la configuración en `.vscode/settings.json`

### Problema: El frontend no carga
**Solución:**
- Verificar que el servidor de desarrollo está ejecutándose en el puerto 3000
- Recargar la ventana de VSCode/Cursor (`Cmd+Shift+P` → "Developer: Reload Window")

### Problema: Los cambios no aparecen en el frontend
**Solución:**
- Asegurar que el servidor de desarrollo está corriendo con `parcel serve`
- Recargar la extensión o la ventana completa
- Limpiar caché del navegador si es necesario

## 📊 Comandos Útiles

### Verificar puertos en uso
```bash
# Verificar puerto 3000 (frontend)
lsof -i :3000

# Verificar puerto 8080 (backend)
lsof -i :8080
```

### Matar procesos si hay conflictos
```bash
# Matar todos los procesos de Parcel
pkill -f parcel

# Matar proceso específico por PID
kill <PID>
```

### Recompilar la extensión
```bash
cd plugins/vscode-apiscoring/code
npm run compile
```

## 🛠️ Desarrollo

### Estructura de archivos importantes
```
├── plugins/
│   ├── spa-apiscoringviewer/          # Frontend React
│   ├── vscode-apiscoring/             # Extensión VSCode
│   └── intellij-apiscoring/           # Extensión IntelliJ
├── api-scoring-engine/                 # Backend Node.js
└── .vscode/settings.json              # Configuración
```

### Scripts útiles
```bash
# Iniciar todo el ecosistema automáticamente (RECOMENDADO)
./start-ecosystem.sh

# Detener todo el ecosistema
./stop-ecosystem.sh

# Iniciar servidor de desarrollo manualmente
cd plugins/spa-apiscoringviewer/packages/spa-apiscoringviewer
pnpm exec parcel serve index.html --port 3000

# Iniciar backend manualmente
cd api-scoring-engine/packages/certification-service/code
node index.js

# Compilar extensión
cd plugins/vscode-apiscoring/code
npm run compile
```

## 📞 Soporte

Si encuentras problemas:
1. Verificar que ambos servidores están ejecutándose
2. Comprobar la configuración en `.vscode/settings.json`
3. Revisar los logs del backend para errores
4. Abrir las herramientas de desarrollador en VSCode/Cursor para ver errores de consola

## 📝 Notas

- La extensión requiere que tanto el frontend como el backend estén ejecutándose
- Los cambios en el código del frontend requieren recargar la extensión
- El backend procesa archivos ZIP y metadata.yml para evaluar las APIs
- Los resultados se muestran en tiempo real en la interfaz web
