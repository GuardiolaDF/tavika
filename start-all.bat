@echo off
echo ==========================================
echo INICIANDO TAVIKA (ENTORNO: DEVELOPMENT)
echo ==========================================

echo Iniciando Backend (Puerto 8000)...
start cmd /k "cd backend && set APP_ENV=development && python -m uvicorn main:app --reload"

echo Iniciando Frontend (Puerto 3000)...
start cmd /k "cd frontend && npm run dev"

echo.
echo ==========================================
echo ¡Listo! Se abrieron dos consolas nuevas.
echo El backend esta en http://localhost:8000
echo El frontend esta en http://localhost:3000
echo ==========================================
