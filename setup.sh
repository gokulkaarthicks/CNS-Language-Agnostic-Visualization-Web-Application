#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Starting setup for Language Agnostic Visualization Web Application...${NC}"

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

install_python_deps() {
    echo -e "${GREEN}Setting up Python environment...${NC}"
    
    if ! command_exists python3; then
        echo -e "${RED}Python 3 is not installed. Please install Python 3 first.${NC}"
        exit 1
    fi

    cd backend
    python3 -m venv venv
    
    if [[ "$OSTYPE" == "darwin"* ]] || [[ "$OSTYPE" == "linux-gnu"* ]]; then
        source venv/bin/activate
    else
        source venv/Scripts/activate
    fi

    pip install -r requirements.txt
    cd ..
}

install_node_deps() {
    echo -e "${GREEN}Setting up Node.js environment...${NC}"
    
    if ! command_exists node; then
        echo -e "${RED}Node.js is not installed. Please install Node.js first.${NC}"
        exit 1
    fi

    cd frontend
    npm install
    cd ..
}

install_r() {
    echo -e "${GREEN}Checking R installation...${NC}"
    
    if ! command_exists Rscript; then
        echo -e "${GREEN}Installing R...${NC}"
        
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew install r
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            sudo apt-get update
            sudo apt-get install -y r-base
        else
            echo -e "${RED}Please install R manually from https://cran.r-project.org/bin/windows/base/${NC}"
            exit 1
        fi
    fi
}

start_application() {
    echo -e "${GREEN}Starting the application...${NC}"
    
    cd backend
    source venv/bin/activate
    uvicorn main:app --reload --port 8000 &
    cd ..
    
    cd frontend
    npm start
}

main() {
    install_r
    install_python_deps
    install_node_deps
    start_application
}

main 