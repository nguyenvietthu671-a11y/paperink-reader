@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Starting PaperInk E-Ink Reader Server...
start "" http://localhost:3000
node server.js
pause
