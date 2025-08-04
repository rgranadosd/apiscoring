# API Scoring Frontend - How to Run

This document explains how to run the API Scoring Frontend using different methods.

## Prerequisites

- **Node.js** (version 18 or higher)
- **pnpm** (version 8.15.9 or higher)
- **Docker** (optional, for containerized deployment)

## Method 1: Development Mode (Recommended for Development)

### Quick Start
```bash
cd plugins/spa-apiscoringviewer/packages/spa-apiscoringviewer
pnpm install
pnpm run watch
```

The frontend will be available at: **http://localhost:3000**

### Commands
- **Install dependencies:** `pnpm install`
- **Start development server:** `pnpm run watch`
- **Build for production:** `pnpm run build`
- **Clear cache:** `pnpm run clear`

## Method 2: Docker Container (Recommended for Production)

### Using Docker Compose (Recommended)

1. **Navigate to the frontend directory:**
   ```bash
   cd plugins/spa-apiscoringviewer
   ```

2. **Start the container:**
   ```bash
   ./start-simple.sh
   ```

3. **Access the frontend:**
   Open your browser and go to: **http://localhost:3000**

### Docker Commands

**Start the container:**
```bash
./start-simple.sh
```

**Stop the container:**
```bash
docker-compose -f docker-compose.simple.yml down
```

**View logs:**
```bash
docker-compose -f docker-compose.simple.yml logs -f
```

**Restart the container:**
```bash
docker-compose -f docker-compose.simple.yml restart
```

**Check container status:**
```bash
docker ps | grep api-scoring
```

## Method 3: Manual Docker Build

If you prefer to build manually:

```bash
cd plugins/spa-apiscoringviewer
docker build -f Dockerfile.simple -t api-scoring-frontend .
docker run -d -p 3000:3000 --name api-scoring-frontend api-scoring-frontend
```

## Project Structure

```
plugins/spa-apiscoringviewer/
├── packages/
│   ├── spa-apiscoringviewer/          # Main frontend application
│   │   ├── dist/                      # Built files (production)
│   │   ├── src/                       # Source code
│   │   ├── index.html                 # Entry point
│   │   └── package.json              # Dependencies
│   └── apiscoringviewer/             # Shared library
├── Dockerfile.simple                  # Docker configuration
├── docker-compose.simple.yml         # Docker Compose configuration
├── start-simple.sh                   # Quick start script
└── HowToRun.md                       # This file
```

## Available Scripts

### Development Scripts
- `pnpm run watch` - Start development server with hot reload
- `pnpm run build` - Build for production
- `pnpm run clear` - Clear cache and node_modules

### Docker Scripts
- `./start-simple.sh` - Start container with docker-compose
- `docker-compose -f docker-compose.simple.yml down` - Stop container
- `docker-compose -f docker-compose.simple.yml logs -f` - View logs

## Troubleshooting

### Port 3000 Already in Use
If you get an error that port 3000 is already in use:

```bash
# Kill any process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
pnpm run watch --port 3001
```

### Docker Container Issues
If the container fails to start:

```bash
# Check container logs
docker-compose -f docker-compose.simple.yml logs

# Rebuild the container
docker-compose -f docker-compose.simple.yml down
docker-compose -f docker-compose.simple.yml up -d --build
```

### Dependencies Issues
If you encounter dependency issues:

```bash
# Clear everything and reinstall
pnpm run clear
pnpm install
```

## Version Information

- **Current Version:** 1.0.1
- **Latest Build:** July 17, 2025 (10:20)
- **Framework:** React with TypeScript
- **Build Tool:** Parcel
- **Package Manager:** pnpm

## Features

- **API Scoring Visualization** - View and analyze API scores
- **Real-time Updates** - Live updates during development
- **Responsive Design** - Works on desktop and mobile
- **Docker Support** - Easy deployment with containers
- **Hot Reload** - Instant updates during development

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the logs using the provided commands
3. Ensure all prerequisites are installed correctly

---

**Note:** The frontend is designed to work with the API Scoring Extension backend. Make sure the backend services are running for full functionality. 