function loadJavascript(url, callback, charset) {
    var head= document.getElementsByTagName('head')[0];
    var script= document.createElement('script');
    script.type= 'text/javascript';
    if (charset != null) {
        script.charset = "utf-8";
    }
    var loaded = false;
    script.onreadystatechange= function () {
        if (this.readyState == 'loaded' || this.readyState == 'complete') {
            if (loaded) {
                return;
            }
            loaded = true;
			
			if (callback != null)
			{
				callback(script);
			}
			
        }
		
    }
    script.onload = function () {
		
		if (callback != null)
		{
			callback(script);
		}
		
    }
    script.src = url;
    head.appendChild(script);
}