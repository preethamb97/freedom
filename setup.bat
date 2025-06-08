@echo off
REM 🏴‍☠️ Freedom - Encrypted Data Storage Setup Script (Windows)
REM Inspired by Monkey D. Luffy's determination to sail the Grand Line!
REM "I don't want to conquer anything. I just think the guy with the most freedom in this whole ocean... is the Pirate King!"

echo 🏴‍☠️ Welcome to Freedom - Your Encrypted Data Treasure Vault! 🏴‍☠️
echo.
echo ⚡ Gear 5 - Setup Mode Activated! ⚡
echo 🌊 Setting sail to configure your digital ship... 🌊
echo.

REM Check if Docker is installed
echo [⚓] Checking if Docker is aboard your ship...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [❌] Docker not found! Please install Docker Desktop first:
    echo     🌊 Visit: https://docs.docker.com/desktop/windows/
    pause
    exit /b 1
) else (
    echo [✅] Docker found! Your ship is seaworthy!
)

REM Check if Docker Compose is installed
echo [⚓] Checking for Docker Compose navigation tools...
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    docker compose version >nul 2>&1
    if %errorlevel% neq 0 (
        echo [❌] Docker Compose not found! Please install Docker Compose:
        echo     🌊 Visit: https://docs.docker.com/compose/install/
        pause
        exit /b 1
    ) else (
        echo [✅] Docker Compose (V2) found! Modern navigation tools ready!
        set DOCKER_COMPOSE=docker compose
    )
) else (
    echo [✅] Docker Compose found! Ready to orchestrate your crew!
    set DOCKER_COMPOSE=docker-compose
)

REM Create environment files
echo [🏴‍☠️] Setting up your treasure maps (environment files)...

REM API Environment
if not exist "API\.env" (
    echo [⚓] Creating API environment file...
    if exist "API\env.example" (
        copy "API\env.example" "API\.env" >nul
        echo [✅] API .env created from example!
        echo [⚠️] IMPORTANT: Edit API\.env with your actual MongoDB URI and Google OAuth credentials!
    ) else (
        echo [❌] API\env.example not found!
    )
) else (
    echo [✅] API .env already exists!
)

REM WEBAPP Environment
if not exist "WEBAPP\.env" (
    echo [⚓] Creating WEBAPP environment file...
    (
        echo # 🌊 Freedom Frontend Configuration
        echo REACT_APP_API_URL=http://localhost:5000
        echo REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
        echo REACT_APP_FIREBASE_API_KEY=your_firebase_api_key_here
        echo REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id_here
    ) > "WEBAPP\.env"
    echo [✅] WEBAPP .env created!
    echo [⚠️] IMPORTANT: Edit WEBAPP\.env with your actual Google OAuth and Firebase credentials!
) else (
    echo [✅] WEBAPP .env already exists!
)

REM Build and start services
echo [🏴‍☠️] 🚢 Launching the Thousand Sunny (your services)!
echo [⚓] Building and starting Docker containers...

REM Stop any existing containers
echo [⚓] Stopping any existing containers...
%DOCKER_COMPOSE% down >nul 2>&1

REM Build and start with simplified configuration
echo [⚓] Building images...
%DOCKER_COMPOSE% build
if %errorlevel% neq 0 (
    echo [❌] Failed to build images!
    pause
    exit /b 1
) else (
    echo [✅] Images built successfully!
)

echo [⚓] Starting services...
%DOCKER_COMPOSE% up -d
if %errorlevel% neq 0 (
    echo [❌] Failed to start services!
    pause
    exit /b 1
) else (
    echo [✅] Services started successfully!
)

REM Check service health
echo [🏴‍☠️] 🔍 Checking if your crew is ready for adventure...
timeout /t 5 /nobreak >nul

echo [⚓] Checking API (Backend crew)...
curl -f http://localhost:5000/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo [⚠️] API might still be starting up...
) else (
    echo [✅] API is healthy and ready!
)

echo [⚓] Checking Frontend (Navigation crew)...
curl -f http://localhost:5001 >nul 2>&1
if %errorlevel% neq 0 (
    echo [⚠️] Frontend might still be starting up...
) else (
    echo [✅] Frontend is ready for adventure!
)

REM Display final information
echo.
echo 🏴‍☠️━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🏴‍☠️
echo.
echo [🏴‍☠️] ⚡ GEAR 5 - SETUP COMPLETE! Your Freedom ship is ready to sail! ⚡
echo.
echo [✅] 🌊 Frontend (Your treasure map): http://localhost:5001
echo [✅] ⚡ API (Your crew headquarters): http://localhost:5000
echo [✅] 🔍 Health Check: http://localhost:5000/api/health
echo.
echo [⚠️] 📋 Next Steps:
echo    1. Edit API\.env with your MongoDB Atlas URI
echo    2. Edit API\.env with your Google OAuth credentials
echo    3. Edit WEBAPP\.env with your frontend configuration
echo    4. Restart services: docker-compose restart
echo.
echo [🏴‍☠️] 🎯 Useful Commands:
echo    • View logs: docker-compose logs -f
echo    • Stop services: docker-compose down
echo    • Restart: docker-compose restart
echo    • Rebuild: docker-compose up -d --build
echo.
echo [🏴‍☠️] "The sea is vast and full of possibilities!"
echo [🏴‍☠️] Set sail with Freedom and protect your digital treasures! 🏴‍☠️
echo.
echo 🏴‍☠️━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🏴‍☠️

pause 