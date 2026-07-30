@echo off
echo ==========================================
echo INICIANDO ENTORNO: STAGING
echo ==========================================
set APP_ENV=staging
cd backend
uvicorn main:app --reload
