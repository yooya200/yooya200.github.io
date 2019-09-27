"use strict";
!function () {
	var str_validate = function (parent, name) {
		if (!(name in parent)) return false;
		if (parent[name] == null) return false;
		if (typeof parent[name] == "undefined") return false;
		if (parent[name].trim().length == 0) return false;
		return true;
	}
	var applyFilter = function (x, y) {
		if (!window.conf_restricted_text) return x;
		if (!window.conf_restricted_text["restricted_text_" + y]) return x;

		var z = x.toString();
		window.conf_restricted_text.restricted_text_filters.forEach(function (x) {
			z = z.split(x).join(window.conf_restricted_text.restricted_text_replaced_text);
		});
		z = z.replace(/\</g, "&lt;")
			.replace(/\>/g, "&gt;");
		return z;
	};
	var isForbiddenFiltered = function (x, y) {
		if (!x) return false;
		if (!window.conf_restricted_text) return false;
		if (!window.conf_restricted_text["forbidden_text_platform"]) return false;
		if (!window.conf_restricted_text["forbidden_text_" + y]) return false;

		var filtered = false, target = x.toLowerCase();
		var z = x.toString();
		window.conf_restricted_text.forbidden_text_filters.forEach(function (x) {
			var item = x.toLowerCase();
			if (target.indexOf(item) >= 0) {
				filtered = true;
				return false;
			}
		});
		return filtered;
	};

	var const_audio_load_retry_max = 8;
	var const_video_load_retry_max = 8;
	var const_video_load_timeout = 10000;
	var const_layout_count = 3;

	window.latest_type = "";
	window.ws = null;
	window.conf = null;
	window.conf_version = 0;
	window.conf_matched = null;
	window.conf_restricted_text = null;
	window.token = null;
	window.token_cache = {};
	window.scheduled = (function () {
		var KEY = "toonation-alertbox-queue-data";
		var values = [];

		if (window.localStorage) { // initial load
			try {
				values = window.localStorage.getItem(KEY);
				values = values ? JSON.parse(values) : [];
			} catch (e) {
				values = [];
			}
			if (!Array.isArray(values)) values = [];
		}

		var update = function () {
			if (!window.localStorage) return;
			window.localStorage.setItem(KEY, JSON.stringify(values));
		};

		return {
			get: function (index) {
				return values[index];
			},
			length: function() {
				return values.length;
			},
			shift: function () {
				var r = values.shift();
				update();
				return r;
			},
			push: function () {
				var r = values.push.apply(values, arguments);
				update();
				return r;
			}
		};
	})();
	window.last_donation = null;
	window.last_audio = null;
	window.last_donation_id = 0;
	window.poll_counter = {
		"twitch": 0,
		"google": 0,
	};
	window.remote_conf = aspx_remote_conf();
	window.alert_cleanup = null;
	window.video_player = null;
	window.video_process = null;
	window.video_running = false;
	window.video_payload_last = null;

	window.tts_volume = 1;
	window.video_volume = 1;
	window.recorder_volume = 1;
	window.roulette_volume = 1;

	window.latest_tts_audio = null;
	window.latest_recorder_audio = null;

	var print_dbg = function (t) {
		console.log(t);
		return;

		var p = $("#div_debug");
		p.innerHTML += t;
		p.innerHTML += '<br />';
	}
	var calc_tts_estimated_duration = function (_text) {
		return _text.length * 200;
	}

	window.video_ready = function () {
		var payload = window.video_payload_last;
		if (!payload) return;
		if (payload.player.src.length == 0) return;

		var obj = payload.obj;

		print_dbg('video_ready#' + obj.time);
		payload.player.play();

		if (payload.prev_position)
			payload.player.currentTime = payload.prev_position;
	}

	window.video_load = function (obj, payload, player) {
		print_dbg('video_load#' + obj.time);

		var video_info = obj.content.video_info;

		if (!player) {
			player = $("#js_player");

			payload.video_reload = 0;
			payload.player = player;
		}

		var _url = video_info.url;
		if (video_info.type == "youtube") {
			var _urls = video_info.urls;
			_url = _urls[0].url;

			//var threshold = (conf.donation.youtube.quality == "hd" ? 720 : 480);
			var threshold = 360;
			for (var u = 0; u < _urls.length; ++u) {
				var p = _urls[u];
				if (p.resolution <= threshold) {
					_url = p.url;
					break;
				}
			}
		}

		var delay = 3000;
		delay = obj.content.video_length * 1000;
		if (delay < 3000) delay = 3000;
		payload.close_delay = delay;

		player.src = _url + '#t=' + obj.content.video_begin;
		//if (video_info.thumbnail) player.poster = video_info.thumbnail;
		player.volume = video_volume;
		player.load();
	};
	window.video_finished = function () {
		if (!video_running) return;
		alert_cleanup_test();
	}
	window.video_suspend = function (p) {
		if (p.ended) return;
		if (p.paused) return;
		p.pause();
		p.src = '';
		p.load();
	}

	window.roulette_load = function (obj, style) {
		print_dbg('roulette_load#' + obj.time);

		window.roulette_prepare({
			input: obj.content.roulette.conf.items.map(function (x) { return x.name }),
			stage: obj.content.roulette.grade,
			result: obj.content.roulette.randomized_index,
			volume: obj.content.roulette.volume,
			callback: function () {
			},
			style: style
		});
	};

	window.playAnimation = function (layout, anim_off, anim_on, is_display) {
		if (is_display !== true) is_display = false;

		var t = $("#div_layout_" + layout);
		if (!t) return;

		var layouts = $.all(
			["video", "roulette_normal", "roulette_taebo", "1", "2", "3"]
				.map(function (x) { return "#div_layout_" + x })
				.join(",")
		);
		layouts.each(function () { this.removeClass(anim_off) });

		t.addClass(anim_on);
		if (is_display) t.removeClass("hidden");
		return true;
	};

	var conv_emote = function (text) {
		return text.replace(/#emote:([0-9]+)/g, '<img src="https://static-cdn.jtvnw.net/emoticons/v1/$1/1.0" />');
	}
	var conv_currency_unit = function (t) {
		switch (t) {
			case "USD": return "$";
			case "EUR": return "€";
			case "GBP": return "£";
			case "JPY":
			case "CNY":
				return "￥";
			case "CAD": return "CA$";
			case "AUD": return "AU$";
			case "NZD": return "NZ$";
			case "RUB":
			case "RUR":
				return "₽";
			case "CHF":
				return "Fr";
			case "NOK":
				return "Kr";
			case "KRW":
				return "₩";
			case "BTC":
				return "Ƀ";
			case "ETH":
				return "Ξ";
			default: return t;
		}
	}

	var audio_load = function (_link, volume, cb) {
		var handle = new Audio();
		handle.oncanplaythrough = function (e) { cb(handle); };
		handle.onerror = function (e) { cb(null) };
		handle.src = _link;
		handle.volume = volume;
		handle.load();
	}

	var measure_time = function (s) {
		return s.length * 120;
	}

	var get_code_name = function (code) {
		switch (code) {
			case 101: return "donation"; //WebPushServerCode.AlertDonation
			case 102: return "twitch_subs"; //WebPushServerCode.AlertTwitchSubscription
			case 103: return "twitch_follow"; //WebPushServerCode.AlertTwitchFollow
			case 104: return "twitch_host"; //WebPushServerCode.AlertTwitchHosting
			case 107: return "twitch_cheer"; //WebPushServerCode.AlertTwitchCheer
			case 108: return "youtube_subs"; //WebPushServerCode.AlertYoutubeSubscription
			case 109: return "youtube_schat"; //WebPushServerCode.AlertYoutubeSuperChat
			case 110: return "youtube_sponsor"; //WebPushServerCode.AlertYoutubeSponsor
			default: return null;
		}
	}

	var conv_title = function (obj, text) {
		var profile = null;

		if (!obj.content.hideinfo) {
			if (!str_validate(obj.content, "image"))
				profile = host.template_root() + "/alert/profile_" + conv_acctype(1) + ".png";
			else
				profile = obj.content.image;
		}

		if (!obj.content.hideinfo && obj.content.title_info) {
			text = text.replace(/{title_name}/g, obj.content.title_info.name);
			text = text.replace(/{title_color}/g, obj.content.title_info.color);

			if (obj.content.title_info.hash)
				profile = host.upload() + "/__special_title_img__/" + obj.content.title_info.hash + ".img?" + Date.now(); // Prevent cache
		} else {
			text = text.replace(/{title_name}/g, '');
		}

		if (profile === null) {
			return text.replace(/{profile}/g, "");
		} else {
			var html = $(".template-profile").html().replace(/{url}/g, profile);
			return text.replace(/{profile}/g, html);
		}
	};

	var make_text_generic = function (obj, _conf) {
		var text = $(".template-generic").innerHTML.trim();
		text = text.replace(/{content}/g, _conf.text_template);
		text = text.replace(/{name}/g, $(".template-name").innerHTML.trim());
		text = text.replace(/{month}/g, $(".template-month").innerHTML.trim());
		text = text.replace(/{profile}/g, "");

		text = text.replace(/{title_name}/g, '');
		text = text.replace(/{title_htmlclass}/g, 'hidden');

		text = text.replace(/{name}/g, applyFilter(obj.content.name, "nickname"));
		text = text.replace(/{anim}/g, _conf.text_ani);
		text = text.replace(/{color}/g, _conf.text_color);
		text = text.replace(/{highlight_color}/g, _conf.text_highlight_color);
		text = text.replace(/{fontsize}/g, _conf.text_size);
		text = text.replace(/{font}/g, _conf.text_font);
		text = text.replace(/{text}/g, text);

		//special parameters
		if (obj.content.count != undefined) text = text.replace(/{count}/g, obj.content.count);
		if (obj.content.amount_m != undefined) text = text.replace(/{amount}/g, obj.content.amount_m / 1000000);
		if (obj.content.unit != undefined) text = text.replace(/{unit}/g, conv_currency_unit(obj.content.unit));
		if (obj.content.month != undefined) {
			if (obj.content.month == 0)
				text = text.replace(/{month}/g, 1);
			else
				text = text.replace(/{month}/g, obj.content.month);
		}

		return text;
	}
	var make_text_donation_video = function (obj, _conf) {
		var text = $(".template-donation-video").innerHTML.trim();
		text = text.replace(/{content}/g, _conf.text_template);
		text = text.replace(/{name}/g, $(".template-name").innerHTML.trim());
		text = text.replace(/{amount}/g, $(".template-amount").innerHTML.trim());

		text = conv_title(obj, text);

		text = text.replace(/{name}/g, applyFilter(obj.content.name, "nickname"));
		text = text.replace(/{amount}/g, obj.content.amount);
		text = text.replace(/{anim}/g, _conf.text_ani);
		text = text.replace(/{color}/g, _conf.text_color);
		text = text.replace(/{highlight_color}/g, _conf.text_highlight_color);
		text = text.replace(/{fontsize}/g, _conf.text_size);
		text = text.replace(/{font}/g, _conf.text_font);
		text = text.replace(/{text}/g, text);
		return text;
	}
	var make_text_donation_roulette = function (obj, _conf) {
		var text = $(".template-donation-video").innerHTML.trim();
		text = text.replace(/{content}/g, _conf.message);
		text = text.replace(/{name}/g, $(".template-name").innerHTML.trim());
		text = text.replace(/{roulette}/g, $(".template-roulette").innerHTML.trim());
		text = text.replace(/{amount}/g, $(".template-amount").innerHTML.trim());

		text = conv_title(obj, text);

		text = text.replace(/{name}/g, applyFilter(obj.content.name, "nickname"));
		text = text.replace(/{roulette}/g, obj.content.roulette.name);
		text = text.replace(/{color}/g, _conf.text_color);
		text = text.replace(/{highlight_color}/g, _conf.text_highlight_color);
		text = text.replace(/{fontsize}/g, _conf.text_size);
		text = text.replace(/{font}/g, _conf.text_font);
		text = text.replace(/{amount}/g, _conf.price);
		return text;
	}
	var make_text_donation = function (obj, _conf) {
		var text = $(".template-donation").innerHTML.trim();

		text = text.replace(/{content}/g, _conf.text_template);
		text = text.replace(/{name}/g, $(".template-name").innerHTML.trim());
		text = text.replace(/{amount}/g, $(".template-amount").innerHTML.trim());
		text = text.replace(/{vote}/g, $(".template-vote").innerHTML.trim());

		text = conv_title(obj, text);

		text = text.replace(/{name}/g, applyFilter(obj.content.name, "nickname"));
		text = text.replace(/{amount}/g, obj.content.amount);
		text = text.replace(/{anim}/g, _conf.text_ani);
		text = text.replace(/{color}/g, _conf.text_color);
		text = text.replace(/{highlight_color}/g, _conf.text_highlight_color);
		text = text.replace(/{fontsize}/g, _conf.text_size);
		text = text.replace(/{font}/g, _conf.text_font);
		text = text.replace(/{text}/g, text);

		if (obj.content.gifticon || obj.content.wishlist) {
			if (obj.content.gifticon)
				text = text.replace(/{product}/g, obj.content.gifticon.name);
			else if (obj.content.wishlist)
				text = text.replace(/{product}/g, obj.content.wishlist.target.name);

			text = text.replace(/{color2}/g, _conf.text2_color);
			text = text.replace(/{fontsize2}/g, _conf.text2_size);
			text = text.replace(/{font2}/g, _conf.text2_font);
		} else if (obj.content.voting) {
			text = text.replace(/{vote}/g, obj.content.voting.count);
		}

		return text;
	}
	var make_text_donation2 = function (obj, _conf) {
		var content_prefix = "";
		if (obj.content.tts_provider == "special" && obj.content.tts_locale == "dog-v1")
			content_prefix = "\uD83D\uDC36";

		var text = $(".template-donation-content").innerHTML.trim();
		text = text.replace(/{content}/g, content_prefix + applyFilter(obj.content.message, "message"));

		text = text.replace(/{color2}/g, _conf.text2_color);
		text = text.replace(/{fontsize2}/g, _conf.text2_size);
		text = text.replace(/{font2}/g, _conf.text2_font);

		text = conv_emote(text);
		return text;
	}
	var conv_acctype = function (acc) {
		switch (acc) {
			case 1: return "twitch";
			case 2: return "google";
			default: return "unknown";
		}
	}

	var alert_cleanup_test = function () {
		console.log("cleanup test");
		last_donation_id = -1;
		if (alert_cleanup) {
			alert_cleanup.apply(this, arguments);
			alert_cleanup = null;
		}
	};
	var hide_layouts = function () {
		["video", "roulette_normal", "roulette_taebo", "1", "2", "3"].forEach(function (x) {
			$("#div_layout_" + x).addClass("hidden");
		});
	};

	var prev_ani_end = "";
	var load_content_generic = function (obj, code_name, conf_detail) {
		var content = obj.content;
		var conf_index = obj.content.conf_idx;
		var path_prefix = host.upload() + '/' + aspx_uid() + '/alert_' + code_name;

		var _conf;
		var text_func = make_text_generic;
		var imgsize = 0;
		var imgmargin = 0;
		var html = "";

		if (code_name == "twitch_subs") {
			if (!conf_index) {
				skip_content(1000);
				return;
			}
			conf_detail = conf_detail['item' + conf_index];
			path_prefix = host.upload() + '/' + aspx_uid() + '/alert_' + code_name + '_' + conf_index;
		}

		var layout = conf_detail.layout;
		hide_layouts();

		var t = $("#div_layout_" + layout);
		_conf = JSON.parse(JSON.stringify(conf_detail)); // Deep copy

		// Make texts (text_func)
		{
			var imgsize, imgmargin;
			var path = '';

			if (conf_detail.customized_image)
				path = path_prefix + '.img?v=' + window.conf_version;
			else
				path = host.template_root() + '/alert/alert.img';


			if (t.find(".js_img") != null) t.find(".js_img").prop("src", path);
			if (t.find(".js_bg") != null) t.find(".js_bg").css("backgroundImage", "url(" + path + ")");

			t.find(".js_text0").html("");

			var calculator = $("#text_calculator");
			var body_width = $("body").clientWidth;

			while (true) {
				var chtml = text_func(obj, _conf);

				imgsize = _conf.text_size * 40 / 24;
				imgmargin = imgsize + 10;
				chtml = chtml.replace(/{imgsize}/g, imgsize);
				chtml = chtml.replace(/{imgmargin}/g, imgmargin);

				calculator.html(chtml);
				if (calculator.clientWidth > body_width && _conf.text_size > 8)
					_conf.text_size--;
				else
					break;
			}
			//console.log(conf_matched.text_size + " -> " + _conf.text_size);

			html = text_func(obj, _conf);
			// html = html.replace(/{url}/g, profile);

			if (!obj.content.hideinfo) {
				imgsize = _conf.text_size * 40 / 24;
				imgmargin = imgsize + 10;
				html = html.replace(/{imgsize}/g, imgsize);
				html = html.replace(/{imgmargin}/g, imgmargin);
			}

			t.find(".js_text0").html(html);
		}

		var text1 = t.find(".js_text1");
		if (obj.content.message == undefined || obj.content.message == null || obj.content.message.length == 0) {
			text1.addClass("hidden");
		} else {
			text1.removeClass("hidden")
				.html(make_text_donation2(obj, conf_detail));
		}


		// Setup
		var id_cur = last_donation_id = Math.random();
		var func1 = function () {
			last_donation = obj;

			// var t = $("#div_layout_" + layout);
			playAnimation(layout, prev_ani_end, conf_detail.alert_ani_begin, true);
		}.bind(content);

		var cleanup = function () { // Cleanup
			//Prevent duplicated execution.
			if (this.value == 0) return;
			this.value = 0;

			// var t = $("#div_layout_" + layout);
			playAnimation(layout, conf_detail.alert_ani_begin, conf_detail.alert_ani_end);

			if (last_audio != null) {
				last_audio.pause();
				last_audio = null;
			}

			prev_ani_end = conf_detail.alert_ani_end;
			skip_content(1000);
		}.bind({ value: 1 });
		alert_cleanup = cleanup;

		setTimeout(func1, 1000);

		var _effect_link = conf_detail.customized_sound
			? path_prefix + '.snd?v=' + window.conf_version
			: host.template_root() + '/alert/alert_' + code_name + '.snd';

		audio_load(
			_effect_link,
			conf_detail.sound_volume * 0.01,

			function (handle) {
				var delay = 2000;
				if (id_cur != last_donation_id) return;
				if (handle != null) {
					handle.play();
					if (!isNaN(handle.duration))
						delay = 1000 * handle.duration;
				}

				if (delay < 1000) delay = 1000;

				if (obj.content.tts_link && obj.content.tts_link.length > 0) {
					var _link = obj.content.tts_link;
					setTimeout(
						function () {
							audio_load(_link, window.remote_conf.tts_volume * 0.01, function (handle) {
								window.latest_tts_audio = handle;

								var speed = conf.donation.tts.speed;
								if (isNaN(speed)) speed = 100;

								var dur = 1000;
								if (id_cur != last_donation_id) {
									// Skip, do not cleanup (already another donation displaying)
									return;
								} else if (handle == null) {
									print_dbg("failed to load audio: " + _link);
								} else {
									if (isNaN(handle.duration))
										dur += calc_tts_estimated_duration(obj.content.message);
									else
										dur += 1000 * handle.duration;

									if (handle.playbackRate != undefined) {
										speed = speed * 0.01;
										handle.playbackRate = speed;
										dur /= speed;
									}

									last_audio = handle;
									handle.play();
								}

								if (conf_detail.alert_remaining_time != undefined)
									dur += 1000 * conf_detail.alert_remaining_time;

								if (dur < 3000) dur = 3000;

								setTimeout(function () {
									if (id_cur == last_donation_id)
										alert_cleanup_test();
								}, dur);
							})
						},
						delay
					);
				} else {
					if (conf_detail.alert_remaining_time != undefined)
						delay += 1000 * conf_detail.alert_remaining_time;

					setTimeout(function () {
						if (id_cur == last_donation_id)
							alert_cleanup_test();
					}, delay);
				}
			}
		);
	}

	var load_content_donation = function (obj, conf_detail) {
		var content = obj.content;
		var conf_index = obj.content.conf_idx;

		hide_layouts();

		if (!!obj.content.roulette) { // Roulette.conf_index == -1
			conf_detail.alert_ani_begin = "fadeIn";
			conf_detail.alert_ani_end = "fadeOut";
		} else if (!!obj.content.wishlist) { // Wishlist.conf_index == -1
		} else if (!!obj.content.voting) { // Voting.conf_index == -1
		} else if (conf_index == -1) {
			skip_content(); // Cannot display
			return;
		}

		if (obj.content.gifticon || obj.content.wishlist)
			window.conf_matched = conf_detail;
		else if (obj.content.rec_link)
			window.conf_matched = conf_detail.recorder;
		else if (obj.code_ex == 300 || obj.code_ex == 400) {
			if (obj.content.video_noti)
				window.conf_matched = conf_detail.video_noti;
			else
				window.conf_matched = conf_detail.video_skip;
		}
		else
			window.conf_matched = conf_detail['item' + conf_index];

		if (typeof conf_matched == "undefined")
			conf_matched = conf_detail;

		var layout = "";
		layout = "layout" in conf_matched ? conf_matched.layout : "1";
		var path_prefix = host.upload() + '/' + aspx_uid() + '/alert_donation_' + conf_index;

		var special_type = "";
		switch (obj.code_ex) {
			case 200:
				special_type = "recorder";
				break;
			case 300:
			case 400:
				special_type = obj.content.video_noti ? "video_noti" : "video_skip";
				break;
			case 600:
				special_type = "gifticon";
				break;
			case 800:
				special_type = "wishlist";
				break;
			case 900:
				special_type = "voting";
				break;
		}

		if (special_type != "")
			path_prefix = host.upload() + '/' + aspx_uid() + '/alert_' + special_type;

		var id_cur = last_donation_id = Math.random();

		var video_info = obj.content.video_info;
		var video_enabled = (!!video_info);
		var video_payload = new Object();
		video_payload.obj = obj;
		video_payload_last = video_payload;

		var _conf = {};
		var text_func = function () { };
		var html = "";

		if (video_payload_last) {
			if (video_payload_last.video_load_retry) {
				clearTimeout(video_payload_last.video_load_retry);
				video_payload_last.video_load_retry = null;
			}
		}

		if (!!obj.content.roulette) { // roulette
			_conf = JSON.parse(JSON.stringify(obj.content.roulette.conf)); // Deep copy
			var name = obj.content.roulette.name;
			var style = '';
			var isTaebo = name.indexOf('태보') > -1;
			
			if (isTaebo)
			{
				style = "taebo";
			}
			else
			{
				style = "normal";
			}
			
			layout = 'roulette_' + style;
			
			setTimeout(function () {
				roulette_load(obj, style);
			}, 100);

			text_func = make_text_donation_roulette;
		} else if (video_enabled) { // youtube/twitch
			layout = "video";
			_conf = JSON.parse(JSON.stringify(conf_matched)); // Deep copy

			text_func = make_text_donation_video;
		} else {
			_conf = JSON.parse(JSON.stringify(conf_matched)); // Deep copy

			if (obj.code_ex == 300 || obj.code_ex == 400) {
				obj.content.message = "";// conf_matched.text_template; // window.locale.get("widget_alert_recorder_donation");
			} else if (obj.content.rec_link.length > 0) {
				obj.content.message = "";// conf_matched.text_template; // window.locale.get("widget_alert_recorder_donation");
			}


			text_func = make_text_donation;

			$("#div_layout_" + layout).find(".js_text1").html(make_text_donation2(obj, _conf))
				.removeClass("hidden");
		}

		// Make texts (text_func)
		{
			var imgsize, imgmargin;
			var path = '';
			if (obj.content.gifticon)
				path = obj.content.gifticon.image;
			else {
				if (obj.content.extra_image) {
					path = host.upload() + '/__special_extra_alert_img__/' + obj.content.extra_image + ".img";
				} else if (!!obj.content.roulette) {
					if (obj.content.roulette.customized_image)
						path = host.upload() + '/__special_roulette_img__/' + obj.content.roulette.hash + ".img";
					else
						path = host.template_root() + '/alert/alert.img';
				} else if (obj.content.wishlist && obj.content.wishlist.target.use_customized_image) {
					path = host.upload() + '/__special_wishlist_img__/' + obj.content.wishlist.hash + ".img";
				} else {
					if (conf_matched.customized_image)
						path = path_prefix + '.img?v=' + window.conf_version;
					else
						path = host.template_root() + '/alert/alert.img';
				}
			}

			var t = $("#div_layout_" + layout);
			if (t.find(".js_img") != null) t.find(".js_img").prop("src", path);
			if (t.find(".js_bg") != null) t.find(".js_bg").css("backgroundImage", "url(" + path + ")");

			t.find(".js_text0").html("");

			var calculator = $("#text_calculator");
			var body_width = $("body").clientWidth;

			while (true) {
				var chtml = text_func(obj, _conf);

				imgsize = _conf.text_size * 40 / 24;
				imgmargin = imgsize + 10;
				chtml = chtml.replace(/{imgsize}/g, imgsize);
				chtml = chtml.replace(/{imgmargin}/g, imgmargin);

				calculator.html(chtml);
				if (calculator.clientWidth > body_width && _conf.text_size > 8)
					_conf.text_size--;
				else
					break;
			}
			//console.log(conf_matched.text_size + " -> " + _conf.text_size);

			html = text_func(obj, _conf);
			// html = html.replace(/{url}/g, profile);

			if (!obj.content.hideinfo) {
				imgsize = _conf.text_size * 40 / 24;
				imgmargin = imgsize + 10;
				html = html.replace(/{imgsize}/g, imgsize);
				html = html.replace(/{imgmargin}/g, imgmargin);
			}

			t.find(".js_text0").html(html);
		}

		var cleanup = function (payload) {
			//Prevent duplicated execution.
			if (this.value == 0) return;
			this.value = 0;

			window.latest_type = "";

			// alert_cleanup = null;

			if (layout == "video") {
				if (!video_running) return;

				video_running = false;
				video_payload_last = null;
			}

			// var t = $("#div_layout_" + layout);
			playAnimation(layout, conf_matched.alert_ani_begin, conf_matched.alert_ani_end);

			prev_ani_end = conf_matched.alert_ani_end;

			if (last_audio != null) {
				last_audio.pause();
				last_audio = null;
			}

			setTimeout(function () {
				if (layout == "video" && (!!payload)) {
					video_suspend(payload.player);
					if (payload.video_load_retry) {
						clearTimeout(payload.video_load_retry);
						payload.video_load_retry = null;
					}
				}
				if (window.latest_recorder_audio) {
					window.latest_recorder_audio.pause();
				}
				skip_content();
			}, 1000);
		}.bind({ value: 1 });
		alert_cleanup = cleanup;

		// Setup
		var func1 = function (tts_delay, payload) {
			last_donation = obj;

			// var t = $("#div_layout_" + layout);
			playAnimation(layout, prev_ani_end, conf_matched.alert_ani_begin, true);

			if (!!obj.content.roulette) { // roulette
				window.roulette();
			} else if (video_enabled) { // youtube/twtich
				setTimeout(function () {
					video_load(obj, video_payload);
				}, 100);
				video_running = true;
				video_volume = window.remote_conf.video_volume * 0.01;
			} else if (obj.content.rec_link.length > 0) { // recording
				var _link = host.upload() + "/" + obj.content.rec_link;

				/*
				var dur = Math.floor(obj.content.rec_size / 14);
				print_dbg('rec_size: ' + obj.content.rec_size);
				print_dbg('dur: ' + dur);
				*/

				var _volume = window.remote_conf.recorder_volume;
				if (_volume == undefined) _volume = 100;

				var audio_handle = (function (link, volume) {
					var retry = 0;

					var handle_audio_end = function (handle) {
						if (handle._handled) return;
						handle._handled = 1;

						handle.pause();

						var dur = 0;
						if (conf_matched.alert_remaining_time != undefined)
							dur += 1000 * conf_matched.alert_remaining_time;

						if (Number.isNaN(dur) || (dur < 3000)) dur = 3000;

						//should not use handle.duration
						setTimeout(function () {
							if (id_cur == last_donation_id)
								alert_cleanup_test();
						}, dur);
					}

					return function (handle) {
						window.latest_recorder_audio = handle;

						if (id_cur != last_donation_id) {
							// Skip, do not cleanup (already another donation displaying)
						} else if (handle == null) {
							if (retry < const_audio_load_retry_max) {
								retry++;
								print_dbg("failed to load audio: " + _link + ", Retry (" + retry + "/" + const_audio_load_retry_max + ")");
								setTimeout(function () {
									audio_load(link, volume * 0.01, audio_handle);
								}, 1000);
							} else {
								print_dbg("failed to load audio: " + _link);
								if (id_cur == last_donation_id)
									alert_cleanup_test();
							}
							return;
						} else {
							last_audio = handle;
							if (!handle.onended) {
								handle.onended = handle.onerror = handle.onabort = function () {
									handle_audio_end.apply(this, [this]);
								};
								handle.ontimeupdate = function () {
									var t = this.currentTime;
									if (t >= obj.content.rec_play_length) {
										this.pause();
										handle_audio_end.apply(this, [this]);
									}
								}
							}
							handle.play();
						}
					};
				})(_link, _volume);
				audio_load(_link, _volume * 0.01, audio_handle);
			} else if (obj.content.tts_link.length > 0) { // readable
				var _link = obj.content.tts_link;
				var _delay = tts_delay;
				if (isNaN(_delay)) _delay = 1000;

				setTimeout(
					function () {
						audio_load(_link, window.remote_conf.tts_volume * 0.01, function (handle) {
							window.latest_tts_audio = handle;

							var speed = conf.donation.tts.speed;
							if (isNaN(speed)) speed = 100;

							var dur = 1000;
							if (handle == null) {
								print_dbg("failed to load audio: " + _link);
							} else if (id_cur != last_donation_id) {
								// Skip, do not cleanup (already another donation displaying)
								return;
							} else {
								last_audio = handle;
								if (isNaN(handle.duration))
									dur += calc_tts_estimated_duration(content.message);
								else
									dur += 1000 * handle.duration;

								if (handle.playbackRate != undefined) {
									speed = speed * 0.01;
									handle.playbackRate = speed;
									dur /= speed;
								}

								handle.play();
							}

							if (conf_matched.alert_remaining_time != undefined)
								dur += 1000 * conf_matched.alert_remaining_time;

							if (dur < 3000) dur = 3000;

							setTimeout(function () {
								if (id_cur == last_donation_id)
									alert_cleanup_test();
							}, dur);
						})
					},
					_delay
				);
			} else { // not readable
				var _delay = 5000;
				if (typeof conf_matched.alert_remaining_time != "undefined")
					_delay += 1000 * conf_matched.alert_remaining_time;

				setTimeout(function () {
					if (id_cur == last_donation_id)
						alert_cleanup_test();
				}, _delay);
			}
		}.bind(content);

		window.latest_type = "";
		if (!!obj.content.roulette) { // roulette
			window.latest_type = "roulette";
			setTimeout(func1, 100);
		} else if (video_enabled) { // youtube/twitch
			video_payload.postprocess = function () {
				try {
					$("#js_player").pause();
				} catch (e) { }

				if (video_payload.video_load_retry) {
					clearTimeout(video_payload.video_load_retry);
					video_payload.video_load_retry = null;
				}

				if (id_cur == last_donation_id)
					alert_cleanup_test();
			};
			setTimeout(func1, 100);
		} else { // readable/recording
			var snd_path = null;
			if (conf_matched.customized_sound)
				snd_path = path_prefix + '.snd?v=' + window.conf_version;
			else {
				//if (special_type != "")
				//	snd_path = host.template_root() + '/alert/alert_' + special_type + '.snd';
				//else
				snd_path = host.template_root() + '/alert/alert.snd';
			}

			audio_load(
				snd_path,
				conf_matched.sound_volume * 0.01,

				function (handle) {
					var delay = 1000;
					if (id_cur != last_donation_id) {
						// Skip, do not cleanup (already another donation displaying)
						return;
					} else if (handle != null) {
						last_audio = handle;
						handle.play();
						if (!isNaN(handle.duration))
							delay = 1000 * handle.duration;
					}

					setTimeout(function () { func1(delay, null); }, 100); //schedule is required.
				}
			);
		}
	}

	var handle_remote = function (obj) {
		switch (obj.code) {
			case 201: //RemoteCancel
				if (last_donation == null) return;
				//if (last_donation.code != 101) return; //Do not apply for non-donation alerts.
				alert_cleanup_test(video_payload_last);
				break;
			case 204: //RemoteSetVideoVolume
				window.remote_conf.video_volume = obj.value;
				$("#js_player").volume = obj.value * 0.01;
				break;
			case 205: //RemoteSetVideoCheck
				return;
			case 206: //RemoteSetAlertPause
				window.remote_conf.alert_pause = obj.value;
				break;
			case 207: //RemoteSetVideoHide
				window.remote_conf.video_hide = obj.value;

				if (window.remote_conf.video_hide)
					$("#js_player").addClass("hidden-force");
				else
					$("#js_player").removeClass("hidden-force");
				break;
			case 208: // RemoteSetRecorderVolume
				window.remote_conf.recorder_volume = obj.value;
				if (window.latest_recorder_audio && ("volume" in window.latest_recorder_audio)) {
					window.latest_recorder_audio.volume = obj.value * 0.01;
				}
				break;
			case 209: // RemoteSetRouletteVolume
				window.remote_conf.roulette_volume = obj.value;
				window.updateRouletteVolume(obj.value);
				break;
			case 210: // RemoteSetTTSVolume
				window.remote_conf.tts_volume = obj.value;
				if (window.latest_tts_audio && ("volume" in window.latest_tts_audio)) {
					window.latest_tts_audio.volume = obj.value * 0.01;
				}

				break;

			case 211: window.remote_conf.donation = obj.value; break;
			case 212: window.remote_conf.twitch_subs = obj.value; break;
			case 213: window.remote_conf.twitch_follow = obj.value; break;
			case 214: window.remote_conf.twitch_host = obj.value; break;
			case 215: window.remote_conf.twitch_cheer = obj.value; break;
			case 221: window.remote_conf.youtube_subs = obj.value; break;
			case 222: window.remote_conf.youtube_schat = obj.value; break;
			case 222: window.remote_conf.youtube_sponsor = obj.value; break;
			default: return;
		}
	}

	var reschedule_content = function (delay) {
		if (delay == undefined) delay = 100;

		var t = scheduled.shift();
		scheduled.push(t);
		setTimeout(load_content, delay);
	}

	var skip_content = function (delay) {
		if (delay == undefined) delay = 100;

		scheduled.shift();
		setTimeout(load_content, delay);
	}

	var update_video_link = function (obj) {
		var video_info = obj.content.video_info;

		if (video_info.type != "youtube") return false;
		if (video_info.engine != "default") return false;
		if (video_info.__updated__) return false;

		video_info.__updated__ = 1;
		var link = obj.content.message;
		var p = link.lastIndexOf("v=");
		if (p == -1) return false;

		var q = link.substring(p + 2);
		lib.http_request("https://toothcdn.xyz/youtube?v=" + q, function (resp) {
			if (resp == null) {
				load_content();
				return;
			}

			try {
				var x = JSON.parse(resp);
				if (x.url) video_info.url = x.url;
				if (x.url2) video_info.url2 = x.url2;
				if (x.url3) video_info.url3 = x.url3;
				if (x.urls) {
					if (x.urls.length > 0) {
						video_info.urls = x.urls;
					}
				}
			} catch (ex) {
				console.log(ex);
			}

			load_content();
		});

		return true;
	}
	var update_video_object = function (obj, payload, player) {
		var video_info = obj.content.video_info;

		if (video_info.type != "youtube") return false;
		if (video_info.engine != "default") return false;

		var link = obj.content.message;
		var p = link.lastIndexOf("v=");
		if (p == -1) return false;

		var q = link.substring(p + 2);
		lib.http_request("https://toothcdn.xyz/youtube?v=" + q, function (resp) {
			if (resp == null) {
				setTimeout(function () {
					update_video_object(obj, payload, player);
				}, 1000);
				return;
			}

			try {
				var x = JSON.parse(resp);
				if (x.url) video_info.url = x.url;
				if (x.url2) video_info.url2 = x.url2;
				if (x.url3) video_info.url3 = x.url3;
				if (x.urls) {
					if (x.urls.length > 0) {
						video_info.urls = x.urls;
					}
				}
			} catch (ex) {
				console.log(ex);
			}
			video_load(obj, payload, player);
		});

		return true;
	}

	var load_content = function () {
		last_donation = null;
		last_audio = null;

		if (!window.conf || scheduled.length() == 0 || window.remote_conf.alert_pause) {
			setTimeout(load_content, 100);
			return;
		}

		var obj = scheduled.get(0);

		if (obj.content.video_info) {
			if (update_video_link(obj))
				return;
		}

		var code = obj.code;
		var code_name = get_code_name(code);
		var conf_detail = conf[code_name];

		if (obj.content.gifticon)
			conf_detail = conf["gifticon"];
		else if (obj.content.wishlist) {
			conf_detail = conf["wishlist"];

			/* Wishlist skip */
			if (conf.wishlist.enabled == 0) {
				skip_content();
				return;
			}
		} else if (obj.content.voting)
			conf_detail = conf["voting"];
		else if (obj.code_ex == 300 || obj.code_ex == 400) {
			if (obj.content.video_info == null) {
				if (obj.content.video_noti)
					conf_detail = conf["donation"]["video_noti"];
				else
					conf_detail = conf["donation"]["video_skip"];
			} else {
				conf_detail = conf["donation"]["video"];
			}
		}

		var calculator = $("#text_calculator");
		calculator.innerHTML = "";

		if (conf_detail == undefined || conf_detail == null || conf_detail.enabled == 0 || (!obj.replay && window.remote_conf[code_name] == 0)) {
			skip_content();
			return;
		}

		if (isForbiddenFiltered(obj.content.name, "nickname")) {
			skip_content();
			return;
		}
		if (isForbiddenFiltered(obj.content.message, "message")) {
			skip_content();
			return;
		}

		if (code == 101) // WebPushServerCode.AlertDonation
			load_content_donation(obj, conf_detail);
		else
			load_content_generic(obj, code_name, conf_detail);
	}
	var set_content = function (obj) {
		switch (aspx_filter_code()) {
			case 121: //WebPushServerCode.AlertTwitchAny
				if (obj.code == 102) break; // WebPushServerCode.AlertTwitchSubscription
				if (obj.code == 103) break; // WebPushServerCode.AlertTwitchFollow
				if (obj.code == 104) break; // WebPushServerCode.AlertTwitchHosting
				if (obj.code == 107) break; // WebPushServerCode.AlertTwitchCheer
				return;
			case 122: //WebPushServerCode.AlertYoutubeAny
				if (obj.code == 108) break; // WebPushServerCode.AlertYoutubeSubscription
				if (obj.code == 109) break; // WebPushServerCode.AlertYoutubeSuperChat
				if (obj.code == 110) break; // WebPushServerCode.AlertYoutubeSponsor
				return;
			case 0: //no-filter
				break;
			default:
				if (aspx_filter_code() == obj.code) break;
				return;
		}

		console.log(obj);
		scheduled.push(obj);
	}
	window.get_twitch_user_image = function (client_id, user, cb_final) {
		var cb1 = function (resp) {
			if (resp == null) return;
			var obj1 = JSON.parse(resp);
			var logo = obj1.users[0].logo;
			cb_final(logo);
		};		
		var url1 = "https://api.twitch.tv/kraken/users/?login=" + user;
		lib.http_request_twitch_v5(url1, client_id, cb1);
	};
	window.post_twitch_follow = function (client_id, obj) {
		if (conf.twitch_follow.allow_duplication) {
			get_twitch_user_image(client_id, obj.content.account, function (icon) {
				this["content"]["image"] = icon;
				set_content(this);
			}.bind(obj));
		} else {
			var uri = host.https() + "/streamer/fetch/subscription/1/" + aspx_uid() + "?acc=" + obj.content.account + "&_=" + (new Date()).getTime();

			lib.http_request(uri, function (resp) {
				if (resp == null) return;

				var t = JSON.parse(resp);
				if (t.result) return;

				get_twitch_user_image(client_id, obj.content.account, function (icon) {
					this["content"]["image"] = icon;
					set_content(this);
				}.bind(obj));
			});
		}
	};
	window.post_google_subscription = function (obj) {
		if (conf.youtube_subs.allow_duplication) {
			set_content(obj);
		} else {
			var uri = host.https() + "/streamer/fetch/subscription/2/" + aspx_uid() + "?acc=" + obj.content.name + "&_=" + (new Date()).getTime();

			lib.http_request(uri, function (resp) {
				if (resp == null) return;

				var t = JSON.parse(resp);
				if (t.result) return;

				set_content(obj);
			});
		}
	};

	window.poll_twitch_follow = function (client_id) {
		if (window.token.twitch.extern_key == null) return;
		var uri = "https://api.twitch.tv/kraken/channels/" + window.token.twitch.extern_key + "/follows?limit=10&direction=desc&ts=" + new Date().getTime();

		lib.http_request_twitch_v5(uri, client_id, function (resp) {
			if (resp == null) return;

			var obj = JSON.parse(resp);
			var arr = obj["follows"];
			var first = !('twitch_last_follow' in window.token_cache);

			if (first) {
				window.token_cache.twitch_last_follow = 0;
				for (var u = 0; u < arr.length; ++u) {
					var p = arr[u];
					var q = Date.parse(p["created_at"]);
					if (q > window.token_cache.twitch_last_follow) window.token_cache.twitch_last_follow = q;
				}
				return;
			}

			if (arr.length == 0) return;
			var last = window.token_cache.twitch_last_follow;

			for (var u = 0; u < arr.length; ++u) {
				var p = arr[u];
				var q = Date.parse(p["created_at"]);
				var acc = p["user"]["name"];
				var name = p["user"]["display_name"];
				if (q <= last) continue;
				if (q > window.token_cache.twitch_last_follow) window.token_cache.twitch_last_follow = q;

				var rv = {
					"code": 103, //(int)WebPushServerCode.AlertTwitchFollow
					"content": {
						"account": acc,
						"name": name
					}
				};

				post_twitch_follow(client_id, rv);
			}
		});
	};
	
	var roulettesoundpack_normal = {};
	
	var initRouletteSoundPack = function(name)
	{
		var pathBase = "assets/roulettepacks/" + name + "/";
		var pack = {};
		
		pack.s_spin = [];
		var s_spin_path = pathBase + "sounds/roulette_spin.mp3";
		
		$$.getJSON(pathBase + "config.json", function(result)
		{
			pack.config = result;
			
			for (var i = 0; i < result.spinOverlapCount; i++)
			{	
				window.Concurrent.Load(s_spin_path, function (x)
				{
					pack.s_spin.push(new Audio(s_spin_path));
				}, "audio");
				
			}
					
		});
		
		pack.s_up = [];
		
		for (var i = 0; i < 4; i++)
		{
			pack.s_up.push(new Audio(pathBase + "sounds/roulette_up" + (i + 1) + ".mp3"));
		}
		
		pack.s_buzzer = new Audio(pathBase + "sounds/roulette_buzzer.mp3");
		pack.s_stop = new Audio(pathBase + "sounds/roulette_spinstop.mp3");
		pack.s_start = new Audio(pathBase + "sounds/roulette_spinstart.mp3");
		
		pack.bglist = [];
		
		for (var i = 1; i <= 5; i++)
		{
			var img = new Image();
			img.src = pathBase + "images/bar" + i + ".png";
			pack.bglist.push(img);
		}

		pack.stars = [];
		
		for (var i = 1; i <= 5; i++)
		{
			var img = new Image();
			img.src = pathBase + "images/star" + i + ".png";
			pack.stars.push(img);
		}

		return pack;
	};

	// Roulette
	!function () {
		var spinning = false, spin_idx = 0;
		var packs = {};
		packs["normal"] = initRouletteSoundPack("normal");
		packs["taebo"] = initRouletteSoundPack("taebo");
		
		var playSE = function (audio, volume, debug) {
			console.log(debug);
			try {
				audio.play();
			} catch (e) {
				console.warn(e);
			}
		};
		var updateVolumePack = function (vol, pack) {
			vol *= 0.01;
			pack.s_spin.forEach(function (x) { x.volume = vol });
			pack.s_up.forEach(function (x) { x.volume = vol });
			pack.s_buzzer.volume = vol;
			pack.s_stop.volume = vol;
			pack.s_start.volume = vol;
		};
		var updateVolume = function (vol) {
			
			var pname = null;
			
			for (pname in packs)
			{
				updateVolumePack(vol, packs[pname]);
			}
			
		};
		window.updateRouletteVolume = function (vol) {
			updateVolume(vol);
		};

		Array.prototype.shuffle = function () {
			var t = [], e = this;
			while (e.length > 0) {
				var idx = parseInt(Math.random() * e.length);
				t.push(e[idx]);
				e.splice(idx, 1);
			}
			return t;
		};

		var opt = {};
		var f = null;
		window.roulette_prepare = function (_opt) {
			console.log('룰렛 스타일=' + _opt.style);
			var pack = packs[_opt.style];
			
			opt = {
				stage: 0,
				role: 8,
				result: 0,
				input: [],
				callback: function () { }
			};
			var res_index = 0;
			for (var i in _opt) opt[i] = _opt[i];

			updateVolume(window.remote_conf.roulette_volume);

			var vcurrent = 0, vsum = 0;
			var nodes = [];

			for (var i = 0; i < opt.input.length; i++) {
				var c = opt.input[i], e = {
					index: i,
					display: c,
					"font-color": "#f9f9f9"
				};
				nodes.push(e);
			}
			nodes = nodes.shuffle();

			var nodelen = nodes.length;
			for (var i = 0; i < nodelen; i++) {
				if (nodes[i].index === opt.result) {
					res_index = i;
					break;
				}
			}

			var canvas = $("#roulette_" + _opt.style).attr("data-stage", 0);

			var fontSize = 48;
			var height_size = fontSize * 1.5;
			var target_stage = opt.stage;

			var accel = 0, accel_accum = 0;
			var phase = -1, stage = 0;
			var y = -nodelen * height_size, py = 0, py2 = 0;
			spinning = true;
			spin_idx = 0;

			var after = function (skip) {
				f = null;

				if (skip !== true) {
					if (opt.result === 0)
						playSE(pack.s_buzzer, opt.volume);
					else
						playSE(pack.s_stop, opt.volume);
				}

				setTimeout(alert_cleanup_test, 3000);
			};
			f = function () {
				if (window.latest_type != "roulette") {
					after(true);
					return;
				}

				var ctx = canvas.getContext("2d");
				ctx.font = fontSize + "px NanumSquare";

				switch (phase) {
					case -1: // startup
						accel_accum++;
						y = 0;
						py = height_size - 1;
						if (accel_accum >= 100) {
							accel_accum = 0;
							accel = -4;
							phase = 0;
							
							playSE(pack.s_start, opt.volume, spin_idx);
						}
						break;
					case 0: // reverse
						accel -= accel / 15;

						if (accel > -0.1) {
							phase = 1;
							accel = -accel;
							accel_accum = accel;
							py = y;
						}
						break;
					case 1: // accel
						accel = Math.min(accel + accel / 40, nodelen * opt.role);
						accel_accum += accel / 40;

						if (accel_accum >= nodelen * opt.role) {
							if (target_stage != stage) {
								stage++;
								accel_accum = -nodelen * opt.role;

								playSE(pack.s_up[stage - 1], opt.volume);
								canvas.attr("data-stage", stage);
							} else {
								phase = 2;
								y = 0;
								accel = (nodelen * opt.role + res_index - 2) / 60 * height_size;
							}
						}
						break;
					case 2: // inertia
						accel = Math.max(0, accel - accel / 60);
						if (accel < 0.02) {
							spin_idx = (spin_idx + 1) % pack.s_spin.length;
							playSE(pack.s_spin[spin_idx], opt.volume, spin_idx);
							spinning = false;
						}
						break;
				}

				y -= Math.min(nodelen * height_size, accel);
				if (Math.abs(py - y) >= height_size || (phase == 1 && Math.floor(y / height_size) != py2)) {
					py = y;
					py2 = Math.floor(y / height_size);

					spin_idx = (spin_idx + 1) % pack.s_spin.length;
					
					if ((spin_idx + pack.config.spinSoundModular - 1) % pack.config.spinSoundModular == 0)
					{
						playSE(pack.s_spin[spin_idx], opt.volume, spin_idx);
					}
				}
				while (y < -height_size * nodelen) y += height_size * nodelen;

				ctx.clearRect(0, 0, canvas.width, canvas.height);

				ctx.save();
				ctx.beginPath();
				ctx.rect(0, 20, canvas.width, canvas.height - 20);
				ctx.clip();

				ctx.filter = "blur(" + (accel / 55) + "px)";

				var w = canvas.width, h = canvas.height;

				var rounds = nodelen;
				while (rounds < 5) rounds += nodelen;

				for (var i = 0; (y - 12 + i * fontSize * 1.5) <= h; i++) {
					var c = nodes[i % nodelen];
					var m = ctx.measureText(c.display);

					ctx.fillStyle = c["font-color"];
					ctx.fillText(c.display, w / 2 - m.width / 2, y - 12 + i * fontSize * 1.5);
				}

				var grad = ctx.createLinearGradient(0, 20, 0, canvas.height);
				grad.addColorStop(0.33, "rgba(0,0,0,0)");
				grad.addColorStop(0.42, "rgba(0,0,0,1)");
				grad.addColorStop(0.72, "rgba(0,0,0,1)");
				grad.addColorStop(0.81, "rgba(0,0,0,0)");
				ctx.globalCompositeOperation = "destination-in";

				ctx.fillStyle = grad;
				ctx.fillRect(0, 20, canvas.width, canvas.height - 20);
				ctx.restore();

				ctx.save();
				ctx.globalCompositeOperation = "destination-over";
				ctx.drawImage(pack.bglist[stage], 0, 0);
				ctx.restore();

				ctx.drawImage(pack.stars[stage], w / 2 - pack.stars[stage].width / 2, 0);

				if (spinning)
					setTimeout(f, 10);
				else
					setTimeout(after, 500);
			};
		};
		window.roulette = function () {
			if (f != null) f();
		};
	}();

	var poll_twitch = function () {
		window.poll_counter.twitch += 1;
		if (window.poll_counter.twitch < 3) return;
		window.poll_counter.twitch = 0;

		var client_id = consts.streamer_twitch_client_id();

		poll_twitch_follow(client_id);
	};
	var poll_counter = 0;
	var poll = function () {
		setTimeout(poll, 1000);
		if (window.token == null) return;

		if (window.token.twitch) poll_twitch();
	};
	var prepare = function () {
		var hideAnim = function () {
			if (this.hasClass(prev_ani_end))
				this.addClass("hidden");
		};

		["video", "roulette_normal", "roulette_taebo", "1", "2", "3"].forEach(function (layout) {
			var q = $("#div_layout_" + layout);
			q.addEventListener("webkitAnimationEnd", hideAnim);
			q.addEventListener("mozAnimationEnd", hideAnim);
			q.addEventListener("MSAnimationEnd", hideAnim);
			q.addEventListener("oanimationend", hideAnim);
			q.addEventListener("animationend", hideAnim);
		});

		var agent = window.navigator.userAgent;
		var chrome = /Chrome\/([0-9]+)/;
		if (chrome.test(agent))
			$("html").addClass("chrome" + chrome.exec(agent)[1]);
	};

	var patch_video = function () {
		var obj = $("video");
		var indicator = $(".video-indicator-wrapper");
		if (!obj || !indicator) return;

		var show = function (e) {
			(function () {
				var payload = window.video_payload_last;
				if (!payload) return;

				var time = this.currentTime;

				console.debug("show", e);
				indicator.removeClass("hidden");

				if (!payload.timeout_id) {
					payload.timeout_id = setTimeout(function () {
						payload.postprocess(payload);
					}, Math.max(const_video_load_timeout, payload.close_delay - (time - payload.obj.content.video_begin) * 1000));
				}

				var obj = payload.obj, player = (payload.player || $("#js_player"));
				if (!payload.video_load_retry) {
					payload.video_load_retry = setTimeout(function () {
						payload.first_loaded = false;

						payload.prev_position = player.currentTime;
						player.pause();

						if (payload.video_reload < const_video_load_retry_max) {
							payload.video_reload += 1;
							print_dbg('video_reload#' + obj.time + " " + payload.video_reload);

							update_video_object(obj, payload, player);
						} else {
							print_dbg('video_timeout#' + obj.time);
							payload.postprocess(null);
							payload.video_load_retry && clearTimeout(payload.video_load_retry);
							payload.video_load_retry = null;
						}
					}, const_video_load_timeout);
				} else if (e.type == "error") {
					console.warn("Yes, error!");
					payload.prev_position = player.currentTime;
					payload.first_loaded = false;

					player.pause();

					if (payload.video_reload < const_video_load_retry_max) {
						payload.video_reload += 1;
						print_dbg('video_reload#' + obj.time + " " + payload.video_reload);

						update_video_object(obj, payload, player);
					} else {
						print_dbg('video_timeout#' + obj.time);
						payload.postprocess(null);
						payload.video_load_retry && clearTimeout(payload.video_load_retry);
						payload.video_load_retry = null;
					}
				}
			}).call(this);
		};
		var hide = function (e) {
			var payload = window.video_payload_last;
			if (!payload) return;

			console.debug("hide", e);
			indicator.addClass("hidden");

			if (payload.timeout_id) {
				clearTimeout(payload.timeout_id);
				payload.timeout_id = null;
			}
			if (payload.video_load_retry) {
				clearTimeout(payload.video_load_retry);
				payload.video_load_retry = null;
			}
		};
		var updated = function (e) {
			var payload = window.video_payload_last;
			if (!payload) return;

			// Run immediately
			var time = this.currentTime;
			if (time >= payload.obj.content.video_begin + payload.obj.content.video_length) {
				if (payload.timeout_id) {
					clearTimeout(payload.timeout_id);
					payload.timeout_id = null;
				}
				payload.postprocess(payload);
			}
		};

		var done = function (e) {
			var payload = window.video_payload_last;
			if (!payload) return;

			if (payload.timeout_id) {
				clearTimeout(payload.timeout_id);
				payload.timeout_id = null;
			}
			payload.postprocess(payload);
		};
		var ready = function () {
			var payload = window.video_payload_last;
			if (!payload) return;

			if (payload.first_loaded) return;
			payload.first_loaded = true;

			video_ready();
		};

		obj.event("loadstart waiting stalled seeking error abort", show);
		obj.event("loadeddata ended seeked playing play", hide);
		obj.event("timeupdate", updated);
		obj.event("ended", done);
		obj.event("canplaythrough", ready);
	};

	window.load_controller_conf = function () {
		lib.http_request('http://127.0.0.1:8282/streamer/fetch/controller_conf/' + aspx_uid(), function (resp) {
			if (resp == null) return;
			console.log(resp);
			window.remote_conf = JSON.parse(resp);

			if (window.remote_conf.video_hide)
				$("#js_player").addClass("hidden-force");
			else
				$("#js_player").removeClass("hidden-force");
		});
	};

	var ws_reload = function(){
		if(ws != null){
			ws = null;
			$("#div_disconnect").removeClass("hidden-force");
			update_reload();
		}
	};
	window.init_websocket = function () {
		ws = new WebSocket(host.ws() + "/" + aspx_payload());

		ws.onopen = function (evt) { print_dbg("ws: opened"); };
		ws.onerror = function (evt) { print_dbg("ws: error"); };
		ws.onclose = function (evt) {
			console.log("ws: closed");
			ws_reload();
		};

		ws.onmessage = function (evt) {
			if (evt.data == "#pong") {
				websocket_ping_count_reset();
				return;
			}

			try {
				var obj = JSON.parse(evt.data);
				if ('remote' in obj) {
					console.log(obj);
					handle_remote(obj);
					return;
				}
				if ('conf' in obj) {
					conf = obj.conf;
					conf_postprocess_alert(conf);
				}
				if ("conf_restricted_text" in obj) {
					window.conf_restricted_text = obj.conf_restricted_text;
					if (!("restricted_text_replaced_text" in window.conf_restricted_text))
						window.conf_restricted_text = null;
				}
				if ('conf_version' in obj) {
					window.conf_version += 1; // obj.conf_version;
				}
				if ('token' in obj) {
					console.log("token received.");
					console.log(obj.token);

					if (window.token) {
						if (obj.token.google) {
							if (window.token.google) {
								window.token.google.value = obj.token.google.value;
								window.token.google.life = obj.token.google.life;
							} else
								window.token.google = obj.token.google;
						}
					} else {
						window.token = obj.token;
					}

					if (window.token.google) {
						window.token_cache.google_token_life = Date.now() + window.token.google.life * 1000;
					}
				}
				if (conf == null) return;
				if (!('content' in obj)) return;

				set_content(obj);
			} catch (ex) {
				print_dbg('ws: message exception');
				console.log(evt.data);
			}
		};
	};
	window.run = function () {
		prepare();

		poll();
		load_controller_conf();
		init_websocket();
		init_websocket_ping_loop(
			function () { return window.ws; },
			function () { if (ws) ws.close(); ws_reload(); }
		);
		load_content();
		print_dbg("run()");

		patch_video();
	}
}();
