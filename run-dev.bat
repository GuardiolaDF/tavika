@echo off
echo ==========================================
echo INICIANDO ENTORNO: DEVELOPMENT
echo ==========================================
set APP_ENV=development
cd backend
uvicorn main:app --reload
