@echo off
echo Starting Language Agnostic Visualization Web Application...

:check_command
where %1 >nul 2>&1
if %errorlevel% neq 0 (
    echo %1 is not installed.
    exit /b 1
)
exit /b 0

call :check_command python
if errorlevel 1 (
    echo Missing Python. Running setup...
    call setup.bat
    if errorlevel 1 (
        echo Setup failed. Please run setup.bat manually.
        exit /b 1
    )
    echo Setup completed. Please run this script again.
    exit /b 0
)

call :check_command node
if errorlevel 1 (
    echo Missing Node.js. Running setup...
    call setup.bat
    if errorlevel 1 (
        echo Setup failed. Please run setup.bat manually.
        exit /b 1
    )
    echo Setup completed. Please run this script again.
    exit /b 0
)

call :check_command Rscript
if errorlevel 1 (
    echo Missing R. Running setup...
    call setup.bat
    if errorlevel 1 (
        echo Setup failed. Please run setup.bat manually.
        exit /b 1
    )
    echo Setup completed. Please run this script again.
    exit /b 0
)

curl -s http://localhost:8000 >nul 2>&1
if errorlevel 1 (
    echo Backend server is not running. Starting it now...
    start cmd /k "cd backend && call venv\Scripts\activate.bat && uvicorn main:app --reload --port 8000"
    timeout /t 2 >nul
)

curl -s http://localhost:3000 >nul 2>&1
if errorlevel 1 (
    echo Frontend server is not running. Starting it now...
    start cmd /k "cd frontend && npm start"
)

echo Application is running!
echo Frontend: http://localhost:3000
echo Backend: http://localhost:8000

pause 