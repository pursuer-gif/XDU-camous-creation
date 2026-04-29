@echo off
cd /d D:\vscodeprojects\campus\client
set "NODE_EXE=D:\application download\Node.js\node.exe"
if not exist "%NODE_EXE%" (
  echo Node.js not found: %NODE_EXE%
  pause
  exit /b 1
)
set PORT=5174
set API_TARGET=http://127.0.0.1:3001
"%NODE_EXE%" serve-dist.cjs
