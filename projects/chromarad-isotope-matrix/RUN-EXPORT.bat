@echo off
echo.
echo  ========================================
echo    Grainrad Bulk Three.js Export
echo  ========================================
echo.
echo  Make sure you have images in the input folder!
echo.
cd /d "%~dp0"
node bulk-export.js
echo.
pause
