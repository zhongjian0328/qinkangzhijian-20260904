@echo off
setlocal

rem ============================================================
rem  QinKangZhiJian - one-click local startup
rem  Starts: PostgreSQL -> AI service -> API service
rem ============================================================

rem Resolve project root (parent of this scripts\ directory)
cd /d "%~dp0"
cd ..
set "ROOT=%CD%"

set "PGBIN=D:\PostgreSQL\pgsql\bin"
set "PGDATA=D:\PostgreSQL\data"
set "PGLOG=D:\PostgreSQL\pg.log"

echo ============================================================
echo   QinKangZhiJian - local dev startup
echo   Project: %ROOT%
echo ============================================================
echo.

echo [1/3] PostgreSQL (port 5432) ...
"%PGBIN%\pg_ctl.exe" -D "%PGDATA%" status >nul 2>&1
if errorlevel 1 (
    "%PGBIN%\pg_ctl.exe" -D "%PGDATA%" -l "%PGLOG%" start
    if errorlevel 1 (
        echo   [FAILED] PostgreSQL failed to start. Check %PGLOG%
        exit /b 1
    )
    echo   [OK] PostgreSQL started.
) else (
    echo   [OK] PostgreSQL already running.
)

echo.
echo [2/3] AI service (port 5000) ...
start "QKZJ-AI" /d "%ROOT%\apps\ai" cmd /k "venv\Scripts\python.exe src\server.py"
echo   [OK] AI service launched in a new window.

echo.
echo [3/3] API service (port 3000) ...
start "QKZJ-API" /d "%ROOT%" cmd /k "pnpm api:dev"
echo   [OK] API service launched in a new window.

echo.
echo ============================================================
echo   All backend services started:
echo     PostgreSQL : localhost:5432
echo     API        : http://localhost:3000/api/docs
echo     AI         : http://localhost:5000
echo ============================================================
echo.
echo   Mobile app (optional) - run in another terminal:
echo     pnpm mobile:dev
echo.
pause
