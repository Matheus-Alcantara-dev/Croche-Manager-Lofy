@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Instale o Node.js e execute este arquivo novamente.
  pause
  exit /b 1
)
node scripts\demo.mjs --open
if errorlevel 1 pause
