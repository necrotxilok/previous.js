
return {
	title: (props) => {
		if (props.title) {
			return "Previous.js - " + props.title;
		}
		return "Previous.js";
	},
	icons: (props) => {
		return {
			icon: '/favicon.ico'
		};
	},
	metadata: (props) => {
		return {
			viewport: "width=device-width, initial-scale=1",
		};
	},
	styles: (props) => {
		return [
			'/css/style.css'
		];
	},
	scripts: (props) => {
		return [
			'/js/app.js'
		];
	},
	content: (props) => {
		return `
		<section>
			<div class="container">
				<div class="main">
					${props.content}
				</div>
			</div>
		</section>
		`;
	}
}
