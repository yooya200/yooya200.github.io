function TTSHandler()
{
	this.init = false;
	this.speechSynthesis = window.speechSynthesis;
	this.timeout = 5000;
	this.startTimestamp = 0;
	
	if (this.speechSynthesis != null)
	{
		this.speechSynthesis.cancel();
		this.init = true;
	}
	else
	{
		return;
	}

	this.isBusy = function()
	{
		return this.speechSynthesis.speaking;
	};
	
	this.play = function(msg)
	{
		this.startTimestamp = new Date().getTime();
		this.speechSynthesis.speak(msg);
	}
	
	this.clear = function()
	{
		this.speechSynthesis.cancel();
	}
	
	this.onDebugMessageEnd = function(ttsHandler)
	{
		var onSetupComplete = ttsHandler.onSetupComplete;

		if (onSetupComplete != null)
		{
			onSetupComplete();
		}
		
	};
	
	this.setup = function(string)
	{
		var msg = new SpeechSynthesisUtterance(string);
		msg.rate = 1.3;
		
		var onSetupError = this.onSetupError;
		var onDebugMessageEnd = this.onDebugMessageEnd;
		
		var target = this;
			
		msg.onerror = function(event)
		{
			if (onSetupError != null)
			{
				onSetupError(target);
			}
			
		};

		msg.onend = function(event)
		{
			var voices = target.speechSynthesis.getVoices();

			if (voices.length == 0)
			{
				if (onSetupError != null)
				{
					onSetupError(target);
				}
				
			}
			else
			{
				onDebugMessageEnd(target);
			}

		};

		this.speechSynthesis.cancel();
		this.speechSynthesis.speak(msg);
	};
	
	
	this.onSetupComplete = null;
	
	this.onSetupError = null;
}
