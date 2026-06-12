@echo off
cd /d "%~dp0"

echo Starting Backend (Django)...
start "Backend Django" cmd /k "cd /d "%~dp0" && venv\Scripts\activate && python manage.py runserver"

echo Starting Frontend (Vite)...
start "Frontend Vite" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo Done! Backend and Frontend are starting...
pause
