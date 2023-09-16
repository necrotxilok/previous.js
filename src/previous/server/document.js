
const Document = {
	title: function(props) {
		return "Previous.js";
	},
	icons: function(props) {
		return {
			//icon: '/favicon.ico'
		};
	},
	metadata: function(props) {
		return {
			//description: "",
			//keywords: "Previous.js,jQuery,JavaScript",
			//author: "necro_txilok",
			//creator: "necro_txilok",
			//publisher: "necro_txilok",
			//viewport: "width=device-width, initial-scale=1",
			//themeColor: 'black',
			//colorScheme: "dark",
			//"link:canonical": "https://necrotxilok.github.io/previous.js",
			//"link:alternate": "https://necrotxilok.github.io/previous.js/rss"
			//"prop:og:title": "Previous.js"
		};
	},
	styles: function(props) {
		return [
			//'/css/style.css'
		];
	},
	scripts: function(props) {
		return [
			//'/js/app.js'
		];
	},
	content: function(props) {
		return `<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<title>${props.title}</title>
	${props.icons}
	${props.metadata}
	${props.styles}
	${props.scripts}
</head>
<body>
	${props.content}
</body>
</html>`;
	}
}

return Document;
