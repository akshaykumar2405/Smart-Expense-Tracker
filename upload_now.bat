@echo off
echo.
echo ========================================
echo   UPLOADING TO GITHUB
echo ========================================
echo.

set GIT="D:\Program Files\Git\bin\git.exe"

echo [1/5] Adding remote repository...
%GIT% remote add origin https://github.com/sujankakadiya/Smart-Expense-Tracker.git 2>nul

if %ERRORLEVEL% NEQ 0 (
    echo Remote already exists, updating URL...
    %GIT% remote set-url origin https://github.com/sujankakadiya/Smart-Expense-Tracker.git
)
echo Done!
echo.

echo [2/5] Ensuring branch is named 'main'...
%GIT% branch -M main
echo Done!
echo.

echo [3/5] Checking status...
%GIT% status
echo.

echo [4/5] Pushing to GitHub...
echo.
echo You will be prompted for credentials:
echo   Username: sujankakadiya
echo   Password: Use your Personal Access Token (NOT your GitHub password)
echo.
echo To create a token: GitHub → Settings → Developer settings → Personal access tokens
echo.

%GIT% push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   SUCCESS! 
    echo ========================================
    echo.
    echo Your project is now on GitHub!
    echo Visit: https://github.com/sujankakadiya/Smart-Expense-Tracker
    echo.
) else (
    echo.
    echo ========================================
    echo   PUSH FAILED
    echo ========================================
    echo.
    echo Possible reasons:
    echo   1. Repository doesn't exist on GitHub yet
    echo   2. Authentication failed (use Personal Access Token)
    echo   3. Network issue
    echo.
    echo Make sure you created the repository on GitHub first!
    echo.
)

echo [5/5] Done!
echo.
pause
