function ChatClient()
{
	this.onOpen = function(obj) { };
	this.onError = function(obj) { };
	this.onMessage = function(obj, json) { };
	this.onConfigNotify = function(obj) { };
	
	this.themeName = null;
	this.config = null;
	
	this.socket = new WebSocketWrapper();
	this.socket.Tag = this;
	
	this.socket.onOpen = function(obj)
	{
		var cc = this.Tag;
		
		cc.send('{"Type": "config_req","Name": "' + cc.themeName + '"}');

		cc.onOpen(obj.Tag);
	};
	
	this.socket.onError = function(obj)
	{
		obj.Tag.onError(obj.Tag);
	};
	
	this.socket.onMessage = function(obj, message)
	{
		var cc = obj.Tag;
		var json = JSON.parse(message);
		var type = json.Type;
		
		if (type == "config_ntf")
		{
			cc.config = json.Config;
			cc.onConfigNotify(cc);
		}
		else if (type == "chat")
		{
			var badges = json.Badges;
			var displayName = json.DisplayName;
			var color = json.Color;
			var components = json.components;
			
			cc.onMessage(obj.Tag, json.Message);
		}
		
	};
	
	this.send = function(json)
	{
		this.socket.send(json);
	};
	
}