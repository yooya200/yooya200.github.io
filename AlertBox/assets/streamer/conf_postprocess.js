"use strict";
if (!window.conf_postprocess_localization) {
	window.conf_postprocess_localization = {
		"ticker": {
			"text_template_donation": "{name}: {amount}원 기부!",
			"text_template_twitch_subs": "{name}님이 {month}개월 구독하셨습니다!",
			"text_template_twitch_follow": "{name}님이 팔로우하셨습니다!",
			"text_template_twitch_hosting": "{name}님이 호스팅하셨습니다!",
			"text_template_twitch_cheer": "{name}님이 {amount}비트를 주셨습니다!",
			"text_template_youtube_subs": "{name}님이 구독하셨습니다!",
			"text_template_youtube_schat": "{name}님이 슈퍼챗으로 {amount}{unit}을 주셨습니다!",
			"text_template_youtube_sponsor": "{name}님이 VIP 가입해주셨습니다!!",
		},
		"alert_message": {
			"donation": "{name}님 {amount}원 후원 감사합니다!",
			"voting": "{name}님이 {amount}원을 사용하여 {vote}표를 행사하셨습니다!",
			"gifticon": "{name}님이 {product}을(를) 선물하셨습니다!",
			"twitch_cheer": "{name}님이 {count}비트를 기부하셨습니다!",
			"youtube_subs": "{name}님이 구독 해주셨습니다!",
			"youtube_schat": "{name}님이 {amount}{unit}을(를) 기부하셨습니다!",
			"youtube_sponsor": "{name}님 VIP 스폰서 가입 감사합니다!"
		},
		"goal": {
			"goal_title": "기부 목표",
		},
		"rank": {
			"template_rank": "{rank}등",
			"template_cash": "{amount}원",
		},
		"wishlist": {
			"title_text": "내 위시리스트",
			"product_name": "상품",
			"message_requested": "후원 부탁드립니다.",
			"message_completed": "후원해 주셔서 감사합니다.",
			"text_template": "{name}님이 {product}을(를) 선물하셨습니다!",
		}
	};
}

window.conf_donation_pages_maximum = function () {
	return 100;
};

window.conf_raffle_items_maximum = function () {
	return 20;
};

window.conf_postprocess_event = function (__conf__) {
	if (__conf__["show_subs"]) {
		if (!__conf__["show_twitch_subs"]) {
			__conf__["show_twitch_subs"] = __conf__["show_subs"];
		}
		delete __conf__["show_subs"];
	}
	if (__conf__["show_follow"]) {
		if (!__conf__["show_twitch_follow"]) {
			__conf__["show_twitch_follow"] = __conf__["show_follow"];
		}
		delete __conf__["show_follow"];
	}
	if (__conf__["show_host"]) {
		if (!__conf__["show_twitch_host"]) {
			__conf__["show_twitch_host"] = __conf__["show_host"];
		}
		delete __conf__["show_host"];
	}
	if (__conf__["show_cheer"]) {
		if (!__conf__["show_twitch_cheer"]) {
			__conf__["show_twitch_cheer"] = __conf__["show_cheer"];
		}
		delete __conf__["show_cheer"];
	}
	if (!__conf__["show_youtube_subs"]) {
		__conf__["show_youtube_subs"] = 0;
	}
	if (!__conf__["show_youtube_schat"]) {
		__conf__["show_youtube_schat"] = 0;
	}
	if (!__conf__["show_youtube_sponsor"]) {
		__conf__["show_youtube_sponsor"] = 0;
	}
};

window.conf_postprocess_ranking = function (__conf__) {
	if (Object.keys(__conf__).length == 0) {
		var obj = {
			"head_font": "Jeju Gothic",
			"head_size": 24,
			"head_rank_color": "#FFFFFF",
			"head_name_color": "#FFFFFF",
			"tail_font": "Jeju Gothic",
			"tail_size": 24,
			"tail_rank_color": "#FFFFFF",
			"tail_name_color": "#FFFFFF",
			"flow_spacing": 10,
			"flow_speed": 20,
			"title_text": "",
			"title_font": "Jeju Gothic",
			"title_size": 24,
			"title_color": "#000000",
			"widget_style": "simple",
			"group_by": "account",
			"target_period": "monthly",
			"target_from": "2016-01-01",
			"target_to": "2025-12-31",
			"show_cash": 1,
			"template_name": "{name}",
			"template_rank": window.conf_postprocess_localization.rank.template_rank,
			"template_cash": window.conf_postprocess_localization.rank.template_cash,
			"display_count": 5
		};

		var keys = Object.keys(obj);
		for (var u = 0; u < keys.length; ++u) {
			var k = keys[u];
			__conf__[k] = obj[k];
		}
	}
};

