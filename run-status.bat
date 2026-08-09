@echo off
setlocal EnableExtensions
chcp 65001 >nul

set "APP_DIR=%~dp0inventory_site"
set "PORT=4173"
set "LOCAL_URL=http://localhost:%PORT%"
set "LOG_FILE=%APP_DIR%\server.log"
set "ERROR_LOG_FILE=%APP_DIR%\server-error.log"

title STITCH Inventory - Server Console

if /i "%~1"=="--status-once" (
  call :load_status
  call :print_dashboard
  exit /b 0
)

:menu
call :load_status
cls
call :print_dashboard
echo.
echo  Actions
echo  ------------------------------------------------------------
echo   [1] Start server        [2] Stop server
echo   [3] Restart server      [4] Live monitor
echo   [5] Open browser        [6] Exit
echo.
choice /c 123456 /n /m "  Select action: "
if errorlevel 6 goto done
if errorlevel 5 goto open_browser
if errorlevel 4 goto live_status
if errorlevel 3 goto restart_server
if errorlevel 2 goto stop_server
if errorlevel 1 goto start_server
goto menu

:start_server
cls
call :print_title "START SERVER"
echo.
call :check_app
if errorlevel 1 goto wait_menu
call :check_node
if errorlevel 1 goto wait_menu
call :get_pid
if defined SERVER_PID (
  echo  Server is already running.
  echo  PID: %SERVER_PID%
  echo  URL: %LOCAL_URL%
  goto wait_menu
)

cd /d "%APP_DIR%"
echo  Starting Node server on port %PORT%...
start "STITCH Inventory Server" /min cmd /c "cd /d ""%APP_DIR%"" && node server.js >> ""%LOG_FILE%"" 2>> ""%ERROR_LOG_FILE%"""
timeout /t 2 /nobreak >nul
call :get_pid
if defined SERVER_PID (
  echo  Status: RUNNING
  echo  PID:    %SERVER_PID%
  echo  URL:    %LOCAL_URL%
  start "" "%LOCAL_URL%"
) else (
  echo  Status: FAILED
  echo.
  call :show_error_log
)
goto wait_menu

:stop_server
cls
call :print_title "STOP SERVER"
echo.
call :get_pid
if not defined SERVER_PID (
  echo  Server is not running on port %PORT%.
  goto wait_menu
)
echo  Stopping PID %SERVER_PID%...
taskkill /PID %SERVER_PID% /F
timeout /t 1 /nobreak >nul
call :get_pid
if defined SERVER_PID (
  echo  Status: STILL RUNNING
  echo  PID:    %SERVER_PID%
) else (
  echo  Status: STOPPED
)
goto wait_menu

:restart_server
cls
call :print_title "RESTART SERVER"
echo.
call :get_pid
if defined SERVER_PID (
  echo  Stopping PID %SERVER_PID%...
  taskkill /PID %SERVER_PID% /F
  timeout /t 1 /nobreak >nul
) else (
  echo  Server was not running.
)
echo.
call :check_app
if errorlevel 1 goto wait_menu
call :check_node
if errorlevel 1 goto wait_menu
cd /d "%APP_DIR%"
echo  Starting Node server on port %PORT%...
start "STITCH Inventory Server" /min cmd /c "cd /d ""%APP_DIR%"" && node server.js >> ""%LOG_FILE%"" 2>> ""%ERROR_LOG_FILE%"""
timeout /t 2 /nobreak >nul
call :get_pid
if defined SERVER_PID (
  echo  Status: RUNNING
  echo  PID:    %SERVER_PID%
  echo  URL:    %LOCAL_URL%
  start "" "%LOCAL_URL%"
) else (
  echo  Status: FAILED
  echo.
  call :show_error_log
)
goto wait_menu

:live_status
:live_loop
call :load_status
cls
call :print_dashboard
echo.
call :show_logs
echo.
echo  ------------------------------------------------------------
echo  Auto refresh: 2 sec     Q: back to menu
echo  ------------------------------------------------------------
choice /c QR /n /t 2 /d R /m "  Select: "
if errorlevel 2 goto live_loop
goto menu

:open_browser
start "" "%LOCAL_URL%"
goto menu

:wait_menu
echo.
pause
goto menu

:done
endlocal
exit /b 0

:print_title
echo ============================================================
echo  STITCH Inventory Server Console - %~1
echo ============================================================
exit /b 0

:print_dashboard
call :print_title "MANAGER"
echo.
echo  Service
echo  ------------------------------------------------------------
if defined SERVER_PID (
  echo  State       : RUNNING
  echo  Process ID  : %SERVER_PID%
) else (
  echo  State       : STOPPED
  echo  Process ID  : -
)
echo  Port        : %PORT%
echo  Node.js     : %NODE_STATUS%
echo  Updated     : %date% %time%
echo.
echo  Access URLs
echo  ------------------------------------------------------------
echo  This PC     : %LOCAL_URL%
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ips = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.PrefixOrigin -ne 'WellKnown' } | Sort-Object InterfaceAlias,IPAddress | Select-Object -ExpandProperty IPAddress; if ($ips) { '  Same network:'; foreach ($ip in $ips) { '     http://' + $ip + ':%PORT%' } } else { '  Same network: No active LAN IPv4 address found' }"
echo.
echo  Internet access
echo  ------------------------------------------------------------
echo  Router/firewall must forward TCP %PORT% to this PC.
echo  After port-forwarding, use: http://YOUR_PUBLIC_IP:%PORT%
echo  Public IP check: search "what is my ip" in a browser.
exit /b 0

:load_status
call :get_pid
call :get_node_status
exit /b 0

:check_app
if not exist "%APP_DIR%\server.js" (
  echo  ERROR: server.js was not found.
  echo  Path: "%APP_DIR%\server.js"
  exit /b 1
)
exit /b 0

:check_node
where node >nul 2>nul
if errorlevel 1 (
  echo  ERROR: Node.js is not installed or not in PATH.
  exit /b 1
)
for /f "delims=" %%v in ('node --version') do set "NODE_VERSION=%%v"
echo  Node.js: %NODE_VERSION%
exit /b 0

:get_node_status
set "NODE_STATUS=Not found"
where node >nul 2>nul
if not errorlevel 1 (
  for /f "delims=" %%v in ('node --version') do set "NODE_STATUS=%%v"
)
exit /b 0

:get_pid
set "SERVER_PID="
for /f %%a in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "(Get-NetTCPConnection -LocalPort %PORT% -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess"') do set "SERVER_PID=%%a"
exit /b 0

:show_logs
echo  Recent server log
echo  ------------------------------------------------------------
if exist "%LOG_FILE%" (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Content -LiteralPath '%LOG_FILE%' -Tail 8 -ErrorAction SilentlyContinue"
) else (
  echo  Waiting for server log...
)
echo.
call :show_error_log
exit /b 0

:show_error_log
echo  Recent error log
echo  ------------------------------------------------------------
if exist "%ERROR_LOG_FILE%" (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Content -LiteralPath '%ERROR_LOG_FILE%' -Tail 5 -ErrorAction SilentlyContinue"
) else (
  echo  No errors.
)
exit /b 0