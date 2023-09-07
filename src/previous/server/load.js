
require("../common/utils");

const fs = require("fs");
const path = require("path");

const read = require("./read");

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
	const filePath = path.join(process.cwd(), file);
	const script = fs.readFileSync(filePath, 'utf8');
	const object = eval('(function() {' + script + '})();');
	return object;
}

module.exports = load;
