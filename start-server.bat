@echo off
REM ========================================
REM PriceCompare-v2 Server Startup Script
REM For Windows Users
REM ========================================

echo.
echo ===================================
echo  ShopIQ - Price Comparison Server
echo ===================================
echo.

REM Try to find Node.js in common install locations
SET NODE_EXE=
SET NPM_CMD=

IF EXIST "C:\Program Files\nodejs\node.exe" (
    SET NODE_EXE=C:\Program Files\nodejs\node.exe
    SET NPM_CMD=C:\Program Files\nodejs\npm.cmd
    echo Found Node.js at: C:\Program Files\nodejs\
    GOTO :FOUND
)

IF EXIST "C:\Program Files (x86)\nodejs\node.exe" (
    SET NODE_EXE=C:\Program Files (x86)\nodejs\node.exe
    SET NPM_CMD=C:\Program Files (x86)\nodejs\npm.cmd
    echo Found Node.js at: C:\Program Files (x86)\nodejs\
    GOTO :FOUND
)

REM Try PATH as a last resort
WHERE node >nul 2>&1
IF NOT ERRORLEVEL 1 (
    SET NODE_EXE=node
    SET NPM_CMD=npm
    GOTO :FOUND
)

echo ERROR: Node.js was not found!
echo Please install Node.js from: https://nodejs.org/
echo.
pause
exit /b 1

:FOUND
REM Show Node.js version
"%NODE_EXE%" --version
echo.

REM Kill any old server using port 3000
echo Checking for existing server on port 3000...
FOR /F "tokens=5" %%a IN ('netstat -aon ^| find ":3000" ^| find "LISTENING"') DO (
    echo Stopping old server (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

REM Check if npm packages are installed
IF NOT EXIST node_modules (
    echo Installing dependencies...
    "%NPM_CMD%" install
    IF ERRORLEVEL 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo.
)

echo Starting server...
echo.
echo ========================================
echo  Server running on: http://localhost:3000
echo  Open this in your browser to use ShopIQ
echo ========================================
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the server using the full path to node
"%NODE_EXE%" server.js

pause
