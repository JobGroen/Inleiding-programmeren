//WARNING: THIS IS A FILE FOR QUICK TESTING ON DEV AND ACC. PRODUCTIONCODE IS ON sc.telegraaf.nl.

// Start Extra tracking Re-design (old website)
_gaq.push(['dubbel._setAccount', 'UA-25693468-16']);
tmgAccounts.push("dubbel.");
// End Extra tracking Re-design (old website)

var gachannel = '';
var gachannelcode = '';
var gacookie = '';
var gatvchannel = '';

var gaurl = new Array();
var gacodes = new Array();
gaurl[0] = '/autovisie/';
gacodes[0] = 'UA-27081125-1';
gaurl[1] = '/dft/';
gacodes[1] = 'UA-27082648-1';
gaurl[2] = '/dft/';
gacodes[2] = 'UA-27079598-1';
gaurl[3] = '/static/prive/songfestival/';
gacodes[3] = 'UA-28238687-1';
gaurl[4] = '/static/telesport/live/';
gacodes[4] = 'UA-28238687-1';
gaurl[5] = '/vrouw/';
gacodes[5] = 'UA-27082467-1';
gaurl[6] = '/reiskrant/';
gacodes[6] = 'UA-27085231-1';
gaurl[7] = '/dft/';
gacodes[7] = 'UA-27082139-1';
gaurl[8] = '/filmenuitgaan/';
gacodes[8] = 'UA-27081182-1';
gaurl[9] = '/watuzegt/';
gacodes[9] = 'UA-27082650-1';
gaurl[10] = '/vaarkrant/';
gacodes[10] = 'UA-27082468-1';
gaurl[11] = '/digitaal/';
gacodes[11] = 'UA-27080795-1';
gaurl[12] = '/uitwinkelen/';
gacodes[12] = 'UA-27085233-1';
gaurl[13] = '/binnenland/';
gacodes[13] = 'UA-27080796-1';
gaurl[14] = '/buitenland/';
gacodes[14] = 'UA-27080797-1';
gaurl[15] = '/teleweer/';
gacodes[15] = 'UA-32404778-1';
gaurl[16] = '/verkeer/';
gacodes[16] = 'UA-27091007-1';
gaurl[17] = '/snelnieuws/';
gacodes[17] = 'UA-27085234-1';
gaurl[18] = '/4422/';
gacodes[18] = 'UA-27085236-1';
gaurl[19] = '/video/';
gacodes[19] = 'UA-27091501-1';

gaurl[20] = '/jsp/';
gacodes[20] = ''; // jsp krijgt een hoofdsectie UA code
gaurl[21] = '/mobiel/';
gacodes[21] = 'UA-27082472-1';
gaurl[22] = '/advertorials/';
gacodes[22] = 'UA-27425525-1';
gaurl[23] = '/wuz/';
gacodes[23] = 'UA-27582210-1';
gaurl[24] = '/prive/';
gacodes[24] = 'UA-27079599-1';
gaurl[25] = '/telegraaf-i/';
gacodes[25] = 'UA-28125378-1';
gaurl[26] = '/telesport/';
gacodes[26] = 'UA-27083436-1';
gaurl[27] = '/live/';
gacodes[27] = 'UA-35119500-1';

gaurl[28] = '/tv/autovisie/';
gacodes[28] = 'UA-27081125-1';
gaurl[29] = '/tv/dft/';
gacodes[29] = 'UA-27082648-1';
gaurl[30] = '/tv/vrouw/';
gacodes[30] = 'UA-27082467-1';
gaurl[31] = '/tv/reizen/';
gacodes[31] = 'UA-27085231-1';
gaurl[32] = '/tv/uitgaan/';
gacodes[32] = 'UA-27081182-1';
gaurl[33] = '/tv/varen/';
gacodes[33] = 'UA-27082468-1';
gaurl[34] = '/tv/digitaal/';
gacodes[34] = 'UA-27080795-1';
gaurl[35] = '/tv/nieuws/binnenland/';
gacodes[35] = 'UA-27080796-1';
gaurl[36] = '/tv/nieuws/buitenland/';
gacodes[36] = 'UA-27080797-1';
gaurl[37] = '/tv/prive/';
gacodes[37] = 'UA-27079599-1';
gaurl[38] = '/tv/telesport/';
gacodes[38] = 'UA-27083436-1';
gaurl[39] = '/specials/';
gacodes[39] = 'UA-42208362-1';
gaurl[40] = '/dft/ondernemen/';
gacodes[40] = 'UA-27082139-1';
gaurl[41] = '/telesport/sotsji-2014/';
gacodes[41] = 'UA-27083436-3';
gaurl[42] = '/telesport/sotsji-2014-premium/';
gacodes[42] = 'UA-27083436-4';
gaurl[43] = '/gezondheid/';
gacodes[43] = 'UA-50094115-1';
gaurl[44] = '/telegraaf-i/';
gacodes[44] = 'UA-28125378-1';

