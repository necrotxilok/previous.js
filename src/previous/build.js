const http = require("http");
const url = require("url");
const path = require("path");
const fs = require("fs");
const cp = require("child_process");

const prefix = process.argv[2] || '';
const buildPath = path.join(process.cwd(), 'build', prefix);
const website = 'http://localhost:8888';


// --------------------------------------------------------------------

function fixCSSRoutePrefix(currentPath = null) {
	if (!currentPath) {
		currentPath = buildPath;
	}
	if (!fs.existsSync(currentPath)) {
		return;
	}
	const list = fs.readdirSync(currentPath, {withFileTypes: true});
	for (const f of list) {
		const filePath = path.join(currentPath, f.name);
		if (f.isDirectory()) {
			fixCSSRoutePrefix(filePath);
		} else {
			if (path.extname(filePath).toLowerCase() === '.css') {
				let css = fs.readFileSync(filePath, 'utf8');
				css = css.replace(/url\("\//gi, "url(\"/" + prefix + "/");
				css = css.replace(/url\('\//gi, "url(\'/" + prefix + "/");
				fs.writeFileSync(filePath, css);
			}
		}
	}
}


// --------------------------------------------------------------------

const linksList = ["/", "/previous.js"];
const processed = {};

function getPage(url) {
	return new Promise((resolve, reject) => {
		http.get(url, (res) => {
			const { statusCode } = res;

			if (statusCode == 302) {
				const location = res.headers['location'];
				getPage(website + location).then((content) => {
					resolve(content);
				}).catch((error) => {
					reject(error.message);
				});
				res.resume();
				return;
			}

			const contentType = res.headers['content-type'];

			let error;
			if (statusCode !== 200) {
				error = new Error('Request Failed. Status Code: ' + statusCode);
			}
			if (error) {
				reject(error.message);
				res.resume();
				return;
			}

			res.setEncoding('utf8');
			let rawData = '';
			res.on('data', (chunk) => {
				rawData += chunk;
			});
			res.on('end', () => {
				resolve(rawData);
			});
		}).on('error', (e) => {
			reject(e.message);
		});
	});
}

function getWebPages() {
	const link = linksList.shift();
	let finish = true;
	getPage(website + link).then((content) => {
		processed[link] = true;
		let body = content;
		if (prefix) {
			body = body.replace(/href="\//gi, "href=\"/" + prefix + "/");
			body = body.replace(/href='\//gi, "href=\'/" + prefix + "/");
			body = body.replace(/src="\//gi, "src=\"/" + prefix + "/");
			body = body.replace(/src='\//gi, "src=\'/" + prefix + "/");
		}
		const dir = path.join(buildPath, link);
		if (path.extname(dir).length > 1) {
			fs.mkdirSync(path.dirname(dir), { recursive: true});
			fs.writeFileSync(dir, body);
		} else {
			fs.mkdirSync(dir, { recursive: true});
			fs.writeFileSync(path.join(dir, 'index.html'), body);
		}
		var matches = [...content.matchAll(/\<a.*?\>/gmi)];
		if (matches && matches.length) {
			matches.forEach((match) => {
				var linkTag = match[0];
				var matchUrl = linkTag.match(/href="(\/.*?)"/im);
				if (!matchUrl || matchUrl.length < 2) {
					return;
				}
				var url = matchUrl[1].split('#')[0].split('?')[0];
				if (!linksList.includes(url) && !processed[url]) {
					linksList.push(url);
				}
			});
		}
		finish = !linksList.length;
	}).catch((error) => {
		processed[link] = true;
		console.error(error);
		finish = !linksList.length;
	}).finally(() => {
		if (finish) {
			ws.kill();
			console.log('Completed!\n');
			
			console.log('\n--------------------------------------\n');
			console.log('Minifying Previous.js...');
			minifyPreviousJS();

			console.log('\n--------------------------------------\n');
			console.log('Build Finished!\n');
		} else {
			getWebPages();
		}
	});
}


// --------------------------------------------------------------------

function minifyPreviousJS() {
	const filePath = path.join(buildPath, 'previous.js');
	if (!fs.existsSync(filePath)) {
		return;
	}
	const script = fs.readFileSync(filePath, 'utf8');
	const scriptLines = script.split('\n');
	let minified = '';
	let prevLineIsClosing = false;
	scriptLines.forEach(function(line) {
		line = line.trim();
		if (!line) {
			return;
		}
		if (line.startsWith('//')) {
			return;
		}
		if (prefix && line.startsWith('previous.router.routes = ')) {
			line = line.replace(/"\//gi, "\"/" + prefix + "/");
			line = line.replace(/'\//gi, "\'/" + prefix + "/");
		}
		line = line.replace(/\s*([\!\<\>\=\(\)\{\}\[\]\,\;\+\-\*\/])\s*/gi, "$1");
		if (prevLineIsClosing && !line.startsWith('}')) {
			line = ';' + line;
		}
		if (line.endsWith('}')) {
			prevLineIsClosing = true;
		} else {
			prevLineIsClosing = false;
		}
		minified += line;
	});
	minified = '/* Previous.js */' + minified.replace(/\/\*.*?\*\//gi, "");
	fs.writeFileSync(filePath, minified);
}


// --------------------------------------------------------------------

if (prefix) {
	console.log('\n--------------------------------------\n');
	console.log('Fixing CSS route prefix...');
	fixCSSRoutePrefix();
}

console.log('\n--------------------------------------\n');
console.log('Generating web pages...');

const ws = cp.spawn('node', [path.join(process.cwd(), 'previous/index.js')]);

ws.stdout.on('data', (data) => {
	if (!data) {
		return;
	}
	outline = '' + data;
	if (outline.startsWith(' CTRL + C to shutdown')) {
		return;
	}
	if (outline.startsWith('Previous server running at http')) {
		getWebPages();
		return;
	}
	process.stdout.write(outline);
});

ws.stderr.on('data', (data) => {
	console.error(data);
});

