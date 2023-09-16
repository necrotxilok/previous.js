const fs = require("fs");
const path = require("path");

const corePath = path.join(process.cwd(), 'previous');

const getCoreFilesByExtension = function(dir, ext) {
	const dirPath = path.join(corePath, dir);
	const list = fs.readdirSync(dirPath, {withFileTypes: true});
	return list.filter(function(f) {
		return f.isFile() && path.extname(f.name) === ext;
	}).map(function(f) {
		return path.join(dirPath, f.name);
	});
}

const getCoreFileContentsByExtension = function(dir, ext) {
	var content = "";
	const dirFiles = getCoreFilesByExtension(dir, ext);
	for (const filePath of dirFiles) {
		content += fs.readFileSync(filePath, 'utf8') + "\n";
	}
	return content;
}

const getCoreAppScripts = function(dir) {
	return getCoreFileContentsByExtension(dir, ".js");
}

const extendRouter = function(previous) {
	return `
(function() {
"use strict";
previous.router.routes = ${JSON.stringify(previous.pages)};
previous.router.validateRoute = ${previous.validateRoute.toString().replace('validateRoute', 'function')}
})();
`;
}

const getAllComponents = function(dirPath, target = 'window.previous.components') {
	if (!fs.existsSync(dirPath)) {
		return "";
	}
	const ext = '.js';
	let content = target + ' = ' + target + ' || {};\n';
	const list = fs.readdirSync(dirPath, {withFileTypes: true});
	for (const fd of list) {
		const filePath = path.join(dirPath, fd.name);
		if (fd.isFile() && path.extname(fd.name) === ext) {
			const viewName = fd.name.replace(ext, '');
			content += target + '.' + viewName + ' = (function() {\n"use strict";\n' + fs.readFileSync(filePath, 'utf8') + '\n})();\n';
		} else if (fd.isDirectory()) {
			content += getAllComponents(filePath, target + '.' + fd.name);
		}
	}
	return content;
}

const StandardRoutes = {
	'/previous.js': {
		type: "text/javascript",
		render: function(previous) {
			let content = "";
			content += getCoreAppScripts('vendor')
			content += getCoreAppScripts('common');
			content += getCoreAppScripts('client');
			content += extendRouter(previous);
			content += getAllComponents(path.join(process.cwd(), 'components'));
			return content;
		}
	}
}

module.exports = StandardRoutes;
