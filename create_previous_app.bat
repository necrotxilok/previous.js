@echo off
setlocal

if [%1]==[] (
	echo ERROR: You must enter the name of your new previous.js awesome app.
	echo USAGE: %0 "MyNewAwesomeApp"
	exit /b
)

if exist %1 (
	echo ERROR: Unable to create app. A folder with the same name exists.
	exit /b
)

node -v >nul 2>nul
if errorlevel 1 (
	echo ERROR: You must install Node JS to create a previous.js app.
	exit /b
)

set appname=%1
mkdir %appname%
cd %appname%

set version=1.0

echo Downloading version %version%...
powershell -command "Invoke-WebRequest -Uri https://github.com/necrotxilok/previous.js/archive/refs/tags/v%version%.zip -OutFile tmp.zip"
if errorlevel 1 (
	echo ERROR: Unable to connect to GitHub Repository to download current version.
	cd ..
	rmdir /S /Q %appname%
	exit /b
)

echo Extracting files...
powershell -command "Expand-Archive tmp.zip"
if errorlevel 1 (
	echo ERROR: Unable to extract previous.js files in your app.
	cd ..
	rmdir /S /Q %appname%
	exit /b
)
del tmp.zip >nul 2>nul

echo Setting up your project...
xcopy /E /Q tmp\previous.js-%version%\src\* .
rmdir /S /Q tmp

echo OK!

echo.
echo Now you can start your app by executing:
echo  cd %appname%
echo  start.bat
echo.
