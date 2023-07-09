
const Document = {
	title: function(data) {
		return "Previous.js";
	},
	icons: function(data) {
		return {
			//icon: '/favicon.ico'
		};
	},
	metadata: function(data) {
		return {
			//description: "",
			//keywords: "Previous.js,jQuery,JavaScript",
			//author: "necro_txilok",
			//creator: "necro_txilok",
			//publisher: "necro_txilok",
			//themeColor: 'black',
			//colorScheme: "dark",
			//"link:canonical": "https://necrotxilok.github.io/previous.js",
			//"link:alternate": "https://necrotxilok.github.io/previous.js/rss"
			//"prop:og:title": "Previous.js"
		};
	},
	styles: function(files) {
		return [
			//'/css/style.css'
		];
	},
	scripts: function(files) {
		return [
			//'/js/app.js'
		];
	},
	content: function(data) {
		return `<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<title>${data.title}</title>
	${data.icons}
	${data.metadata}
	${data.styles}
	${data.scripts}
</head>
<body>
	${data.content}
</body>
</html>`;
	}
}

return Document;
