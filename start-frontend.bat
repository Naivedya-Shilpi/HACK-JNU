@echo off
echo Starting MSME Compliance Navigator Frontend...
echo.

echo Installing dependencies...
call npm install

echo.
echo Starting frontend development server...
call npm run dev

pause
