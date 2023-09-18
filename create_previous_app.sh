#!/bin/sh

node -v >/dev/null 2>/dev/null
if [ ! $? -eq 0 ]; then
	echo "ERROR: You must install Node JS to create a Previous.js app."
	exit 1
fi

if [ -z "$1" ]; then
	echo "ERROR: You must enter the name of your new Previous.js awesome app."
	echo USAGE: $0 MyApp
	exit 1
fi

if [ -d "$1" ]; then
	echo "ERROR: Unable to create app. A folder with the same name exists."
	exit 1
fi

appname=$1
mkdir $appname
cd $appname

version=1.1

echo "Downloading version $version..."
curl -kL https://github.com/necrotxilok/previous.js/releases/download/v$version/previous.js-release-v$version.zip -o tmp.zip >/dev/null 2>/dev/null
if [ ! $? -eq 0 ]; then
	echo "ERROR: Unable to connect to GitHub repository to download current version."
	cd ..
	rm -rf $appname >/dev/null 2>/dev/null
	exit 1
fi

echo "Extracting files..."
unzip tmp.zip >/dev/null 2>/dev/null
if [ ! $? -eq 0 ]; then
	echo "ERROR: Unable to extract main Previous.js files to create the new app."
	cd ..
	rm -rf $appname >/dev/null 2>/dev/null
	exit 1
fi
rm -f tmp.zip >/dev/null 2>/dev/null

echo "Setting up your project..."
mv -f src/* . >/dev/null 2>/dev/null
rm -rf src >/dev/null 2>/dev/null

echo "OK!"

echo
echo "Now you can start your new Previous.js App by running:"
echo " cd $appname"
echo " ./start.sh"
echo
