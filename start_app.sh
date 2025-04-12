#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

kill_port() {
    local port=$1
    if lsof -i :$port > /dev/null; then
        echo -e "${YELLOW}Port $port is in use. Attempting to free it...${NC}"
        lsof -i :$port | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

check_python_deps() {
    echo -e "${GREEN}Checking Python dependencies...${NC}"
    cd backend
    
    if [ ! -d "venv" ]; then
        echo -e "${YELLOW}Creating Python virtual environment...${NC}"
        python3 -m venv venv
    fi
    
    source venv/bin/activate
    
    if [ ! -f "requirements.txt" ]; then
        echo -e "${RED}requirements.txt not found!${NC}"
        exit 1
    fi
    
    # Install dependencies
    echo -e "${GREEN}Installing Python dependencies...${NC}"
    pip install -r requirements.txt
    
    cd ..
}

check_node_deps() {
    echo -e "${GREEN}Checking Node.js dependencies...${NC}"
    cd frontend
    
    if [ ! -f "package.json" ]; then
        echo -e "${RED}package.json not found!${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Installing Node.js dependencies...${NC}"
    npm install
    
    cd ..
}

check_r() {
    if ! command_exists Rscript; then
        echo -e "${YELLOW}R is not installed. Attempting to install...${NC}"
        
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew install r
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            sudo apt-get update
            sudo apt-get install -y r-base
        else
            echo -e "${RED}R installation not supported on this platform. Please install R manually.${NC}"
            exit 1
        fi
    fi
}

start_backend() {
    echo -e "${GREEN}Starting backend server...${NC}"
    cd backend
    
    kill_port 8000
    
    source venv/bin/activate

    uvicorn main:app --reload --port 8000 &
    
    sleep 3
    
    if ! curl -s http://localhost:8000 > /dev/null; then
        echo -e "${RED}Backend server failed to start!${NC}"
        exit 1
    fi
    
    cd ..
}

start_frontend() {
    echo -e "${GREEN}Starting frontend server...${NC}"
    cd frontend

    kill_port 3000
    
    npm start &
    
    sleep 3
    
    if ! curl -s http://localhost:3000 > /dev/null; then
        echo -e "${RED}Frontend server failed to start!${NC}"
        exit 1
    fi
    
    cd ..
}

main() {
    echo -e "${GREEN}Starting Language Agnostic Visualization Web Application...${NC}"
    
    check_r
    check_python_deps
    check_node_deps
    
    start_backend
    start_frontend
    
    echo -e "${GREEN}Application is running!${NC}"
    echo -e "${GREEN}Frontend: http://localhost:3000${NC}"
    echo -e "${GREEN}Backend: http://localhost:8000${NC}"
    
    wait
}

main 