"use strict";

window.host = function(){};

window.host.https = function () {
	return 'https://toon.at';
};

window.host.ws = function () {
	return 'wss://toon.at:8071';
};

window.host.ws_check = function () {
    return 'https://toon.at:8071/ping';
};

window.host.asset_root = function () {
    //return 'https://toothcdn.xyz/assets';
	return 'https://esfviinjshml2105872.cdn.ntruss.com/assets';	
}

window.host.template_root = function () {
    return 'https://toon.at/template';
}

window.host.proxy = function () {
    return 'https://toothcdn.xyz/proxy?p=';
}

window.host.upload = function() {
	return 'https://toothcdn.xyz/uploaded'
}