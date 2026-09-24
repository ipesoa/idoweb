@echo off
rem Meter fotos nuevas en un proyecto que ya existe
rem Toda la logica esta en _tareas.ps1 (tarea: fotos)
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -STA -File "%~dp0_tareas.ps1" fotos
if errorlevel 1 pause
