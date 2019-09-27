/*
	Concurrent loader
	WolfgangKurz
	v1
*/
"use strict";
!function(){
	var concurrent_templates = {};
	var concurrent_loading = [];
	var concurrent_queue = {};

	var flush = function(url, value, alias){
		concurrent_templates[url] = value;
		concurrent_loading.splice(concurrent_loading.indexOf(url), 1);

		var queue = concurrent_queue[url];
		if(Array.isArray(queue)) queue.forEach(function(x){ x(value, url) });
		delete concurrent_queue[url];

		if(typeof alias != "undefined"){
			concurrent_templates[alias] = value;
			concurrent_loading.splice(concurrent_loading.indexOf(alias), 1);

			var queue = concurrent_queue[alias];
			if(Array.isArray(queue)) queue.forEach(function(x){ x(value, alias) });
			delete concurrent_queue[alias];
		}
	};

	window.Concurrent = {};
	window.Concurrent.Load = function(url, callback, type, alias){
		// Already loaded
		if(url in concurrent_templates){
			if(typeof callback=="function")
				callback( concurrent_templates[url], url );
			return;
		}

		if(typeof type=="undefined") type = "image";
		type = type.toLowerCase();

		// Already loading (not loaded yet)
		if( concurrent_loading.indexOf(url)>=0 ){
			if( !(url in concurrent_queue) )
				concurrent_queue[url] = [];

			concurrent_queue[url].push(callback);
			return;
		}
		concurrent_loading.push(url);
		if(typeof alias != "undefined")
			concurrent_loading.push(alias);

		switch(type){
			case "image":
				var obj = new Image();
				obj.onload = function(){
					flush(url, this, alias);
					obj.onload = null;
				};
				obj.src = url;
				break;

			case "audio":
				var obj = new Audio();
				obj.oncanplaythrough = function(){
					flush(url, this, alias);
					obj.oncanplaythrough = null;
				};
				obj.src = url;
				obj.load();
				break;

			default:
				throw new Exception("Cannot concurrent unknown type '"+type+"'.");
		}
	};
}();