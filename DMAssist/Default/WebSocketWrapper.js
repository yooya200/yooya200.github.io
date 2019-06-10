function WebSocketWrapper()
{
	this.url = "";
	this.retryCount = 0;
	this.timeout = 1000;
	this.started = false;
	this.opened = false;
	this.closed = false;
	this.socket = null;
	
	this.onOpen = function(obj) { };
	this.onMessage = function(obj, message) { };
	this.onError = function(obj) { };
	
	this.start = function()
	{
		this.started = true;
		
		this.open(this);
		setTimeout(this.onWatchTick, this.timeout, this);
	};
	
	this.stop = function()
	{
		this.started = false;
		this.close();
	};
	
	this.onWatchTick = function(obj)
	{
		if (obj.started == true)
		{
			var state = obj.socket.readyState;
			
			if (state != WebSocket.CONNECTING && state != WebSocket.OPEN)
			{
				obj.onWebSocketError0(obj);
				
				obj.close(obj);
				obj.open(obj);
			}
			
			setTimeout(obj.onWatchTick, obj.timeout, obj);
		}
		
	}
	
	this.open = function(obj)
	{
		var socket = obj.socket = new WebSocket(obj.url);
		socket.Tag = obj;
		socket.onmessage = obj.onWebSocketMessage;
		socket.onopen = obj.onWebSocketOpen;
		socket.onerror = obj.onWebSocketError;
	};
	
	this.close = function()
	{
		this.opened = false;
		this.closed = true;
		
		var socket = this.socket;
		
		if (socket != null)
		{
			socket.close();
		}
		
	};
	
	this.onWebSocketError = function(e)
	{
		var obj = e.srcElement.Tag;
		obj.onWebSocketError0(obj);
	};
	
	this.onWebSocketError0 = function(obj)
	{
		obj.retryCount ++;
		obj.close(obj);
		
		obj.onError(obj);
		
		if (obj.closed != true)
		{
			obj.open(obj);
		}
		
	};
	
	this.onWebSocketOpen = function(e)
	{
		var obj = e.srcElement.Tag;
		obj.opened = true;
		obj.closed = false;
		obj.onOpen(obj);
	};
	
	this.send = function(data)
	{
		if (this.socket.readyState != WebSocket.OPEN)
		{
			this.onWebSocketError0(this);
			return;
		}
		
		this.socket.send(data);
	};
	
	this.onWebSocketMessage = function(e)
	{
		var obj = e.srcElement.Tag;
		obj.onMessage(obj, e.data);
	};
	
}