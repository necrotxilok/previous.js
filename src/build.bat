@echo off

echo.
echo Previous.js Build!
echo --------------------------------------
echo.

if exist build (
	echo Cleaning last build...
	rmdir /S /Q build
	echo Done!
	echo.
)

echo Creating build directory...
mkdir build\%1
echo Done!
echo.

echo Copying public files...
xcopy /S /Y public\* build\%1\
echo Done!
echo.

node .\previous\build.js %1
echo.
