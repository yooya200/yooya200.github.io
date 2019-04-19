
function VoicewareSans(json)
{
	this.name = "Sans";
	this.prefix = json.prefix;
	this.skipThreshold = json.skipThreshold;
	this.audio = new Audio(json.audio);
	this.sayQueue = [];
	
	this.isBusy = function()
	{
		var queue = this.sayQueue;
		return queue.length > 0 || this.audio.paused == false;
	}
	
	this.play = function(string)
	{
		for (var i = 0; i < string.length; i ++)
		{
			var c = string.charAt(i);
			var word = new SansWord();
			word.speed = 1;
			word.volume = (c === ' ') ? 0 : 1;
			this.sayQueue.push(word);
		}
		
		this.say();
	}

	this.say = function()
	{
		if (this.audio.paused == false && this.canSkip() == false)
		{
			setTimeout(function(p) { p.say(); }, 10, this);
			return;
		}
		
		var queue = this.sayQueue;
		var word = queue.shift();
		
		if(typeof word === 'undefined') {
			return;
		}
		
		this.audio.pause();
		this.audio.playbackRate = word.speed;
		this.audio.volume = word.volume;
		this.audio.currentTime = 0;
		this.audio.play();
		
		setTimeout(function(p) { p.say(); }, 10, this);
	}
	
	this.canSkip = function()
	{
		var ratio = this.audio.currentTime / this.audio.duration;
		return ratio >= this.skipThreshold;
	}
	
	function SansWord()
	{
		this.speed = 1.0;
		this.volume = 1.0;
	}
	
}
