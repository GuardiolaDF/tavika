@echo off
echo ==========================================
echo INICIANDO ENTORNO: DEVELOPMENT
echo ==========================================
set APP_ENV=development
cd backend

python -m uvicorn main:app --reload
