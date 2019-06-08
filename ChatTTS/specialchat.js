function SpecialChatPlayer()
{
	this.lastClip = null;
	this.clips = null;
	this.masterVolume = 1.0;
	
	this.isBusy = function()
	{
		var lastClip = this.lastClip;
		return lastClip != null && lastClip.audio.paused == false;
	}
	
	this.play = function(clip)
	{
		clip.audio.currentTime = 0;
		clip.audio.volume = this.masterVolume * clip.volume;
		clip.audio.play();
		
		this.lastClip = clip;
	}
	
	this.clear = function()
	{
		var lastClip = this.lastClip;
		
		if (lastClip != null)
		{
			lastClip.audio.pause();
		}
		
	}
	
}

function SpecialChatClip()
{
	this.keyword = null;
	this.audio = null;
	this.volume = 1.0;
}