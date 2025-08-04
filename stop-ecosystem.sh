#!/bin/bash

# API Scoring Extension - Complete Ecosystem Stop Script
# This script stops the backend, frontend, and provides cleanup commands with visual indicators

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

# Detect container engine
detect_container_engine() {
    if command -v podman > /dev/null 2>&1 && podman info > /dev/null 2>&1; then
        CONTAINER_ENGINE="podman"
        COMPOSE_CMD="podman-compose"
    elif command -v docker > /dev/null 2>&1 && docker info > /dev/null 2>&1; then
        CONTAINER_ENGINE="docker"
        COMPOSE_CMD="docker-compose"
    else
        print_error "Neither Podman nor Docker is available"
        exit 1
    fi
    
    print_info "Using $CONTAINER_ENGINE as container engine"
}

# Stop frontend container
stop_frontend() {
    print_step "Stopping Frontend Container..."
    
    if $CONTAINER_ENGINE ps --format "table {{.Names}}" | grep -q "api-scoring-frontend"; then
        # Store current directory
        CURRENT_DIR=$(pwd)
        
        cd plugins/spa-apiscoringviewer
        
        # Try to stop with compose files
        if [ -f "docker-compose.simple.yml" ]; then
            $COMPOSE_CMD -f docker-compose.simple.yml down
            print_success "Frontend container stopped with simple compose"
        elif [ -f "docker-compose.yml" ]; then
            $COMPOSE_CMD down
            print_success "Frontend container stopped with regular compose"
        else
            # Stop the specific container directly
            $CONTAINER_ENGINE stop api-scoring-frontend
            $CONTAINER_ENGINE rm api-scoring-frontend
            print_success "Frontend container stopped directly"
        fi
        
        # Return to original directory
        cd "$CURRENT_DIR"
    else
        print_warning "Frontend container not found"
    fi
}

# Stop backend container
stop_backend() {
    print_step "Stopping Backend Container..."
    
    if $CONTAINER_ENGINE ps --format "table {{.Names}}" | grep -q "scoring-api"; then
        # Store current directory
        CURRENT_DIR=$(pwd)
        
        # Try to stop with compose if it exists
        if [ -d "../api-scoring-engine" ]; then
            cd ../api-scoring-engine
            
            if [ -f "docker-compose.yml" ]; then
                $COMPOSE_CMD down
                print_success "Backend stopped with $COMPOSE_CMD"
            else
                # Stop the specific container
                $CONTAINER_ENGINE stop api-scoring-engine_scoring-api_1
                print_success "Backend container stopped"
            fi
            
            # Return to original directory
            cd "$CURRENT_DIR"
        else
            # Stop the specific container
            $CONTAINER_ENGINE stop api-scoring-engine_scoring-api_1
            print_success "Backend container stopped"
        fi
    else
        print_warning "Backend container not found"
    fi
}

# Kill processes on ports
kill_port_processes() {
    print_step "Killing processes on ports 3000 and 8080..."
    
    # Kill process on port 3000
    if lsof -ti:3000 > /dev/null 2>&1; then
        lsof -ti:3000 | xargs kill -9
        print_success "Process on port 3000 killed"
    fi
    
    # Kill process on port 8080
    if lsof -ti:8080 > /dev/null 2>&1; then
        lsof -ti:8080 | xargs kill -9
        print_success "Process on port 8080 killed"
    fi
}

# Show cleanup options
show_cleanup_options() {
    echo ""
    echo "=========================================="
    echo "Cleanup Options"
    echo "=========================================="
    
    print_info "To completely clean up, you can run:"
    echo ""
    echo "  Remove all containers:"
    echo "    $CONTAINER_ENGINE rm -f \$($CONTAINER_ENGINE ps -aq --filter 'name=api-scoring')"
    echo ""
    echo "  Remove all images:"
    echo "    $CONTAINER_ENGINE rmi \$($CONTAINER_ENGINE images --filter 'reference=*api-scoring*' -q)"
    echo ""
    echo "  Remove all volumes:"
    echo "    $CONTAINER_ENGINE volume prune -f"
    echo ""
    echo "  Remove VS Code extension:"
    echo "    code --uninstall-extension inditextech.apiscoring"
    echo ""
    print_warning "These commands will permanently delete containers and data!"
}

# Show final status
show_final_status() {
    echo ""
    echo "=========================================="
    echo "📊 Ecosystem Status"
    echo "=========================================="
    
    # Show remaining containers
    print_info "Remaining containers:"
    $CONTAINER_ENGINE ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(api-scoring|scoring-api)" || echo "No API Scoring containers found"
    
    # Check ports
    echo ""
    print_info "Port status:"
    if lsof -i:3000 > /dev/null 2>&1; then
        echo "  Port 3000: IN USE"
    else
        echo "  Port 3000: FREE"
    fi
    
    if lsof -i:8080 > /dev/null 2>&1; then
        echo "  Port 8080: IN USE"
    else
        echo "  Port 8080: FREE"
    fi
    
    echo ""
    print_success "Ecosystem stop completed!"
}

# Main execution
main() {
    echo "=========================================="
    echo "API Scoring Extension - Ecosystem Stop"
    echo "=========================================="
    echo "Stopping API Scoring Extension ecosystem..."
    echo ""
    
    # Detect container engine
    detect_container_engine
    
    # Find the correct directory
    find_correct_directory
    
    # Stop services
    stop_frontend
    stop_backend
    
    # Kill any remaining processes
    kill_port_processes
    
    # Show status
    show_final_status
    
    # Show cleanup options
    show_cleanup_options
}

# Run main function
main "$@"
