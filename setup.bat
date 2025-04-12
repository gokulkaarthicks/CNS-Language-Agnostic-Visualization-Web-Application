@echo off
echo Starting setup for Language Agnostic Visualization Web Application...

python --version >nul 2>&1
if errorlevel 1 (
    echo Python is not installed. Please install Python 3 first.
    exit /b 1
)

node --version >nul 2>&1
if errorlevel 1 (
    echo Node.js is not installed. Please install Node.js first.
    exit /b 1
)

Rscript --version >nul 2>&1
if errorlevel 1 (
    echo R is not installed. Please install R from https://cran.r-project.org/bin/windows/base/
    exit /b 1
)

echo Setting up Python environment...
cd backend
python -m venv venv
call venv\Scripts\activate.bat
pip install -r requirements.txt
cd ..

echo Setting up Node.js environment...
cd frontend
call npm install
cd ..

echo Starting the application...

start cmd /k "cd backend && call venv\Scripts\activate.bat && uvicorn main:app --reload --port 8000"

cd frontend
call npm start 