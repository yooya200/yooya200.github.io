function TapicHandler()
{
	this._joinedChannels = [];
};

TapicHandler.prototype.joinedChannels = function(){ return [...this._joinedChannels]; };

TapicHandler.prototype.setup = function(oauth)
{
	this.ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443");
	this.ws.onopen = e =>
	{
		this.ws.send("CAP REQ :twitch.tv/tags twitch.tv/commands");
		this.ws.send("PASS oauth:" + oauth);
		this.ws.send("NICK justinfan123");
		
		this.onOpen();
	};
	this.ws.onmessage = this.onIRCMessage.bind(this);
};

TapicHandler.prototype.join = function(channelName)
{
	this.ws.send("JOIN #" + channelName);
	this._joinedChannels.push(channelName);
};

TapicHandler.prototype.part = function(channelName)
{
	let index = this.joinedChannels().indexOf(channelName);
	
	if (index > -1)
	{
		this.ws.send("PART #" + channelName);
		this._joinedChannels.splice(index, 1);
	}
	
};

TapicHandler.prototype.onIRCMessage = function(e)
{
	let data = e.data;
	
	let indexOf = function(input, separator)
	{
		let index = input.indexOf(separator);
		return index == -1 ? input.length : index;
	};
	
	while (data)
	{
		let r = indexOf(data, "\r");
		let n = indexOf(data, "\n");
		
		if (r || n)
		{
			let line = data.substring(0, Math.min(r, n));
			
			if (line)
			{
				this.processLine(line);
			}
			
			data = data.substring(line.length + 1);
		}
		
	}
	
};

TapicHandler.prototype.getTagValue = function(tags, key)
{
	let keySeparator = "=";
	let prefix = key + keySeparator;
	
	for (let tag of tags)
	{
		if (tag.startsWith(prefix) == true)
		{
			return tag.substring(prefix.length);
		}
		
	}
	
	return undefined;
}

TapicHandler.prototype.processLine = function(data)
{
	let tagPrefix = "@";
	let tagSuffix = " ";
	let tagContains = data.startsWith(tagPrefix);
	let tagEndIndex = tagContains ? data.indexOf(tagSuffix) : -1;
	let tagToString = tagContains ? data.substring(tagPrefix.length, tagEndIndex) : "";
	let tags = tagToString.split(";");
	
	let userPrefix = ":";
	let userSuffix = " ";
	let userStartIndex = data.indexOf(userPrefix, tagEndIndex) + userPrefix.length;
	let userEndIndex = data.indexOf(userSuffix, userStartIndex);
	let user = data.substring(userStartIndex, userEndIndex);
	let userIdIndex = user.indexOf("!");
	let userId = userIdIndex == -1 ? user : user.substring(0, userIdIndex);
	
	let commandSuffix = " ";
	let commandStartIndex = userEndIndex + userSuffix.length;
	let commandEndIndex = data.indexOf(commandSuffix, commandStartIndex);
	let command = data.substring(commandStartIndex, commandEndIndex);
	
	let channelSuffix = " ";
	let channelStartIndex = commandEndIndex + commandSuffix.length;
	let channelEndIndex = data.indexOf(channelSuffix, channelStartIndex);
	let channel = channelEndIndex == -1 ? "" : data.substring(channelStartIndex, channelEndIndex);
	
	let message = channelEndIndex == -1 ? data.substring(channelStartIndex) : data.substring(channelEndIndex + channelSuffix.length);
	
	if (command == "PING")
	{
		this.ws.send("PONG :tmi.twitch.tv");
	}
	else if (command == "PONG")
	{
		this.ws.send("PING :tmi.twitch.tv");
	}
	else if (command == "JOIN")
	{
		this.onJoin(message.substring(1));
	}
	else if (command == "PRIVMSG")
	{
		let e = {};
		e.mod = false;
		e.streamer = false;
		e.from = userId;
		e.text = message.substring(1);
		e.badges = [];
		e.displayName = this.getTagValue(tags, "display-name");
		e.emotes = this.getTagValue(tags, "emotes");
		this.onMessage(e);
	}
	
};

TapicHandler.prototype.onOpen = function()
{
	
};

TapicHandler.prototype.onJoin = function(channelName)
{
	
};

TapicHandler.prototype.onMessage = function(e)
{
	
};
