@echo off
echo ==========================================
echo INICIANDO ENTORNO: PRODUCTION
echo ==========================================
set APP_ENV=production
cd backend
uvicorn main:app
