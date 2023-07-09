const http = require("http");
const url = require("url");
const path = require("path");
const fs = require("fs");
const Previous = require("./server/previous");

const port = process.argv[2] || 8888;

const contentTypesByExtension = {
	'.html': "text/html",
	'.css':  "text/css",
	'.js':   "text/javascript",
};

//const prev = new Previous();
//process.exit();

const logAccess = function(statusCode, date, url) {
	const time = Date.now() - date.getTime();
	const fullDate = date.getFullDateString();
	const ms = ("" + date.getMilliseconds()).padStart(3, '0');
	console.log('[' + statusCode + '] ' + fullDate + '.' + ms + ': ' + url + ' (' + time + 'ms)');
}

const server = http.createServer(function(request, response) {
	const start = new Date();
	
	const send = function(statusCode, contentType, content) {
		logAccess(statusCode, start, request.url);
		const headers = {};
		if (contentType) {
			headers["Content-Type"] = contentType;
		}
		response.writeHead(statusCode, headers);
		response.write(content);
		response.end();
	}

	const sendNotFound = function() {
		try {
			// Get Previous Route
			const previous = new Previous(request, response);
			const route = previous.render('/404');
			if (route) {
				send(404, route.type, route.content);
				return;
			}
		} catch(err) {
			// Previous App Error
			console.error('\x1b[31m%s\x1b[0m %s', '[Previous App Error]', err);
			sendError(err);
			return;
		}
		send(404, "text/plain", "404 Not Found\n");
	}

	const sendError = function(err) {
		try {
			// Get Previous Route
			const previous = new Previous(request, response);
			const route = previous.render('/500');
			if (route) {
				send(500, route.type, route.content);
				return;
			}
		} catch(err) {
			// Previous App Error
			console.error('\x1b[31m%s\x1b[0m %s', '[Previous App Error]', err);
			send(500, "text/plain", err + "\n");
			return;
		}
		send(500, "text/plain", err + "\n");
	}

	// Get Request URL Path
	const uri = url.parse(request.url).pathname;

	// Check File Exists
	const filename = path.join(process.cwd(), 'public', uri);
	if (uri == '/' || !fs.existsSync(filename)) {
		try {
			// Get Previous Route
			const previous = new Previous(request, response);
			const route = previous.render(uri);
			if (route) {
				send(200, route.type, route.content);
				return;
			}
		} catch(err) {
			// Previous App Error
			console.error('\x1b[31m%s\x1b[0m %s', '[Previous App Error]', err);
			sendError(err);
			return;
		}
		// Not Found
		sendNotFound();
		return;
	}

	// Get File Content
	fs.readFile(filename, function(err, content) {
		if (err) {
			// File Reading Error
			sendError(err);
			return;
		}

		// Get Content Type
		const ext = path.extname(filename);
		const contentType = contentTypesByExtension[ext];

		// Return File Content
		send(200, contentType, content);
	});
});

server.listen(port);

console.log("Previous server running at http://localhost:" + port + "/");
console.log(" CTRL + C to shutdown\n");
