@echo off
cd /d D:\vscodeprojects\campus
set "NODE_EXE=D:\application download\Node.js\node.exe"
if not exist "%NODE_EXE%" (
  echo Node.js not found: %NODE_EXE%
  pause
  exit /b 1
)
set PORT=3001
set HTTP_PROXY=
set HTTPS_PROXY=
"%NODE_EXE%" server.js
