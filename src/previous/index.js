const http = require("http");
const url = require("url");
const path = require("path");
const fs = require("fs");
const qs = require('querystring');
const Previous = require("./server/previous");

const port = process.argv[2] || 8888;

const contentTypesByExtension = {
	'.html': "text/html",
	'.css':  "text/css",
	'.js':   "text/javascript",
};

const server = http.createServer(function(request, response) {
	const start = new Date();

	const logAccess = function(url, method, statusCode) {
		const time = Date.now() - start.getTime();
		const fullDate = start.getFullDateString();
		const ms = ("" + start.getMilliseconds()).padStart(3, '0');
		console.log('[' + method + ' ' + statusCode + '] ' + fullDate + '.' + ms + ': ' + url + ' (' + time + 'ms)');
	}
	
	let body = '';
	request.on('data', function (data) {
		body += data;
		// 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
		if (body.length > 1e6) { 
			// FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
			request.connection.destroy();
		}
	});
	request.on('end', function () {

		// Get Request URL Path
		const uri = url.parse(request.url).pathname;

		// Process POST Data
		const method = request.method;
		const data = { ...url.parse(request.url, true).query, ...qs.parse(body)};

		// Define Response Methods 

		const send = function(statusCode, contentType, content) {
			logAccess(request.url, method, statusCode);
			const headers = {};
			if (contentType) {
				headers["Content-Type"] = contentType;
			}
			response.writeHead(statusCode, headers);
			response.write(content);
			response.end();
		}

		const redirect = function(statusCode, url) {
			logAccess(request.url, method, statusCode);
			const headers = {
				Location: url
			};
			response.writeHead(statusCode, headers);
			response.end();
		}

		const sendNotFound = function() {
			// Get Previous Content
			const previous = new Previous(method, data);
			previous.render('/404', function(content) {
				if (!content) {
					send(404, "text/plain", "404 Not Found\n");
					return;
				}
				if (content.error) {
					sendError(content.error, content.file);
					return;
				}					
				send(404, content.type, content.body || '');
			});
		}

		const sendError = function(error, file) {
			data.error = error;
			if (file) {
				data.file = file;
				inFile = ' in ' + file;
			}
			// Get Previous Content
			const previous = new Previous(method, data);
			previous.render('/500', function(content) {
				if (!content) {
					send(500, "text/plain", error + inFile + "\n");
					return;
				}
				if (content.error) {
					send(500, "text/plain", content.error + inFile + "\n");
					return;
				}					
				send(500, content.type, content.body || '');
			});
		}

		// Check Public File Exists
		const filename = path.join(process.cwd(), 'public', uri);
		if (uri == '/' || !fs.existsSync(filename)) {
			// Get Previous Content
			const previous = new Previous(method, data);
			if (uri == '/404' || uri == '/500') {
				// Not Found
				sendNotFound();
				return;
			}
			previous.render(uri, function(content) {
				if (!content) {
					// Not Found
					sendNotFound();
					return;
				}
				if (content.error) {
					sendError(content.error, content.file);
					return;
				}
				if (content.redirect) {
					redirect(content.statusCode || 302, content.redirect);
					return;
				}
				send(200, content.type, content.body || '');
			});
			return;
		}

		// Get File Content
		fs.readFile(filename, function(error, content) {
			if (error) {
				// File Reading Error
				sendError(error, filename);
				return;
			}

			// Get Content Type
			const ext = path.extname(filename);
			const contentType = contentTypesByExtension[ext];

			// Return File Content
			send(200, contentType, content);
		});
	});
});

server.listen(port);

console.log("Previous server running at http://localhost:" + port + "/");
console.log(" CTRL + C to shutdown\n");
