@echo off
setlocal

node -v >nul 2>nul
if errorlevel 1 (
	echo ERROR: You must install Node JS to create a Previous.js app.
	exit /b
)

if [%1]==[] (
	echo ERROR: You must enter the name of your new Previous.js awesome app.
	echo USAGE: %0 MyApp
	exit /b
)

if exist %1 (
	echo ERROR: Unable to create app. A folder with the same name exists.
	exit /b
)

set appname=%1
mkdir %appname%
cd %appname%

set version=1.1

echo Downloading version %version%...
powershell -command "Invoke-WebRequest -Uri https://github.com/necrotxilok/previous.js/releases/download/v%version%/previous.js-release-v%version%.zip -OutFile tmp.zip" >nul 2>nul
if errorlevel 1 (
	echo ERROR: Unable to connect to GitHub repository to download current version.
	cd ..
	rmdir /S /Q %appname% >nul 2>nul
	exit /b
)

echo Extracting files...
powershell -command "Expand-Archive tmp.zip" >nul 2>nul
if errorlevel 1 (
	echo ERROR: Unable to extract main Previous.js files to create the new app.
	cd ..
	rmdir /S /Q %appname% >nul 2>nul
	exit /b
)
del tmp.zip >nul 2>nul

echo Setting up your project...
xcopy /E /Q tmp\src\* . >nul 2>nul
rmdir /S /Q tmp >nul 2>nul

echo OK!

echo.
echo Now you can start your new Previous.js App by running:
echo  cd %appname%
echo  start.bat
echo.
