@echo off
rem Subir los cambios a internet
rem Toda la logica esta en _tareas.ps1 (tarea: publicar)
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -STA -File "%~dp0_tareas.ps1" publicar
if errorlevel 1 pause
