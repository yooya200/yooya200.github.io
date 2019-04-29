
function VoicewareSonic()
{
	this.setup = function(json)
	{
		this.name = "Sonic";
		this.prefix = json.prefix;
		this.syllableAudio = this.loadCharAudio(json.syllableAudio);
		this.wordAudio = this.loadCharAudio(json.wordAudio);
		this.sayQueue = [];
		this.sayTypes = [ 'syllable', 'word' ];
	};
	
	this.isBusy = function()
	{
		return this.sayQueue.length > 0 || this.isSaying();
	};
	
	this.isSaying = function()
	{
		if (this.syllableAudio.some(a => a.paused == false))
		{
			return true;
		}
		else if (this.wordAudio.some(a => a.paused == false))
		{
			return true;
		}
		
		return false;
	};
	
	this.clear = function()
	{
		this.sayQueue = [];
		this.syllableAudio.forEach(a => a.pause());
		this.wordAudio.forEach(a => a.pause());
	};
	
	this.play = function(string)
	{
		var voices = this.getTextVoice(string);
		
		for (var i = 0; i < voices.length; i++)
		{
			this.sayQueue.push(voices[i]);
		}
		
		this.say();
	};
	
	this.say = function()
	{
		if (this.isSaying() == true)
		{
			setTimeout(function(p) { p.say(); }, 100, this);
			return;
		}
		
		var queue = this.sayQueue;
		var voice = queue.shift();
		
		var set = null;
		
		if (voice == 'syllable')
		{
			set = this.syllableAudio;
		}
		else if (voice == 'word')
		{
			set = this.wordAudio;
		}
		
		var index = Math.floor(Math.random() * set.length);
		var audio = set[index];
		audio.pause();
		audio.volume = 1;
		audio.currentTime = 0;
		audio.playbackRate = 1;
		audio.play();
		
		setTimeout(function(p) { p.say(); }, 100, this);
	};
	
	this.getTextVoice = function(string)
	{
		var voices = [];
		
		for (var i = 0; i < string.length; i++)
		{
			var c = string.charAt(i);
			var code = string.charCodeAt(i);
			
			if (c == ' ')
			{
				voices[i] = 'word';
			}
			else
			{
				voices[i] = 'syllable';
			}
			
		}
		
		return voices;
		
	};
	
	this.loadCharAudio = function(array)
	{
		var audios = [];
		
		for (var i = 0; i < array.length; i++)
		{
			audios[i] = new Audio(array[i]);
		}
		
		return audios;
	};

}
