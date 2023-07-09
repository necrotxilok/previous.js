
(function() {
"use strict";

var links = {};
var scripts = {};

previous.router = {
	routes: {},
	cache: {},
	validateRoute: function(uri, callback) {
		return false;
	},
	navigate: function(uri, save = true) {
		var _self = this;
		return this.validateRoute(uri, function(route, params) {
			var content = _self.cache[route];
			if (content) {
				_self.open(uri, content, save);
			} else {
				$.get(uri, function(response) {
					response = response.replace('<!DOCTYPE html>', '');
					response = response.replace(/<link rel="icon".*?>/g, '');
					response = response.replace('<html>', '<div class="html-tag">').replace('</html>', '</div>');
					response = response.replace('<head>', '<div class="head-tag">').replace('</head>', '</div>');
					response = response.replace('<body>', '<div class="body-tag">').replace('</body>', '</div>');
					response = response.trim();
					
					if (!Object.values(params).length) {
						_self.cache[route] = response;
					}

					_self.open(uri, response, save);
				});
			}
			return true;
		});
	},
	open: function(uri, content, save) {
		var $virtual = $(content);

		// Set Title
		var title = $virtual.find('title').text();
		document.title = title;

		// Get New Styles
		$virtual.find('link').each(function(i, el) {
			var $el = $(el);
			if ($el.attr('rel') == 'stylesheet') {
				var href = $el.attr('href');
				if (href && !links[href]) {
					links[href] = true;
					$('head').append(`<link rel="stylesheet" type="text/css" href="${href}">`);
				}
			}
		});

		// Get New Scripts
		$virtual.find('script').each(function(i, el) {
			var $el = $(el);
			if ($el.attr('type') == 'text/javascript') {
				var src = $el.attr('src');
				if (src && !scripts[src]) {
					scripts[src] = true;
					// Synchronous -> The scripts are ready on virtual body load
					$('head').append(`<script type="text/javascript" src="${src}"></script>`);
					// WARNING! Next method cause error.
					// Asynchronous -> The scripts are NOT ready on virtual body load
					/*
					var script = document.createElement('script');
					script.src = src;
					document.head.appendChild(script);
					*/
				}
			}
		});

		// Get Body HTML
		var $body = $virtual.find('.body-tag');
		$('body').html($body.html());

		if (save) {
			window.history.pushState(null, title, uri);
		}
	}
};

window.onpopstate = function() {
	var uri = location.pathname;
	previous.router.navigate(uri, false);
}

$(function() {
	// Get Current Styles
	$('head').find('link').each(function(i, el) {
		var $el = $(el);
		if ($el.attr('rel') == 'stylesheet') {
			var href = $el.attr('href');
			if (href) {
				links[href] = true;
			}
		}
	});
	// Get Current Scripts
	$('head').find('script').each(function(i, el) {
		var $el = $(el);
		if ($el.attr('type') == 'text/javascript') {
			var src = $el.attr('src');
			if (src) {
				scripts[src] = true;
			}
		}
	});
	// Attach click event to all links
	$('body').on('click', 'a', function(e) {
		var href = $(this).attr('href');
		if (previous.router.navigate(href)) {
			e.preventDefault();
		}
	});
});

})();
