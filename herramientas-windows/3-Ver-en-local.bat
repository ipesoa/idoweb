@echo off
rem Ver la web en este ordenador antes de publicar
rem Toda la logica esta en _tareas.ps1 (tarea: ver)
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -STA -File "%~dp0_tareas.ps1" ver
if errorlevel 1 pause