window.conf_postprocess_donagoal = function (__conf__) {
	if (!("cash_base" in __conf__)) __conf__.cash_base = 0;
	if (!("widget_style" in __conf__)) __conf__.widget_style = "default";
	if (!("show_percentage" in __conf__)) __conf__.show_percentage = 1;
	if (!("bar_color" in __conf__)) __conf__.bar_color = "#42A5F5";
	if (!("bar_background_color" in __conf__)) __conf__.bar_background_color = "#FFFFFF";
	if (!("widget_style" in __conf__)) __conf__.widget_style = "default-single-line";
	if (!("text_title" in __conf__)) __conf__.text_title = window.conf_postprocess_localization.goal.text_title;

	var datetime = function (x) {
		var regex = [
			[/^([0-9]{4})[\/-]([0-9]{2})[\/-]([0-9]{2})$/, "$1-$2-$3T00:00:00"],
			[/^([0-9]{4})[\/-]([0-9]{2})[\/-]([0-9]{2}) ([0-9]{2}\:[0-9]{2})$/, "$1-$2-$3T$4:00"],
			[/^([0-9]{4})[\/-]([0-9]{2})[\/-]([0-9]{2})T([0-9]{2}\:[0-9]{2}\:[0-9]{2}$)/, "$1-$2-$3T$4"]
		];
		for (var i = 0; i < regex.length; i++) {
			if (regex[i][0].test(x)) {
				var date = new Date(x.replace(regex[i][0], regex[i][1]));
				var m = date.getMonth() + 1;
				var d = date.getDate();
				var h = date.getHours();
				var i = date.getMinutes();
				var s = date.getSeconds();

				return String.format(
					"{0}-{1}-{2} {3}:{4}:{5}",
					date.getFullYear(),
					m > 9 ? m : '0' + m,
					d > 9 ? d : '0' + d,
					h > 9 ? h : '0' + h,
					i > 9 ? i : '0' + i,
					s > 9 ? s : '0' + s
				);
			}
		}
		return x;
	};
	if ("date_begin" in __conf__)
		__conf__.date_begin = datetime(__conf__.date_begin);
	if ("date_end" in __conf__)
		__conf__.date_end = datetime(__conf__.date_end);

	if (!("detailed_conf" in __conf__)) {
		__conf__.detailed_conf = {
			"default": {
				"bar_height": 40,
				"title_color": "#FFFFFF",
				"title_font": "Jeju Gothic",
				"title_font_size": 24,
				"content_color": "#FFFFFF",
				"content_font": "Jeju Gothic",
				"content_font_size": 24,
				"content_outline": 1
			},
			"default-single-line": {
				"bar_height": 40,
				"title_color": "#FFFFFF",
				"title_font": "Jeju Gothic",
				"title_font_size": 24,
				"content_color": "#FFFFFF",
				"content_font": "Jeju Gothic",
				"content_font_size": 24,
				"content_outline": 1
			},
			"simple": {
				"bar_height": 40,
				"content_color": "#FFFFFF",
				"content_font": "Jeju Gothic",
				"content_font_size": 24,
				"content_outline": 1
			}
		};
	}
};


