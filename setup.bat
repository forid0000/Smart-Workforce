@echo off
REM Smart Workforce – Windows quick setup script
REM Make sure PostgreSQL is running and you have created the smart_workforce database.

echo === Installing backend dependencies ===
cd backend
call npm install
if errorlevel 1 goto :err

echo.
echo === Generating Prisma client ===
call npx prisma generate
if errorlevel 1 goto :err

echo.
echo === Running migration ===
call npx prisma migrate dev --name init
if errorlevel 1 goto :err

echo.
echo === Seeding database ===
call npm run prisma:seed
if errorlevel 1 goto :err

cd ..

echo.
echo === Installing frontend dependencies ===
cd frontend
call npm install
if errorlevel 1 goto :err

echo.
echo === Setup complete! ===
echo Backend: cd backend && npm run dev
echo Frontend: cd frontend && npm run dev
goto :eof

:err
echo Setup failed.
exit /b 1