# Scripts de Gestión de Servicios - API Scoring IDE Plugins

Este documento describe los scripts automatizados para gestionar todos los servicios del proyecto API Scoring IDE Plugins.

## Scripts Disponibles

### `start.sh` - Iniciar Todos los Servicios

Script inteligente que:
- ✅ Verifica si los puertos están ocupados antes de iniciar
- ✅ Pregunta si matar procesos existentes si los puertos están ocupados
- ✅ Instala dependencias automáticamente si no existen
- ✅ Compila el SPA antes de iniciar
- ✅ Inicia todos los servicios en el orden correcto
- ✅ Espera a que cada servicio esté disponible antes de continuar
- ✅ Genera logs separados para cada servicio
- ✅ Muestra un resumen completo al final

#### Uso:
```bash
./start.sh
```

#### Servicios que inicia:
- **Backend**: Puerto 8080 (API Certification Service)
- **Frontend**: Puerto 3000 (React App)
- **Servicio Base**: Puerto 2345 (Parcel Watch)

### `stop.sh` - Detener Todos los Servicios

Script que:
- ✅ Detiene todos los servicios de forma segura
- ✅ Usa archivos PID para identificar procesos
- ✅ Verifica puertos como respaldo
- ✅ Limpia archivos temporales
- ✅ Muestra confirmación de servicios detenidos

#### Uso:
```bash
./stop.sh
```

## Características de los Scripts

### 🔍 Verificación Inteligente de Puertos
- Detecta automáticamente si los puertos están ocupados
- Muestra qué proceso está usando cada puerto
- Permite matar procesos existentes de forma segura

### 🎨 Output con Colores
- **Azul**: Información general
- **Verde**: Éxito
- **Amarillo**: Advertencias
- **Rojo**: Errores

### 📊 Logs Separados
Los scripts crean archivos de log individuales:
- `backend.log` - Logs del backend
- `frontend.log` - Logs del frontend
- `base-service.log` - Logs del servicio base

### 🔄 Gestión de PIDs
- Guarda PIDs en archivos temporales
- Permite detener servicios específicos
- Limpia archivos PID automáticamente

## Flujo de Trabajo Típico

### 1. Iniciar Servicios
```bash
./start.sh
```

**Salida esperada:**
```
[INFO] Iniciando servicios de API Scoring IDE Plugins...
[INFO] Verificando estado de puertos...
[INFO] Puerto 8080 (Backend) está libre
[INFO] Puerto 3000 (Frontend) está libre
[INFO] Puerto 2345 (Servicio Base) está libre
[INFO] Iniciando servicios...
[INFO] Compilando SPA...
[SUCCESS] SPA compilado correctamente
[INFO] Iniciando backend en puerto 8080...
[SUCCESS] Backend está disponible en puerto 8080
[SUCCESS] Backend iniciado con PID 42248
[INFO] Iniciando servicio base en puerto 2345...
[SUCCESS] Servicio Base está disponible en puerto 2345
[SUCCESS] Servicio base iniciado con PID 42309
[INFO] Iniciando frontend en puerto 3000...
[SUCCESS] Frontend está disponible en puerto 3000
[SUCCESS] Frontend iniciado con PID 42348

[SUCCESS] Todos los servicios iniciados correctamente!

[INFO] Resumen de servicios:
  - Backend: http://localhost:8080
  - Frontend: http://localhost:3000
  - Servicio Base: http://localhost:2345

[INFO] PIDs de los servicios:
  - Backend: 42248
  - Servicio Base: 42309
  - Frontend: 42348

[INFO] Logs disponibles en:
  - Backend: backend.log
  - Frontend: frontend.log
  - Servicio Base: base-service.log

[INFO] Para detener todos los servicios, ejecuta: ./stop.sh
```

### 2. Detener Servicios
```bash
./stop.sh
```

**Salida esperada:**
```
[INFO] Deteniendo servicios de API Scoring IDE Plugins...
[INFO] Deteniendo servicios por archivos PID...
[INFO] Deteniendo Backend (PID: 42248)...
[SUCCESS] Backend detenido
[INFO] Deteniendo Frontend (PID: 42348)...
[SUCCESS] Frontend detenido
[INFO] Deteniendo Servicio Base (PID: 42309)...
[SUCCESS] Servicio Base detenido
[INFO] Limpiando archivos temporales...
[SUCCESS] Todos los servicios detenidos correctamente!

[INFO] Servicios detenidos:
  - Backend (puerto 8080)
  - Frontend (puerto 3000)
  - Servicio Base (puerto 2345)

[INFO] Para iniciar los servicios nuevamente, ejecuta: ./start.sh
```

## Casos de Uso

### 🚀 Primera Vez
```bash
# Los scripts instalarán dependencias automáticamente
./start.sh
```

### 🔄 Reiniciar Servicios
```bash
./stop.sh
./start.sh
```

### 🛠️ Desarrollo
```bash
# Iniciar servicios
./start.sh

# Hacer cambios en el código...

# Los servicios se recargan automáticamente
# (Parcel watch está activo)

# Detener al finalizar
./stop.sh
```

### 🔍 Debugging
```bash
# Ver logs en tiempo real
tail -f backend.log
tail -f frontend.log
tail -f base-service.log
```

## Puertos Utilizados

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| Backend | 8080 | API Certification Service |
| Frontend | 3000 | React Development Server |
| Servicio Base | 2345 | Parcel Watch |

## Troubleshooting

### Error: "Puerto ya está en uso"
```bash
# El script preguntará si matar el proceso
# Responde 'y' para continuar
```

### Error: "No se pudo matar el proceso"
```bash
# Usar kill manual
lsof -ti :PUERTO | xargs kill -9
```

### Error: "Dependencias no encontradas"
```bash
# Los scripts instalan automáticamente
# Si falla, ejecutar manualmente:
cd plugins/spa-apiscoringviewer/packages/spa-apiscoringviewer && npm install
cd ../api-scoring-engine/packages/certification-service/code && npm install
```

## Archivos Generados

### Archivos PID (temporales)
- `backend.pid` - PID del backend
- `frontend.pid` - PID del frontend  
- `base-service.pid` - PID del servicio base

### Archivos de Log
- `backend.log` - Logs del backend
- `frontend.log` - Logs del frontend
- `base-service.log` - Logs del servicio base

## Notas Importantes

1. **Ejecutar desde el directorio raíz**: Los scripts deben ejecutarse desde `/api-scoring-ide-plugins/`

2. **Permisos**: Los scripts tienen permisos de ejecución (`chmod +x`)

3. **Dependencias**: Los scripts instalan `node_modules` automáticamente si no existen

4. **Logs**: Los logs se guardan en archivos separados para facilitar el debugging

5. **Puertos**: Los scripts verifican y gestionan los puertos 8080, 3000 y 2345

## Comandos Útiles

```bash
# Verificar estado de puertos
lsof -i :8080
lsof -i :3000  
lsof -i :2345

# Ver logs en tiempo real
tail -f backend.log
tail -f frontend.log
tail -f base-service.log

# Ver procesos activos
ps aux | grep node

# Matar proceso específico
kill -9 PID
``` 