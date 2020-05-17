(function(){

  var url = (function() {
      function isNumeric(arg) {
          return !isNaN(parseFloat(arg)) && isFinite(arg);
      }

      return function url(arg, url) {
      var _ls = url || window.location.toString();

      if(_ls.substring(0,2) === '//') _ls = 'http:' + _ls;
      else if(_ls.split('://').length === 1) _ls = 'http://' + _ls;

      url = _ls.split('/');
      var _l = {auth:''}, host = url[2].split('@');

      if(host.length === 1) host = host[0].split(':');
      else{ _l.auth = host[0]; host = host[1].split(':'); }

      _l.protocol=url[0], _l.hostname=host[0], _l.port=(host[1]||'80'), _l.pathname='/' + url.slice(3, url.length).join('/').split('?')[0].split('#')[0];
      var _p = _l.pathname;
      if(_p.split('.').length === 1 && _p[_p.length-1] !== '/') _p += '/';
      var _h = _l.hostname, _hs = _h.split('.'), _ps = _p.split('/');

      if(!arg) return _ls;
      else if(arg === 'hostname') return _h;
      else if(arg === 'domain') return _hs.slice(-2).join('.');
      else if(arg === 'tld') return _hs.slice(-1).join('.');
      else if(arg === 'sub') return _hs.slice(0, _hs.length - 2).join('.');
      else if(arg === 'port') return _l.port || '80';
      else if(arg === 'protocol') return _l.protocol.split(':')[0];
      else if(arg === 'auth') return _l.auth;
      else if(arg === 'user') return _l.auth.split(':')[0];
      else if(arg === 'pass') return _l.auth.split(':')[1] || '';
      else if(arg === 'path') return _p;
      else if(arg[0] === '.')
      {
        arg = arg.substring(1);
        if(isNumeric(arg)) {arg = parseInt(arg); return _hs[arg < 0 ? _hs.length + arg : arg-1] || ''; }
      }
      else if(isNumeric(arg)){ arg = parseInt(arg); return _ps[arg < 0 ? _ps.length - 1 + arg : arg] || ''; }
      else if(arg === 'file') return _ps.slice(-1)[0];
      else if(arg === 'filename') return _ps.slice(-1)[0].split('.')[0];
      else if(arg === 'fileext') return _ps.slice(-1)[0].split('.')[1] || '';
      else if(arg[0] === '?' || arg[0] === '#')
      {
        var params = _ls, param = null;

        if(arg[0] === '?') params = (params.split('?')[1] || '').split('#')[0];
        else if(arg[0] === '#') params = (params.split('#')[1] || '');

        if(!arg[1]) return params;

        arg = arg.substring(1);
        params = params.split('&');

        for(var i=0,ii=params.length; i<ii; i++)
        {
        param = params[i].split('=');
        if(param[0] === arg) return param[1];
        }

        return null;
      }

      return '';
      }
  })();

  /* http://spitsacc.telegraaf.net/#ad=%2Fafbeelding%2F2765216%2Fstraatwerk.jpg&width=336 */

  var ADPROP = "ad";
  var WIDTH  = "width";
  var HEIGHT = "height";

  /* build a key/value array of hash params */
  var ad = escape(decodeURIComponent(url('#' + ADPROP)));
  var width = url('#' + WIDTH) / 1;
  var height = url('#' + HEIGHT) / 1;

  /* we need to highlight an ad on this page */
  if (ad && width) {

      // hide the main html so it won't flicker
      document.getElementsByTagName('html')[0].style.visibility = 'hidden';

      var OVERLAYID  = "adoverlay";

      /* now we load jquery in noconflict mode */
      document.write('<script language="JavaScript" type="text/javascript" src="http://www.telegraaf.nl/static/gerichtonline/bpreview_base.js?2">\x3C/script>');

      // this will be called by the _base.js
      window.bpreviewCallback = function(){

          // set jq to current jquery and restore the site's jquery if they have one
          var jq = jQuery.noConflict(true);

          // something went wrong, maybe call the parent?
          function error(msg) {
              alert('Er is een fout opgetreden. ' + msg);
              jq('html').css('visibility', 'visible');
          }


          setTimeout(function(){
              /* get the banner position and check if its there, if banner position is found continue */
              var ads = jq('[id^=div-adtech-ad-], .tg-ads-placeholder').css('display', 'block');
              var adposition = null;

              for (var i = 0; i < ads.length; i++) {
                  if (jq(ads[i]).width() == width){
                      adposition = jq(ads[i]);
                      break;
                  }
              }

              if ( ! adposition ) {
                  for (var i = 0; i < ads.length; i++) {
                      var adpos = jq(ads[i]);
                      var diff = adpos.width() - width;
                      if (diff < 300 && diff > 0 && adpos.is(':visible')) {
                          adposition = adpos;
                          break;
                      }
                  }
              }

              if ( ! adposition ) {
                  if (! TMG.check('advertising_targeting')) {
                      error('U heeft onvoldoende cookie rechten gegeven.');
                  } else {
                      return error('Banner positie niet gevonden.');
                  }
              }

              function finish(){
                  jq('html, body').animate({
                      scrollTop: adposition.offset().top - 300
                  }, 0);
                  jq('html').css('visibility', 'visible');
                  if ( ! adposition.is(':visible')) {
                      return error('Banner positie niet zichtbaar.');
                  }
              }

              if (adposition.length == 1) {

                  var DOMAIN = "https://go.gerichtonline.nl";
                  var offset = adposition.css('display', 'block').offset();

                  // hide iframes
                  jq('body').append('<style>#' + adposition[0].id + ' iframe{ display:none !important;}</style>');

                  /* construct the banner and overlay*/
                  var img = jq('<img src="' + DOMAIN + ad + '" />');
                  img.on('load', function(){
                      finish();
                  }).on('error', function(){
                      if (ad.substring(ad.length - 4) == '.swf') {
                          var objhtml = '<object data="' + DOMAIN + ad + '" '
                                  + 'type="application/x-shockwave-flash" width="' + width + '" height="' + height + '">'
                              + '<param name="movie" value="' + DOMAIN + ad + '" />'
                              + '<param name="quality" value="high" />'
                              + '<param name="bgcolor" value="#ffffff" />'
                              + '<param name="play" value="true" />'
                              + '<param name="loop" value="true" />'
                              + '<param name="wmode" value="transparent" />'
                              + '<param name="scale" value="showall" />'
                              + '<param name="menu" value="false" />'
                              + '<param name="devicefont" value="false" />'
                              + '<param name="allowScriptAccess" value="sameDomain" />'
                              + '<param name="flashvars" value="clickTag=" />'
                              + '</object>';
                          adposition.html(objhtml);
                          finish();
                      } else {
                          return error('Banner kan niet geladen worden.');
                      }
                  });
                  adposition.html(img);

              } else {
                  error('Banner positie niet gevonden (2).');
              }
          }, 3000);
      }
  }
})();
