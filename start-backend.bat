@echo off
echo Starting MSME Compliance Navigator Backend...
echo.

cd backend

echo Installing dependencies...
call npm install

echo.
echo Starting backend server...
call npm run dev

pause
