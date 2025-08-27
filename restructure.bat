@echo off
echo Moving Next.js app to repository root...

REM Move to the project directory
cd /d "C:\Users\nikla\Documents\Finanztracker"

REM Copy all files from financeflow to root
xcopy financeflow\* . /E /H /Y
xcopy financeflow\*.* . /Y

REM Remove the financeflow directory
rmdir /s /q financeflow

REM Remove backup file if exists
del vercel.json.backup 2>nul

echo.
echo Files moved successfully!
echo.
echo Now run these commands to push to GitHub:
echo   git add -A
echo   git commit -m "Move Next.js app to repository root"
echo   git push
echo.
pause
