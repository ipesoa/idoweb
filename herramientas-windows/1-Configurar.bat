@echo off
rem Solo la primera vez: usuario, repositorio y token de GitHub
rem Toda la logica esta en _tareas.ps1 (tarea: configurar)
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -STA -File "%~dp0_tareas.ps1" configurar
if errorlevel 1 pause