window.conf_postprocess_ticker = function (__conf__) {
	// name conversions.
	if (__conf__["text_template"]) {
		if (!__conf__["text_template_donation"]) {
			__conf__["text_template_donation"] = __conf__["text_template"];
		}
		delete __conf__["text_template"];
	}
	if (__conf__["text_template_subscription"]) {
		if (!__conf__["text_template_twitch_subs"]) {
			__conf__["text_template_twitch_subs"] = __conf__["text_template_subscription"];
		}
		delete __conf__["text_template_subscription"];
	}
	if (__conf__["text_template_follow"]) {
		if (!__conf__["text_template_twitch_follow"]) {
			__conf__["text_template_twitch_follow"] = __conf__["text_template_follow"];
		}
		delete __conf__["text_template_follow"];
	}

	// initial values.
	if (!__conf__["text_template_donation"]) {
		__conf__["text_template_donation"] = window.conf_postprocess_localization.ticker.text_template_donation;
	}
	if (!__conf__["text_template_twitch_subs"]) {
		__conf__["text_template_twitch_subs"] = window.conf_postprocess_localization.ticker.text_template_twitch_subs;
	}
	if (!__conf__["text_template_twitch_follow"]) {
		__conf__["text_template_twitch_follow"] = window.conf_postprocess_localization.ticker.text_template_twitch_follow;
	}
	if (!__conf__["text_template_twitch_hosting"]) {
		__conf__["text_template_twitch_hosting"] = window.conf_postprocess_localization.ticker.text_template_twitch_hosting;
	}
	if (!__conf__["text_template_twitch_cheer"]) {
		__conf__["text_template_twitch_cheer"] = window.conf_postprocess_localization.ticker.text_template_twitch_cheer;
	}
	if (!__conf__["text_template_youtube_subs"]) {
		__conf__["text_template_youtube_subs"] = window.conf_postprocess_localization.ticker.text_template_youtube_subs;
	}
	if (!__conf__["text_template_youtube_schat"]) {
		__conf__["text_template_youtube_schat"] = window.conf_postprocess_localization.ticker.text_template_youtube_schat;
	}
	if (!__conf__["text_template_youtube_sponsor"]) {
		__conf__["text_template_youtube_sponsor"] = window.conf_postprocess_localization.ticker.text_template_youtube_sponsor;
	}
}

