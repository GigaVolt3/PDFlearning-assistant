@echo off
title Smart PDF Learning Assistant
echo ========================================================
echo 🚀 Starting Smart PDF Learning Assistant...
echo ========================================================
echo.

echo Launching Backend Server on http://localhost:5000 ...
start "Smart PDF Backend Server" cmd /k "cd /d %~dp0server && npm run dev"

echo Launching Frontend Client on http://localhost:3000 ...
start "Smart PDF Frontend Client" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo ========================================================
echo 🎉 Both Server and Client are starting!
echo 📄 Backend API:  http://localhost:5000
echo 🌐 Frontend UI:   http://localhost:3000
echo ========================================================
echo.
pause
