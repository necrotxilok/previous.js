
require("../common/utils");

const fs = require("fs");
const path = require("path");
const StandardRoutes = require("./routes");

const load = require('./load');

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

	request = null;
	response = null;

	routes = {};
	pages = {};

	constructor(request, response) {
		const rootLayout = path.join(process.cwd(), 'app/layout.js');
		if (!fs.existsSync(rootLayout)) {
			console.error('ERROR: Previous RootLayout does not exists!');
			return;
		}
		this.request = request;
		this.response = response;
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
		const routeFile = path.join(current, 'route.js');
		if (fs.existsSync(path.join(process.cwd(), routeFile))) {
			this.routes[url] = {
				api: routeFile
			};
		} else {
			const layoutFile = path.join(current, 'layout.js');
			if (fs.existsSync(path.join(process.cwd(), layoutFile))) {
				files.push(layoutFile);
			}
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
				this.getRoutes(curPath, urlPath, files);
			}
		}
	}

	render(uri) {
		let route = StandardRoutes[uri];
		if (!route) {
			route = this.getValidRoute(uri);
			if (!route) {
				return false;
			}
		}
		const content = this.renderRoute(uri, route);
		if (content === false) {
			return false;
		}
		return {
			type: route.type,
			content: content
		};
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

	renderRoute(uri, route) {
		let content = "";

		if (route.files) {

			// Render Page
			const data = {
				title: "",
				icons: {},
				metadata: {},
				styles: [],
				scripts: [],
				content: "",
				params: route.params,
				routes: Object.keys(this.routes)
			};

			for (let i = route.files.length - 1; i >= 0; i--) {
				const file = route.files[i];

				const page = load(file);
				if (typeof page.type == 'function') {
					route.type = page.type(data);
				}
				if (typeof page.title == 'function') {
					data.title = page.title(data);
				}
				if (typeof page.icons == 'function') {
					data.icons = {...page.icons(data), ...data.icons};
				}
				if (typeof page.metadata == 'function') {
					data.metadata = {...page.metadata(data), ...data.metadata};
				}
				if (typeof page.styles == 'function') {
					data.styles = page.styles(data).concat(data.styles).unique();
				}
				if (typeof page.scripts == 'function') {
					data.scripts = page.scripts(data).concat(data.scripts).unique();
				}
				if (typeof page.content == 'function') {
					content = page.content({
						title: data.title,
						content: data.content,
						params: data.params
					});
				}
				if (typeof page.ready == 'function') {
					const ready = page.ready.toString();
					content += '<script type="text/javascript">\n$(' + ready + ');\n</script>'
				}

				data.content = content;
			}

			if (route.type == "text/html") {
				// Render Document
				const document = load('previous/server/document.js');
				data.scripts = ['/previous.js'].concat(data.scripts).unique();
				content = document.content({
					title: data.title,
					icons: this.renderIcons(data.icons),
					metadata: this.renderMetadata(data.metadata),
					styles: this.renderStyles(data.styles),
					scripts: this.renderScripts(data.scripts),
					content: data.content,
					params: data.params
				});
			}

		} else if (route.api) {

			// Render API
			const api = load(route.api);
			const method = this.request.method;
			if (typeof api[method] == 'function') {
				const result = api[method]({
					params: route.params,
					routes: Object.keys(this.routes)
				});
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
