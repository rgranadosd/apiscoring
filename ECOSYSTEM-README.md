# API Scoring Extension - Complete Ecosystem

This document explains how to run the complete API Scoring Extension ecosystem, including the backend, frontend, and VS Code extension.

## Quick Start

### Start Everything
```bash
./start-ecosystem.sh
```

### Stop Everything
```bash
./stop-ecosystem.sh
```

## What the Scripts Do

### `start-ecosystem.sh`
This script performs the following actions:

1. **Checks Prerequisites**
   - Verifies Podman machine is running
   - Checks if VS Code CLI is available

2. **Starts Backend**
   - Looks for existing backend container (`api-scoring-engine_scoring-api_1`)
   - Starts backend if not running
   - Waits for backend to be ready on port 8080

3. **Starts Frontend**
   - Starts the frontend container using Podman
   - Waits for frontend to be ready on port 3001

4. **Installs VS Code Extension**
   - Installs the latest `.vsix` extension file
   - Skips if VS Code CLI is not available

5. **Shows Status**
   - Displays running containers
   - Shows service URLs
   - Provides useful commands

### `stop-ecosystem.sh`
This script performs the following actions:

1. **Stops Frontend**
   - Stops the frontend Podman container

2. **Stops Backend**
   - Stops the backend Podman container

3. **Kills Port Processes**
   - Kills any remaining processes on ports 3001 and 8080

4. **Shows Cleanup Options**
   - Provides commands for complete cleanup

## Service URLs

After running `start-ecosystem.sh`, you can access:

- **Backend API:** http://localhost:8080
- **Frontend:** http://localhost:3001

## Container Information

### Backend Container
- **Name:** `api-scoring-engine_scoring-api_1`
- **Port:** 8080
- **Purpose:** API Scoring backend services

### Frontend Container
- **Name:** `api-scoring-frontend`
- **Port:** 3001
- **Purpose:** React frontend application

## VS Code Extension

The script automatically installs the VS Code extension from:
- `plugins/vscode-apiscoring/code/vscode-apiscoring-1.0.1.vsix`

### Manual Installation
If the automatic installation fails, you can install manually:

```bash
code --install-extension plugins/vscode-apiscoring/code/vscode-apiscoring-1.0.1.vsix
```

### Manual Uninstallation
To remove the extension:

```bash
code --uninstall-extension inditextech.apiscoring
```

## Troubleshooting

### Port Already in Use
If you get port conflicts:

```bash
# Kill processes on specific ports
lsof -ti:3000 | xargs kill -9
lsof -ti:8080 | xargs kill -9
```

### Podman Issues
If containers fail to start:

```bash
# Check Podman machine status
podman machine list
podman machine start  # If not running

# Check running containers
podman ps

# View container logs
podman logs <container-name>
```

### VS Code Extension Issues
If the extension doesn't install:

```bash
# Check if VS Code CLI is available
which code

# Install VS Code CLI if needed
# (Instructions vary by platform)
```

## Useful Commands

### View Logs
```bash
# All containers
podman logs -f

# Specific container
podman logs api-scoring-frontend
podman logs api-scoring-engine_scoring-api_1
```

### Restart Services
```bash
# Restart everything
./stop-ecosystem.sh
./start-ecosystem.sh

# Restart specific container
podman restart api-scoring-frontend
podman restart api-scoring-engine_scoring-api_1
```

### Clean Up Everything
```bash
# Remove all containers
podman rm -f $(podman ps -aq --filter 'name=api-scoring')

# Remove all images
podman rmi $(podman images --filter 'reference=*api-scoring*' -q)

# Remove all volumes
podman volume prune -f
```

## Development Mode

For development, you can run services individually:

### Frontend Development
```bash
cd plugins/spa-apiscoringviewer/packages/spa-apiscoringviewer
pnpm run watch
```

### Backend Development
```bash
# Start backend manually (depends on your backend setup)
```

## File Structure

```
api-scoring-extension/
├── start-ecosystem.sh          # Start everything
├── stop-ecosystem.sh           # Stop everything
├── ECOSYSTEM-README.md         # This file
├── plugins/
│   ├── spa-apiscoringviewer/   # Frontend
│   │   ├── start-simple.sh     # Frontend start script
│   │   └── HowToRun.md         # Frontend documentation
│   └── vscode-apiscoring/      # VS Code extension
│       └── code/
│           └── *.vsix          # Extension files
└── (backend files)             # Backend configuration
```

## Prerequisites

- **Podman** - For container orchestration
- **VS Code** - For extension installation (optional)
- **curl** - For health checks (usually pre-installed)

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review container logs using the provided commands
3. Ensure all prerequisites are installed
4. Try restarting the ecosystem with the stop/start scripts

---

**Note:** The ecosystem is designed to work together. Make sure all services are running for full functionality. 