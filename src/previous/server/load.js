
const fs = require("fs");
const path = require("path");

function getJSON(data) {
	return {
		type: "application/json",
		data: JSON.stringify(data)
	};
}

function load(file) {
	file = path.join(file);
	if (!fs.existsSync(file)) {
		throw 'Unable to load file "' + file + '".';
	}
	last = file;
	const filePath = path.join(process.cwd(), file);
	const script = fs.readFileSync(filePath, 'utf8');
	try {
		const object = eval('(function() {' + script + '})();');
		return object;
	} catch (err) {
		throw 'An error was found when loading "' + file + '". ' + err;
	}
}

module.exports = load;
