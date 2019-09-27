"use strict";
!function(){
	// Polyfill
	if (!Element.prototype.matches) {
		Element.prototype.matches = 
			Element.prototype.matchesSelector || 
			Element.prototype.mozMatchesSelector ||
			Element.prototype.msMatchesSelector || 
			Element.prototype.oMatchesSelector || 
			Element.prototype.webkitMatchesSelector ||
			function(s) {
				var matches = (this.document || this.ownerDocument).querySelectorAll(s),
					i = matches.length;
				while (--i >= 0 && matches.item(i) !== this) {}
				return i > -1;
			};
	}

	// Defines
	var $ = function(x){ return document.querySelector(x) };
	$.all = function(x){ return document.querySelectorAll(x) };
	$.byname = function(x){ return $("[name=\""+x+"\"]") };

	$.new = function(x, y){ x = document.createElement(x), (typeof y!="undefined" ? x.className=y : 0); return x };
	$.new.text = function(x, y){ return document.createTextNode(x) };

	HTMLElement.prototype.find = function(x){ return this.querySelector(x) };
	HTMLElement.prototype.findAll = function(x){ return this.querySelectorAll(x) };
	HTMLElement.prototype.child = function(x){
		var y = "_TMP$"+Math.random().toFixed(12).substr(2);
		var z = this.id, u = null;
		this.id = y, u = $("#"+y.replace("$","\\$")+">"+x);
		z.length==0 ? this.removeAttribute("id") : this.id=z;
		return u;
	};
	HTMLElement.prototype.childs = function(x){
		var y = "_TMP$"+Math.random().toFixed(12).substr(2);
		var z = this.id, u = null;
		this.id = y, u = $.all("#"+y.replace("$","\\$")+">"+x);
		z.length==0 ? this.removeAttribute("id") : this.id=z;
		return u;
	};
	HTMLElement.prototype.prev = function(){ return this.previousElementSibling }
	HTMLElement.prototype.next = function(){ return this.nextElementSibling }

	HTMLElement.prototype.prop = function(x, y){ if(typeof y=="undefined") return this[x]; this[x] = y; return this };
	HTMLElement.prototype.attr = function(x, y){ if(typeof y=="undefined") return this.getAttribute(x); y==="" ? this.removeAttribute(x) : this.setAttribute(x, y); return this };
	HTMLElement.prototype.css = function(x, y){
		if(typeof y=="undefined") {
			if(window.getComputedStyle) return window.getComputedStyle(this)[x];
			return this.style[x];
		}
		this.style[x]=y;
		return this;
	};
	HTMLElement.prototype.data = function(x, y){ if(typeof y=="undefined") return this.dataset[x]; this.dataset[x]=y; return this };

	HTMLElement.prototype.html = function(x){ if(typeof x=="undefined") return this.innerHTML; this.innerHTML=x; return this };
	HTMLElement.prototype.outerhtml = function(x){ if(typeof x=="undefined") return this.outerHTML; this.outerHTML=x; return this };
	HTMLElement.prototype.text = function(){
		var node, ret = "", i = 0, nodeType = this.nodeType;
		if( !nodeType ){
			for(; (node = elem[i]); i++) ret += getText( node );
		}else if( nodeType === 1 || nodeType === 9 || nodeType === 11 ){
			if( typeof this.textContent === "string" ) return this.textContent;
			else{
				for( elem = this.firstChild; elem; elem=this.nextSibling )
					ret += getText( elem );
			}
		}else if( nodeType === 3 || nodeType === 4 ) return this.nodeValue;
		return ret;
	};

	HTMLElement.prototype.prepend = function(x){ (x instanceof HTMLElement || x instanceof Text) ? this.insertBefore(x,this.firstChild) : this.insertBefore($.new.text(x),this.firstChild); return this };
	HTMLElement.prototype.append = function(x){ (x instanceof HTMLElement || x instanceof Text) ? this.appendChild(x) : this.appendChild($.new.text(x)); return this };

	HTMLElement.prototype.remove = function(x){ x instanceof HTMLElement ? this.removeChild(x) : this.parentNode.removeChild(this); return this };
	NodeList.prototype.remove = function(x){ this.each(function(){ this.remove(x) }); return this };
	HTMLCollection.prototype.remove = function(x){ this.each(function(){ this.remove(x) }); return this };

	HTMLElement.prototype.before = function(x, y){
		if(typeof y=="undefined") return this.parent().before(x, this);

		if(x instanceof HTMLElement || x instanceof Text)
			this.insertBefore(x, y);
		else if(x instanceof NodeList || x instanceof HTMLCollection)
			x.each(function(){ y.before(this) });
		else
			this.insertBefore($.new.text(x), y);
		return this;
	};
	HTMLElement.prototype.after = function(x, y){
		if(typeof y=="undefined") return this.parent().after(x, this);

		if(x instanceof HTMLElement || x instanceof Text)
			this.insertBefore(x, y.next());
		else if(x instanceof NodeList || x instanceof HTMLCollection)
			x.each(function(){ y.before(this.next()) });
		else
			this.insertBefore($.new.text(x), y.next());
		return this;
	};

	HTMLElement.prototype.wrap = function(x){
		this.parent().before(x, this);
		x.append(this);
	};
	HTMLElement.prototype.unwrap = function(){
		var p = this.parent();
		p.parent().before(this, p);
		p.remove();
	};

	HTMLElement.prototype.val = function(x){ if(typeof x=="undefined") return this.value; this.value=x; return this };
	HTMLElement.prototype.clone = function(){ return this.cloneNode(true) };

	NodeList.prototype.byAttr = function(x, y){ for(var i=0; i<this.length; i++) if(this[i] instanceof HTMLElement && this[i].attr(x)==y) return this[i]; return null };
	NodeList.prototype.byAttrAll = function(x, y){ var o = []; for(var i=0; i<this.length; i++) if(this[i] instanceof HTMLElement && this[i].attr(x)==y) o.push(this[i]); return o };
	HTMLCollection.prototype.byAttr = function(x, y){ for(var i=0; i<this.length; i++) if(this[i] instanceof HTMLElement && this[i].attr(x)==y) return this[i]; return null };
	HTMLCollection.prototype.byAttrAll = function(x, y){ var o = []; for(var i=0; i<this.length; i++) if(this[i] instanceof HTMLElement && this[i].attr(x)==y) o.push(this[i]); return o };

	NodeList.prototype.first = function(x, y){ return this[0] };
	HTMLCollection.prototype.first = function(x, y){ return this[0] };
	NodeList.prototype.last = function(x, y){ return this[this.length-1] };
	HTMLCollection.prototype.last = function(x, y){ return this[this.length-1] };

	NodeList.prototype.each = function(x){ for(var i=0; i<this.length; i++) if(x.apply(this[i], [i])===false) break };
	HTMLCollection.prototype.each = function(x){ for(var i=0; i<this.length; i++) if(x.apply(this[i], [i])===false) break };

	NodeList.prototype.map = function(x){ var output = []; for(var i=0; i<this.length; i++) output.push(x.apply(this[i], [i])); return output };
	HTMLCollection.prototype.map = function(x){ var output = []; for(var i=0; i<this.length; i++) output.push(x.apply(this[i], [i])); return output };

	if(window.HTMLDocument) HTMLDocument.prototype.event = function(x, y, z){ var e = x.split(" "); for(var i=0; i<e.length; i++) this.addEventListener(e[i], y, z); return this };
	else if(window.Document) Document.prototype.event = function(x, y, z){ var e = x.split(" "); for(var i=0; i<e.length; i++) this.addEventListener(e[i], y, z); return this };
	HTMLElement.prototype.event = function(x, y, z){ var e = x.split(" "); for(var i=0; i<e.length; i++) this.addEventListener(e[i], y, z); return this };
	NodeList.prototype.event = function(x, y, z){ this.each(function(){ this.event(x, y, z) }); return this };
	HTMLCollection.prototype.event = function(x, y, z){ this.each(function(){ this.event(x, y, z) }); return this };

	if(window.HTMLDocument) HTMLDocument.prototype.trigger = function(x){ var e = x.split(" "); for(var i=0; i<e.length; i++) { if(document.createEventObject) this.fireEvent("on"+x); else { var e = document.createEvent("HTMLEvents"); e.initEvent(x, false, true), this.dispatchEvent(e) } } return this };
	else if(window.Document) Document.prototype.trigger = function(x){ var e = x.split(" "); for(var i=0; i<e.length; i++) { if(document.createEventObject) this.fireEvent("on"+x); else { var e = document.createEvent("HTMLEvents"); e.initEvent(x, false, true), this.dispatchEvent(e) } } return this };
	HTMLElement.prototype.trigger = function(x){
		var e = x.split(" ");
		for(var i=0; i<e.length; i++) {
			if(document.createEvent){
				var e = document.createEvent("HTMLEvents");
				e.initEvent(x, false, true);
			} else {
				var e = document.createEventObject();
				e.eventType = x;
			}
			e.eventName = x;
			if(document.createEvent)
				this.dispatchEvent(e);
			else
				this.fireEvent("on"+x, e);
		}
		return this
	};
	NodeList.prototype.trigger = function(x){ this.each(function(){ this.trigger(x) }); return this };
	HTMLCollection.prototype.trigger = function(x){ this.each(function(){ this.trigger(x) }); return this };

	HTMLElement.prototype.is = function(x){ return this.matches(x) };
	NodeList.prototype.is = function(x){
		return this.each(function(){ return this.is(x) })
			.filter(function(){ return !this })
			.length==0
	};
	HTMLCollection.prototype.is = function(x){
		return this.each(function(){ return this.is(x) })
			.filter(function(){ return !this })
			.length==0
	};

	HTMLElement.prototype.parent = function(x){
		if(typeof x=="undefined") return this.parentNode;
		var y = this;
		try {
			while(y!=null && y.tagName.toLowerCase()!="body" && !y.is(x)) y = y.parentNode;
			return y==null ? null : (y.tagName.toLowerCase()=="body" ? (y.is(x) ? y : null) : y);
		} catch(e){}
		return null;
	};

	HTMLElement.prototype.addClass = function(x){
		if(x===undefined || x===null) return this;
		var y = x.split(" "), z = this.className.split(" ");
		for(var i=0; i<y.length; i++){
			if( y[i].trim().length==0 ) continue;
			if( z.indexOf(y[i])>=0 ) continue;
			z.push(y[i]);
		}
		this.className = z.filter(function(_){return _.length>0}).join(" ");
		return this;
	};
	HTMLElement.prototype.removeClass = function(x){
		if(x===undefined || x===null) return this;
		var y = x.split(" "), z = this.className.split(" ");
		for(var i=0, j; i<y.length; i++){
			if( y[i].trim().length==0 ) continue;
			while((j=z.indexOf(y[i])) >=0) z.splice(j, 1);
		}
		this.className = z.filter(function(_){return _.length>0}).join(" ");
		return this;
	};
	HTMLElement.prototype.hasClass = function(x){
		if(x===undefined || x===null) return false;
		var y = this.className.split(" ");
		for(var i=0, j; i<y.length; i++){
			if( y[i].trim().length==0 ) continue;
			if(y[i]==x) return true;
		}
		return false;
	};
	HTMLElement.prototype.toggleClass = function(x){
		if(x===undefined || x===null) return this;
		var y = x.split(" ").map(function(z){ return z.trim() }).filter(function(z){ return z.length>0 });
		for(var i=0; i<y.length; i++){
			if(this.hasClass(y[i])) this.removeClass(y[i]);
			else this.addClass(y[i]);
		}
		return this;
	};
	NodeList.prototype.addClass = function(x){
		this.each(function(){ this.addClass(x) });
		return this;
	};
	NodeList.prototype.removeClass = function(x){
		this.each(function(){ this.removeClass(x) });
		return this;
	};
	NodeList.prototype.hasClass = function(x){
		return this[0].hasClass(x);
	};
	NodeList.prototype.toggleClass = function(x){
		this.each(function(){ this.toggleClass(x) });
		return this;
	};
	HTMLCollection.prototype.addClass = function(x){
		this.each(function(){ this.addClass(x) });
		return this;
	};
	HTMLCollection.prototype.removeClass = function(x){
		this.each(function(){ this.removeClass(x) });
		return this;
	};
	HTMLCollection.prototype.toggleClass = function(x){
		this.each(function(){ this.toggleClass(x) });
		return this;
	};
	HTMLCollection.prototype.hasClass = function(x){
		return this[0].hasClass(x);
	};

	String.prototype.int = function(){ return parseInt(this) };
	String.prototype.float = function(){ return parseFloat(this) };
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
	Number.prototype.format = function(){
		return this.toFixed().replace(/(\d)(?=(\d{3})+$)/g, "$1,");
	};

	$.ajax = function(opt){
		var h = new XMLHttpRequest();

		var eventLoad = function(){
			if(h.readyState==4){
				h.config.callback(h.responseText, h);
				h.config.after(h);
			}
		};
		var eventAbort = function(e){
			h.config.aborted(e, h);
			h.config.after(h);
		};
		var eventError = function(e){
			h.config.error(e, h);
			h.config.after(h);
		};
		var eventProgress = function(e){
			if(!e.lengthComputable) h.config.progress(1, 2, h);
			else h.config.progress(e.loaded || e.position, e.total, h);
		};

		var o = {
			method: "GET",
			url: "",
			async: true,
			mime:"text/html",
			after: function(){},
			progress: function(){},
			error: function(){},
			aborted: function(){},
			callback: function(){},
			post: null
		};
		for(var k in opt) o[k] = opt[k];

		h.config = o;

		if(h.upload) h.upload.addEventListener("progress", eventProgress);
		else h.addEventListener("progress", eventProgress);

		h.addEventListener("loadend", eventLoad);
		h.addEventListener("error", eventError);
		h.addEventListener("abort", eventAbort);

		h.open(o.method, o.url, o.async);
		if(o.method.toUpperCase()=="POST" && !(o.post instanceof FormData))
			h.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

		h.overrideMimeType(o.mime);
		h.send(o.post);
		return h;
	};

	window["$"] = $;
	window["$common"] = $;
}()