
require("../common/utils");

const fs = require("fs");
const path = require("path");
const StandardRoutes = require("./routes");

const load = require('./load');
const read = require('./read');

const iconTypesByExtension = {
	'.ico':  "image/x-icon",
	'.png':  "image/png",
	'.svg':  "image/svg+xml",
	'.webp': "image/webp",
};

const iconTpl = '<link rel="[rel]" type="[type]" href="[icon]">';
const metadataTpl = '<meta name="[key]" content="[value]">';
const metapropTpl = '<meta property="[key]" content="[value]">';
const metalinkTpl = '<link rel="[key]" href="[value]">';
const styleTpl = '<link rel="stylesheet" type="text/css" href="[file]">';
const scriptTpl = '<script type="text/javascript" src="[file]"></script>';

class Previous {

	method = 'GET';
	data = {};

	routes = {};
	pages = {};

	constructor(method, requestData) {
		const rootLayout = path.join(process.cwd(), 'app/layout.js');
		if (!fs.existsSync(rootLayout)) {
			console.error('ERROR: Previous RootLayout does not exists!');
			return;
		}
		this.method = method;
		this.data = requestData;
		this.getRoutes('app', '/');
		if (fs.existsSync(path.join(process.cwd(), 'app/404.js'))) {
			this.routes['/404'] = {
				files: ['app/layout.js', 'app/404.js']
			};
		}
		if (fs.existsSync(path.join(process.cwd(), 'app/500.js'))) {
			this.routes['/500'] = {
				files: ['app/layout.js', 'app/500.js']
			};
		}
	}	

	getRoutes(current, url, files = []) {
		if (!fs.existsSync(path.join(process.cwd(), current))) {
			console.error('ERROR: Previous can not find route in "' + path.join(process.cwd(), current) + '"!');
			return;
		}
		const layoutFile = path.join(current, 'layout.js');
		if (fs.existsSync(path.join(process.cwd(), layoutFile))) {
			files.push(layoutFile);
		}
		const routeFile = path.join(current, 'route.js');
		if (fs.existsSync(path.join(process.cwd(), routeFile))) {
			this.routes[url] = {
				api: routeFile
			};
		} else {
			const pageFile = path.join(current, 'page.js');
			if (fs.existsSync(path.join(process.cwd(), pageFile))) {
				this.routes[url] = {
					files: [...files, pageFile]
				};
				this.pages[url] = true;
			}
		}
		const list = fs.readdirSync(current, {withFileTypes: true});
		for (const f of list) {
			if (f.isDirectory() && !f.name.startsWith('_')) {
				const curPath = path.join(current, f.name);
				const urlPath = url + f.name + '/';
				this.getRoutes(curPath, urlPath, [...files]);
			}
		}
	}

	async render(uri, response) {
		let route = StandardRoutes[uri];
		if (!route) {
			route = this.getValidRoute(uri);
			if (!route) {
				response(false);
				return;
			}
		}
		const body = await this.renderRoute(uri, route);
		if (body === false) {
			response(false);
			return;
		}
		if (body && body.error) {
			response(body);
			return;
		}
		if (body && body.redirect) {
			response(body);
			return;
		}
		/*if (body && body instanceof Promise) {
			body.then(function(result) {
				response({
					type: result.type,
					body: result.data
				})
			});
			return;
		}*/
		response({
			type: route.type,
			body: body
		});
	}

	getValidRoute(uri) {
		var _self = this;
		return this.validateRoute(uri, function(path, params) {
			const route = _self.routes[path];
			return {
				path: path,
				params: params,
				api: route.api,
				files: route.files,
				type: "text/html"
			};
		});
	}

	validateRoute(uri, callback) {
		let valid = false;
		let route = "";
		let params = {};
		const parts = uri.trim('/').split('/');
		for (route in this.routes) {
			const routeParts = route.trim('/').split('/');
			let validUrl = false;
			if (parts.length == routeParts.length) {
				validUrl = true;
				for (var i = 0; i < parts.length; i++) {
					var u = parts[i];
					var r = routeParts[i];
					const isParam = r.startsWith('[') && r.endsWith(']');
					if (isParam) {
						const param = r.replace('[', '').replace(']', '');
						params[param] = decodeURI(u);
					} else {
						if (u != r) {
							validUrl = false;
						}
					}
				}
			}
			if (validUrl) {
				valid = true;
				break;
			}
		}
		if (!valid) {
			return false;
		}
		if (typeof callback == 'function') {
			return callback(route, params);
		}
		return true;
	}

