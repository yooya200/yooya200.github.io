"use strict";

window.lib = function(){};

window.lib.http_check = function(addr, func, timeout) {
	if(!addr) return;
	if(!func) return;
	if(typeof timeout=="undefined") timeout = 4000;

	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function (evt) {
		if(xhr.readyState != 4) return;

		if(xhr.status == 200) {
			func(true);
		} else {
			func(false);
		}
	};

	xhr.open("HEAD", addr, true);
	xhr.timeout = timeout;
	xhr.msCaching = "disabled"; //force reload (for IE)
	xhr.send();
};

window.lib.http_request = function(addr, func, timeout) {
	if(!addr) return;
	if(!func) return;
	if(typeof timeout=="undefined") timeout = 4000;

	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function (evt) {
		if(xhr.readyState != 4) return;

		if(xhr.status == 200) {
			func(xhr.responseText);
		} else {
			console.log(xhr.responseText);
			func(null);
		}
	};

	xhr.open("GET", addr, true);
	xhr.timeout = timeout;
	xhr.msCaching = "disabled"; //force reload (for IE)
	xhr.setRequestHeader("Content-Type", "text/html");

	try {
		xhr.send();
	} catch(e) {
		console.log(e);
		func(null);
	}
};

window.lib.http_request_twitch_v5 = function(addr, client_id, func, timeout) {
	if(!addr) return;
	if(!func) return;
	if(typeof timeout=="undefined") timeout = 4000;

	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function (evt) {
		if(xhr.readyState != 4) return;

		if(xhr.status == 200) {
			func(xhr.responseText);
		} else {
			console.log(xhr.responseText);
			func(null);
		}
	};

	xhr.open("GET", addr, true);
	xhr.timeout = timeout;
	xhr.msCaching = "disabled"; //force reload (for IE)
	xhr.setRequestHeader("Content-Type", "text/html");
	xhr.setRequestHeader("Accept", "application/vnd.twitchtv.v5+json");
	xhr.setRequestHeader("Client-ID", client_id);
	xhr.send();
};

window.lib.http_request_ex = function(addr, func, timeout) {
	if(!addr) return;
	if(!func) return;
	if(typeof timeout=="undefined") timeout = 4000;

	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function (evt) {
		if(xhr.readyState != 4) return;

		if(xhr.status == 200) {
			func(xhr.responseText, 200);
		} else {
			console.log(xhr.responseText);
			func(null, xhr.status);
		}
	};

	xhr.open("GET", addr, true);
	xhr.timeout = timeout;
	xhr.msCaching = "disabled"; //force reload (for IE)
	xhr.setRequestHeader("Content-Type", "text/html");
	xhr.send();
};

window.lib.http_post = function(addr, data, func, timeout) {
	if(!addr) return;
	if(!func) return;
	if(typeof timeout=="undefined") timeout = 4000;

	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function (evt) {
		if(xhr.readyState != 4) return;

		if(xhr.status == 200) {
			func(xhr.responseText);
		} else {
			console.log(xhr.responseText);
			func(null);
		}
	};

	xhr.open("POST", addr, true);
	xhr.timeout = timeout;
	xhr.msCaching = "disabled"; //force reload (for IE)
	xhr.send(data);
};

window.lib.execute_js = function(input) {
	var regex = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;
	var m;
	//console.log(input);
	while (m = regex.exec(input)) {
		//console.log(m[1]);
		eval(m[1]);
	}
};

window.lib.conv_utf8_array_to_string = function(array) {
    var out, i, len, c;
    var char2, char3;

    out = "";
    len = array.length;
    i = 0;
    while(i < len) {
        c = array[i++];
        switch(c >> 4)
        {
        case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
            // 0xxxxxxx
            out += String.fromCharCode(c);
            break;
        case 12: case 13:
            // 110x xxxx   10xx xxxx
            char2 = array[i++];
            out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
            break;
        case 14:
            // 1110 xxxx  10xx xxxx  10xx xxxx
            char2 = array[i++];
            char3 = array[i++];
            out += String.fromCharCode(((c & 0x0F) << 12) | ((char2 & 0x3F) << 6) | ((char3 & 0x3F) << 0));
            break;
        }
    }

    return out;
}

window.lib.json_clone = function(obj) {
  return JSON.parse(JSON.stringify(obj));

  /*
  if (obj === null || typeof(obj) !== 'object' || 'isActiveClone' in obj)
	return obj;

  if (obj instanceof Date)
	var temp = new obj.constructor(); //or new Date(obj);
  else
	var temp = obj.constructor();

  for (var key in obj) {
	if (Object.prototype.hasOwnProperty.call(obj, key)) {
	  obj['isActiveClone'] = null;
	  temp[key] = clone(obj[key]);
	  delete obj['isActiveClone'];
	}
  }

  return temp;
  */
}

/*
window.lib.init_internal = function() {
	var list = document.getElementsByClassName("include");
	for(var u = 0; u < list.length; ++u) {
		var item = list[u];
		var src = item.getAttribute("src");
		var cb = function(response) {
			if(response == null) return;
			this.innerHTML = response;
			lib.execute_js(response);
			var onload = this.getAttribute("onload");
			if(!onload) return;
			var func = function() { eval(this); }.bind(onload);
			//console.log("onload: " + onload);
			window.setTimeout(func, 0);
		}.bind(item);
		lib.http_request(src, cb);
	}
};

//window.lib.init_internal();
window.setTimeout(lib.init_internal, 0);
*/
