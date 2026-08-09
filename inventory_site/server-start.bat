@echo off
setlocal

cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed or not in PATH.
  pause
  exit /b 1
)

for /f %%a in ('powershell -NoProfile -Command "(Get-NetTCPConnection -LocalPort 4173 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess"') do set "RUNNING_PID=%%a"

if defined RUNNING_PID (
  echo Inventory server is already running.
  echo URL: http://localhost:4173
  echo PID: %RUNNING_PID%
  pause
  exit /b 0
)

echo Starting inventory server...
echo URL: http://localhost:4173
start "inventory-site" cmd /k "cd /d ""%~dp0"" && node server.js"

endlocal