	async renderRoute(uri, route) {
		let currentFile = '';
		try {
			let content = "";

			if (route.files) {

				// Render Page
				let page = {
					title: "",
					icons: {},
					metadata: {},
					styles: [],
					scripts: [],
					content: "",
					params: route.params,
					uri: uri,
					data: this.data
				};

				for (let i = route.files.length - 1; i >= 0; i--) {
					const file = route.files[i];
					currentFile = file;

					const view = load(file);
					if (view.redirect) {
						return view;
					}

					if (typeof view.type == 'string') {
						route.type = view.type;
					}
					
					if (typeof view.data == 'function') {
						page = {...view.data(page), ...page};
					}
					if (typeof view.title == 'function') {
						page.title = view.title(page);
					}
					if (typeof view.icons == 'function') {
						page.icons = {...view.icons(page), ...page.icons};
					}
					if (typeof view.metadata == 'function') {
						page.metadata = {...view.metadata(page), ...page.metadata};
					}
					if (typeof view.styles == 'function') {
						page.styles = view.styles(page).concat(page.styles).unique();
					}
					if (typeof view.scripts == 'function') {
						page.scripts = view.scripts(page).concat(page.scripts).unique();
					}

					const htmlFile = file.replace('.js', '.html');
					if (fs.existsSync(htmlFile)) {
						content = read(htmlFile, page);
					} else if (typeof view.content == 'function') {
						content = view.content(page);
					}

					if (route.type != "text/html") {
						break;
					}

					if (typeof view.ready == 'function') {
						const ready = view.ready.toString();
						content += '<script type="text/javascript">\n$(' + ready + ');\n</script>'
					}

					page.content = content;
				}

				if (route.type == "text/html") {
					// Render Document
					const document = load('previous/server/document.js');
					page.scripts = ['/previous.js'].concat(page.scripts).unique();
					content = document.content({
						title: page.title,
						icons: this.renderIcons(page.icons),
						metadata: this.renderMetadata(page.metadata),
						styles: this.renderStyles(page.styles),
						scripts: this.renderScripts(page.scripts),
						content: page.content,
						params: page.params,
						uri: uri,
						data: this.data
					});
				}

			} else if (route.api) {

				currentFile = route.api; 

				// Render API
				const api = load(route.api);
				const method = this.method;
				if (typeof api[method] == 'function') {
					let result = api[method]({
						params: route.params,
						uri: uri,
						data: this.data
					});
					if (!result) {
						throw 'Invalid router response for method ' + method + '.';
					}
					if (result.redirect) {
						return result;
					}
					if (result instanceof Promise) {
						result = await result;
					}
					route.type = result.type;
					content = result.data;
				} else {
					content = false;
				}

			} else if (route.render) {

				// Render Standard Route
				content = route.render(this);
			
			}

			return content;
		} catch(error) {
			// Previous App Error
			console.error('\x1b[31m%s\x1b[0m %s', '[Previous App Error]', error);
			return {
				error: error,
				file: currentFile
			};
		}
	}

	renderIcons(icons) {
		let html = "";
		for (const [rel, icon] of Object.entries(icons)) {
			const ext = path.extname(icon);
			const type = iconTypesByExtension[ext];
			if (type) {
				html += iconTpl.replace('[rel]', rel).replace('[type]', type).replace('[icon]', icon) + "\n";
			}
		}
		return html;
	}

	renderMetadata(metadata) {
		let html = "";
		for (const [key, value] of Object.entries(metadata)) {
			if (key.startsWith('link:')) {
				html += metalinkTpl.replace('[key]', key.replace('link:', '')).replace('[value]', value) + "\n";
			} else if (key.startsWith('prop:')) {
				html += metapropTpl.replace('[key]', key.replace('prop:', '')).replace('[value]', value) + "\n";
			} else {
				html += metadataTpl.replace('[key]', key).replace('[value]', value) + "\n";
			}
		}
		return html;
	}

	renderStyles(files) {
		let html = "";
		for (const file of files) {
			html += styleTpl.replace('[file]', file) + "\n";
		}
		return html;
	}

	renderScripts(files) {
		let html = "";
		for (const file of files) {
			html += scriptTpl.replace('[file]', file) + "\n";
		}
		return html;
	}

};

module.exports = Previous;
