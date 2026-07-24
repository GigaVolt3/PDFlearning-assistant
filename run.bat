@echo off
title Smart PDF Learning Assistant Launcher
echo ========================================================
echo 🎓 Starting Smart PDF Learning Assistant...
echo ========================================================
echo.

set "ROOT_DIR=%~dp0"

REM 1. Check & Install Server Dependencies
if not exist "%ROOT_DIR%server\node_modules\" (
    echo 📦 [1/3] Backend dependencies not found. Installing server packages...
    cd /d "%ROOT_DIR%server"
    call npm install
    if errorlevel 1 (
        echo ❌ Server npm install failed! Please check your internet connection or Node.js installation.
        pause
        exit /b 1
    )
    echo ✓ Backend dependencies installed successfully!
    echo.
) else (
    echo ✓ [1/3] Backend dependencies verified.
)

REM 2. Check & Install Client Dependencies
if not exist "%ROOT_DIR%client\node_modules\" (
    echo 📦 [2/3] Frontend dependencies not found. Installing client packages...
    cd /d "%ROOT_DIR%client"
    call npm install
    if errorlevel 1 (
        echo ❌ Client npm install failed! Please check your internet connection or Node.js installation.
        pause
        exit /b 1
    )
    echo ✓ Frontend dependencies installed successfully!
    echo.
) else (
    echo ✓ [2/3] Frontend dependencies verified.
)

REM 3. Check & Create server\.env if missing
if not exist "%ROOT_DIR%server\.env" (
    echo 🔑 Creating default server\.env configuration...
    if exist "%ROOT_DIR%server\.env.example" (
        copy "%ROOT_DIR%server\.env.example" "%ROOT_DIR%server\.env" >nul
    ) else (
        echo PORT=5000 > "%ROOT_DIR%server\.env"
        echo GROQ_API_KEY=your_groq_api_key_here >> "%ROOT_DIR%server\.env"
    )
    echo ✓ Created server\.env! (Add your free GROQ_API_KEY in server\.env if needed)
    echo.
) else (
    echo ✓ [3/3] Environment configuration verified.
)

echo.
echo ========================================================
echo 🚀 Launching Application Engines...
echo ========================================================
echo.

echo Starting Backend Express Server on http://localhost:5000 ...
start "Smart PDF Backend Server" cmd /k "cd /d "%ROOT_DIR%server" && npm run dev"

echo Starting Frontend React Vite App on http://localhost:3000 ...
start "Smart PDF Frontend Client" cmd /k "cd /d "%ROOT_DIR%client" && npm run dev"

echo.
echo ========================================================
echo 🎉 Smart PDF Learning Assistant is Running!
echo 📄 Backend API:  http://localhost:5000
echo 🌐 Frontend UI:   http://localhost:3000
echo ========================================================
echo.
pause
