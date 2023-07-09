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
node -e "const fs = require('fs'); const https = require('https'); const file = fs.createWriteStream('tmp.zip'); const request = url => { https.get(url, response => { var body = []; if (response.statusCode == 302) { body = []; request(response.headers.location); } else { var stream = response.pipe(file); stream.on('finish', () => { console.log(' Done!'); }); } }).on('error', () => { process.exit(1); }); }; request('https://github.com/necrotxilok/previous.js/archive/refs/tags/v%version%.zip');"
if errorlevel 1 (
	echo ERROR: Unable to connect to GitHub Repository to download current version.
	cd ..
	rmdir /S /Q %appname%
	exit /b
)

echo Extracting files...
powershell -command "Expand-Archive tmp.zip"
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