function tmgPageview(url) {
    if (gacookie === '/dft/') {
        // Add additional pageviews for /dft/geld/ and /dft/ondernemen/
        _gaq.push(['_trackPageview', url]);
        _gaq.push(['channel._setAccount', 'UA-27082648-1']);
        _gaq.push(['channel._trackPageview', url]);
        _gaq.push(['channel._setAccount', 'UA-27079598-1']);
        _gaq.push(['channel._trackPageview', url]);
        _gaq.push(['channel._setAccount', 'UA-27082139-1']);
        _gaq.push(['channel._trackPageview', url]);
        _gaq.push(['dubbel._setAccount', 'UA-25693468-16']);
        _gaq.push(['dubbel._trackPageview', url]);
    } else {
        for (var i = 0; i < tmgAccounts.length; i++) {
            _gaq.push([tmgAccounts[i] + '_trackPageview', url]);
        }
    }
}

function tmgEvent(category, action, opt_label, opt_value, opt_noninteraction) {
    if (gacookie === '/dft/') {
        // Add additional events for /dft/geld/ and /dft/ondernemen/
        _gaq.push(['_trackEvent', category, action, opt_label, opt_value, opt_noninteraction]);
        _gaq.push(['channel._setAccount', 'UA-27082648-1']);
        _gaq.push(['channel._trackEvent', category, action, opt_label, opt_value, opt_noninteraction]);
        _gaq.push(['channel._setAccount', 'UA-27079598-1']);
        _gaq.push(['channel._trackEvent', category, action, opt_label, opt_value, opt_noninteraction]);
        _gaq.push(['channel._setAccount', 'UA-27082139-1']);
        _gaq.push(['channel._trackEvent', category, action, opt_label, opt_value, opt_noninteraction]);
        _gaq.push(['dubbel._setAccount', 'UA-25693468-16']);
        _gaq.push(['dubbel._trackEvent', category, action, opt_label, opt_value, opt_noninteraction]);
    } else {
        for (var i = 0; i < tmgAccounts.length; i++) {
            _gaq.push([tmgAccounts[i] + '_trackEvent', category, action, opt_label, opt_value, opt_noninteraction]);
        }
    }
}

function tmgSocial(network, socialAction, opt_target, opt_pagePath) {
    if (gacookie === '/dft/') {
        // Add additional social events for /dft/geld/ and /dft/ondernemen/
        _gaq.push(['_trackSocial', network, socialAction, opt_target, opt_pagePath]);
        _gaq.push(['channel._setAccount', 'UA-27082648-1']);
        _gaq.push(['channel._trackSocial', network, socialAction, opt_target, opt_pagePath]);
        _gaq.push(['channel._setAccount', 'UA-27079598-1']);
        _gaq.push(['channel._trackSocial', network, socialAction, opt_target, opt_pagePath]);
        _gaq.push(['channel._setAccount', 'UA-27082139-1']);
        _gaq.push(['channel._trackSocial', network, socialAction, opt_target, opt_pagePath]);
        _gaq.push(['dubbel._setAccount', 'UA-25693468-16']);
        _gaq.push(['dubbel._trackSocial', network, socialAction, opt_target, opt_pagePath]);
    } else {
        for (var i = 0; i < tmgAccounts.length; i++) {
            _gaq.push([tmgAccounts[i] + '_trackSocial', network, socialAction, opt_target, opt_pagePath]);
        }
    }
}

extractParamFromUri_ = function(uri, paramName) {
   if (!uri) {
      return;
   }
   var uri = uri.split('#')[0];
   var parts = uri.split('?');
   if (parts.length == 1) {
      return;
   }
   var query = decodeURI(parts[1]);

   paramName += '=';
   var params = query.split('&');
   for ( var i = 0, param; param = params[i]; ++i) {
      if (param.indexOf(paramName) === 0) {
         return unescape(param.split('=')[1]);
      }
   }
   return;
};