window.conf_postprocess_alert = function (__conf__) {

	// value conversions.	
	if (__conf__["donation"]) {
		if (__conf__["donation"]["enabled"] == 0) {
			__conf__["donation"]["enabled"] = 1;
		}
	}

	// name conversions.

	if (__conf__["bit"]) {
		if (!__conf__["cheer"]) {
			__conf__["cheer"] = __conf__["bit"];
		}
		delete __conf__["bit"];
	}

	if (__conf__["cheer"]) {
		if (!__conf__["twitch_cheer"]) {
			__conf__["twitch_cheer"] = __conf__["cheer"];
		}
		delete __conf__["cheer"];
	}

	if (__conf__["subscription"]) {
		if (!__conf__["twitch_subs"]) {
			__conf__["twitch_subs"] = __conf__["subscription"];
		}
		delete __conf__["subscription"];
	}

	if (__conf__["hosting"]) {
		if (!__conf__["twitch_host"]) {
			__conf__["twitch_host"] = __conf__["hosting"];
		}
		delete __conf__["hosting"];
	}

	if (__conf__["follow"]) {
		if (!__conf__["twitch_follow"]) {
			__conf__["twitch_follow"] = __conf__["follow"];
		}
		delete __conf__["follow"];
	}

	// initial values.

	if (!__conf__["raffle"]) {
		__conf__["raffle"] = {
			"enabled": 0
		};
	}

	if (!__conf__["gifticon"]) {
		__conf__["gifticon"] = {
			"enabled": 1,
			"layout": 1,
			"alert_ani_begin": "fadeIn",
			"alert_ani_end": "fadeOut",
			"sound_volume": 100,
			"text_ani": "pulse",
			"text_template": window.conf_postprocess_localization.alert_message.gifticon,
			"text_size": 36,
			"text_font": "Jeju Gothic",
			"text_color": "#FFFFFF",
			"text_highlight_color": "#42A5F5",
			"text2_color": "#FFFFFF",
			"text2_size": 40,
			"text2_font": "Jeju Gothic",
			"alert_remaining_time": 3
		};
	}

	if ("layout" in __conf__["twitch_subs"]) {
		var _origin = JSON.parse(JSON.stringify(__conf__["twitch_subs"]));
		_origin.month = 1;
		_origin.month_type = 0;
		__conf__["twitch_subs"] = {
			"item1": _origin
		}
	}
	if ("enabled" in __conf__["twitch_subs"]) {
		delete __conf__["twitch_subs"]["enabled"];
	}

	if (!__conf__["twitch_cheer"]) {
		__conf__["twitch_cheer"] = {
			"enabled": 0,
			"layout": 1,
			"alert_ani_begin": "fadeIn",
			"alert_ani_end": "fadeOut",
			"sound_volume": 100,
			"text_ani": "pulse",
			"text_template": window.conf_postprocess_localization.alert_message.twitch_cheer,
			"text_size": 36,
			"text_font": "Jeju Gothic",
			"text_color": "#FFFFFF",
			"text_highlight_color": "#18C9FF",
			"alert_remaining_time": 3
		};
	}

	if (!__conf__["youtube_subs"]) {
		__conf__["youtube_subs"] = {
			"enabled": 0,
			"layout": 1,
			"alert_ani_begin": "fadeIn",
			"alert_ani_end": "fadeOut",
			"sound_volume": 100,
			"text_ani": "pulse",
			"text_template": window.conf_postprocess_localization.alert_message.youtube_subs,
			"text_size": 36,
			"text_font": "Jeju Gothic",
			"text_color": "#FFFFFF",
			"text_highlight_color": "#18C9FF",
			"alert_remaining_time": 3
		};
	}

	if (!__conf__["youtube_schat"]) {
		__conf__["youtube_schat"] = {
			"enabled": 0,
			"layout": 1,
			"alert_ani_begin": "fadeIn",
			"alert_ani_end": "fadeOut",
			"sound_volume": 100,
			"text_ani": "pulse",
			"text_template": window.conf_postprocess_localization.alert_message.youtube_schat,
			"text_size": 36,
			"text_font": "Jeju Gothic",
			"text_color": "#FFFFFF",
			"text_highlight_color": "#18C9FF",
			"text2_color": "#42A5F5",
			"text2_size": 40,
			"text2_font": "Jeju Gothic",
			"alert_remaining_time": 3
		};
	}

	if (!__conf__["youtube_sponsor"]) {
		__conf__["youtube_sponsor"] = {
			"enabled": 0,
			"layout": 1,
			"alert_ani_begin": "fadeIn",
			"alert_ani_end": "fadeOut",
			"sound_volume": 100,
			"text_ani": "pulse",
			"text_template": window.conf_postprocess_localization.alert_message.youtube_sponsor,
			"text_size": 36,
			"text_font": "Jeju Gothic",
			"text_color": "#FFFFFF",
			"text_highlight_color": "#18C9FF",
			"alert_remaining_time": 3
		};
	}

	if (!__conf__["wishlist"]) {
		__conf__["wishlist"] = {
			"enabled": 0,
			"layout": 1,
			"alert_ani_begin": "fadeIn",
			"alert_ani_end": "fadeOut",
			"sound_volume": 100,
			"text_ani": "pulse",
			"text_template": window.conf_postprocess_localization.alert_message.wishlist,
			"text_size": 36,
			"text_font": "Jeju Gothic",
			"text_color": "#FFFFFF",
			"text_highlight_color": "#18C9FF",
			"text2_color": "#FFFFFF",
			"text2_size": 24,
			"text2_font": "Jeju Gothic",
			"alert_remaining_time": 3
		}
	}

	if (!__conf__["voting"]) {
		__conf__["voting"] = {
			"enabled": 0,
			"layout": 1,
			"alert_ani_begin": "fadeIn",
			"alert_ani_end": "fadeOut",
			"sound_volume": 100,
			"text_ani": "pulse",
			"text_template": window.conf_postprocess_localization.alert_message.voting,
			"text_size": 36,
			"text_font": "Jeju Gothic",
			"text_color": "#FFFFFF",
			"text_highlight_color": "#18C9FF",
			"text2_color": "#FFFFFF",
			"text2_size": 24,
			"text2_font": "Jeju Gothic",
			"alert_remaining_time": 3
		}
	}

	if (!__conf__.donation.video) {
		__conf__.donation.video = {
			"alert_ani_begin": "fadeIn",
			"alert_ani_end": "fadeOut",
			"text_ani": "pulse",
			"text_template": window.conf_postprocess_localization.alert_message.video,
			"text_size": 36,
			"text_font": "Jeju Gothic",
			"text_color": "#FFFFFF",
			"text_highlight_color": "#18C9FF"
		};
	}
	if (!__conf__.donation.video_noti) {
		__conf__.donation.video_noti = {
			"enabled": 1,
			"layout": 1,
			"alert_ani_begin": "fadeIn",
			"alert_ani_end": "fadeOut",
			"sound_volume": 100,
			"text_ani": "pulse",
			"text_template": window.conf_postprocess_localization.alert_message.video_noti,
			"text_size": 36,
			"text_font": "Jeju Gothic",
			"text_color": "#FFFFFF",
			"text_highlight_color": "#18C9FF",
			"alert_remaining_time": 3
		};
	}
	if (!__conf__.donation.video_skip) {
		__conf__.donation.video_skip = {
			"enabled": 1,
			"layout": 1,
			"alert_ani_begin": "fadeIn",
			"alert_ani_end": "fadeOut",
			"sound_volume": 100,
			"text_ani": "pulse",
			"text_template": __conf__.intercept_message || window.conf_postprocess_localization.alert_message.video_skip,
			"text_size": 36,
			"text_font": "Jeju Gothic",
			"text_color": "#FFFFFF",
			"text_highlight_color": "#18C9FF",
			"alert_remaining_time": 3
		};
	}
	if (!__conf__.donation.recorder.layout) {
		__conf__.donation.recorder = {
			"enabled": __conf__.donation.recorder.activated,
			"layout": 1,
			"donation_min": __conf__.donation.recorder.donation_min,
			"volume": __conf__.donation.recorder.volume,
			"alert_ani_begin": "fadeIn",
			"alert_ani_end": "fadeOut",
			"sound_volume": 100,
			"text_ani": "pulse",
			"text_template": window.conf_postprocess_localization.alert_message.recorder,
			"text_size": 36,
			"text_font": "Jeju Gothic",
			"text_color": "#FFFFFF",
			"text_highlight_color": "#18C9FF",
			"alert_remaining_time": 3
		};
	}

	// additional properties.

	var conf_donation = __conf__["donation"];
	if (!("intercept_notify" in conf_donation)) conf_donation.intercept_notify = 0;

	for (var v = 1; v <= conf_donation_pages_maximum(); ++v) {
		var _conf = conf_donation["item" + v];
		if (typeof _conf == "undefined") continue;
		if (!("alert_remaining_time" in _conf)) _conf.alert_remaining_time = 0;
		if (!("cash_type" in _conf)) _conf.cash_type = 0;
		if (!("enabled" in _conf)) {
			_conf.enabled = _conf.activated;
			delete _conf.activated;
		}
	}

	var tabs = ["gifticon", "twitch_host", "twitch_follow", "twitch_cheer"];
	for (var u = 0; u < tabs.length; ++u) {
		var _conf = __conf__[tabs[u]];
		if (!("alert_remaining_time" in _conf)) _conf.alert_remaining_time = 3;
	}

	/*
	var conf_twitch_subs = __conf__["twitch_subs"];
	if (!("text2_color" in conf_twitch_subs)) conf_twitch_subs.text2_color = "#42A5F5";
	if (!("text2_size" in conf_twitch_subs)) conf_twitch_subs.text2_size = 24;
	if (!("text2_font" in conf_twitch_subs)) conf_twitch_subs.text2_font = "Open Sans";	
	*/

	if (!("quality" in conf_donation.youtube)) conf_donation.youtube.quality = "sd";
	if (!("extra_image_enabled" in conf_donation)) conf_donation.extra_image_enabled = 0;

	if (!("max_length" in __conf__.donation.tts))
		__conf__.donation.tts.max_length = 120;

	var conf_recorder = __conf__.donation.recorder;
	if (!("file_upload" in conf_recorder))
		conf_recorder.file_upload = 0;
	if (!("donation_per_sec" in conf_recorder))
		conf_recorder.donation_per_sec = 10;
	if (!("donation_type" in conf_recorder))
		conf_recorder.donation_type = 0;
	if (!("duration_max" in conf_recorder))
		conf_recorder.duration_max = 30;

	/*
	var conf_tts = __conf__["donation"]["tts"];
	if (!("mod_switch" in conf_tts)) conf_tts.mod_switch = [];
	*/

	// removed properties.

	if (conf_donation.youtube.volume) delete conf_donation.youtube.volume;
	if (conf_donation.twitch.volume) delete conf_donation.twitch.volume;

	// temporary properties	

	__conf__["donation"]["default"] = {
		"enabled": 1,
		"donation_min": 1000,
		"layout": 1,
		"alert_ani_begin": "fadeIn",
		"alert_ani_end": "fadeOut",
		"sound_volume": 100,
		"text_ani": "bounce",
		"text_template": window.conf_postprocess_localization.alert_message.donation,
		"text_size": 36,
		"text_font": "Jeju Gothic",
		"text_color": "#FFFFFF",
		"text_highlight_color": "#18C9FF",
		"text2_size": 40,
		"text2_font": "Jeju Gothic",
		"text2_color": "#FFFFFF",
		"alert_remaining_time": 0,
		"cash_type": 0
	};

	__conf__["twitch_subs"]["default"] = {
		"enabled": 1,
		"month_type": 0,
		"month": 1,
		"layout": 1,
		"alert_ani_begin": "fadeIn",
		"alert_ani_end": "fadeOut",
		"sound_volume": 100,
		"text_ani": "bounce",
		"text_template": window.conf_postprocess_localization.alert_message.twitch_subs,
		"text_size": 36,
		"text_font": "Jeju Gothic",
		"text_color": "#FFFFFF",
		"text_highlight_color": "#18C9FF",
		"text2_size": 40,
		"text2_font": "Jeju Gothic",
		"text2_color": "#FFFFFF",
		"alert_remaining_time": 3
	};
};

