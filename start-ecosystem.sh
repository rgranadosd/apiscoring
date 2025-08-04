#!/bin/bash

# API Scoring Extension - Complete Ecosystem Startup Script
# This script starts the backend, frontend, and installs the VS Code extension with visual indicators

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ [SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️  [WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}❌ [ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ️  [INFO]${NC} $1"
}

# Function to find and navigate to the correct directory
find_correct_directory() {
    print_info "Current directory: $(pwd)"
    
    # Check if we're in the correct directory
    if [ -d "plugins/spa-apiscoringviewer" ] && [ -d "plugins/vscode-apiscoring" ]; then
        print_info "Already in correct directory: $(pwd)"
        return 0
    fi
    
    # Try to find the correct directory
    print_info "Looking for correct API Scoring Extension directory..."
    
    # Check if we're in a parent directory
    if [ -d "api-scoring-extension" ]; then
        print_info "Found api-scoring-extension directory, navigating..."
        cd "api-scoring-extension"
        if [ -d "plugins/spa-apiscoringviewer" ] && [ -d "plugins/vscode-apiscoring" ]; then
            print_success "Navigated to correct directory: $(pwd)"
            return 0
        fi
    fi
    
    # Check if we're in the Scoring backup directory
    if [ -d "../api-scoring-extension" ]; then
        print_info "Found api-scoring-extension directory in parent, navigating..."
        cd "../api-scoring-extension"
        if [ -d "plugins/spa-apiscoringviewer" ] && [ -d "plugins/vscode-apiscoring" ]; then
            print_success "Navigated to correct directory: $(pwd)"
            return 0
        fi
    fi
    
    # Check if we're in the wrong directory and need to go up
    if [ -d "plugins" ] && [ ! -d "plugins/spa-apiscoringviewer" ]; then
        print_warning "Found plugins directory but missing spa-apiscoringviewer, checking parent..."
        if [ -d "../api-scoring-extension" ]; then
            cd "../api-scoring-extension"
            if [ -d "plugins/spa-apiscoringviewer" ] && [ -d "plugins/vscode-apiscoring" ]; then
                print_success "Navigated to correct directory: $(pwd)"
                return 0
            fi
        fi
    fi
    
    print_error "Could not find correct API Scoring Extension directory"
    print_info "Please run this script from the api-scoring-extension directory"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."
    
    # Check Podman or Docker (prioritizing Podman)
    if command -v podman > /dev/null 2>&1 && podman info > /dev/null 2>&1; then
        print_success "Podman is running"
        CONTAINER_ENGINE="podman"
        COMPOSE_CMD="podman-compose"
    elif command -v docker > /dev/null 2>&1 && docker info > /dev/null 2>&1; then
        print_success "Docker is running"
        CONTAINER_ENGINE="docker"
        COMPOSE_CMD="docker-compose"
    else
        print_error "Neither Podman nor Docker is available"
        exit 1
    fi
    
    # Check VS Code CLI
    if ! command -v code > /dev/null 2>&1; then
        print_warning "VS Code CLI not found. Extension installation will be skipped."
        VSCODE_AVAILABLE=false
    else
        print_success "VS Code CLI found"
        VSCODE_AVAILABLE=true
    fi
    
    # Check ports availability
    if lsof -i:3000 > /dev/null 2>&1; then
        print_warning "Port 3000 is in use. Stopping existing process..."
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    
    if lsof -i:8080 > /dev/null 2>&1; then
        print_warning "Port 8080 is in use. Stopping existing process..."
        lsof -ti:8080 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    
    print_success "Ports 3000 and 8080 are available"
}

# Start backend
start_backend() {
    print_step "Starting Backend API (Port 8080)..."
    
    # Check if backend is already running
    if $CONTAINER_ENGINE ps --format "table {{.Names}}" | grep -q "scoring-api"; then
        print_success "Backend is already running on port 8080"
        return 0
    fi
    
    # Check if api-scoring-engine directory exists
    if [ -d "../api-scoring-engine" ]; then
        print_info "Found api-scoring-engine directory, starting backend..."
        
        # Store current directory
        CURRENT_DIR=$(pwd)
        
        cd ../api-scoring-engine
        
        if [ -f "docker-compose.yml" ]; then
            print_info "Starting backend with $COMPOSE_CMD..."
            
            # Try to start with compose
            if $COMPOSE_CMD up -d; then
                print_success "Backend started with $COMPOSE_CMD"
            else
                print_warning "Failed to start with $COMPOSE_CMD, trying rebuild script..."
                
                # Try the rebuild script if it exists
                if [ -f "rebuild-backend.sh" ]; then
                    print_info "Using rebuild-backend.sh script..."
                    chmod +x rebuild-backend.sh
                    ./rebuild-backend.sh
                    print_success "Backend started with rebuild script"
                else
                    print_error "Failed to start backend and no rebuild script found"
                    cd "$CURRENT_DIR"
                    return 1
                fi
            fi
        else
            print_warning "No docker-compose.yml found in api-scoring-engine directory"
            print_info "Backend container should be started manually"
            print_info "Expected backend URL: http://localhost:8080"
        fi
        
        # Return to original directory
        cd "$CURRENT_DIR"
    else
        print_warning "api-scoring-engine directory not found"
        print_info "Backend container should be started manually"
        print_info "Expected backend URL: http://localhost:8080"
    fi
}

# Start frontend
start_frontend() {
    print_step "Starting Frontend SPA (Port 3000)..."
    
    # Check if frontend is already running
    if $CONTAINER_ENGINE ps --format "table {{.Names}}" | grep -q "api-scoring-frontend"; then
        print_success "Frontend is already running on port 3000"
        return 0
    fi
    
    # Store current directory
    CURRENT_DIR=$(pwd)
    
    # Navigate to frontend directory and start
    if [ -d "plugins/spa-apiscoringviewer" ]; then
        cd plugins/spa-apiscoringviewer
        
        if [ -f "start-simple.sh" ]; then
            print_info "Starting frontend with Docker..."
            chmod +x start-simple.sh
            ./start-simple.sh
            print_success "Frontend started with Docker"
        elif [ -f "docker-compose.yml" ]; then
            print_info "Starting frontend with docker-compose..."
            docker-compose up -d
            print_success "Frontend started with docker-compose"
        else
            print_error "No frontend start script or docker-compose.yml found"
            cd "$CURRENT_DIR"
            exit 1
        fi
        
        # Return to original directory
        cd "$CURRENT_DIR"
    else
        print_error "Frontend directory not found"
        exit 1
    fi
}

# Install VS Code extension
install_vscode_extension() {
    print_step "Installing VS Code Extension..."
    
    if [ "$VSCODE_AVAILABLE" = false ]; then
        print_warning "VS Code CLI not available. Skipping extension installation."
        print_warning "To install manually, run: code --install-extension plugins/vscode-apiscoring/code/vscode-apiscoring-1.0.1.vsix"
        return 1
    fi
    
    # Find the latest .vsix file
    EXTENSION_FILE=""
    if [ -f "plugins/vscode-apiscoring/code/vscode-apiscoring-1.0.1.vsix" ]; then
        EXTENSION_FILE="plugins/vscode-apiscoring/code/vscode-apiscoring-1.0.1.vsix"
    elif [ -f "plugins/vscode-apiscoring/code/vscode-apiscoring-1.0.0.vsix" ]; then
        EXTENSION_FILE="plugins/vscode-apiscoring/code/vscode-apiscoring-1.0.0.vsix"
    fi
    
    if [ -n "$EXTENSION_FILE" ]; then
        print_info "Installing extension: $EXTENSION_FILE"
        code --install-extension "$EXTENSION_FILE"
        print_success "VS Code extension installed"
    else
        print_error "No .vsix extension file found"
        return 1
    fi
}

# Wait for services to be ready
wait_for_services() {
    print_step "Waiting for services to be ready..."
    
    # Wait for backend
    print_info "Waiting for backend on port 8080..."
    for i in {1..30}; do
        if curl -s http://localhost:8080 > /dev/null 2>&1; then
            print_success "Backend is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            print_warning "Backend not responding after 30 seconds"
        fi
        sleep 1
    done
    
    # Wait for frontend
    print_info "Waiting for frontend on port 3000..."
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            print_success "Frontend is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            print_warning "Frontend not responding after 30 seconds"
        fi
        sleep 1
    done
}

# Show final status
show_final_status() {
    echo ""
    echo "=========================================="
    echo "Ecosystem Status - All Systems Ready!"
    echo "=========================================="
    
    # Show running containers
    print_info "Running containers:"
    $CONTAINER_ENGINE ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(api-scoring|scoring-api)" || echo "No API Scoring containers found"
    
    echo ""
    print_success "Service URLs:"
    echo "  Backend API:  http://localhost:8080"
    echo "  Frontend:     http://localhost:3000"
    
    echo ""
    print_info "Useful commands:"
    echo "  View logs:    $COMPOSE_CMD logs -f"
    echo "  Stop all:     ./stop-ecosystem.sh"
    echo "  Restart:      ./start-ecosystem.sh"
    
    echo ""
    print_success "Ecosystem startup completed successfully!"
    echo "   All services are running and ready to use!"
}

# Main execution
main() {
    echo "=========================================="
    echo "API Scoring Extension - Ecosystem Startup"
    echo "=========================================="
    echo "Starting API Scoring Extension ecosystem..."
    echo ""
    
    # Find and navigate to the correct directory
    find_correct_directory

    # Check prerequisites
    check_prerequisites
    
    # Start services
    start_backend
    start_frontend
    
    # Install extension
    install_vscode_extension
    
    # Wait for services
    wait_for_services
    
    # Show final status
    show_final_status
}

# Run main function
main "$@"
