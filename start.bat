@echo off
chcp 65001 >nul
set PYTHONIOENCODING=utf-8
echo ============================================================
echo   AI Career Coach - Starting...
echo ============================================================
echo.

cd /d "%~dp0"

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH.
    echo Please install Python 3.10+ from https://www.python.org/downloads/
    pause
    exit /b 1
)

:: Create virtual environment if not exists
if not exist "venv" (
    echo [1/3] Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment.
        echo Trying to install dependencies globally...
        pip install -r requirements.txt
        goto :start
    )
)

:: Activate venv and install dependencies
echo [1/3] Activating virtual environment...
call venv\Scripts\activate.bat

echo [2/3] Installing dependencies...
pip install -r requirements.txt --quiet

:start
:: Create .env.local if not exists
if not exist ".env.local" (
    echo [INFO] Creating .env.local from template...
    copy .env.example .env.local >nul
    echo [INFO] Edit .env.local to configure your AI provider.
    echo.
)

:: Create required directories
if not exist "data" mkdir data
if not exist "uploads" mkdir uploads

echo [3/3] Starting AI Career Coach...
echo.
echo ============================================================
echo   AI Career Coach is running!
echo   Local URL: http://localhost:3000
echo.
echo   Press Ctrl+C in this window to stop the server.
echo ============================================================
echo.

start http://localhost:3000
python app.py

pause
