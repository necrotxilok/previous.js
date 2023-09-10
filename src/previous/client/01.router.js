
(function() {
"use strict";

var links = {};
var scripts = {};

var last = location.pathname;

previous.router = {
	routes: {},
	cache: {},
	validateRoute: function(uri, callback) {
		return false;
	},
	getPath: function(uri) {
		if (uri.startsWith('#')) {
			return location.pathname;
		}
		if (uri.includes('#')) {
			return uri.split('#')[0];
		}
		return uri;
	},
	getHash: function(uri) {
		var hash = '';
		if (uri.includes('#')) {
			hash = uri.split('#')[1];
		}
		return hash;
	},
	navigate: function(uri, push = true) {
		// Save Last Path
		last = this.getPath(uri);
		var _self = this;
		var path = this.getPath(uri);
		if (push && path == location.pathname) {
			// Check Hash Update
			var hash = this.getHash(uri);
			if (hash) {
				if ('#' + hash == location.hash) {
					return true;
				} else {
					return false;
				}
			}
			if (!hash && location.hash) {
				window.history.pushState(null, null, uri);
			}
			$('html').scrollTop(0);
			return true;
		}
		return this.validateRoute(path, function(route, params) {
			var content = _self.cache[last];
			if (content) {
				_self.open(uri, content, push);
			} else {
				$.get(uri, function(response, status, xhr) {
					var contentType = xhr.getResponseHeader('content-type');
					if (!contentType || !contentType.includes('text/html')) {
						window.location = uri;
						return;
					}

					response = response.replace('<!DOCTYPE html>', '');
					response = response.replace(/<link rel="icon".*?>/g, '');
					response = response.replace('<html>', '<div class="html-tag">').replace('</html>', '</div>');
					response = response.replace('<head>', '<div class="head-tag">').replace('</head>', '</div>');
					response = response.replace('<body>', '<div class="body-tag">').replace('</body>', '</div>');
					response = response.trim();
					
					_self.cache[last] = response;

					_self.open(uri, response, push);
				}).fail(function() {
					window.location = uri;
				});
			}
			return true;
		});
	},
	open: function(uri, content, push) {
		// Push History State
		if (push) {
			window.history.pushState(null, null, uri);
		}

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

		// Set Anchor
		var hash = this.getHash(uri);
		if (hash) {
			var $anchor = $('#' + hash);
			if ($anchor.length) {
				$('html').scrollTop($anchor.offset().top);
			}
		} else if (push) {
			$('html').scrollTop(0);
		}
	}
};

window.onpopstate = function() {
	if (location.pathname == last) {
		return true;
	}
	var uri = location.pathname + location.hash;
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