window.conf_postprocess_wishlist = function (__conf__) {
	if (Object.keys(__conf__).length == 0) {
		var obj = {
			"enabled": 0,
			"title_text": window.conf_postprocess_localization.wishlist.title_text,
			"title_font": "Jeju Gothic",
			"title_size": 36,
			"title_color": "#FFFFFF",
			"content_size": 24,
			"background_color": "#808080",
			"donator_font": "Jeju Gothic",
			"donator_color": "#18C9FF",
			"product_font": "Jeju Gothic",
			"product_color": "#18C9FF",
			"opacity": 80,
			"list": []
		};

		var keys = Object.keys(obj);
		for (var u = 0; u < keys.length; ++u) {
			var k = keys[u];
			__conf__[k] = obj[k];
		}
	}

	if (!__conf__["content_size"]) {
		__conf__["content_size"] = 24;
	}
}

window.conf_postprocess_voting = function (__conf__) {
	if (Object.keys(__conf__).length == 0) {
		var obj = {
			"enabled": 0,
			"title_font": "Jeju Gothic",
			"title_size": 36,
			"title_color": "#FFFFFF",
			"info_font": "Jeju Gothic",
			"info_size": 24,
			"info_color": "#FFFFFF",
			"item_font": "Jeju Gothic",
			"item_size": 24,
			"item_color": "#FFFFFF",
			"list": []
		};

		var keys = Object.keys(obj);
		for (var u = 0; u < keys.length; ++u) {
			var k = keys[u];
			__conf__[k] = obj[k];
		}
	}
}

