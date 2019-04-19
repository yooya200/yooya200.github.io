function SpecialChatPlayer()
{
	this.lastClip = null;
	this.clips = null;
	this.masterVolume = 1.0;
	
	this.isBusy = function()
	{
		return this.lastClip != null && this.lastClip.audio.paused == false;
	}
	
	this.play = function(clip)
	{
		clip.audio.volume = this.masterVolume * clip.volume;
		clip.audio.play();
		
		this.lastClip = clip;
	}
	
}

function SpecialChatClip()
{
	this.keyword = null;
	this.audio = null;
	this.volume = 1.0;
}