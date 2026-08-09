@echo off
setlocal

set "PORT=4173"

for /f %%a in ('powershell -NoProfile -Command "(Get-NetTCPConnection -LocalPort %PORT% -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess"') do set "SERVER_PID=%%a"

if not defined SERVER_PID (
  echo Inventory server is not running on port %PORT%.
  pause
  exit /b 0
)

echo Stopping inventory server on port %PORT% - PID %SERVER_PID%
taskkill /PID %SERVER_PID% /F

echo Done.
pause

endlocal
