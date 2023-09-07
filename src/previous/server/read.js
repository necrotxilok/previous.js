
const fs = require("fs");
const path = require("path");

function read(file, props) {
	file = path.join(file);
	if (!fs.existsSync(file)) {
		throw 'Unable to load file "' + file + '".';
	}
	const filePath = path.join(process.cwd(), file);
	const content = fs.readFileSync(filePath, 'utf8');
	const string = eval('(function() { return `' + content + '`; })();');
	return string;
}

module.exports = read;