window.conf_postprocess_restricted_text = function (__conf__) {
	if (Object.keys(__conf__).length == 0) {
		var obj = {
			"restricted_text_nickname": 0,
			"restricted_text_message": 0,
			"restricted_text_filters": [],
			"restricted_text_replaced_text": ""
		};

		var keys = Object.keys(obj);
		for (var u = 0; u < keys.length; ++u) {
			var k = keys[u];
			__conf__[k] = obj[k];
		}
	}

	if (!("forbidden_text_nickname" in __conf__)) {
		var obj = {
			"forbidden_text_nickname": 0,
			"forbidden_text_message": 0,
			"forbidden_text_platform": 0,
			"forbidden_text_filters": []
		};

		var keys = Object.keys(obj);
		for (var u = 0; u < keys.length; ++u) {
			var k = keys[u];
			__conf__[k] = obj[k];
		}
	}
}

window.conf_postprocess_accum = function (__conf__) {
	if (Object.keys(__conf__).length <= 1) {
		var obj = {
			"text_title": "누적",
			"text_content": "{value}원",
			"date_begin": "2000-01-01 00:00",
			"date_end": "2100-01-01 00:00",
			"title_font": "Jeju Gothic",
			"title_size": 24,
			"title_color": "#FFFFFF",
			"content_font": "Jeju Gothic",
			"content_size": 24,
			"content_color": "#18C9FF",
		};

		var keys = Object.keys(obj);
		for (var u = 0; u < keys.length; ++u) {
			var k = keys[u];
			__conf__[k] = obj[k];
		}
	}
}

window.conf_postprocess_chatbot = function (__conf__) {
	var target = {
		"donation": ["text", "recorder", "video", "roulette", "wishlist", "voting"],
		// "twitch": ["subs", "host", "follow", "cheer"]
	};
	var thresholds = ["donation_text", "donation_recorder", "donation_video", "donation_voting"];

	for (var key in target) {
		var group = target[key];
		for (var i = 0; i < group.length; i++) {
			var name = group[i];
			var keyname = key + "_" + name;

			if (!(keyname in __conf__)) __conf__[keyname] = {};

			var locale;
			if (!("template" in __conf__[keyname])) {
				if (key == "donation" && name == "text")
					locale = window.conf_postprocess_localization.alert_message["donation"];
				else if (key == "donation")
					locale = window.conf_postprocess_localization.alert_message[name];
				else
					locale = window.conf_postprocess_localization.alert_message[keyname];

				__conf__[keyname] = {
					template: locale,
					enabled: 0
				};
				if (thresholds.indexOf(keyname) >= 0) __conf__[keyname].cash_threshold = 10000;
			}
		}
	}
}