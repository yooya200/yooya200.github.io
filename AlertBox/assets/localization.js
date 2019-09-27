"use strict";
!function () {
	var $ = function (x) { return document.querySelector(x) };
	$.all = function (x) { return document.querySelectorAll(x) };
	$.new = function (x, y) { x = document.createElement(x), (typeof y != "undefined" ? x.className = y : 0); return x };
	HTMLElement.prototype.html = function (x) { if (typeof x == "undefined") return this.innerHTML; this.innerHTML = x; return this };
	HTMLElement.prototype.prop = function (x, y) { if (typeof y == "undefined") return this[x]; this[x] = y; return this };
	HTMLElement.prototype.attr = function (x, y) { if (typeof y == "undefined") return this.getAttribute(x); y === "" ? this.removeAttribute(x) : this.setAttribute(x, y); return this };
	NodeList.prototype.each = function (x) { for (var i = 0; i < this.length; i++) if (x.apply(this[i], [i]) === false) break };
	HTMLCollection.prototype.each = function (x) { for (var i = 0; i < this.length; i++) if (x.apply(this[i], [i]) === false) break };
	String.format = function(template){
		for (var i = 1; i < arguments.length; i++){
			var arg = arguments[i];
			if (typeof arg == "string" || typeof arg == "number") {
				var reg = new RegExp("\\{" + (i - 1) + "\\}", "g");
				template = template.replace(reg, arg);
			} else if (arg instanceof Object) { // Array or JSON object
				for (var j in arg) {
					var reg = new RegExp("\\{" + j + "\\}", "g");
					template = template.replace(reg, arg[j]);
				}
			}
		}
		return template;
	}

	var _format = function (template) {
		for (var i = 1; i < arguments.length; i++) {
			var arg = arguments[i];
			if (typeof arg == "string" || typeof arg == "number") {
				var reg = new RegExp("\\{" + (i - 1) + "\\}", "g");
				template = template.replace(reg, arg);
			} else if (arg instanceof Object) { // Array or JSON object
				for (var j in arg) {
					var reg = new RegExp("\\{" + j + "\\}", "g");
					template = template.replace(reg, arg[j]);
				}
			}
		}
		return template;
	};

	if (!("locale" in window)) return;

	var register_get = function (obj) {
		obj.get = function (x) {
			if (!(x in obj)) return x;
			var args = [];
			for (var i = 1; i < arguments.length; i++)
				args.push(arguments[i]);
			return _format(obj[x], args);
		}
	};
	register_get(window.locale);
	for (var k in window.locale) {
		if (typeof window.locale[k] === "object")
			register_get(window.locale[k]);
	}

	window.locale.apply = function(){
		$.all(".localized[data-locale-tag]").each(function () {
			var locale = this.attr("data-locale-tag");

			var args = [locale], arg = null;
			var index = 1;
			while( arg = this.attr("data-locale-param-"+(index++).toString()) ) args.push(arg);

			var localized = window.locale.get.apply( window.locale, args );
			var content = this.attr("data-locale-content");
			if(!content)
				this.html(localized);
			else
				this.attr(content, localized);

			this.attr("data-locale-tag", "")
				.attr("data-localized", locale);
		});

		var c = 1, t = {};
		while(c > 0){
			c = 0;
			$.all("input[placeholder]").each(function () {
				var h = this.hash;
				if(!h) {
					h = Math.random();
					this.hash = h;
				}

				if( !(h in t) ) t[h] = 0;

				if(t[h]>=10) return;
				t[h] ++;

				this.prop(
					"placeholder",
					this.prop("placeholder")
						.replace(/\{([^\{\}+]+)\}/g, function (m, p) {
							if (p[0] == '#') {
								var _p = p.substr(1);
								if (_p in window.locale)
									return window.locale[_p];
								else
									return _p;
							} else
								return p;
						})
				);
				c++;
			});
		}
	};

	document.addEventListener("DOMContentLoaded", function (event) {
		window.locale.apply();

		if ("var" in window.locale) {
			var css = "";
			for (var k in window.locale.var){
				if(k != "get")
					css += String.format("--locale-{0}: \"{1}\";\n", k, window.locale.var.get(k));
			}

			$("body").append(
				$.new("style")
					.prop("type", "text/css")
					.html(String.format(":root {\n{0}}", css))
			);
		}
	});
}();
