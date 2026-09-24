@echo off
rem Bajar cambios hechos desde otro ordenador
rem Toda la logica esta en _tareas.ps1 (tarea: traer)
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -STA -File "%~dp0_tareas.ps1" traer
if errorlevel 1 pause
