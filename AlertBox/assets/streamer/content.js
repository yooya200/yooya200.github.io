window.const_reload_countdown = 5;
window.const_reload_check_max = 1;
window.const_websocket_ping_period = 12000;
window.const_websocket_ping_count_max = 5;
window.reload_count = const_reload_countdown;
window.reload_check = 0;
window.reloading = 0;
window.websocket_ping_count = 0;
window.websocket_ping_task_payload = null;

window.websocket_ping_task = function() {	
	//console.log("websocket_ping_task()");
	setTimeout(websocket_ping_task, const_websocket_ping_period);
	
	var payload = websocket_ping_task_payload;
	if (!payload) return;	
	if (reloading) return;
	
	var ws = payload.getws();
	if (!ws) return;
	
	if (window.websocket_ping_count == 0) {
		console.log("websocket_ping_task() timed out");
		try { payload.timeoutcb(); } catch (ex) {}
		return;
	}
	
	window.websocket_ping_count -= 1;
	try { ws.send("#ping"); } catch (ex) {}
	//console.log("websocket_ping_task() send ping");
}

window.websocket_ping_count_reset = function() {
	console.log("websocket_ping_count_reset()");
	window.websocket_ping_count = const_websocket_ping_count_max;	
}

window.init_websocket_ping_loop = function(getws, timeoutcb) {
	var payload = {};
	payload.getws = getws;
	payload.timeoutcb = timeoutcb;
	websocket_ping_task_payload = payload;
	websocket_ping_count_reset();
	setTimeout(websocket_ping_task, const_websocket_ping_period);
}

window.perform_reload_next = function() {
    lib.http_request('/tools/runtime', function (resp) {
        if (resp) {
            if (reload_check < const_reload_check_max) {
                reload_check += 1;
                reload_count = const_reload_countdown;
                update_reload();
                return;
            }

            var obj = JSON.parse(resp);

            if (obj["widget_reload"]) {
                location.reload();
            } else {
				websocket_ping_count_reset();
                reload_count = const_reload_countdown;
                document.querySelector("#div_disconnect").addClass("hidden-force");
                init_websocket();
				window.reloading = 0;
            }
        } else {
            reload_check = 0;
            reload_count = const_reload_countdown;
            update_reload();
        }
    });
}

window.perform_reload = function () {
	lib.http_request(host.ws_check(), function (resp) {
		if (resp) {
			perform_reload_next();
			return;
		}
		reload_check = 0;
		reload_count = const_reload_countdown;
		update_reload();
	});
};

window.update_reload = function () {
	window.reloading = 1;
	
    var timer = $("#label_disconnect_timer");
	if(timer) timer.html( reload_count.toString() );
	reload_count -= 1;

	if (reload_count >= 0)
		setTimeout(update_reload, 1000);
	else
		perform_reload();
};
