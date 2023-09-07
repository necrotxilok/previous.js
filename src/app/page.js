
return {
	title: (props) => {
		return "Hello World!!";
	},
	content: (props) => {
		return `
			<div class="box">
				<div class="corners">
					<div class="tl"></div>
					<div class="tr"></div>
					<div class="bl"></div>
					<div class="br"></div>
				</div>
				<div class="shadow"></div>
				<div class="box-content">
					<div class="logo">
						<a href="/"><img src="/img/logo.png"></a>
					</div>
					<h1>${props.title}</h1>
					<p>Welcome to <a href="https://necrotxilok.github.io/previous-js" target="_blank">previous.js</a>. The "Next" jQuery Framework.</p>
					<p><small>by <a href="https://necrotxilok.github.io/" target="_blank">necro_txilok</a>.</small></p>
				</div>
			</div>
		`;
	}
}
