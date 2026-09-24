@echo off
rem Crear una peli o anuncio nuevo
rem Toda la logica esta en _tareas.ps1 (tarea: nuevo)
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -STA -File "%~dp0_tareas.ps1" nuevo
if errorlevel 1 pause
