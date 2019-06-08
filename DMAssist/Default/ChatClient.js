function ChatClient()
{
	this.onOpen = function(obj) { };
	this.onError = function(obj) { };
	this.onMessage = function(obj, json) { };
	this.onConfigNotify = function(obj) { };
	
	this.config = null;
	
	this.socket = new WebSocketWrapper();
	this.socket.Tag = this;
	
	this.socket.onOpen = function(obj)
	{
		var cc = this.Tag;
		
		cc.readConfig(function()
		{
			var name = cc.config.Name;
			cc.send('{"Type": "config_req","Name": "' + name + '"}');
		});
	
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
			cc.readConfig(function() { cc.onConfigNotify(cc); });
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
	
	this.readConfig = function(complete)
	{
		var urihost = new URL(window.location.href);
		var configUri = "./dmaconfig.json";
		
		var obj = this;
		var configResponse = $.getJSON(configUri);

		configResponse.complete(function ()
		{
			if (configResponse.status == 200)
			{
				obj.config = configResponse.responseJSON;
				
				if (complete != null)
				{
					complete();
				}
				
			}

		});

	}
	
	this.send = function(json)
	{
		this.socket.send(json);
	};
	
}