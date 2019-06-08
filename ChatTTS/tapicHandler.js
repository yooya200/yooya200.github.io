function TapicHandler()
{
	this.setup = function(oauth, channelName)
	{
		var onJoin = this.onJoin;
		var onMessage = this.onMessage;
		
		TAPIC.setup(oauth, function(username)
		{
			TAPIC.setRefreshRate(10);
			
			if (channelName == "")
			{
				channelName = username;
			}

			TAPIC.joinChannel(channelName, function()
			{
				if (onJoin != null)
				{
					onJoin(channelName);
				}
				
				TAPIC.listen('message', function(e)
				{
					if (onMessage != null)
					{
						onMessage(e);
					}
					
				});

			});
		
		});

	};
	
	this.onJoin = null;
	
	this.onMessage = null;
}