function getCodeFromPath(URL) {
   tmpvar = URL.split("?");
   path = tmpvar[0];
   args = tmpvar[1];

   // Join premium
   path = path.replace('/premium/','/');

   var tvpathreg = new RegExp("telegraaf.nl" + '/tv/');
   if (tvpathreg.test(path)) {
      gatvchannel = true;
      tmgAccounts.push("tv.");
   } else {
      gatvchannel = false;
   }

   if (URL.indexOf('telegraaf-i.telegraaf.nl') != -1) {
      gachannelcode = gacodes[25];
      gacookie = gaurl[25];
      gachannel = true;
      tmgAccounts.push("channel.")
      _gaq.push([ 'channel._setAccount', gachannelcode ]);
      _gaq.push([ 'channel._setDomainName', 'telegraaf-i.telegraaf.nl' ]);
      _gaq.push([ 'channel._setCustomVar', 1, 'sectie', 'telegraaf-i', 3 ]);
      _gaq.push([ 'channel._setCustomVar', 3, 'pagina type', "SectiePagina", 3 ]);
      tmgPageview();
   } else if (URL.indexOf('live.telegraaf.nl') != -1) {
      gachannelcode = gacodes[27];
      gacookie = gaurl[27];
      gachannel = true;
      tmgAccounts.push("channel.")
      _gaq.push([ 'channel._setAccount', gachannelcode ]);
      _gaq.push([ 'channel._setDomainName', 'live.telegraaf.nl' ]);
      _gaq.push([ 'channel._setCustomVar', 1, 'sectie', 'live', 3 ]);
      _gaq.push([ 'channel._setCustomVar', 3, 'pagina type', "SectiePagina", 3 ]);
      tmgPageview();

   } else {
      for ( var x in gaurl) {
         var pathreg = new RegExp("telegraaf.nl" + gaurl[x]);
         if (pathreg.test(path)) {
            if (x == 20) {
               for ( var i in gaurl) {
                  var jspsec = '/' + extractParamFromUri_(URL, 'artsec') + '/';
                  var jspreg = new RegExp(gaurl[i]);
                  if (jspreg.test(jspsec)) {
                     gachannelcode = gacodes[i];
                     gacookie = gaurl[i];
                     gachannel = true;
                     tmgAccounts.push("channel.")
                     return;
                  }

               }
            } else {
               gachannelcode = gacodes[x];
               gacookie = gaurl[x];
               gachannel = true;
               tmgAccounts.push("channel.")
               return;
            }
         } else {
            gachannel = false;
         }
      }
   }

   // Special check for homepage
   //    pathreg = new RegExp("telegraaf.nl/(\\d+/[^\./]+\.html|article\\d+\.ece|[^\./]+\.html|)$");
}
getCodeFromPath(document.location.href);

function findProdMaatschappij(obj) {
   var videoTag = obj.toLowerCase();
   var p = [ 'item', 'zoomin', 'montage' ];
   for ( var i = 0; i < p.length; i++) {
      if (videoTag.indexOf(p[i]) != -1) {
         return p[i];
      }
   }
   return 'none';
}

var currentVideoId;
var titleVideo = [];

// Video meting

function onBCPlay(event, experienceID) {
   if (event == "complete") {
      currentVideoId = "";
   }

   var video = modVP['video' + experienceID].getCurrentVideo();

   if (currentVideoId != video.id && event != "complete") {

      currentVideoId = video.id;
      titleVideo = video.displayName.substring(0, 35) + " - " + video.id + " - " + findProdMaatschappij(video.tags.toString());

      if(typeof(Storage)!=="undefined") {
          VideoViewed = (video.length < 30000) ? 1 : VideoViewed + 1;
          sessionStorage.VideoViewed = VideoViewed;
      }

   } else {

      switch (event) {
      case 'play':
         event = 'resume'
         break;
      }

   }

   tmgEvent('videos', event, titleVideo);

}

// Uitgaande links meting

if (typeof jQuery == 'function') {
   jQuery(function() {
      jQuery('span.leesvoor a#rslink').mousedown(function(e) {
         tmgEvent('links', 'lees voor', jQuery(this).attr('href'));
      });
      jQuery('a[href^="http"]').mousedown(function(e) {
         url = this.toString();
         if ((url.indexOf(document.domain) == -1) && (url.indexOf("http") > -1)) {
            tmgEvent('links', 'exit', jQuery(this).attr('href'));
         }
      });
   });
}

function clickFotoVenster(topsection, articid, title) {
   tmgEvent('content', 'fotoplayer', 'handmatig');
}

function clickPoll(topsection, articid, title) {
   tmgEvent('content', 'poll', title.replace(/\+/g, " "));
}

function clickComment(topsection, articid, title) {
   tmgEvent('content', 'reactie', title);
}

function submitForm(topsection, articid, title) {
}

function mailArticle(topsection, articid, title) {
   tmgEvent('content', 'mail', title);
}

// Social bookmark tracking

if (typeof jQuery == 'function') {
   jQuery(function() {
      jQuery('document').ready(function() {
         try {
            if (FB && FB.Event && FB.Event.subscribe) {
               FB.Event.subscribe('edge.create', function(targetUrl) {
                  tmgSocial('Facebook', 'Like');
               });
               FB.Event.subscribe('edge.remove', function(targetUrl) {
                  tmgSocial('Facebook', 'Unlike');
               });
               FB.Event.subscribe('message.send', function(targetUrl) {
                  tmgSocial('Facebook', 'Send');
               });
               FB.Event.subscribe('comment.create', function(targetUrl) {
                  tmgSocial('Facebook', 'Comment create');
               });
               FB.Event.subscribe('comment.remove', function(targetUrl) {
                  tmgSocial('Facebook', 'Comment remove');
               });
            }
         } catch (e) {
         }

         try {
            if (twttr && twttr.events && twttr.events.bind) {
               twttr.events.bind('tweet', function(event) {
                  if (event) {
                     var targetUrl;
                     if (event.target && event.target.nodeName == 'IFRAME') {
                        targetUrl = extractParamFromUri_(event.target.src, 'url');
                     }
                     tmgSocial('Twitter', 'Tweet', targetUrl);
                  }
               });
            }
         } catch (e) {
         }
      });
   });
};

// Google+ meting

window['doCustomTracking'] = function(data) {
   if (data['state'] == 'on') {
      tmgSocial('Google', '+1', data['href']);
   }
};
