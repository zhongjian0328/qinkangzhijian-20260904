@echo off
setlocal

rem ============================================================
rem  QinKangZhiJian - stop local services
rem  Stops: API -> AI -> PostgreSQL
rem ============================================================

set "PGBIN=D:\PostgreSQL\pgsql\bin"
set "PGDATA=D:\PostgreSQL\data"

echo ============================================================
echo   QinKangZhiJian - stop local services
echo ============================================================
echo.

echo [1/3] Stopping API (window "QKZJ-API" + port 3000) ...
for /f %%p in ('powershell -NoProfile -Command "Get-Process | Where-Object { $_.MainWindowTitle -like '*QKZJ-API*' } | Select-Object -ExpandProperty Id"') do taskkill /T /F /PID %%p >nul 2>&1
for /f %%p in ('powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess"') do taskkill /T /F /PID %%p >nul 2>&1
echo   [OK] API stopped.

echo [2/3] Stopping AI (window "QKZJ-AI" + port 5000) ...
for /f %%p in ('powershell -NoProfile -Command "Get-Process | Where-Object { $_.MainWindowTitle -like '*QKZJ-AI*' } | Select-Object -ExpandProperty Id"') do taskkill /T /F /PID %%p >nul 2>&1
for /f %%p in ('powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess"') do taskkill /T /F /PID %%p >nul 2>&1
echo   [OK] AI stopped.

echo [3/3] Stopping PostgreSQL ...
"%PGBIN%\pg_ctl.exe" -D "%PGDATA%" stop
echo   [OK] PostgreSQL stopped.

echo.
echo   All local services stopped.
pause
