@echo off
cd /d D:\vscodeprojects\campus\client
set "NODE_EXE=D:\application download\Node.js\node.exe"
if not exist "%NODE_EXE%" (
  echo Node.js not found: %NODE_EXE%
  pause
  exit /b 1
)
"%NODE_EXE%" serve-dist.cjs
