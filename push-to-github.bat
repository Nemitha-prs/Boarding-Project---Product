@echo off
echo ========================================
echo GitHub Push Setup
echo ========================================
echo.
echo Your project is ready to push!
echo.
echo Please provide your GitHub repository URL.
echo Example: https://github.com/username/repository-name.git
echo.
set /p REPO_URL="Enter your GitHub repository URL: "
echo.
echo Setting up remote...
git remote add origin %REPO_URL%
echo.
echo Pushing to GitHub...
git push -u origin main
echo.
echo Done! Check your GitHub repository.
pause

