
const RootLayout = {
	title: function(data) {
		if (data.title) {
			return "Previous - " + data.title;
		}
		return "Previous";
	},
	icons: function(data) {
		return {
			icon: '/favicon.ico'
		};
	},
	metadata: function(data) {
		return {};
	},
	styles: function(files) {
		return [
			'/css/style.css'
		];
	},
	scripts: function(files) {
		return [
			'/js/app.js'
		];
	},
	content: function(data) {
		return `
		<section>
			<div class="container">
				<div class="main">
					${data.content}
				</div>
			</div>
		</section>
		`;
	}
}

return RootLayout;
