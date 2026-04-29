@echo off
cd /d D:\vscodeprojects\campus
start "XDU CampusMind Backend" cmd /k "call D:\vscodeprojects\campus\start-backend.cmd"
start "XDU CampusMind Frontend" cmd /k "call D:\vscodeprojects\campus\start-frontend.cmd"
