(function(){
  var current = {hash:'ffec05f5df330dbba143c4b4d917a5e9afdad717',functions:dimml.functions('ffec05f5df330dbba143c4b4d917a5e9afdad717')};
  var getValue = current.functions.getValue = function(name,fun,lifetime){
	var value = getCookie(name);

	if (!value) {
		value = fun();

		if (value !== null) {
			setCookie(name, value, lifetime);
		}
	}

	return value;
};
  var calculateClientVisitorAttributes = current.functions.calculateClientVisitorAttributes = function(data,refClass){
	var newList = function(){return [0,0,1,new Date().getTime(),0,0,0,0];}
	var list = getCookie('o2vrc');
	if (list) {
		var numbers = true;
		list = list.split(';');
		for (var i=0;i<list.length;i++) {
			list[i] = Number(list[i]);
			numbers = numbers && !isNaN(list[i]);
		}
		if (!numbers) list = newList();
	} else {
		list = newList();
	}
	
	if (!refClass) {
		if (typeof list[4] === 'undefined' || new Date(list[3]).toDateString() != new Date().toDateString()) {
			list[4] = 0;
			list[5] = 0;
			list[6] = 0;
			list[7] = 0;
		}
	
		// total number of clicks
		if (!refClass) list[0] = list[0]+1;
	
		// total visit length and number of visits
		var currentTime = new Date().getTime();
		if (currentTime-list[3] < 1800000) {
			list[1] = list[1]+(currentTime-list[3]);
		} else {
			list[2] = list[2]+1;
		}
		list[3] = currentTime;

		data.vnc = list[0];
		data.val = Math.round(list[1]/list[2]);
		data.vnv = list[2];
		data.rdirect = list[4];
		data.rsearch = list[5];
		data.rsocial = list[6];
		data.runknown = list[7];
	} else {
		list[refClass+3] = list[refClass+3]+1;
	}
			
	setCookie('o2vrc', list.join(';'), 31536000);
};
  var randomId = current.functions.randomId = function(){
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
		/[xy]/g,
		function(c) {
			var r = Math.random() * 16 | 0;
			var v = c == 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		}
	)
};
  var getReferrerHost = current.functions.getReferrerHost = function(){
	return !document.referrer?"":new dimml.uri(document.referrer).host();
};
  var setCookie = current.functions.setCookie = function(name,value,lifetime){
  	var d = new Date();
	var e = '';

	if (lifetime > 0) {
		d.setSeconds(d.getSeconds() + lifetime);
		e = '; expires=' + d.toUTCString();
	}

	document.cookie = name + '=' + escape(value) + e + '; path=/';
};
  var bowser = current.functions.bowser = function(){
/*!
  * Bowser - a browser detector
  * https://github.com/ded/bowser
  * MIT License | (c) Dustin Diaz 2014
  */
!function(e,t){typeof module!="undefined"&&module.exports?module.exports.browser=t():typeof define=="function"?define(t):this[e]=t()}("bowser",function(){function t(t){function n(e){var n=t.match(e);return n&&n.length>1&&n[1]||""}var r=n(/(ipod|iphone|ipad)/i).toLowerCase(),i=/like android/i.test(t),s=!i&&/android/i.test(t),o=n(/version\/(\d+(\.\d+)?)/i),u=/tablet/i.test(t),a=!u&&/[^-]mobi/i.test(t),f;/opera|opr/i.test(t)?f={name:"Opera",opera:e,version:o||n(/(?:opera|opr)[\s\/](\d+(\.\d+)?)/i)}:/windows phone/i.test(t)?f={name:"Windows Phone",windowsphone:e,msie:e,version:n(/iemobile\/(\d+(\.\d+)?)/i)}:/msie|trident/i.test(t)?f={name:"Internet Explorer",msie:e,version:n(/(?:msie |rv:)(\d+(\.\d+)?)/i)}:/chrome|crios|crmo/i.test(t)?f={name:"Chrome",chrome:e,version:n(/(?:chrome|crios|crmo)\/(\d+(\.\d+)?)/i)}:r?(f={name:r=="iphone"?"iPhone":r=="ipad"?"iPad":"iPod"},o&&(f.version=o)):/sailfish/i.test(t)?f={name:"Sailfish",sailfish:e,version:n(/sailfish\s?browser\/(\d+(\.\d+)?)/i)}:/seamonkey\//i.test(t)?f={name:"SeaMonkey",seamonkey:e,version:n(/seamonkey\/(\d+(\.\d+)?)/i)}:/firefox|iceweasel/i.test(t)?(f={name:"Firefox",firefox:e,version:n(/(?:firefox|iceweasel)[ \/](\d+(\.\d+)?)/i)},/\((mobile|tablet);[^\)]*rv:[\d\.]+\)/i.test(t)&&(f.firefoxos=e)):/silk/i.test(t)?f={name:"Amazon Silk",silk:e,version:n(/silk\/(\d+(\.\d+)?)/i)}:s?f={name:"Android",version:o}:/phantom/i.test(t)?f={name:"PhantomJS",phantom:e,version:n(/phantomjs\/(\d+(\.\d+)?)/i)}:/blackberry|\bbb\d+/i.test(t)||/rim\stablet/i.test(t)?f={name:"BlackBerry",blackberry:e,version:o||n(/blackberry[\d]+\/(\d+(\.\d+)?)/i)}:/(web|hpw)os/i.test(t)?(f={name:"WebOS",webos:e,version:o||n(/w(?:eb)?osbrowser\/(\d+(\.\d+)?)/i)},/touchpad\//i.test(t)&&(f.touchpad=e)):/bada/i.test(t)?f={name:"Bada",bada:e,version:n(/dolfin\/(\d+(\.\d+)?)/i)}:/tizen/i.test(t)?f={name:"Tizen",tizen:e,version:n(/(?:tizen\s?)?browser\/(\d+(\.\d+)?)/i)||o}:/safari/i.test(t)?f={name:"Safari",safari:e,version:o}:f={},/(apple)?webkit/i.test(t)?(f.name=f.name||"Webkit",f.webkit=e,!f.version&&o&&(f.version=o)):!f.opera&&/gecko\//i.test(t)&&(f.name=f.name||"Gecko",f.gecko=e,f.version=f.version||n(/gecko\/(\d+(\.\d+)?)/i)),s||f.silk?f.android=e:r&&(f[r]=e,f.ios=e);var l="";r?(l=n(/os (\d+([_\s]\d+)*) like mac os x/i),l=l.replace(/[_\s]/g,".")):s?l=n(/android[ \/-](\d+(\.\d+)*)/i):f.windowsphone?l=n(/windows phone (?:os)?\s?(\d+(\.\d+)*)/i):f.webos?l=n(/(?:web|hpw)os\/(\d+(\.\d+)*)/i):f.blackberry?l=n(/rim\stablet\sos\s(\d+(\.\d+)*)/i):f.bada?l=n(/bada\/(\d+(\.\d+)*)/i):f.tizen&&(l=n(/tizen[\/\s](\d+(\.\d+)*)/i)),l&&(f.osversion=l);var c=l.split(".")[0];if(u||r=="ipad"||s&&(c==3||c==4&&!a)||f.silk)f.tablet=e;else if(a||r=="iphone"||r=="ipod"||s||f.blackberry||f.webos||f.bada)f.mobile=e;return f.msie&&f.version>=10||f.chrome&&f.version>=20||f.firefox&&f.version>=20||f.safari&&f.version>=6||f.opera&&f.version>=10||f.ios&&f.osversion&&f.osversion.split(".")[0]>=6?f.a=e:f.msie&&f.version<10||f.chrome&&f.version<20||f.firefox&&f.version<20||f.safari&&f.version<6||f.opera&&f.version<10||f.ios&&f.osversion&&f.osversion.split(".")[0]<6?f.c=e:f.x=e,f}var e=!0,n=t(typeof navigator!="undefined"?navigator.userAgent:"");return n._detect=t,n})
};
  var getCookie = current.functions.getCookie = function(name){
	if (!String.prototype.trim) {
	  (function(){  
	    var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
	    String.prototype.trim = function () {
	      return this.replace(rtrim, "");
	    }
	  })();
	}
	var i, l, x, y, cookies = document.cookie.split(';');

	for (i = 0, l = cookies.length; i < l; i++) {
		x = cookies[i].substr(0, cookies[i].indexOf('='));
		y = cookies[i].substr(cookies[i].indexOf('=') + 1);

		if (x.trim() == name) {
			return unescape(y);
		}
	}

	return null;
};
  var getBannerId = current.functions.getBannerId = function(){
	if (typeof dimml.telegraaf !== 'undefined' && typeof dimml.telegraaf.bannerid !== 'undefined' && dimml.telegraaf.bannerid != -1) {
		return {bannerid: dimml.telegraaf.bannerid};
	} else {
		return false;
	}
};
  var isTop = current.functions.isTop = function(){
	try {
		if (window.self === window.top) {
			return '1';
		}
	} catch(e) {}

	return '0';
};
  var registerBannerListener = current.functions.registerBannerListener = function(){
	dimml.telegraaf = dimml.telegraaf || {};
	dimml.telegraaf.bannerid = -1;
	dimml.ready(function(){
		$('[id|="div-adtech-ad"]').hover(function(){
			dimml.telegraaf.bannerid = 1;
		},function(){
			dimml.telegraaf.bannerid = -1;
		});
		var count = 0;
		var handle = window.setInterval(function(){
			count++;
			if(count>5)window.clearInterval(handle);
			if($('embed[menu="false"]').length>0) {
				//console.log('binding... '+$('embed[menu="false"]').length);
				$('embed[menu="false"]').parent().hover(function(){
					dimml.telegraaf.bannerid = 1;
				},function(){
					dimml.telegraaf.bannerid = -1;
				});
				window.clearInterval(handle);
			}
		},1000);
	});
};
  var detectBrowser = current.functions.detectBrowser = function(data){
	bowser();
	data.browser = window.bowser.name;
	if (window.bowser.mobile) {
		data.device = 'mobile';
		data.os = window.bowser.name;
	} else if (window.bowser.tablet) {
		data.device = 'tablet';
		data.os = window.bowser.name;
	} else {
		data.device = 'desktop';
		var os = "unknown";
		var av = navigator.appVersion;
		if (av.indexOf("Win")!=-1) os = "Windows";
		else if (av.indexOf("Mac")!=-1) os = "MacOS";
		else if (av.indexOf("X11")!=-1) os = "UNIX";
		else if (av.indexOf("Linux")!=-1) os = "Linux";
		data.os = os;
	}
};
  var getVisitId = current.functions.getVisitId = function(){
	return getValue('o2vtId', function() {
		return randomId();
	}, 0);
};
  (function(){dimml.safe(function(){if(typeof current.dataCallback==='undefined'){current.dataCallback=[];}if(typeof current.data==='undefined'){current.data={};}if(typeof current.scriptName==='undefined'){current.scriptName='flow';}try{current.data['refHost']=String(getReferrerHost());}catch(e){current.data['refHost']='';}try{current.data['currentTime']=String(new Date().getTime());}catch(e){current.data['currentTime']='';}try{current.data['path']=String(window.location.pathname);}catch(e){current.data['path']='';}try{current.data['visitId']=String(getVisitId());}catch(e){current.data['visitId']='';}setTimeout(function(){var extra=dimml.extraData[current.hash];if(extra)dimml._.extend(current.data,extra.pop());dimml._.each(current.dataCallback,function(callback){callback();});if(current.scriptName)dimml.send(current.data,current.scriptName+'/'+dimml.rnd4(),null,current.hash);},0);});})();
  (function(){dimml.safe(function(){current.dataCallback.push(function(){var data=current.data;
		calculateClientVisitorAttributes(data);
		detectBrowser(data);
		registerBannerListener();
	});});})();
  (function(){dimml.safe(function(){dimml.addEventHash('adClick','ffec05f5186e0d3575f4fe1a34e93b134b88e9fb');if(dimml.addEventHash(current.hash+'/adClick','ffec05f5186e0d3575f4fe1a34e93b134b88e9fb')){dimml.registerEventListener(function(){return window;},'blur',function(it){var result = getBannerId();if(result){dimml.event(current.hash+'/adClick',typeof result === 'object'?result:{});return true;}return true;});}});})();
})();