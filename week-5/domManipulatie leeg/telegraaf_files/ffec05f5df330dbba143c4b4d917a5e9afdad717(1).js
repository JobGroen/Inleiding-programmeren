(function(){
  var current = {hash:'ffec05f5df330dbba143c4b4d917a5e9afdad717',functions:dimml.functions('ffec05f5df330dbba143c4b4d917a5e9afdad717')};
  var getValue = current.functions.getValue;
  var calculateClientVisitorAttributes = current.functions.calculateClientVisitorAttributes;
  var randomId = current.functions.randomId;
  var getReferrerHost = current.functions.getReferrerHost;
  var setCookie = current.functions.setCookie;
  var bowser = current.functions.bowser;
  var getCookie = current.functions.getCookie;
  var getBannerId = current.functions.getBannerId;
  var isTop = current.functions.isTop;
  var registerBannerListener = current.functions.registerBannerListener;
  var detectBrowser = current.functions.detectBrowser;
  var getVisitId = current.functions.getVisitId;
  (function(){dimml.safe(function(){var serialized="{\"clickChance\":0.010470317692187658,\"clickScore\":-1,\"refClass\":0}";
		if (typeof serialized!=='undefined') { 
			var data = JSON.parse(serialized);
		} else {
			var data = {clickChance:0.0001,clickScore:0,refClass:-1};
		}
		var clickChance = Number(data.clickChance);
		var clickScore = Number(data.clickScore);
		var callbacks = window.tmgcc;
		if (typeof callbacks !== 'object') callbacks = [];
		if (typeof callbacks.getClickChance === 'undefined') {
			window.tmgcc = {
				getClickChance: function(){return clickChance;},
				getClickScore: function(){return clickScore;},
				getClickAge: function(){return clickScore>=0?121:120;}
			};
			dimml._.each(callbacks,function(callback){
				callback(clickChance);
			});
		} else {
			window.tmgcc.getClickChance = function(){return clickChance;};
		}
		var refClass = Number(data.refClass);
		if (refClass > 0)
			calculateClientVisitorAttributes({}, refClass);
	});})();
})();