#!/bin/sh

echo
echo Previous.js Build!
echo --------------------------------------
echo

if [ -d "./build" ]; then
	echo "Cleaning last build..."
	rm -rf build
	echo "Done!"
	echo
fi

echo "Creating build directory..."
mkdir -p build/$1
echo "Done!"
echo

echo "Copying public files..."
cp -rvf public/* build/$1/
echo "Done!"
echo

node ./previous/build.js $1
echo
