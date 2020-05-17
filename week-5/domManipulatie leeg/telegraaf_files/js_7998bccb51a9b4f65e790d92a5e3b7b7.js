
/**
 * Override jQuery.fn.init to guard against XSS attacks.
 *
 * See http://bugs.jquery.com/ticket/9521
 */
(function () {
  var jquery_init = jQuery.fn.init;
  jQuery.fn.init = function (selector, context, rootjQuery) {
    // If the string contains a "#" before a "<", treat it as invalid HTML.
    if (selector && typeof selector === 'string') {
      var hash_position = selector.indexOf('#');
      if (hash_position >= 0) {
        var bracket_position = selector.indexOf('<');
        if (bracket_position > hash_position) {
          throw 'Syntax error, unrecognized expression: ' + selector;
        }
      }
    }
    return jquery_init.call(this, selector, context, rootjQuery);
  };
  jQuery.fn.init.prototype = jquery_init.prototype;
})();

var Drupal = Drupal || { 'settings': {}, 'behaviors': {}, 'themes': {}, 'locale': {} };

/**
 * Set the variable that indicates if JavaScript behaviors should be applied
 */
Drupal.jsEnabled = true;

/**
 * Attach all registered behaviors to a page element.
 *
 * Behaviors are event-triggered actions that attach to page elements, enhancing
 * default non-Javascript UIs. Behaviors are registered in the Drupal.behaviors
 * object as follows:
 * @code
 *    Drupal.behaviors.behaviorName = function () {
 *      ...
 *    };
 * @endcode
 *
 * Drupal.attachBehaviors is added below to the jQuery ready event and so
 * runs on initial page load. Developers implementing AHAH/AJAX in their
 * solutions should also call this function after new page content has been
 * loaded, feeding in an element to be processed, in order to attach all
 * behaviors to the new content.
 *
 * Behaviors should use a class in the form behaviorName-processed to ensure
 * the behavior is attached only once to a given element. (Doing so enables
 * the reprocessing of given elements, which may be needed on occasion despite
 * the ability to limit behavior attachment to a particular element.)
 *
 * @param context
 *   An element to attach behaviors to. If none is given, the document element
 *   is used.
 */
Drupal.attachBehaviors = function(context) {
  context = context || document;
  // Execute all of them.
  jQuery.each(Drupal.behaviors, function() {
    this(context);
  });
};

/**
 * Encode special characters in a plain-text string for display as HTML.
 */
Drupal.checkPlain = function(str) {
  str = String(str);
  var replace = { '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;' };
  for (var character in replace) {
    var regex = new RegExp(character, 'g');
    str = str.replace(regex, replace[character]);
  }
  return str;
};

/**
 * Translate strings to the page language or a given language.
 *
 * See the documentation of the server-side t() function for further details.
 *
 * @param str
 *   A string containing the English string to translate.
 * @param args
 *   An object of replacements pairs to make after translation. Incidences
 *   of any key in this array are replaced with the corresponding value.
 *   Based on the first character of the key, the value is escaped and/or themed:
 *    - !variable: inserted as is
 *    - @variable: escape plain text to HTML (Drupal.checkPlain)
 *    - %variable: escape text and theme as a placeholder for user-submitted
 *      content (checkPlain + Drupal.theme('placeholder'))
 * @return
 *   The translated string.
 */
Drupal.t = function(str, args) {
  // Fetch the localized version of the string.
  if (Drupal.locale.strings && Drupal.locale.strings[str]) {
    str = Drupal.locale.strings[str];
  }

  if (args) {
    // Transform arguments before inserting them
    for (var key in args) {
      switch (key.charAt(0)) {
        // Escaped only
        case '@':
          args[key] = Drupal.checkPlain(args[key]);
        break;
        // Pass-through
        case '!':
          break;
        // Escaped and placeholder
        case '%':
        default:
          args[key] = Drupal.theme('placeholder', args[key]);
          break;
      }
      str = str.replace(key, args[key]);
    }
  }
  return str;
};

/**
 * Format a string containing a count of items.
 *
 * This function ensures that the string is pluralized correctly. Since Drupal.t() is
 * called by this function, make sure not to pass already-localized strings to it.
 *
 * See the documentation of the server-side format_plural() function for further details.
 *
 * @param count
 *   The item count to display.
 * @param singular
 *   The string for the singular case. Please make sure it is clear this is
 *   singular, to ease translation (e.g. use "1 new comment" instead of "1 new").
 *   Do not use @count in the singular string.
 * @param plural
 *   The string for the plural case. Please make sure it is clear this is plural,
 *   to ease translation. Use @count in place of the item count, as in "@count
 *   new comments".
 * @param args
 *   An object of replacements pairs to make after translation. Incidences
 *   of any key in this array are replaced with the corresponding value.
 *   Based on the first character of the key, the value is escaped and/or themed:
 *    - !variable: inserted as is
 *    - @variable: escape plain text to HTML (Drupal.checkPlain)
 *    - %variable: escape text and theme as a placeholder for user-submitted
 *      content (checkPlain + Drupal.theme('placeholder'))
 *   Note that you do not need to include @count in this array.
 *   This replacement is done automatically for the plural case.
 * @return
 *   A translated string.
 */
Drupal.formatPlural = function(count, singular, plural, args) {
  var args = args || {};
  args['@count'] = count;
  // Determine the index of the plural form.
  var index = Drupal.locale.pluralFormula ? Drupal.locale.pluralFormula(args['@count']) : ((args['@count'] == 1) ? 0 : 1);

  if (index == 0) {
    return Drupal.t(singular, args);
  }
  else if (index == 1) {
    return Drupal.t(plural, args);
  }
  else {
    args['@count['+ index +']'] = args['@count'];
    delete args['@count'];
    return Drupal.t(plural.replace('@count', '@count['+ index +']'), args);
  }
};

/**
 * Generate the themed representation of a Drupal object.
 *
 * All requests for themed output must go through this function. It examines
 * the request and routes it to the appropriate theme function. If the current
 * theme does not provide an override function, the generic theme function is
 * called.
 *
 * For example, to retrieve the HTML that is output by theme_placeholder(text),
 * call Drupal.theme('placeholder', text).
 *
 * @param func
 *   The name of the theme function to call.
 * @param ...
 *   Additional arguments to pass along to the theme function.
 * @return
 *   Any data the theme function returns. This could be a plain HTML string,
 *   but also a complex object.
 */
Drupal.theme = function(func) {
  for (var i = 1, args = []; i < arguments.length; i++) {
    args.push(arguments[i]);
  }

  return (Drupal.theme[func] || Drupal.theme.prototype[func]).apply(this, args);
};

/**
 * Parse a JSON response.
 *
 * The result is either the JSON object, or an object with 'status' 0 and 'data' an error message.
 */
Drupal.parseJson = function (data) {
  if ((data.substring(0, 1) != '{') && (data.substring(0, 1) != '[')) {
    return { status: 0, data: data.length ? data : Drupal.t('Unspecified error') };
  }
  return eval('(' + data + ');');
};

/**
 * Freeze the current body height (as minimum height). Used to prevent
 * unnecessary upwards scrolling when doing DOM manipulations.
 */
Drupal.freezeHeight = function () {
  Drupal.unfreezeHeight();
  var div = document.createElement('div');
  $(div).css({
    position: 'absolute',
    top: '0px',
    left: '0px',
    width: '1px',
    height: $('body').css('height')
  }).attr('id', 'freeze-height');
  $('body').append(div);
};

/**
 * Unfreeze the body height
 */
Drupal.unfreezeHeight = function () {
  $('#freeze-height').remove();
};

/**
 * Wrapper around encodeURIComponent() which avoids Apache quirks (equivalent of
 * drupal_urlencode() in PHP). This function should only be used on paths, not
 * on query string arguments.
 */
Drupal.encodeURIComponent = function (item, uri) {
  uri = uri || location.href;
  item = encodeURIComponent(item).replace(/%2F/g, '/');
  return (uri.indexOf('?q=') != -1) ? item : item.replace(/%26/g, '%2526').replace(/%23/g, '%2523').replace(/\/\//g, '/%252F');
};

/**
 * Get the text selection in a textarea.
 */
Drupal.getSelection = function (element) {
  if (typeof(element.selectionStart) != 'number' && document.selection) {
    // The current selection
    var range1 = document.selection.createRange();
    var range2 = range1.duplicate();
    // Select all text.
    range2.moveToElementText(element);
    // Now move 'dummy' end point to end point of original range.
    range2.setEndPoint('EndToEnd', range1);
    // Now we can calculate start and end points.
    var start = range2.text.length - range1.text.length;
    var end = start + range1.text.length;
    return { 'start': start, 'end': end };
  }
  return { 'start': element.selectionStart, 'end': element.selectionEnd };
};

/**
 * Build an error message from ahah response.
 */
Drupal.ahahError = function(xmlhttp, uri) {
  if (xmlhttp.status == 200) {
    if (jQuery.trim(xmlhttp.responseText)) {
      var message = Drupal.t("An error occurred. \n@uri\n@text", {'@uri': uri, '@text': xmlhttp.responseText });
    }
    else {
      var message = Drupal.t("An error occurred. \n@uri\n(no information available).", {'@uri': uri });
    }
  }
  else {
    var message = Drupal.t("An HTTP error @status occurred. \n@uri", {'@uri': uri, '@status': xmlhttp.status });
  }
  return message.replace(/\n/g, '<br />');
}

// Global Killswitch on the <html> element
$(document.documentElement).addClass('js');
// Attach all behaviors.
$(document).ready(function() {
  Drupal.attachBehaviors(this);
});

/**
 * The default themes.
 */
Drupal.theme.prototype = {

  /**
   * Formats text for emphasized display in a placeholder inside a sentence.
   *
   * @param str
   *   The text to format (plain-text).
   * @return
   *   The formatted text (html).
   */
  placeholder: function(str) {
    return '<em>' + Drupal.checkPlain(str) + '</em>';
  }
};
;
Drupal.locale = { 'pluralFormula': function($n) { return Number(($n!=1)); }, 'strings': {"Edit":"Bewerken","Save":"Verstuur","Your server has been successfully tested to support this feature.":"De server is getest en kan deze functie gebruiken.","Your system configuration does not currently support this feature. The \u003ca href=\"http:\/\/drupal.org\/node\/15365\"\u003ehandbook page on Clean URLs\u003c\/a\u003e has additional troubleshooting information.":"De systeem configuratie ondersteunt deze functie momenteel niet. De \u003ca href=\"http:\/\/drupal.org\/node\/15365\"\u003e handboekpagina over Clean URLs\u003c\/a\u003e geeft meer informatie.","Testing clean URLs...":"Testen van schone URLs.","Select all rows in this table":"Selecteer alle regels van deze tabel","Deselect all rows in this table":"De-selecteer alle regels van deze tabel","Join summary":"Samenvatting samenvoegen","Split summary at cursor":"Splits de samenvatting op de cursorpositie","Drag to re-order":"Slepen om de volgorde te wijzigen","Changes made in this table will not be saved until the form is submitted.":"Wijzigingen in deze tabel worden pas opgeslagen wanneer het formulier wordt ingediend.","Unspecified error":"Onbekend probleem","An error occurred. \n@uri\n@text":"Een fout is opgetreden; @uri @text","An error occurred. \n@uri\n(no information available).":"Een fout is opgetreden. \r\n@uri \r\n(geen informatie beschikbaar).","An HTTP error @status occurred. \n@uri":"Een HTTP-fout @status is opgetreden; @uri","The changes to these blocks will not be saved until the \u003cem\u003eSave blocks\u003c\/em\u003e button is clicked.":"Wijzigingen aan de blokken worden pas opgeslagen wanneer u de knop \u003cem\u003eBlokken opslaan\u003c\/em\u003e aanklikt.","Automatic alias":"Automatische alias","The selected file %filename cannot be uploaded. Only files with the following extensions are allowed: %extensions.":"Het geselecteerde bestand %filename kan niet worden geupload. Alleen bestanden met volgende extensies zijn toegestaan: %extensions.","Close":"Alleen zichtbaar voor mij","Logout":"Uitloggen","Saving vote...":"Stem geregistreerd","Facebook and !site_name":"Facebook en !site_name","Do you also want to logout from your Facebook account?":"Wilt u ook uitloggen van uw Facebook account?"} };;
Drupal.tmc_login = {};

Drupal.tmc_login.premiumCheck = function () {

  var premiumbox = getParameter(window.location.href, 'lightbox');
  var premium = $('#artikel.premiumcontent').length;

  var uri, hash, valuri, upsell_type;

  if (premiumbox == 'true') {

    uri = getParameter(window.location.href, 'uri');
    hash = getParameter(window.location.href, 'hash');

    valuri = '/wuz/valuri?hash=' + hash + '&uri=' + escape( uri );

    upsell_type = getParameter(window.location.href, 'upsell_type');
    upsell_type !== 'null' ? valuri = valuri + '?upsell_type=' + upsell_type : '';
    uri = '<a href="' + valuri + '" rel="lightframe" id="lightbox-uri"></a>';

  } else if (premium) {

    if (document.referrer == window.location.href ||
      document.referrer.indexOf('close-iframe') != -1 ||
      document.referrer.indexOf('forced') != -1 ||
      premiumbox == 'false' ||
      window.location.pathname.indexOf('/premium/') === 0) return;
    uri = '<a href="/wuz/upsell/check/premium?nocache" rel="lightframe" id="lightbox-uri"></a>';

  }

  if (typeof uri != 'undefined') {

    $('body').prepend(uri);
    Lightbox.initList();
    $('#lightbox-uri').click(function () {
      $(this).remove();
    });
    $('#lightbox-uri').trigger('click');

  }

}

// Drupal.tmc_login.showLoader = function () {
//   loginbox = {
//     left: $('#community-status').position().left,
//     top: $('#community-status').position().top,
//     width: $('#community-status').width(),
//     height: $('#community-status').height()

//   }
//   $("#ajax-login-loader .background").css({
//     "left": loginbox.left,
//     "top": loginbox.top,
//     "width": loginbox.width,
//     "height": loginbox.height
//   });
//   $("#ajax-login-loader .text").css({
//     "width": loginbox.width - 20
//   });
//   $('#ajax-login-loader').show();
// }
// Drupal.tmc_login.hideLoader = function () {
//   $('#ajax-login-loader').hide();
// }
// Drupal.tmc_login.getLoginBox = function (el) {
//   if ($('#community-status').length > 0) {
//     $('#community-status').prependTo('#comment-form-content');
//     $('#community-status').show();
//     $('#community-status .close').show();
//     $('#login-button').hide();
//   } else {
//     $.ajax({
//       url: '/wuz/ajax/loginbox',
//       dataType: "html",
//       success: function (data) {
//         $('#comment-form-content').prepend(data);
//         $('#community-status .close').show();
//         $('#community-status').addClass('ajaxed');
//         $('#login-button').hide();
//         Drupal.attachBehaviors('#comment-form-content');
//       }
//     });
//     //$('<div class="messages error hasTimeout">Er heeft zich een fout voorgedaan. <a href="#" onclick="location.reload();">Herlaad</a> de pagina en probeer het nog eens.</div>').prependTo('#comment-form-content');
//   }
// }
// Drupal.tmc_login.resetLoginBox = function (el) {
//   if ($('#community-status').length > 0) {
//     if ($('#community-status').hasClass('ajaxed')) {
//       $('#community-status').remove();
//     } else {
//       $('#community-status').prependTo('#communityheader .wuzcontainer');
//       $('#community-status .close').hide();
//     }
//     $('#login-button').show();
//   } else {
//     $('<div class="messages error hasTimeout">Er heeft zich een fout voorgedaan. <a href="#" onclick="location.reload();">Herlaad</a> de pagina en probeer het nog eens.</div>').prependTo('#comment-form-content');
//   }
// }
;
/* $Id: lightbox.js,v 1.5.2.6.2.136 2010/09/24 08:39:40 snpower Exp $ */

// andre HACK z-index, replaced 10500 with 2147483645
// and 10090 with 2147483643.
// for zindex levels see http://stackoverflow.com/questions/491052/mininum-and-maximum-value-of-z-index
// we need this hack because banners use high zindexes

/**
 * jQuery Lightbox
 * @author
 *   Stella Power, <http://drupal.org/user/66894>
 *
 * Based on Lightbox v2.03.3 by Lokesh Dhakar
 * <http://www.huddletogether.com/projects/lightbox2/>
 * Also partially based on the jQuery Lightbox by Warren Krewenki
 *   <http://warren.mesozen.com>
 *
 * Permission has been granted to Mark Ashmead & other Drupal Lightbox2 module
 * maintainers to distribute this file via Drupal.org
 * Under GPL license.
 *
 * Slideshow, iframe and video functionality added by Stella Power.
 */

var Lightbox = {
    auto_modal: false,
    overlayOpacity: 0.8, // Controls transparency of shadow overlay.
    overlayColor: '000', // Controls colour of shadow overlay.
    disableCloseClick: true,
    // Controls the order of the lightbox resizing animation sequence.
    resizeSequence: 0, // 0: simultaneous, 1: width then height, 2: height then width.
    resizeSpeed: 'normal', // Controls the speed of the lightbox resizing animation.
    fadeInSpeed: 'normal', // Controls the speed of the image appearance.
    slideDownSpeed: 'slow', // Controls the speed of the image details appearance.
    minWidth: 240,
    borderSize: 10,
    boxColor: 'fff',
    fontColor: '000',
    topPosition: '',
    infoHeight: 20,
    alternative_layout: false,
    imageArray: [],
    imageNum: null,
    total: 0,
    activeImage: null,
    inprogress: false,
    disableResize: false,
    disableZoom: false,
    isZoomedIn: false,
    rtl: false,
    loopItems: false,
    keysClose: ['c', 'x', 27],
    keysPrevious: ['p', 37],
    keysNext: ['n', 39],
    keysZoom: ['z'],
    keysPlayPause: [32],

    // Slideshow options.
    slideInterval: 5000, // In milliseconds.
    showPlayPause: true,
    autoStart: true,
    autoExit: true,
    pauseOnNextClick: false, // True to pause the slideshow when the "Next" button is clicked.
    pauseOnPrevClick: true, // True to pause the slideshow when the "Prev" button is clicked.
    slideIdArray: [],
    slideIdCount: 0,
    isSlideshow: false,
    isPaused: false,
    loopSlides: false,

    // Iframe options.
    isLightframe: false,
    iframe_width: 600,
    iframe_height: 400,
    iframe_border: 1,

    // Video and modal options.
    enableVideo: false,
    flvPlayer: '/flvplayer.swf',
    flvFlashvars: '',
    isModal: false,
    isVideo: false,
    videoId: false,
    modalWidth: 400,
    modalHeight: 400,
    modalHTML: null,


    // initialize()
    // Constructor runs on completion of the DOM loading.
    // The function inserts html at the bottom of the page which is used
    // to display the shadow overlay and the image container.
    initialize: function () {

        var s = Drupal.settings.lightbox2;
        Lightbox.overlayOpacity = s.overlay_opacity;
        Lightbox.overlayColor = s.overlay_color;
        Lightbox.disableCloseClick = s.disable_close_click;
        Lightbox.resizeSequence = s.resize_sequence;
        Lightbox.resizeSpeed = s.resize_speed;
        Lightbox.fadeInSpeed = s.fade_in_speed;
        Lightbox.slideDownSpeed = s.slide_down_speed;
        Lightbox.borderSize = s.border_size;
        Lightbox.boxColor = s.box_color;
        Lightbox.fontColor = s.font_color;
        Lightbox.topPosition = s.top_position;
        Lightbox.rtl = s.rtl;
        Lightbox.loopItems = s.loop_items;
        Lightbox.keysClose = s.keys_close.split(" ");
        Lightbox.keysPrevious = s.keys_previous.split(" ");
        Lightbox.keysNext = s.keys_next.split(" ");
        Lightbox.keysZoom = s.keys_zoom.split(" ");
        Lightbox.keysPlayPause = s.keys_play_pause.split(" ");
        Lightbox.disableResize = s.disable_resize;
        Lightbox.disableZoom = s.disable_zoom;
        Lightbox.slideInterval = s.slideshow_interval;
        Lightbox.showPlayPause = s.show_play_pause;
        Lightbox.showCaption = s.show_caption;
        Lightbox.autoStart = s.slideshow_automatic_start;
        Lightbox.autoExit = s.slideshow_automatic_exit;
        Lightbox.pauseOnNextClick = s.pause_on_next_click;
        Lightbox.pauseOnPrevClick = s.pause_on_previous_click;
        Lightbox.loopSlides = s.loop_slides;
        Lightbox.alternative_layout = s.use_alt_layout;
        Lightbox.iframe_width = s.iframe_width;
        Lightbox.iframe_height = s.iframe_height;
        Lightbox.iframe_border = s.iframe_border;
        Lightbox.enableVideo = s.enable_video;
        if (s.enable_video) {
            Lightbox.flvPlayer = s.flvPlayer;
            Lightbox.flvFlashvars = s.flvFlashvars;
        }

        // Make the lightbox divs.
        var layout_class = (s.use_alt_layout ? 'lightbox2-alt-layout' : 'lightbox2-orig-layout');
        var output = '<div id="lightbox2-overlay" style="display: none;"></div>\
      <div id="lightbox" style="display: none;" class="' + layout_class + '">\
        <div id="outerImageContainer"></div>\
        <div id="imageDataContainer" class="clearfix">\
          <div id="imageData"></div>\
        </div>\
      </div>';
        var loading = '<div id="loading"><a href="#" id="loadingLink"></a></div>';
        var modal = '<div id="modalContainer" style="display: none;"></div>';
        var frame = '<div id="frameContainer" style="display: none;"></div>';
        var imageContainer = '<div id="imageContainer" style="display: none;"></div>';
        var details = '<div id="imageDetails"></div>';
        var bottomNav = '<div id="bottomNav"></div>';
        var image = '<img id="lightboxImage" alt="" />';
        var hoverNav = '<div id="hoverNav"><a id="prevLink" href="#"></a><a id="nextLink" href="#"></a></div>';
        var frameNav = '<div id="frameHoverNav"><a id="framePrevLink" href="#"></a><a id="frameNextLink" href="#"></a></div>';
        var hoverNav = '<div id="hoverNav"><a id="prevLink" title="' + Drupal.t('Previous') + '" href="#"></a><a id="nextLink" title="' + Drupal.t('Next') + '" href="#"></a></div>';
        var frameNav = '<div id="frameHoverNav"><a id="framePrevLink" title="' + Drupal.t('Previous') + '" href="#"></a><a id="frameNextLink" title="' + Drupal.t('Next') + '" href="#"></a></div>';
        var caption = '<span id="caption"></span>';
        var numberDisplay = '<span id="numberDisplay"></span>';
        var close = '<a id="bottomNavClose" title="Sluit" href="#"></a>';
        var zoom = '<a id="bottomNavZoom" href="#"></a>';
        var zoomOut = '<a id="bottomNavZoomOut" href="#"></a>';
        var pause = '<a id="lightshowPause" title="' + Drupal.t('Pause Slideshow') + '" href="#" style="display: none;"></a>';
        var play = '<a id="lightshowPlay" title="' + Drupal.t('Play Slideshow') + '" href="#" style="display: none;"></a>';

        $("body").append(output);
        $('#outerImageContainer').append(modal + frame + imageContainer + loading);
        if (!s.use_alt_layout) {
            $('#outerImageContainer').append(close);
            $('#imageContainer').append(image + hoverNav);
            $('#imageData').append(details + bottomNav);
            $('#imageDetails').append(caption + numberDisplay);
            //      $('#bottomNav').append(frameNav + zoom + zoomOut + pause + play);
        } else {
            $('#outerImageContainer').append(bottomNav);
            $('#imageContainer').append(image);
            $('#bottomNav').append(close + zoom + zoomOut);
            $('#imageData').append(hoverNav + details);
            $('#imageDetails').append(caption + numberDisplay + pause + play);
        }

        // Setup onclick handlers.
        if (Lightbox.disableCloseClick) {
            $('#lightbox2-overlay').click(function () {
                Lightbox.end();
                return false;
            }).hide();
        }
        $('#loadingLink, #bottomNavClose').click(function () {
            Lightbox.end('forceClose');
            return false;
        });
        $('#prevLink, #framePrevLink').click(function () {
            Lightbox.changeData(Lightbox.activeImage - 1);
            return false;
        });
        $('#nextLink, #frameNextLink').click(function () {
            Lightbox.changeData(Lightbox.activeImage + 1);
            return false;
        });
        $('#bottomNavZoom').click(function () {
            Lightbox.changeData(Lightbox.activeImage, true);
            return false;
        });
        $('#bottomNavZoomOut').click(function () {
            Lightbox.changeData(Lightbox.activeImage, false);
            return false;
        });
        $('#lightshowPause').click(function () {
            Lightbox.togglePlayPause("lightshowPause", "lightshowPlay");
            return false;
        });
        $('#lightshowPlay').click(function () {
            Lightbox.togglePlayPause("lightshowPlay", "lightshowPause");
            return false;
        });

        // Fix positioning.
        $('#prevLink, #nextLink, #framePrevLink, #frameNextLink').css({
            'paddingTop': Lightbox.borderSize + 'px'
        });
        $('#imageContainer, #frameContainer, #modalContainer').css({
            'padding': Lightbox.borderSize + 'px'
        });
        $('#outerImageContainer, #imageDataContainer, #bottomNavClose').css({
            'backgroundColor': '#' + Lightbox.boxColor,
            'color': '#' + Lightbox.fontColor
        });
        if (Lightbox.alternative_layout) {
            $('#bottomNavZoom, #bottomNavZoomOut').css({
                'bottom': Lightbox.borderSize + 'px',
                'right': Lightbox.borderSize + 'px'
            });
        } else if (Lightbox.rtl == 1 && $.browser.msie) {
            $('#bottomNavZoom, #bottomNavZoomOut').css({
                'left': '0px'
            });
        }

        // Force navigation links to always be displayed
        if (s.force_show_nav) {
            $('#prevLink, #nextLink').addClass("force_show_nav");
        }

    },

    // initList()
    // Loops through anchor tags looking for 'lightbox', 'lightshow' and
    // 'lightframe', etc, references and applies onclick events to appropriate
    // links. You can rerun after dynamically adding images w/ajax.
    initList: function (context) {

        if (context == undefined || context == null) {
            context = document;
        }

        // Attach lightbox to any links with rel 'lightbox', 'lightshow' or
        // 'lightframe', etc.
        $("a[rel^='lightbox']:not(.lightbox-processed), area[rel^='lightbox']:not(.lightbox-processed)", context).addClass('lightbox-processed').click(function (e) {
            if (Lightbox.disableCloseClick) {
                $('#lightbox').unbind('click');
                $('#lightbox').click(function () {
                    Lightbox.end('forceClose');
                });
            }
            Lightbox.start(this, false, false, false, false);
            if (e.preventDefault) {
                e.preventDefault();
            }
            return false;
        });
        $("a[rel^='lightshow']:not(.lightbox-processed), area[rel^='lightshow']:not(.lightbox-processed)", context).addClass('lightbox-processed').click(function (e) {
            if (Lightbox.disableCloseClick) {
                $('#lightbox').unbind('click');
                $('#lightbox').click(function () {
                    Lightbox.end('forceClose');
                });
            }
            Lightbox.start(this, true, false, false, false);
            if (e.preventDefault) {
                e.preventDefault();
            }
            return false;
        });
        $("a[rel^='lightframe']:not(.lightbox-processed), area[rel^='lightframe']:not(.lightbox-processed)", context).addClass('lightbox-processed').click(function (e) {
            if (Lightbox.disableCloseClick) {
                $('#lightbox').unbind('click');
                $('#lightbox').click(function () {
                    Lightbox.end('forceClose');
                });
            }
            Lightbox.start(this, false, true, false, false);
            if (e.preventDefault) {
                e.preventDefault();
            }
            return false;
        });
        if (Lightbox.enableVideo) {
            $("a[rel^='lightvideo']:not(.lightbox-processed), area[rel^='lightvideo']:not(.lightbox-processed)", context).addClass('lightbox-processed').click(function (e) {
                if (Lightbox.disableCloseClick) {
                    $('#lightbox').unbind('click');
                    $('#lightbox').click(function () {
                        Lightbox.end('forceClose');
                    });
                }
                Lightbox.start(this, false, false, true, false);
                if (e.preventDefault) {
                    e.preventDefault();
                }
                return false;
            });
        }
        $("a[rel^='lightmodal']:not(.lightbox-processed), area[rel^='lightmodal']:not(.lightbox-processed)", context).addClass('lightbox-processed').click(function (e) {
            $('#lightbox').unbind('click');
            // Add classes from the link to the lightbox div - don't include lightbox-processed
            $('#lightbox').addClass($(this).attr('class'));
            $('#lightbox').removeClass('lightbox-processed');
            Lightbox.start(this, false, false, false, true);
            if (e.preventDefault) {
                e.preventDefault();
            }
            return false;
        });
        $("#lightboxAutoModal:not(.lightbox-processed)", context).addClass('lightbox-processed').click(function (e) {
            Lightbox.auto_modal = true;
            $('#lightbox').unbind('click');
            Lightbox.start(this, false, false, false, true);
            if (e.preventDefault) {
                e.preventDefault();
            }
            return false;
        });
    },

    // start()
    // Display overlay and lightbox. If image is part of a set, add siblings to
    // imageArray.
    start: function (imageLink, slideshow, lightframe, lightvideo, lightmodal) {

        Lightbox.isPaused = !Lightbox.autoStart;

        // Replaces hideSelectBoxes() and hideFlash() calls in original lightbox2.
        Lightbox.toggleSelectsFlash('hide');

        // Stretch overlay to fill page and fade in.
        var arrayPageSize = Lightbox.getPageSize();
        $("#lightbox2-overlay").hide().css({
            'width': '100%',
            'zIndex': '2147483643',
            'height': arrayPageSize[1] + 'px',
            'backgroundColor': '#' + Lightbox.overlayColor
        });
        // Detect OS X FF2 opacity + flash issue.
        if (lightvideo && this.detectMacFF2()) {
            $("#lightbox2-overlay").removeClass("overlay_default");
            $("#lightbox2-overlay").addClass("overlay_macff2");
            $("#lightbox2-overlay").css({
                'opacity': null
            });
        } else {
            $("#lightbox2-overlay").removeClass("overlay_macff2");
            $("#lightbox2-overlay").addClass("overlay_default");
            $("#lightbox2-overlay").css({
                'opacity': Lightbox.overlayOpacity
            });
        }
        $("#lightbox2-overlay").fadeIn(Lightbox.fadeInSpeed);


        Lightbox.isSlideshow = slideshow;
        Lightbox.isLightframe = lightframe;
        Lightbox.isVideo = lightvideo;
        Lightbox.isModal = lightmodal;
        Lightbox.imageArray = [];
        Lightbox.imageNum = 0;

        var anchors = $(imageLink.tagName);
        var anchor = null;
        var rel_parts = Lightbox.parseRel(imageLink);
        var rel = rel_parts["rel"];
        var rel_group = rel_parts["group"];
        var title = (rel_parts["title"] ? rel_parts["title"] : imageLink.title);
        var rel_style = null;
        var i = 0;

        if (rel_parts["flashvars"]) {
            Lightbox.flvFlashvars = Lightbox.flvFlashvars + '&' + rel_parts["flashvars"];
        }

        // Set the title for image alternative text.
        var alt = imageLink.title;
        if (!alt) {
            var img = $(imageLink).find("img");
            if (img && $(img).attr("alt")) {
                alt = $(img).attr("alt");
            } else {
                alt = title;
            }
        }

        if ($(imageLink).attr('id') == 'lightboxAutoModal') {
            rel_style = rel_parts["style"];
            Lightbox.imageArray.push(['#lightboxAutoModal > *', title, alt, rel_style, 1]);
        } else {
            // Handle lightbox images with no grouping.
            if ((rel == 'lightbox' || rel == 'lightshow') && !rel_group) {
                Lightbox.imageArray.push([imageLink.href, title, alt]);
            }

            // Handle other items with no grouping.
            else if (!rel_group) {
                rel_style = rel_parts["style"];
                Lightbox.imageArray.push([imageLink.href, title, alt, rel_style]);
            }

            // Handle grouped items.
            else {

                // Loop through anchors and add them to imageArray.
                for (i = 0; i < anchors.length; i++) {
                    anchor = anchors[i];
                    if (anchor.href && typeof (anchor.href) == "string" && $(anchor).attr('rel')) {
                        var rel_data = Lightbox.parseRel(anchor);
                        var anchor_title = (rel_data["title"] ? rel_data["title"] : anchor.title);
                        img_alt = anchor.title;
                        if (!img_alt) {
                            var anchor_img = $(anchor).find("img");
                            if (anchor_img && $(anchor_img).attr("alt")) {
                                img_alt = $(anchor_img).attr("alt");
                            } else {
                                img_alt = title;
                            }
                        }
                        if (rel_data["rel"] == rel) {
                            if (rel_data["group"] == rel_group) {
                                if (Lightbox.isLightframe || Lightbox.isModal || Lightbox.isVideo) {
                                    rel_style = rel_data["style"];
                                }
                                Lightbox.imageArray.push([anchor.href, anchor_title, img_alt, rel_style]);
                            }
                        }
                    }
                }

                // Remove duplicates.
                for (i = 0; i < Lightbox.imageArray.length; i++) {
                    for (j = Lightbox.imageArray.length - 1; j > i; j--) {
                        if (Lightbox.imageArray[i][0] == Lightbox.imageArray[j][0]) {
                            Lightbox.imageArray.splice(j, 1);
                        }
                    }
                }
                while (Lightbox.imageArray[Lightbox.imageNum][0] != imageLink.href) {
                    Lightbox.imageNum++;
                }
            }
        }

        if (Lightbox.isSlideshow && Lightbox.showPlayPause && Lightbox.isPaused) {
            $('#lightshowPlay').show();
            $('#lightshowPause').hide();
        }

        // Calculate top and left offset for the lightbox.
        var arrayPageScroll = Lightbox.getPageScroll();
        var lightboxTop = arrayPageScroll[1] + (Lightbox.topPosition == '' ? (arrayPageSize[3] / 10) : Lightbox.topPosition) * 1;
        var lightboxLeft = arrayPageScroll[0];
        $('#frameContainer, #modalContainer, #lightboxImage').hide();
        $('#hoverNav, #prevLink, #nextLink, #frameHoverNav, #framePrevLink, #frameNextLink').hide();
        $('#imageDataContainer, #numberDisplay, #bottomNavZoom, #bottomNavZoomOut').hide();
        $('#outerImageContainer').css({
            'width': '250px',
            'height': '250px'
        });
        $('#lightbox').css({
            'zIndex': '2147483645',
            'top': lightboxTop + 'px',
            'left': lightboxLeft + 'px'
        }).show();

        Lightbox.total = Lightbox.imageArray.length;
        Lightbox.changeData(Lightbox.imageNum);

        pagerefresh = function () {
            return false;
        }

    },

    // changeData()
    // Hide most elements and preload image in preparation for resizing image
    // container.
    changeData: function (imageNum, zoomIn) {

        if (Lightbox.inprogress === false) {
            if (Lightbox.total > 1 && ((Lightbox.isSlideshow && Lightbox.loopSlides) || (!Lightbox.isSlideshow && Lightbox.loopItems))) {
                if (imageNum >= Lightbox.total) imageNum = 0;
                if (imageNum < 0) imageNum = Lightbox.total - 1;
            }

            if (Lightbox.isSlideshow) {
                for (var i = 0; i < Lightbox.slideIdCount; i++) {
                    window.clearTimeout(Lightbox.slideIdArray[i]);
                }
            }
            Lightbox.inprogress = true;
            Lightbox.activeImage = imageNum;

            if (Lightbox.disableResize && !Lightbox.isSlideshow) {
                zoomIn = true;
            }
            Lightbox.isZoomedIn = zoomIn;


            // Hide elements during transition.
            $('#loading').css({
                'zIndex': '2147483645'
            }).show();
            if (!Lightbox.alternative_layout) {
                $('#imageContainer').hide();
            }
            $('#frameContainer, #modalContainer, #lightboxImage').hide();
            $('#hoverNav, #prevLink, #nextLink, #frameHoverNav, #framePrevLink, #frameNextLink').hide();
            $('#imageDataContainer, #numberDisplay, #bottomNavZoom, #bottomNavZoomOut').hide();

            // Preload image content, but not iframe pages.
            if (!Lightbox.isLightframe && !Lightbox.isVideo && !Lightbox.isModal) {
                $("#lightbox #imageDataContainer").removeClass('lightbox2-alt-layout-data');
                imgPreloader = new Image();
                imgPreloader.onerror = function () {
                    Lightbox.imgNodeLoadingError(this);
                };

                imgPreloader.onload = function () {
                    var photo = document.getElementById('lightboxImage');
                    photo.src = Lightbox.imageArray[Lightbox.activeImage][0];
                    photo.alt = Lightbox.imageArray[Lightbox.activeImage][2];

                    var imageWidth = imgPreloader.width;
                    var imageHeight = imgPreloader.height;

                    // Resize code.
                    var arrayPageSize = Lightbox.getPageSize();
                    var targ = {
                        w: arrayPageSize[2] - (Lightbox.borderSize * 2),
                        h: arrayPageSize[3] - (Lightbox.borderSize * 6) - (Lightbox.infoHeight * 4) - (arrayPageSize[3] / 10)
                    };
                    var orig = {
                        w: imgPreloader.width,
                        h: imgPreloader.height
                    };

                    // Image is very large, so show a smaller version of the larger image
                    // with zoom button.
                    if (zoomIn !== true) {
                        var ratio = 1.0; // Shrink image with the same aspect.
                        $('#bottomNavZoomOut, #bottomNavZoom').hide();
                        if ((orig.w >= targ.w || orig.h >= targ.h) && orig.h && orig.w) {
                            ratio = ((targ.w / orig.w) < (targ.h / orig.h)) ? targ.w / orig.w : targ.h / orig.h;
                            if (!Lightbox.disableZoom && !Lightbox.isSlideshow) {
                                $('#bottomNavZoom').css({
                                    'zIndex': '2147483645'
                                }).show();
                            }
                        }

                        imageWidth = Math.floor(orig.w * ratio);
                        imageHeight = Math.floor(orig.h * ratio);
                    } else {
                        $('#bottomNavZoom').hide();
                        // Only display zoom out button if the image is zoomed in already.
                        if ((orig.w >= targ.w || orig.h >= targ.h) && orig.h && orig.w) {
                            // Only display zoom out button if not a slideshow and if the
                            // buttons aren't disabled.
                            if (!Lightbox.disableResize && Lightbox.isSlideshow === false && !Lightbox.disableZoom) {
                                $('#bottomNavZoomOut').css({
                                    'zIndex': '2147483645'
                                }).show();
                            }
                        }
                    }

                    photo.style.width = (imageWidth) + 'px';
                    photo.style.height = (imageHeight) + 'px';
                    Lightbox.resizeContainer(imageWidth, imageHeight);

                    // Clear onLoad, IE behaves irratically with animated gifs otherwise.
                    imgPreloader.onload = function () {};
                };

                imgPreloader.src = Lightbox.imageArray[Lightbox.activeImage][0];
                imgPreloader.alt = Lightbox.imageArray[Lightbox.activeImage][2];
            }

            // Set up frame size, etc.
            else if (Lightbox.isLightframe) {
                $("#lightbox #imageDataContainer").addClass('lightbox2-alt-layout-data');
                // BEGIN HACK
                $("#lightbox #imageDataContainer").remove();
                // END HACK
                var src = Lightbox.imageArray[Lightbox.activeImage][0];
                $('#frameContainer').html('<iframe id="lightboxFrame" style="background: transparent url(\'//www.telegraaf.nl/wuz/sites/all/themes/zen/css/images/lightbox/loading.gif?1384369115\') no-repeat center center;display: none;" src="' + src + '"></iframe>');

                // Enable swf support in Gecko browsers.
                if ($.browser.mozilla && src.indexOf('.swf') != -1) {
                    setTimeout(function () {
                        document.getElementById("lightboxFrame").src = Lightbox.imageArray[Lightbox.activeImage][0];
                    }, 1000);
                }

                if (!Lightbox.iframe_border) {
                    $('#lightboxFrame').css({
                        'border': 'none'
                    });
                    $('#lightboxFrame').attr('frameborder', '0');
                }
                var iframe = document.getElementById('lightboxFrame');
                var iframeStyles = Lightbox.imageArray[Lightbox.activeImage][3];
                iframe = Lightbox.setStyles(iframe, iframeStyles);
                Lightbox.resizeContainer(parseInt(iframe.width, 10), parseInt(iframe.height, 10));
            } else if (Lightbox.isVideo || Lightbox.isModal) {
                $("#lightbox #imageDataContainer").addClass('lightbox2-alt-layout-data');
                var container = document.getElementById('modalContainer');
                var modalStyles = Lightbox.imageArray[Lightbox.activeImage][3];
                container = Lightbox.setStyles(container, modalStyles);
                if (Lightbox.isVideo) {
                    Lightbox.modalHeight = parseInt(container.height, 10) - 10;
                    Lightbox.modalWidth = parseInt(container.width, 10) - 10;
                    Lightvideo.startVideo(Lightbox.imageArray[Lightbox.activeImage][0]);
                }
                Lightbox.resizeContainer(parseInt(container.width, 10), parseInt(container.height, 10));
            }
        }
    },

    // imgNodeLoadingError()
    imgNodeLoadingError: function (image) {
        var s = Drupal.settings.lightbox2;
        var original_image = Lightbox.imageArray[Lightbox.activeImage][0];
        if (s.display_image_size !== "") {
            original_image = original_image.replace(new RegExp("." + s.display_image_size), "");
        }
        Lightbox.imageArray[Lightbox.activeImage][0] = original_image;
        image.onerror = function () {
            Lightbox.imgLoadingError(image);
        };
        image.src = original_image;
    },

    // imgLoadingError()
    imgLoadingError: function (image) {
        var s = Drupal.settings.lightbox2;
        Lightbox.imageArray[Lightbox.activeImage][0] = s.default_image;
        image.src = s.default_image;
    },

    // resizeContainer()
    resizeContainer: function (imgWidth, imgHeight) {

        imgWidth = (imgWidth < Lightbox.minWidth ? Lightbox.minWidth : imgWidth);

        this.widthCurrent = $('#outerImageContainer').width();
        this.heightCurrent = $('#outerImageContainer').height();

        var widthNew = (imgWidth + (Lightbox.borderSize * 2));
        var heightNew = (imgHeight + (Lightbox.borderSize * 2));

        // Scalars based on change from old to new.
        this.xScale = (widthNew / this.widthCurrent) * 100;
        this.yScale = (heightNew / this.heightCurrent) * 100;

        // Calculate size difference between new and old image, and resize if
        // necessary.
        wDiff = this.widthCurrent - widthNew;
        hDiff = this.heightCurrent - heightNew;

        $('#modalContainer').css({
            'width': imgWidth,
            'height': imgHeight
        });
        // Detect animation sequence.
        if (Lightbox.resizeSequence) {
            var animate1 = {
                width: widthNew
            };
            var animate2 = {
                height: heightNew
            };
            if (Lightbox.resizeSequence == 2) {
                animate1 = {
                    height: heightNew
                };
                animate2 = {
                    width: widthNew
                };
            }
            $('#outerImageContainer').animate(animate1, Lightbox.resizeSpeed).animate(animate2, Lightbox.resizeSpeed, 'linear', function () {
                Lightbox.showData();
            });
        }
        // Simultaneous.
        else {
            $('#outerImageContainer').animate({
                'width': widthNew,
                'height': heightNew
            }, Lightbox.resizeSpeed, 'linear', function () {
                Lightbox.showData();
            });
        }

        // If new and old image are same size and no scaling transition is necessary
        // do a quick pause to prevent image flicker.
        if ((hDiff === 0) && (wDiff === 0)) {
            if ($.browser.msie) {
                Lightbox.pause(250);
            } else {
                Lightbox.pause(100);
            }
        }

        var s = Drupal.settings.lightbox2;
        if (!s.use_alt_layout) {
            $('#prevLink, #nextLink').css({
                'height': imgHeight + 'px'
            });
        }
        $('#imageDataContainer').css({
            'width': widthNew + 'px'
        });
    },

    // showData()
    // Display image and begin preloading neighbors.
    showData: function () {
        $('#loading').hide();

        if (Lightbox.isLightframe || Lightbox.isVideo || Lightbox.isModal) {
            Lightbox.updateDetails();
            if (Lightbox.isLightframe) {
                $('#frameContainer').show();
                if ($.browser.safari || Lightbox.fadeInSpeed === 0) {
                    $('#lightboxFrame').css({
                        'zIndex': '2147483645'
                    }).show();
                } else {
                    $('#lightboxFrame').css({
                        'zIndex': '2147483645'
                    }).fadeIn(Lightbox.fadeInSpeed);
                }
            } else {
                if (Lightbox.isVideo) {
                    $("#modalContainer").html(Lightbox.modalHTML).click(function () {
                        return false;
                    }).css('zIndex', '2147483645').show();
                } else {
                    var src = unescape(Lightbox.imageArray[Lightbox.activeImage][0]);
                    if (Lightbox.imageArray[Lightbox.activeImage][4]) {
                        $(src).appendTo("#modalContainer");
                        $('#modalContainer').css({
                            'zIndex': '2147483645'
                        }).show();
                    } else {
                        // Use a callback to show the new image, otherwise you get flicker.
                        $("#modalContainer").hide().load(src, function () {
                            $('#modalContainer').css({
                                'zIndex': '2147483645'
                            }).show();
                        });
                    }
                    $('#modalContainer').unbind('click');
                }
                // This might be needed in the Lightframe section above.
                //$('#modalContainer').css({'zIndex': '2147483645'}).show();
            }
        }

        // Handle display of image content.
        else {
            $('#imageContainer').show();
            if ($.browser.safari || Lightbox.fadeInSpeed === 0) {
                $('#lightboxImage').css({
                    'zIndex': '2147483645'
                }).show();
            } else {
                $('#lightboxImage').css({
                    'zIndex': '2147483645'
                }).fadeIn(Lightbox.fadeInSpeed);
            }
            Lightbox.updateDetails();
            this.preloadNeighborImages();
        }
        Lightbox.inprogress = false;

        // Slideshow specific stuff.
        if (Lightbox.isSlideshow) {
            if (!Lightbox.loopSlides && Lightbox.activeImage == (Lightbox.total - 1)) {
                if (Lightbox.autoExit) {
                    Lightbox.slideIdArray[Lightbox.slideIdCount++] = setTimeout(function () {
                        Lightbox.end('slideshow');
                    }, Lightbox.slideInterval);
                }
            } else {
                if (!Lightbox.isPaused && Lightbox.total > 1) {
                    Lightbox.slideIdArray[Lightbox.slideIdCount++] = setTimeout(function () {
                        Lightbox.changeData(Lightbox.activeImage + 1);
                    }, Lightbox.slideInterval);
                }
            }
            if (Lightbox.showPlayPause && Lightbox.total > 1 && !Lightbox.isPaused) {
                $('#lightshowPause').show();
                $('#lightshowPlay').hide();
            } else if (Lightbox.showPlayPause && Lightbox.total > 1) {
                $('#lightshowPause').hide();
                $('#lightshowPlay').show();
            }
        }

        // Adjust the page overlay size.
        var arrayPageSize = Lightbox.getPageSize();
        var arrayPageScroll = Lightbox.getPageScroll();
        var pageHeight = arrayPageSize[1];
        if (Lightbox.isZoomedIn && arrayPageSize[1] > arrayPageSize[3]) {
            var lightboxTop = (Lightbox.topPosition == '' ? (arrayPageSize[3] / 10) : Lightbox.topPosition) * 1;
            pageHeight = pageHeight + arrayPageScroll[1] + lightboxTop;
        }
        $('#lightbox2-overlay').css({
            'height': pageHeight + 'px'
        });

        // Gecko browsers (e.g. Firefox, SeaMonkey, etc) don't handle pdfs as
        // expected.
        if ($.browser.mozilla) {
            if (Lightbox.imageArray[Lightbox.activeImage][0].indexOf(".pdf") != -1) {
                setTimeout(function () {
                    document.getElementById("lightboxFrame").src = Lightbox.imageArray[Lightbox.activeImage][0];
                }, 1000);
            }
        }
    },

    // updateDetails()
    // Display caption, image number, and bottom nav.
    updateDetails: function () {

        $("#imageDataContainer").hide();

        var s = Drupal.settings.lightbox2;

        if (s.show_caption) {
            var caption = Lightbox.filterXSS(Lightbox.imageArray[Lightbox.activeImage][1]);
            if (!caption) caption = '';
            $('#caption').html(caption).css({
                'zIndex': '2147483645'
            }).show();
        }

        // If image is part of set display 'Image x of x'.
        var numberDisplay = null;
        if (s.image_count && Lightbox.total > 1) {
            var currentImage = Lightbox.activeImage + 1;
            if (!Lightbox.isLightframe && !Lightbox.isModal && !Lightbox.isVideo) {
                numberDisplay = s.image_count.replace(/\!current/, currentImage).replace(/\!total/, Lightbox.total);
            } else if (Lightbox.isVideo) {
                numberDisplay = s.video_count.replace(/\!current/, currentImage).replace(/\!total/, Lightbox.total);
            } else {
                numberDisplay = s.page_count.replace(/\!current/, currentImage).replace(/\!total/, Lightbox.total);
            }
            $('#numberDisplay').html(numberDisplay).css({
                'zIndex': '2147483645'
            }).show();
        } else {
            $('#numberDisplay').hide();
        }

        $("#imageDataContainer").hide().slideDown(Lightbox.slideDownSpeed, function () {
            $("#bottomNav").show();
        });
        if (Lightbox.rtl == 1) {
            $("#bottomNav").css({
                'float': 'left'
            });
        }
        Lightbox.updateNav();
    },

    // updateNav()
    // Display appropriate previous and next hover navigation.
    updateNav: function () {

        $('#hoverNav').css({
            'zIndex': '2147483645'
        }).show();
        var prevLink = '#prevLink';
        var nextLink = '#nextLink';

        // Slideshow is separated as we need to show play / pause button.
        if (Lightbox.isSlideshow) {
            if ((Lightbox.total > 1 && Lightbox.loopSlides) || Lightbox.activeImage !== 0) {
                $(prevLink).css({
                    'zIndex': '2147483645'
                }).show().click(function () {
                    if (Lightbox.pauseOnPrevClick) {
                        Lightbox.togglePlayPause("lightshowPause", "lightshowPlay");
                    }
                    Lightbox.changeData(Lightbox.activeImage - 1);
                    return false;
                });
            } else {
                $(prevLink).hide();
            }

            // If not last image in set, display next image button.
            if ((Lightbox.total > 1 && Lightbox.loopSlides) || Lightbox.activeImage != (Lightbox.total - 1)) {
                $(nextLink).css({
                    'zIndex': '2147483645'
                }).show().click(function () {
                    if (Lightbox.pauseOnNextClick) {
                        Lightbox.togglePlayPause("lightshowPause", "lightshowPlay");
                    }
                    Lightbox.changeData(Lightbox.activeImage + 1);
                    return false;
                });
            }
            // Safari browsers need to have hide() called again.
            else {
                $(nextLink).hide();
            }
        }

        // All other types of content.
        else {

            if ((Lightbox.isLightframe || Lightbox.isModal || Lightbox.isVideo) && !Lightbox.alternative_layout) {
                $('#frameHoverNav').css({
                    'zIndex': '2147483645'
                }).show();
                $('#hoverNav').css({
                    'zIndex': '2147483645'
                }).hide();
                prevLink = '#framePrevLink';
                nextLink = '#frameNextLink';
            }

            // If not first image in set, display prev image button.
            if ((Lightbox.total > 1 && Lightbox.loopItems) || Lightbox.activeImage !== 0) {
                // Unbind any other click handlers, otherwise this adds a new click handler
                // each time the arrow is clicked.
                $(prevLink).css({
                    'zIndex': '2147483645'
                }).show().unbind().click(function () {
                    Lightbox.changeData(Lightbox.activeImage - 1);
                    return false;
                });
            }
            // Safari browsers need to have hide() called again.
            else {
                $(prevLink).hide();
            }

            // If not last image in set, display next image button.
            if ((Lightbox.total > 1 && Lightbox.loopItems) || Lightbox.activeImage != (Lightbox.total - 1)) {
                // Unbind any other click handlers, otherwise this adds a new click handler
                // each time the arrow is clicked.
                $(nextLink).css({
                    'zIndex': '2147483645'
                }).show().unbind().click(function () {
                    Lightbox.changeData(Lightbox.activeImage + 1);
                    return false;
                });
            }
            // Safari browsers need to have hide() called again.
            else {
                $(nextLink).hide();
            }
        }

        // Don't enable keyboard shortcuts so forms will work.
        if (!Lightbox.isModal) {
            this.enableKeyboardNav();
        }
    },


    // enableKeyboardNav()
    enableKeyboardNav: function () {
        $(document).bind("keydown", this.keyboardAction);
    },

    // disableKeyboardNav()
    disableKeyboardNav: function () {
        $(document).unbind("keydown", this.keyboardAction);
    },

    // keyboardAction()
    keyboardAction: function (e) {
        if (e === null) { // IE.
            keycode = event.keyCode;
            escapeKey = 27;
        } else { // Mozilla.
            keycode = e.keyCode;
            escapeKey = e.DOM_VK_ESCAPE;
        }

        key = String.fromCharCode(keycode).toLowerCase();

        // Close lightbox.
        if (Lightbox.checkKey(Lightbox.keysClose, key, keycode)) {
            Lightbox.end('forceClose');
        }
        // Display previous image (p, <-).
        else if (Lightbox.checkKey(Lightbox.keysPrevious, key, keycode)) {
            if ((Lightbox.total > 1 && ((Lightbox.isSlideshow && Lightbox.loopSlides) || (!Lightbox.isSlideshow && Lightbox.loopItems))) || Lightbox.activeImage !== 0) {
                Lightbox.changeData(Lightbox.activeImage - 1);
            }

        }
        // Display next image (n, ->).
        else if (Lightbox.checkKey(Lightbox.keysNext, key, keycode)) {
            if ((Lightbox.total > 1 && ((Lightbox.isSlideshow && Lightbox.loopSlides) || (!Lightbox.isSlideshow && Lightbox.loopItems))) || Lightbox.activeImage != (Lightbox.total - 1)) {
                Lightbox.changeData(Lightbox.activeImage + 1);
            }
        }
        // Zoom in.
        else if (Lightbox.checkKey(Lightbox.keysZoom, key, keycode) && !Lightbox.disableResize && !Lightbox.disableZoom && !Lightbox.isSlideshow && !Lightbox.isLightframe) {
            if (Lightbox.isZoomedIn) {
                Lightbox.changeData(Lightbox.activeImage, false);
            } else if (!Lightbox.isZoomedIn) {
                Lightbox.changeData(Lightbox.activeImage, true);
            }
            return false;
        }
        // Toggle play / pause (space).
        else if (Lightbox.checkKey(Lightbox.keysPlayPause, key, keycode) && Lightbox.isSlideshow) {

            if (Lightbox.isPaused) {
                Lightbox.togglePlayPause("lightshowPlay", "lightshowPause");
            } else {
                Lightbox.togglePlayPause("lightshowPause", "lightshowPlay");
            }
            return false;
        }
    },

    preloadNeighborImages: function () {

        if ((Lightbox.total - 1) > Lightbox.activeImage) {
            preloadNextImage = new Image();
            preloadNextImage.src = Lightbox.imageArray[Lightbox.activeImage + 1][0];
        }
        if (Lightbox.activeImage > 0) {
            preloadPrevImage = new Image();
            preloadPrevImage.src = Lightbox.imageArray[Lightbox.activeImage - 1][0];
        }

    },

    end: function (caller) {
        var closeClick = (caller == 'slideshow' ? false : true);
        if (Lightbox.isSlideshow && Lightbox.isPaused && !closeClick) {
            return;
        }
        // To prevent double clicks on navigation links.
        if (Lightbox.inprogress === true && caller != 'forceClose') {
            return;
        }
        Lightbox.disableKeyboardNav();
        $('#lightbox').hide();
        $("#lightbox2-overlay").fadeOut();
        Lightbox.isPaused = true;
        Lightbox.inprogress = false;
        // Replaces calls to showSelectBoxes() and showFlash() in original
        // lightbox2.
        Lightbox.toggleSelectsFlash('visible');
        if (Lightbox.isSlideshow) {
            for (var i = 0; i < Lightbox.slideIdCount; i++) {
                window.clearTimeout(Lightbox.slideIdArray[i]);
            }
            $('#lightshowPause, #lightshowPlay').hide();
        } else if (Lightbox.isLightframe) {
            $('#frameContainer').empty().hide();
        } else if (Lightbox.isVideo || Lightbox.isModal) {
            if (!Lightbox.auto_modal) {
                $('#modalContainer').hide().html("");
            }
            Lightbox.auto_modal = false;
        }
    },


    // getPageScroll()
    // Returns array with x,y page scroll values.
    // Core code from - quirksmode.com.
    getPageScroll: function () {

        var xScroll, yScroll;

        if (self.pageYOffset || self.pageXOffset) {
            yScroll = self.pageYOffset;
            xScroll = self.pageXOffset;
        } else if (document.documentElement && (document.documentElement.scrollTop || document.documentElement.scrollLeft)) { // Explorer 6 Strict.
            yScroll = document.documentElement.scrollTop;
            xScroll = document.documentElement.scrollLeft;
        } else if (document.body) { // All other Explorers.
            yScroll = document.body.scrollTop;
            xScroll = document.body.scrollLeft;
        }

        arrayPageScroll = [xScroll, yScroll];
        return arrayPageScroll;
    },

    // getPageSize()
    // Returns array with page width, height and window width, height.
    // Core code from - quirksmode.com.
    // Edit for Firefox by pHaez.

    getPageSize: function () {

        var xScroll, yScroll;

        if (window.innerHeight && window.scrollMaxY) {
            xScroll = window.innerWidth + window.scrollMaxX;
            yScroll = window.innerHeight + window.scrollMaxY;
        } else if (document.body.scrollHeight > document.body.offsetHeight) { // All but Explorer Mac.
            xScroll = document.body.scrollWidth;
            yScroll = document.body.scrollHeight;
        } else { // Explorer Mac...would also work in Explorer 6 Strict, Mozilla and Safari.
            xScroll = document.body.offsetWidth;
            yScroll = document.body.offsetHeight;
        }

        var windowWidth, windowHeight;

        if (self.innerHeight) { // All except Explorer.
            if (document.documentElement.clientWidth) {
                windowWidth = document.documentElement.clientWidth;
            } else {
                windowWidth = self.innerWidth;
            }
            windowHeight = self.innerHeight;
        } else if (document.documentElement && document.documentElement.clientHeight) { // Explorer 6 Strict Mode.
            windowWidth = document.documentElement.clientWidth;
            windowHeight = document.documentElement.clientHeight;
        } else if (document.body) { // Other Explorers.
            windowWidth = document.body.clientWidth;
            windowHeight = document.body.clientHeight;
        }
        // For small pages with total height less than height of the viewport.
        if (yScroll < windowHeight) {
            pageHeight = windowHeight;
        } else {
            pageHeight = yScroll;
        }
        // For small pages with total width less than width of the viewport.
        if (xScroll < windowWidth) {
            pageWidth = xScroll;
        } else {
            pageWidth = windowWidth;
        }
        arrayPageSize = new Array(pageWidth, pageHeight, windowWidth, windowHeight);
        return arrayPageSize;
    },


    // pause(numberMillis)
    pause: function (ms) {
        var date = new Date();
        var curDate = null;
        do {
            curDate = new Date();
        }
        while (curDate - date < ms);
    },


    // toggleSelectsFlash()
    // Hide / unhide select lists and flash objects as they appear above the
    // lightbox in some browsers.
    toggleSelectsFlash: function (state) {
        if (state == 'visible') {
            $("select.lightbox_hidden, embed.lightbox_hidden, object.lightbox_hidden").show();
        } else if (state == 'hide') {
            $("select:visible, embed:visible, object:visible").not('#lightboxAutoModal select, #lightboxAutoModal embed, #lightboxAutoModal object').addClass("lightbox_hidden");
            $("select.lightbox_hidden, embed.lightbox_hidden, object.lightbox_hidden").hide();
        }
    },


    // parseRel()
    parseRel: function (link) {
        var parts = [];
        parts["rel"] = parts["title"] = parts["group"] = parts["style"] = parts["flashvars"] = null;
        if (!$(link).attr('rel')) return parts;
        parts["rel"] = $(link).attr('rel').match(/\w+/)[0];

        if ($(link).attr('rel').match(/\[(.*)\]/)) {
            var info = $(link).attr('rel').match(/\[(.*?)\]/)[1].split('|');
            parts["group"] = info[0];
            parts["style"] = info[1];
            if (parts["style"] != undefined && parts["style"].match(/flashvars:\s?(.*?);/)) {
                parts["flashvars"] = parts["style"].match(/flashvars:\s?(.*?);/)[1];
            }
        }
        if ($(link).attr('rel').match(/\[.*\]\[(.*)\]/)) {
            parts["title"] = $(link).attr('rel').match(/\[.*\]\[(.*)\]/)[1];
        }
        return parts;
    },

    // setStyles()
    setStyles: function (item, styles) {
        item.width = Lightbox.iframe_width;
        item.height = Lightbox.iframe_height;
        item.scrolling = "auto";

        if (!styles) return item;
        var stylesArray = styles.split(';');
        for (var i = 0; i < stylesArray.length; i++) {
            if (stylesArray[i].indexOf('width:') >= 0) {
                var w = stylesArray[i].replace('width:', '');
                item.width = jQuery.trim(w);
            } else if (stylesArray[i].indexOf('height:') >= 0) {
                var h = stylesArray[i].replace('height:', '');
                item.height = jQuery.trim(h);
            } else if (stylesArray[i].indexOf('scrolling:') >= 0) {
                var scrolling = stylesArray[i].replace('scrolling:', '');
                item.scrolling = jQuery.trim(scrolling);
            } else if (stylesArray[i].indexOf('overflow:') >= 0) {
                var overflow = stylesArray[i].replace('overflow:', '');
                item.overflow = jQuery.trim(overflow);
            }
        }
        return item;
    },


    // togglePlayPause()
    // Hide the pause / play button as appropriate.  If pausing the slideshow also
    // clear the timers, otherwise move onto the next image.
    togglePlayPause: function (hideId, showId) {
        if (Lightbox.isSlideshow && hideId == "lightshowPause") {
            for (var i = 0; i < Lightbox.slideIdCount; i++) {
                window.clearTimeout(Lightbox.slideIdArray[i]);
            }
        }
        $('#' + hideId).hide();
        $('#' + showId).show();

        if (hideId == "lightshowPlay") {
            Lightbox.isPaused = false;
            if (!Lightbox.loopSlides && Lightbox.activeImage == (Lightbox.total - 1)) {
                Lightbox.end();
            } else if (Lightbox.total > 1) {
                Lightbox.changeData(Lightbox.activeImage + 1);
            }
        } else {
            Lightbox.isPaused = true;
        }
    },

    triggerLightbox: function (rel_type, rel_group) {
        if (rel_type.length) {
            if (rel_group && rel_group.length) {
                $("a[rel^='" + rel_type + "\[" + rel_group + "\]'], area[rel^='" + rel_type + "\[" + rel_group + "\]']").eq(0).trigger("click");
            } else {
                $("a[rel^='" + rel_type + "'], area[rel^='" + rel_type + "']").eq(0).trigger("click");
            }
        }
    },

    detectMacFF2: function () {
        var ua = navigator.userAgent.toLowerCase();
        if (/firefox[\/\s](\d+\.\d+)/.test(ua)) {
            var ffversion = new Number(RegExp.$1);
            if (ffversion < 3 && ua.indexOf('mac') != -1) {
                return true;
            }
        }
        return false;
    },

    checkKey: function (keys, key, code) {
        return (jQuery.inArray(key, keys) != -1 || jQuery.inArray(String(code), keys) != -1);
    },

    filterXSS: function (str, allowed_tags) {
        var output = "";
        $.ajax({
            url: Drupal.settings.basePath + 'system/lightbox2/filter-xss',
            data: {
                'string': str,
                'allowed_tags': allowed_tags
            },
            type: "POST",
            async: false,
            dataType: "json",
            success: function (data) {
                output = data;
            }
        });
        return output;
    }

};

// Initialize the lightbox.
Drupal.behaviors.initLightbox = function (context) {
    $('body:not(.lightbox-processed)', context).addClass('lightbox-processed').each(function () {
        Lightbox.initialize();
        return false; // Break the each loop.
    });

    // Attach lightbox to any links with lightbox rels.
    Lightbox.initList(context);
    $('#lightboxAutoModal', context).triggerHandler('click');
};;
// Javascript for user_relationships_ui.module

// Creating our own namespace for the module
Drupal.user_relationships_ui = {};

Drupal.behaviors.userRelationshipsPopupLink = function(context) {
  // Any links that we have created in the ui module are
  // Given a click handler so you can display the popup correctly
  $('a.user_relationships_popup_link').click(function(e) {
    var buttoncode = e.which ? e.which : e.button; // msie specific checks does not support e.which
    // If position is fixed, allow for %'s.
    position = Drupal.settings.user_relationships_ui.position.position;
    left = Drupal.settings.user_relationships_ui.position.left;
    xtop = Drupal.settings.user_relationships_ui.position.top;

    if(position == "fixed") {
      // If left is defined in a % (.5) calculate left requirement
      if(left <= 1) {
        // Window width * desired - UI width
        left = Math.round(($(window).width()*left) - ($("#user_relationships_popup_form").width()/2));
      }
      // If top is define in a % (.33) calculate top requirement
      if(xtop <= 1) {
        // Window height * desired - UI height (which is an unknown)
        xtop = Math.round(($(window).height()*xtop));// - ($("#user_relationships_popup_form").height()/2));
      }
    } else {
      left = (e.pageX ? e.pageX : e.clientX) + Number(left); // msie specific checks does not support e.page
      if (left + $("#user_relationships_popup_form").width() > $(window).width()) {
        left = (e.pageX ? e.pageX : e.clientX) - $("#user_relationships_popup_form").width();
      }
      xtop = (e.pageY ? e.pageY : e.clientY) + Number(xtop); // msie specific checks does not support e.page
    }
    var href = $(this).attr('href'); // Where we send the ajax request.
    Drupal.user_relationships_ui.showForm(href, position, left, xtop);
    return false;
  });
}

/**
 * Function to display the pertinent form for the user
 *
 * @param href
 *      Ajax url where we will retrieve the form
 * @param pageX
 *      Left value for the event
 * @param pageY
 *      Top value for the event
 */
Drupal.user_relationships_ui.showForm = function(href, position, left, top) {
  // Making sure that any currently open popups will be hidden.
  Drupal.user_relationships_ui.hidePopup();
  // Putting the animation into this

  $('#user_relationships_popup_form')
    .css({top: top + 'px', left: left + 'px', position: position})
    .html(Drupal.user_relationships_ui.loadingAnimation())
    .slideDown();
  // Adding ajax to the href because we need to determine between ajax and regular
  if (href.indexOf('?') == -1) {
    href += '?';
  }
  href += '&ajax=1';
  // Making the ajax request to the server to retrieve the form.
  $.get(href, function(result) {
    $('#user_relationships_popup_form').html(result).slideDown();
    // Making sure the cancel link on each form in the popup closes the popup.
    $('#user_relationships_popup_form .container-inline a').click(function() {
      Drupal.user_relationships_ui.hidePopup();
      return false;
    });
    //Prevent users from clicking submit button twice
    Drupal.user_relationships_ui.formCheck();
  });
};

/**
 * Function used to return the html that is used to build the.
 * Loading animation when a form is requested by the user.
 */
Drupal.user_relationships_ui.loadingAnimation = function() {
  var html = '<div>';
  html += '<div style="text-align: center; font-weight: bold;">';
  html += Drupal.t('Form Loading');
  html += '</div>';
  html += '<img src="' + Drupal.settings.user_relationships_ui.loadingimage + '" border="0" height="20" width="200" />';
  html += '</div>';
  return html;
};

/**
 * Helper function to hide the popup form
 */
Drupal.user_relationships_ui.hidePopup = function() {
  $('#user_relationships_popup_form').slideUp();
};

/**
 * Prevent users from clicking a submit button twice - borrowed from http://drupal.org/project/newswire - thanks, fellows :)
 */
Drupal.user_relationships_ui.formCheck = function() {
  // only apply this to node and comment and new user registration forms
  var forms = $("#user_relationships_popup_form #edit-submit");
  // insert the saving div now to cache it for better performance and to show the loading image
  $('<div id="user_relationships_popup_form_saving"><p class="user_relationships_popup_form_saving">' + Drupal.t('Saving...') + '</p></div>').insertAfter(forms);
  forms.click(function() {
    $(this).siblings("input[type=submit]").hide();
    $(this).hide();
    $("#user_relationships_popup_form_saving").show();
    var notice = function() {
      $('<p id="user_relationships_popup_form_saving_notice">' + Drupal.t('Not saving? Please wait a few seconds, reload this page, and try again.') + '</p>').appendTo("#user_relationships_popup_form_saving").fadeIn();
    };
    // append notice if form saving isn't work, perhaps a timeout issue
    setTimeout(notice, 60000);
  });
};

$(document).ready(function() {
  $('#edit-is-oneway').click(function () {
    if ($('#edit-is-oneway').attr('checked')) {
      $('#edit-is-reciprocal-wrapper').slideDown('slow');
    }
    else {
      $('#edit-is-reciprocal-wrapper').slideUp('slow');
    }
  });

  if (!$('#edit-is-oneway').attr('checked')) {
    $('#edit-is-reciprocal-wrapper').hide();
  }
});
;
/*global window, jQuery, Drupal */

var accessflow_forms = (function ($, Drupal) {

  var errors = [];

  function getUserName(name) {
    $.ajax({
      url: '/wuz/ajax/getusername',
      async: false,
      data: {
        username: name
      },
      dataType: 'json',
      success: function (ret) {
        var username;
        if (ret.allowed) {
          username = ret.username;
          $("#user-register input[id='edit-name']").val(username);
          $("#user-register input[id='edit-profile-nickname']").val(username);
        }
      }
    });
  }

  function createErrorMessage(el) {
    var id = "#" + el.id,
      html = "",
      rows = "",
      i;

    for (i = 0; i < errors.length; i++) {
      rows += "<li>" + errors[i] + "</li>";
    }

    if ($('.messages').length > 0) {
      $('.messages').html(rows);
    } else {
      $('<div class="messages error"><ul>' + rows + '</ul></div>').prependTo(id);
    }

  }

  var init = function () {

    $('#user-login, #user-register, #user-pass, #change-password-form').submit(function (e) {

      $(this).find('.required').each(function () {
        if ($(this).val() === '') {
          errors.push('Niet alle velden zijn ingevuld.');
        }
        if ($(this).hasClass('not-valid')) {
          errors.push('Niet alle velden zijn valide.');
        }
        if (errors.length > 0) {
          return false;
        }
      });

      if (errors.length > 0) {
        e.preventDefault();
        createErrorMessage(this);
        errors = [];
        Drupal.attachBehaviors();
      } else {
        $('input[type="submit"]').attr('disabled','disabled');
        if (this.id === 'user-register') {
          getUserName($('#edit-mail').val());
        }
        if ($('#edit-redir').val() === '') {
          $('#edit-redir').val(window.parent.location.href);
        }
      }

    });

  };

  return {
    init: init
  };

}(jQuery, Drupal));

$(function () {
  accessflow_forms.init();
});;
/*global window, jQuery, Drupal */

var accessflow_email_check = (function ($, Drupal) {

  function mailCheck(el) {

    var val = $.trim($(el).val());
    var emailRegex = /^([\w-\.]+@([\w\-]+\.)+[\w]{2,4})?$/;

    if ($(el).parent().find('.weak').length === 0) {
      $(el).after('<div class="weak"></div>');
    }

    if (!emailRegex.test(val)) {
      $(el).parent().find('.weak').text('Dit is geen valide e-mailadres');
      $(el).addClass("not-valid");
    } else {
      $(el).parent().find('.weak').remove();
      $(el).removeClass("not-valid");
    }

  }

  var init = function (el) {

    $('input[type="text"].mail').blur(function () {
      mailCheck($(this));
    });

  };

  return {
    init: init
  };

}(jQuery, Drupal));

$(function () {
  accessflow_email_check.init();
});;
jQuery.extend({

  createUploadIframe: function(id, uri) {
    /* Create frame */
    var frameId = 'jUploadFrame' + id;

    if (window.ActiveXObject) {
      var io = document.createElement('<iframe id="' + frameId + '" name="' + frameId + '" />');
      if (typeof uri== 'boolean') {
        io.src = 'javascript:false';
      }
      else if (typeof uri== 'string') {
        io.src = uri;
      }
    }
    else {
      var io = document.createElement('iframe');
      io.id = frameId;
      io.name = frameId;
    }
    io.style.position = 'absolute';
    io.style.top = '-1000px';
    io.style.left = '-1000px';

    document.body.appendChild(io);

    return io;
  },

  createUploadForm: function(id, fileElementId) {
    /* Create form	*/
    var formId = 'jUploadForm' + id;
    var fileId = 'jUploadFile' + id;
    var form = $('<form  action="" method="POST" name="' + formId + '" id="' + formId + '" enctype="multipart/form-data"></form>');
    var oldElement = $('#' + fileElementId);
    var newElement = $(oldElement).clone();
    $(oldElement).attr('id', fileId);
    $(oldElement).before(newElement);
    $(oldElement).appendTo(form);
    /* Set attributes */
    $(form).css('position', 'absolute');
    $(form).css('top', '-1200px');
    $(form).css('left', '-1200px');
    $(form).appendTo('body');
    return form;
  },

  ajaxFileUpload: function(s) {
    /* TODO introduce global settings, allowing the client to modify them for all requests, not only timeout */
    s = jQuery.extend({}, jQuery.ajaxSettings, s);
    var id = new Date().getTime();
    var form = jQuery.createUploadForm(id, s.fileElementId);
    var io = jQuery.createUploadIframe(id, s.secureuri);
    var frameId = 'jUploadFrame' + id;
    var formId = 'jUploadForm' + id;
    /* Watch for a new set of requests */
    if (s.global && !jQuery.active++) {
      jQuery.event.trigger( "ajaxStart" );
    }
    var requestDone = false;
    /* Create the request object */
    var xml = {}
    if (s.global)
      jQuery.event.trigger("ajaxSend", [xml, s]);
    /* Wait for a response to come back */
    var uploadCallback = function(isTimeout) {
      var io = document.getElementById(frameId);
      try {
        if (io.contentWindow) {
          xml.responseText = io.contentWindow.document.body?io.contentWindow.document.body.innerHTML:null;
          xml.responseXML = io.contentWindow.document.XMLDocument?io.contentWindow.document.XMLDocument:io.contentWindow.document;
        }
        else if (io.contentDocument) {
          xml.responseText = io.contentDocument.document.body?io.contentDocument.document.body.innerHTML:null;
          xml.responseXML = io.contentDocument.document.XMLDocument?io.contentDocument.document.XMLDocument:io.contentDocument.document;
        }
      }
      catch(e) {
        jQuery.handleError(s, xml, null, e);
      }

      if (xml || isTimeout == "timeout") {
        requestDone = true;
        var status;
        try {
          status = isTimeout != "timeout" ? "success" : "error";
          /* Make sure that the request was successful or notmodified */
          if (status != "error") {
            /* process the data (runs the xml through httpData regardless of callback) */
            var data = jQuery.uploadHttpData( xml, s.dataType );
            /* If a local callback was specified, fire it and pass it the data */
            if (s.success)
              s.success(data, status);

              /* Fire the global callback */
              if( s.global )
                jQuery.event.trigger( "ajaxSuccess", [xml, s] );
          } else
            jQuery.handleError(s, xml, status);
        }
        catch(e) {
          status = "error";
          jQuery.handleError(s, xml, status, e);
        }

        /* The request was completed */
        if( s.global )
          jQuery.event.trigger( "ajaxComplete", [xml, s] );

        /* Handle the global AJAX counter */
        if ( s.global && ! --jQuery.active )
        jQuery.event.trigger("ajaxStop");
        /* Process result */
        if (s.complete)
          s.complete(xml, status);

        jQuery(io).unbind()

        setTimeout(function() {
          try {
            $(io).remove();
            $(form).children('input').attr('id', 'tmp-input-upload');
            $('#edit-picture-upload').before($(form).children('input'));
            $('#edit-picture-upload').remove();
            $('#tmp-input-upload').attr('id', 'edit-picture-upload');
            $(form).remove();
          }
          catch(e) {
            jQuery.handleError(s, xml, null, e);
          }
        }, 100);

        xml = null

      }
    }
    /* Timeout checker */
    if (s.timeout > 0) {
      setTimeout(function() {
        /* Check to see if the request is still happening */
        if( !requestDone ) uploadCallback( "timeout" );
      }, s.timeout);
    }
    try {
      var form = $('#' + formId);
      $(form).attr('action', s.url);
      $(form).attr('method', 'POST');
      $(form).attr('target', frameId);
      if (form.encoding) {
        form.encoding = 'multipart/form-data';
      }
      else {
        form.enctype = 'multipart/form-data';
      }
      $(form).submit();

    }
    catch(e) {
      jQuery.handleError(s, xml, null, e);
    }
    if (window.attachEvent) {
      document.getElementById(frameId).attachEvent('onload', uploadCallback);
    }
    else {
      document.getElementById(frameId).addEventListener('load', uploadCallback, false);
    }

    return {abort: function () {}};

  },

  uploadHttpData: function(r, type) {
    var data = !type;
    data = type == "xml" || data ? r.responseXML : r.responseText;
    /* If the type is "script", eval it in global context */
    if (type == "script")
      jQuery.globalEval(data);
    /* Get the JavaScript object, if JSON is used. */
    if (type == "json")
      eval("data = " + data);
    /* evaluate scripts within html */
    if (type == "html")
      jQuery("<div>").html(data).evalScripts();
    return data;
  }
});
;
function ajaxFileUpload() {
  $("#loading")
  .ajaxStart(function(){
    $(this).show();
  })
  .ajaxComplete(function(){
    $(this).hide();
  });
  var upload_mode = Drupal.settings.ajax_pic_preview.mode;
  var upload_message = Drupal.settings.ajax_pic_preview.upload_message;

  $.ajaxFileUpload({
    url: '/wuz/ajax/ajax-pic-preview/' + upload_mode,
    secureuri:false,
    fileElementId:'edit-picture-upload',
    dataType: 'json',
    success: function (data, status){
        if (typeof(data.error) != 'undefined') {
          $('.messages.hasTimeout').remove();
          $('#main > h2').before('<div class="messages hasTimeout"></div>');
          if (data.error != '') {
            $('.messages.hasTimeout').addClass('error');
            $('.messages.hasTimeout').html(data.error);
          } else {
            $('.messages.hasTimeout').addClass('status');
            $('.messages.hasTimeout').html(upload_message);
            if ($('#img-picture').html() == null) {
              //$('#edit-picture-delete-wrapper').before('<div class="picture"><a href="#" title="View user profile."><img src="" id="img-picture"></a></div>');
              $('#profile-pic .picture a').click((function () { $('#edit-picture-upload').click(); }));
            }
            $('#img-picture').attr('src', data.img);
          }
        }
      },
    error: function (data, status, e) {
      /*alert(e);*/
    }
  });

  return true;
}

$(document).ready(function() {
  $('#user-profile-form #profile-pic img').attr('id', 'img-picture');
  $('label[for="edit-picture-upload"]').append('<span id="edit-picture-message" class="form-required"></span>');
  $('#edit-picture-upload').change(ajaxFileUpload).after('<span id="loading" style="display:none"><img src="/wuz/misc/throbber.gif" /></span>');
});
;
Drupal.tmc_signin = {};
Drupal.tmc_signin.lightboxWindow = null;
Drupal.tmc_signin.lightbox = function(url) {
    var width = 780;
    var height = 420;
    var left = parseInt((screen.availWidth/2) - (width/2));
    var top = parseInt((screen.availHeight/2) - (height/2));
    var windowFeatures = "width=" + width + ",height=" + height + ",status,resizable,left=" + left + ",top=" + top + "screenX=" + left + ",screenY=" + top;
    Drupal.tmc_signin.lightboxWindow = window.open(url, "subWind", windowFeatures);
};
function style_commented_nodes()
{
        var el = document.getElementById('commented-nodes');
        if (!el) return;

        // comment overview table css fixes:
        var $comm = $(el);
        // assign classes to TDs from the responding header     
        $comm.find('th').each(function(index) {$comm.find('tr > td:nth-child(' + (1 + index) + ')').addClass($(this).attr('class'));});
        // mark alerted cells
        $comm.find('tr > td.published')
            .filter(function(index){
                $this = $(this);
                return $this.html() === "0" && $this.parent().find('td.total').html() !== '0';
            })
            .css({'color':'red', 'font-weight':'bold'});
        $comm.find('tr:odd').css('background', '#E6E9F2');
}

Drupal.behaviors.tmc_moderate = function (context) {
//    style_commented_nodes();
    $('#a-select-all').click(function(){
        $(':checkbox').attr('checked', true); 
    });
    $('#a-deselect-all').click(function() {
        $(':checkbox').attr('checked', false);
    });
    $('#section').change(function() { this.form.submit(); });
};
;
$(document).ready(function() {
  var max_chars = 160;
  $('#max_chars').html('Nog <strong>' + max_chars + '</strong> karakters');
  $('#edit-profile-about').keyup( function() {
      if($(this).val().length > max_chars){
          $(this).val($(this).val().substr(0, max_chars));
      }

      var chars = max_chars - $(this).val().length;
      $('#max_chars').html('Nog <strong>' + chars + '</strong> karakters');

  });
  
  $('#user-profile-form .grey').focus(function(){
        if ($(this).val() == $(this).attr('rel')) {
            $(this).val('').removeClass('grey');
        }
  });
    
  $('#user-profile-form').submit(function() {
    
        $('#user-profile-form .grey').each(function(){
            if ($(this).val() == $(this).attr('rel')) {
                $(this).val('');
            }
        });

  });
  
  // if($('#edit-new-pass').hasClass('unfold')) {
  //   $("#change-pass").show();
  //   $('#tohide_pass').css('visibility', 'hidden');
  // }
  
  if($('#edit-mail').hasClass('error') || $('#edit-check-pass').hasClass('error')) {
      $("#main > .messages").prependTo("#change-mail");
      $('#tohide_mail').css('visibility', 'hidden');
      $("#change-mail").show();
  }
  // if($('#edit-pass').hasClass('error') || $('#edit-new-pass').hasClass('error')) {
  //     $("#main > .messages").prependTo("#change-pass");
  //     $('#tohide_pass').css('visibility', 'hidden');
  //     $("#change-pass").show();
  // }
  
  $('#toggle-mail').unbind('click').bind('click', function (e) {
      e.preventDefault();
      $('#tohide_mail').css('visibility', 'hidden');
      $('#change-mail .messages').remove();
      $('#change-mail input').removeClass('error');
      $("#change-mail").slideToggle("fast");
      
  });
  
  $('.change-cancel').unbind('click').bind('click', function (e) {
      e.preventDefault();
      $("#edit-mail").val($("#edit-dummy-mail-wrapper .dummymail").html());
      $("#edit-mail").removeClass('error');
      $('#change-mail').slideToggle("fast");
      $('#tohide_mail').css('visibility', 'visible');
  });
  
  $('.pass-cancel').unbind('click').bind('click', function (e) {
      e.preventDefault();
      $("#edit-pass-pass1").val('');
      $("#edit-new-pass").val('');
      $("#edit-pass-pass1").removeClass('error');
      $('#change-pass').slideToggle("fast");
      // $('#tohide_pass').css('visibility', 'visible');
  });
  
  
  // $('#toggle-pass').unbind('click').bind('click', function (e) {
  //   e.preventDefault();
  //   $('#tohide_pass').css('visibility', 'hidden');
  //   $('#change-pass .messages').remove();
  //   $('#change-pass input').removeClass('error');
  //   $("#change-pass").slideToggle("fast");

  // });
  $('#toggle-sso-mail').unbind('click').bind('click', function (e) {
      e.preventDefault();
      $(this).parent().parent().find(".text-info").addClass('popup-message');
      var height = $(this).parent().parent().find(".text-info").height();
      $(this).parent().parent().find(".text-info").css("margin-top", -(height/2));
      $('<div id="blackout">').prependTo('body');
      $('#blackout').attr("onclick", "message_popup_close("+$(this).parent().attr('id')+"); return false;");
      $(this).parent().parent().find(".text-info").insertAfter('#blackout');
      
  });
  
  $('#toggle-sso-pass').unbind('click').bind('click', function (e) {
      e.preventDefault();
      $(this).parent().parent().find(".text-info").addClass('popup-message');
      var height = $(this).parent().parent().find(".text-info").height();
      $(this).parent().parent().find(".text-info").css("margin-top", -(height/2));
      $('<div id="blackout">').prependTo('body');
      $('#blackout').attr("onclick", "message_popup_close("+$(this).parent().attr('id')+"); return false;");
      $(this).parent().parent().find(".text-info").insertAfter('#blackout');
      
  });
  
  // $('#change-pass .pass-reset-link').click( function (e) {
  //   e.preventDefault();

  //   var name = $('#edit-dummy-mail-wrapper .dummymail').html();

  //   $.ajax({
  //       type: "POST",
  //       url: '/wuz/ajax/pass',
  //       data: {'name': name },
  //       success: function (data) {
  //           if (data == 'success') {
  //               $('#change-pass').html("<strong>Check je mailbox!</strong><br/><p>We hebben een e-mail gestuurd naar <em class='address'>"+name+"</em>. Klik op de link in dit bericht om een nieuw wachtwoord te maken.</p><p><strong>Geen e-mail ontvangen?</strong><br/>Kijk in uw spamfolder en voeg eventueel no-reply@telegraaf.nl toe aan je contacten.</p><div class='cancel'><a href='javascript:void(0);' class='redbutton'>"+Drupal.t('Annuleren')+"</a></div>");
  //               bind_cancel_click('#change-pass .cancel');
  //         } 
  //       }

  //   });
  // });
  $('#change-mail .pass-reset-link').click( function (e) {
    e.preventDefault();
    var name = $('#edit-dummy-mail-wrapper .dummymail').html();
    $.ajax({
        type: "POST",
        url: '/wuz/ajax/pass',
        data: {'name': name },
        success: function (data) {
            if (data == 'success') {
                $('#change-mail').html("<strong>Check je mailbox!</strong><br/><p>We hebben een e-mail gestuurd naar <em class='address'>"+name+"</em>. Klik op de link in dit bericht om een nieuw wachtwoord te maken.</p><p><strong>Geen e-mail ontvangen?</strong><br/>Kijk in uw spamfolder en voeg eventueel no-reply@telegraaf.nl toe aan je contacten.</p><div class='cancel'><a href='javascript:void(0);' class='redbutton'>"+Drupal.t('Annuleren')+"</a></div>");
                bind_cancel_click('#change-mail .cancel');
            } 
        }

    });
  });
});


// Drupal.behaviors.passcancel = function (context) {
//   $('.pass-info-cancel:not(.processed)', context)
//    .each(function () {
//      $(this).bind("click", function(e) {
//         e.preventDefault();
//         $('body > .text-info').removeClass('popup-message');
//         $('body > .text-info').insertAfter('#tohide_pass');
//         $('body #blackout').remove();
//      });
//      $(this).addClass('processed');
//    });
//  }
 
 Drupal.behaviors.mailcancel = function (context) {
  $('.mail-info-cancel:not(.processed)', context)
   .each(function () {
     $(this).bind("click", function(e) {
        e.preventDefault();
        $('body > .text-info').removeClass('popup-message');
        $('body > .text-info').insertAfter('#sso_mail');
        $('body #blackout').remove();
     });
     $(this).addClass('processed');
   });
 }
 
 function bind_cancel_click(element) {
   $(element).bind("click", function(e) {
      e.preventDefault();
      $(this).parent().slideToggle("fast");
      $('#tohide_pass').css('visibility', 'visible');
      $('#tohide_mail').css('visibility', 'visible');
   });
 }
 
 function message_popup_close(element) {
   $('body > .text-info').removeClass('popup-message');
   $('body > .text-info').insertAfter(element);
   $('body #blackout').remove();
 }
;
Drupal.behaviors.checkPassStrength = function ( context ) {

	$('#edit-pass-pass1').keyup( function(e,t) {
		if (  $(this).val() != '' ) {
			$(this).parent().next().html(checkStrength($(this).parent().next(),$(this)));
			if ( $(this).parent().next().hasClass('not-valid') ) {
				$(this).addClass("not-valid"); 
			} else {
				$(this).removeClass("not-valid"); 
			}
		}
	});

	$( "#edit-pass-pass2").blur( function() {
		$('#edit-pass-pass1').val() === $('#edit-pass-pass2').val() ? equal = true : equal = false;
		if ( equal ) {
			$("#edit-pass-pass2").parent().next().html('').hide();
			$("#edit-pass-pass2").removeClass("not-valid"); 
		} else {
			$("#edit-pass-pass2").parent().next().removeClass().addClass('weak').show();
			$("#edit-pass-pass2").parent().next().html('Wachtwoorden zijn niet gelijk.')
			$("#edit-pass-pass2").addClass("not-valid"); 
		}
	});
}

function checkStrength(el, password){
	Drupal.passCheck = password.val();
	//initial strength
	var strength = 0;

	//if the password length is less than 6, return message.
	////if (Drupal.passCheck.length < 6) {
	////	$(el).removeClass().addClass('weak not-valid').show();
	////	return 'Uw wachtwoord voldoet niet. U wachtwoord moet minimaal bestaan uit 6 karakters.';
	////} else {
	////	$(el).removeClass().hide();
	////	return " ";
	//}
	
	//length is ok, lets continue.

//	if length is 8 characters or more, increase strength value
	if (Drupal.passCheck.length > 7) strength += 1

	//if password contains both lower and uppercase characters, increase strength value
	if (Drupal.passCheck.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/))  strength += 1

	//if it has numbers and characters, increase strength value
	if (Drupal.passCheck.match(/([a-zA-Z])/) && Drupal.passCheck.match(/([0-9])/))  strength += 1

	//if it has one special character, increase strength value
	if (Drupal.passCheck.match(/([!,%,&,@,#,$,^,*,?,_,~])/))  strength += 1

	//if it has two special characters, increase strength value
	if (Drupal.passCheck.match(/(.*[!,%,&,@,#,$,^,*,?,_,~].*[!,",%,&,@,#,$,^,*,?,_,~])/)) strength += 1

	//now we have calculated strength value, we can return messages

	if (strength < 3 ) {
		$(el).removeClass().addClass('weak not-valid').show();
		return 'Uw wachtwoord voldoet niet. U wachtwoord moet minimaal bestaan uit 8 karakters, 1 kapitaal en 1 getal.';
	} else if (strength == 3 ) {
        $(el).removeClass();
        return '';
        //$(el).removeClass().addClass('good').show()
		//return Drupal.t('Goed wachtwoord');
	} else {
		$(el).removeClass();
        return '';
        //$(el).removeClass().addClass('strong').show()
		//return Drupal.t('Sterk wachtwoord');
	}
};

(function($){$.fn.filestyle=function(options){var settings={width:250};if(options){$.extend(settings,options);};return this.each(function(){var self=this;var wrapper=$("<div>").css({"width":settings.imagewidth+"px","height":settings.imageheight+"px","background":"url("+settings.image+") 0 0 no-repeat","background-position":"right","display":"inline","position":"absolute","overflow":"hidden"});var filename=$('<input class="file">').addClass($(self).attr("class")).css({"display":"inline","width":settings.width+"px"});$(self).before(filename);$(self).wrap(wrapper);$(self).css({"position":"relative","height":settings.imageheight+"px","width":settings.width+"px","display":"inline","cursor":"pointer","opacity":"0.0"});if($.browser.mozilla){if(/Win/.test(navigator.platform)){$(self).css("margin-left","-142px");}else{$(self).css("margin-left","-168px");};}else{$(self).css("margin-left",settings.imagewidth-settings.width+"px");};$(self).bind("change",function(){filename.val($(self).val());});});};})(jQuery);;
// $Id: network binding.js $

function social_login_analytics(network) {
  tmgEvent('login',network,window.location.href);
}

function bindnetwork(network, name, link, msg) {
  var parent = $('#network-'+network);
  var info = $('#network-'+network+' .not-linked');
  // Loop through messages.
  $.each(msg, function(index, value) {
      $.each(value, function(key, message) {
        $('#main .networks .networks_wrapper').before('<div class="messages '+index+' hasTimeout">'+message+'</div>');
      });
  });
  
  // Check if we dont have warnings or errors and then update social status.
  if (typeof msg.error == "undefined" && typeof msg.warning == "undefined") {
    parent.empty();
    info.removeClass('not-linked');
    info.addClass('linked');
    parent.append(info);
    parent.append('<a class="bluebutton unbind-link" title="Ontkoppel '+network+' van uw account" href="#">'+Drupal.t('Ontkoppel ')+network+'</a>');
    parent.append('<div class="network-info">Verbonden met: <a href="'+link+'">'+name+'</a></div>');
  
    Drupal.attachBehaviors();
  }
}


Drupal.behaviors.networks = function (context) {
  $('.bind-button:not(.processed)', context)
   .each(function () {
     var button = $(this);
     var network = $(this).parent().attr("id").substring(8);
     
     $(this).bind("click", function() {
       $(this).attr('href', '#');
       Drupal.tmc_signin.lightbox(window.location.origin+'/wuz/tmc_signin/'+network+'/connector?nocache');
       return false;
     });
     button.addClass('processed');
     
   });
 };


Drupal.behaviors.unbind = function (context) {
  $('.unbind-link:not(.processed)', context)
   .addClass('processed')
   .click(function(q){
     q.preventDefault();
     var network_id = $(this).parent().attr("id").substring(8);
     var info = $(this).parent().find('.linked');
     var parent = $(this).parent();
     
     
     $.ajax({
       type: "POST",
       url: '/wuz/ajax/register/unbind',
       data: { 'network' : network_id },
       success: function(data) {
         if(data){
           parent.empty();
           info.removeClass('linked');
           info.addClass('not-linked');
           parent.append(info);

           parent.append('<a class="bind-button bluebutton" title="Koppel '+network_id+' aan uw account." href="#">Koppel '+network_id+'</a>');
           $('#main .networks .networks_wrapper').before('<div class="messages ok hasTimeout">'+Drupal.t('Sociaal netwerk <em>'+network_id+'</em> is ontkoppeld van uw account.')+'</div>');
           Drupal.attachBehaviors();
         }
       }
     });
   });
 };
   ;
// $Id: password_toggle.js,v 1.3 2010/04/20 15:16:14 stborchert Exp $

$(function() {

    $('#tmc-register-user-complete-form input.grey').focus(function(){
        if ($(this).val() == $(this).attr('rel')) {
            $(this).val('').removeClass('grey');
        }
    });
    
    $('#tmc-register-user-complete-form').submit(function() {
    
        $('#tmc-register-user-complete-form input.grey').each(function(){
            if ($(this).val() == $(this).attr('rel')) {
                $(this).val('');
            }
        });

    });

    $('#edit-continue-profiel').click(function(el){
        el.preventDefault();
        location.href = '/wuz/user/me';
    });

});
;
/**
 * The heartbeat object.
 */
Drupal.heartbeat = Drupal.heartbeat || {};

Drupal.heartbeat.moreLink = null;

/**
 * wait().
 *   Function that shows throbber while waiting a response.
 */
Drupal.heartbeat.wait = function(element, parentSelector) {

  // We wait for a server response and show a throbber 
  // by adding the class heartbeat-messages-waiting.
  Drupal.heartbeat.moreLink = $(element).parents(parentSelector);
  // Disable double-clicking.
  if (Drupal.heartbeat.moreLink.is('.heartbeat-messages-waiting')) {      
    return false;
  }
  Drupal.heartbeat.moreLink.addClass('heartbeat-messages-waiting');
  
}

/**
 * doneWaiting().
 *   Function that is triggered if waiting period is over, to start
 *   normal behavior again.
 */
Drupal.heartbeat.doneWaiting = function() {
  Drupal.heartbeat.moreLink.removeClass('heartbeat-messages-waiting');
}

/**
 * getOlderMessages().
 *   Fetch older messages with ajax.
 */
Drupal.heartbeat.getOlderMessages = function(element, page, account) {
  Drupal.heartbeat.wait(element, '.heartbeat-more-messages-wrapper');
  var post = {
    block: page ? 0 : 1,
    ajax: 1
  };

  if (account != undefined && account != -1) {
    post.account = account;
  }
  
  $.event.trigger('heartbeatBeforeOlderMessages', [post]); 
  $.post(element.href, post, Drupal.heartbeat.appendMessages);
}

/**
 * pollMessages().
 *   Function that checks and fetches newer messages to the
 *   current stream.
 */
Drupal.heartbeat.pollMessages = function(stream) {

  var stream_selector = '#heartbeat-stream-' + stream;
  
  if ($(stream_selector).length > 0) {
    var href = Drupal.settings.heartbeat_poll_url;
    var uaids = new Array();
    var beats = $(stream_selector + ' .beat-item');
    var firstUaid = 0;
    
    if (beats.length > 0) {    
      firstUaid = $(beats.get(0)).attr('id').replace("beat-item-", "");
      
      beats.each(function(i) {  
        var uaid = parseInt($(this).attr('id').replace("beat-item-", ""));
        uaids.push(uaid);
      });
    }
    
    var post = {
      latestUaid: firstUaid,
      language: Drupal.settings.heartbeat_language, 
      stream: stream, 
      uaids: uaids.join(',')
    };
    $.event.trigger('heartbeatBeforePoll', [post]); 
    if (firstUaid) {
      $.post(href, post, Drupal.heartbeat.prependMessages);
    }
  }
}

/**
 * appendMessages().
 *   Function that appends older messages to the stream.
 */
Drupal.heartbeat.appendMessages = function(data) {
  
  var result = Drupal.parseJson(data);
  
  var wrapper = Drupal.heartbeat.moreLink.parents('.heartbeat-messages-wrapper');
  Drupal.heartbeat.moreLink.remove();
  var data = $(result['data']);
  wrapper.append(data);
  Drupal.heartbeat.doneWaiting();
    
  // Reattach behaviors for new added html
  Drupal.attachBehaviors(data);
  
}

/**
 * prependMessages().
 *   Append messages to the front of the stream. This done for newer 
 *   messages, often with the auto poller.
 */
Drupal.heartbeat.prependMessages = function(data) {

  var result = Drupal.parseJson(data);
  var stream_selector = '#heartbeat-stream-' + result['stream'];

  // Update the times in the stream
  if (result['time_updates'] != undefined) {
    var time_updates = result['time_updates'];
    for (uaid in time_updates) {
      $(stream_selector + ' #beat-item-' + uaid).find('.heartbeat_times').html(time_updates[uaid]);
    }
  }

  // Append the messages
  if (result['data'] != '') {
    var data = $(result['data']);
    $(stream_selector + ' .heartbeat-messages-wrapper').prepend(data);
    // Reattach behaviors for new added html
    Drupal.attachBehaviors(data);
  }
}

/**
 * splitGroupedMessage().
 * 
 * Splits a grouped message into separate ones.
 * 
 * @param Integer uaid
 *   The user activity Id for the grouped message.
 * @param Array uaids
 *   The standalone user activity Ids involved in the grouped message.
 */
Drupal.heartbeat.splitGroupedMessage = function(uaid, uaids) {
  if (uaids == null) {
    $("#beat-item-" + uaid).show('slow');
    $("#beat-item-" + uaid + "-ungrouped").hide('slow');  
  }
  else {
    $("#beat-item-" + uaid).hide('slow');
    $("#beat-item-" + uaid + "-ungrouped").show('slow'); 
  }
}

/**
 * Document onReady().
 */
$(document).ready(function() {
  var span = 0;
  if (Drupal.settings.heartbeatPollNewerMessages != undefined) {
    for (n in Drupal.settings.heartbeatPollNewerMessages) {
      if (parseInt(Drupal.settings.heartbeatPollNewerMessages[n]) > 0) {
        var interval = (Drupal.settings.heartbeatPollNewerMessages[n] * 1000) + span;
        var poll = setInterval('Drupal.heartbeat.pollMessages("' + n + '")', interval);
        span += 100;
      }
    }  
  }
});;

/*
 * jQuery Form Plugin
 * version: 2.01 (10/31/2007)
 * @requires jQuery v1.1 or later
 *
 * Examples at: http://malsup.com/jquery/form/
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */
eval(function(p,a,c,k,e,r){e=function(c){return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--)r[e(c)]=k[c]||e(c);k=[function(e){return r[e]}];e=function(){return'\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c]);return p}('(5($){$.7.1j=5(o){2(P o==\'5\')o={L:o};o=$.2h({1h:4.X(\'2i\')||1E.2u.3D(),I:4.X(\'2g\')||\'29\'},o||{});3 p={};$.M.N(\'R.2P.2L\',[4,o,p]);2(p.1Q)6 4;3 a=4.1z(o.2r);2(o.V){H(3 n 3u o.V)a.C({z:n,A:o.V[n]})}2(o.28&&o.28(a,4,o)===E)6 4;$.M.N(\'R.K.36\',[a,4,o,p]);2(p.1Q)6 4;3 q=$.1x(a);2(o.I.31()==\'29\'){o.1h+=(o.1h.2Z(\'?\')>=0?\'&\':\'?\')+q;o.V=B}8 o.V=q;3 r=4,U=[];2(o.1r)U.C(5(){r.1r()});2(o.1o)U.C(5(){r.1o()});2(!o.18&&o.14){3 u=o.L||5(){};U.C(5(a){2(4.1N)$(o.14).X("1M",a).1N().D(u,1L);8 $(o.14).2t(a).D(u,1L)})}8 2(o.L)U.C(o.L);o.L=5(a,b){H(3 i=0,F=U.G;i<F;i++)U[i](a,b,r)};3 v=$(\'19:3v\',4).15();3 w=E;H(3 j=0;j<v.G;j++)2(v[j])w=T;2(o.2f||w){2($.1i.3o&&o.2a)$.3l(o.2a,1l);8 1l()}8 $.3h(o);$.M.N(\'R.K.3f\',[4,o]);6 4;5 1l(){3 d=r[0];3 f=$.2h({},$.39,o);3 h=\'35\'+$.7.1j.1a++;3 i=$(\'<2f 33="\'+h+\'" z="\'+h+\'" />\');3 j=i[0];3 k=$.1i.20&&1E.20.30()<9;2($.1i.1X||k)j.2Y=\'2W:E;1w.2U("");\';i.2S({2R:\'2Q\',23:\'-24\',1R:\'-24\'});3 l={Z:B,1b:B,2K:0,2J:\'n/a\',2H:5(){},2F:5(){},2E:5(){}};3 g=f.2B;2(g&&!$.1O++)$.M.N("2x");2(g)$.M.N("2w",[l,f]);3 m=0;3 n=0;1f(5(){i.2v(\'1n\');j.1K?j.1K(\'1J\',12):j.2s(\'1I\',12,E);3 a=d.1H?\'1H\':\'2q\';3 t=r.X(\'14\');r.X({14:h,2g:\'3C\',2i:f.1h});d[a]=\'3B/R-V\';2(f.1G)1f(5(){n=T;12()},f.1G);d.K();r.X(\'14\',t)},10);5 12(){2(m++)6;j.2o?j.2o(\'1J\',12):j.3A(\'1I\',12,E);3 a=T;3z{2(n)3x\'1G\';3 b,O;O=j.2n?j.2n.1w:j.2l?j.2l:j.1w;l.Z=O.1n?O.1n.1M:B;l.1b=O.2k?O.2k:O;2(f.18==\'2j\'||f.18==\'3s\'){3 c=O.1D(\'1C\')[0];b=c?c.A:l.Z;2(f.18==\'2j\')3r("V = "+b);8 $.3q(b)}8 2(f.18==\'2m\'){b=l.1b;2(!b&&l.Z!=B)b=2d(l.Z)}8{b=l.Z}}3p(e){a=E;$.3n(f,l,\'2b\',e)}2(a){f.L(b,\'L\');2(g)$.M.N("3m",[l,f])}2(g)$.M.N("3k",[l,f]);2(g&&!--$.1O)$.M.N("3j");2(f.27)f.27(l,a?\'L\':\'2b\');1f(5(){i.3i();l.1b=B},3g)};5 2d(s,a){2(1E.26){a=25 26(\'3d.3c\');a.3b=\'E\';a.3a(s)}8 a=(25 38()).37(s,\'1A/2m\');6(a&&a.22&&a.22.1e!=\'34\')?a:B}}};$.7.1j.1a=0;$.7.W=5(a){6 4.21().K(1m).D(5(){4.1u=$.7.W.1a++;$.7.W.1t[4.1u]=a;$(":K,19:Y",4).1Z(1s)})};$.7.W.1a=1;$.7.W.1t={};5 1s(e){3 a=4.R;a.Q=4;2(4.I==\'Y\'){2(e.1Y!=S){a.11=e.1Y;a.16=e.2X}8 2(P $.7.1U==\'5\'){3 b=$(4).1U();a.11=e.1V-b.1R;a.16=e.1W-b.23}8{a.11=e.1V-4.2V;a.16=e.1W-4.32}}1f(5(){a.Q=a.11=a.16=B},10)};5 1m(){3 a=4.1u;3 b=$.7.W.1t[a];$(4).1j(b);6 E};$.7.21=5(){4.1T(\'K\',1m);6 4.D(5(){$(":K,19:Y",4).1T(\'1Z\',1s)})};$.7.1z=5(b){3 a=[];2(4.G==0)6 a;3 c=4[0];3 d=b?c.1D(\'*\'):c.2T;2(!d)6 a;H(3 i=0,F=d.G;i<F;i++){3 e=d[i];3 n=e.z;2(!n)1v;2(b&&c.Q&&e.I=="Y"){2(!e.1d&&c.Q==e)a.C({z:n+\'.x\',A:c.11},{z:n+\'.y\',A:c.16});1v}3 v=$.15(e,T);2(v&&v.1c==1g){H(3 j=0,1S=v.G;j<1S;j++)a.C({z:n,A:v[j]})}8 2(v!==B&&P v!=\'S\')a.C({z:n,A:v})}2(!b&&c.Q){3 f=c.1D("19");H(3 i=0,F=f.G;i<F;i++){3 g=f[i];3 n=g.z;2(n&&!g.1d&&g.I=="Y"&&c.Q==g)a.C({z:n+\'.x\',A:c.11},{z:n+\'.y\',A:c.16})}}6 a};$.7.2O=5(a){6 $.1x(4.1z(a))};$.7.2N=5(b){3 a=[];4.D(5(){3 n=4.z;2(!n)6;3 v=$.15(4,b);2(v&&v.1c==1g){H(3 i=0,F=v.G;i<F;i++)a.C({z:n,A:v[i]})}8 2(v!==B&&P v!=\'S\')a.C({z:4.z,A:v})});6 $.1x(a)};$.7.15=5(a){H(3 b=[],i=0,F=4.G;i<F;i++){3 c=4[i];3 v=$.15(c,a);2(v===B||P v==\'S\'||(v.1c==1g&&!v.G))1v;v.1c==1g?$.3e(b,v):b.C(v)}6 b};$.15=5(b,c){3 n=b.z,t=b.I,13=b.1e.1F();2(P c==\'S\')c=T;2(c&&(!n||b.1d||t==\'17\'||t==\'2M\'||(t==\'1q\'||t==\'1B\')&&!b.1p||(t==\'K\'||t==\'Y\')&&b.R&&b.R.Q!=b||13==\'J\'&&b.1y==-1))6 B;2(13==\'J\'){3 d=b.1y;2(d<0)6 B;3 a=[],1k=b.2I;3 e=(t==\'J-2e\');3 f=(e?d+1:1k.G);H(3 i=(e?d:0);i<f;i++){3 g=1k[i];2(g.2c){3 v=$.1i.1X&&!(g.2G[\'A\'].3t)?g.1A:g.A;2(e)6 v;a.C(v)}}6 a}6 b.A};$.7.1o=5(){6 4.D(5(){$(\'19,J,1C\',4).2p()})};$.7.2p=$.7.2D=5(){6 4.D(5(){3 t=4.I,13=4.1e.1F();2(t==\'1A\'||t==\'3w\'||13==\'1C\')4.A=\'\';8 2(t==\'1q\'||t==\'1B\')4.1p=E;8 2(13==\'J\')4.1y=-1})};$.7.1r=5(){6 4.D(5(){2(P 4.17==\'5\'||(P 4.17==\'2C\'&&!4.17.3y))4.17()})};$.7.2A=5(b){2(b==S)b=T;6 4.D(5(){4.1d=!b})};$.7.J=5(b){2(b==S)b=T;6 4.D(5(){3 t=4.I;2(t==\'1q\'||t==\'1B\')4.1p=b;8 2(4.1e.1F()==\'1P\'){3 a=$(4).2z(\'J\');2(b&&a[0]&&a[0].I==\'J-2e\'){a.2y(\'1P\').J(E)}4.2c=b}})}})(3E);',62,227,'||if|var|this|function|return|fn|else|||||||||||||||||||||||||||name|value|null|push|each|false|max|length|for|type|select|submit|success|event|trigger|doc|typeof|clk|form|undefined|true|callbacks|data|ajaxForm|attr|image|responseText||clk_x|cb|tag|target|fieldValue|clk_y|reset|dataType|input|counter|responseXML|constructor|disabled|tagName|setTimeout|Array|url|browser|ajaxSubmit|ops|fileUpload|submitHandler|body|clearForm|checked|checkbox|resetForm|clickHandler|optionHash|formPluginId|continue|document|param|selectedIndex|formToArray|text|radio|textarea|getElementsByTagName|window|toLowerCase|timeout|encoding|load|onload|attachEvent|arguments|innerHTML|evalScripts|active|option|veto|left|jmax|unbind|offset|pageX|pageY|msie|offsetX|click|opera|ajaxFormUnbind|documentElement|top|1000px|new|ActiveXObject|complete|beforeSubmit|GET|closeKeepAlive|error|selected|toXml|one|iframe|method|extend|action|json|XMLDocument|contentDocument|xml|contentWindow|detachEvent|clearFields|enctype|semantic|addEventListener|html|location|appendTo|ajaxSend|ajaxStart|find|parent|enable|global|object|clearInputs|setRequestHeader|getResponseHeader|attributes|getAllResponseHeaders|options|statusText|status|serialize|button|fieldSerialize|formSerialize|pre|absolute|position|css|elements|write|offsetLeft|javascript|offsetY|src|indexOf|version|toUpperCase|offsetTop|id|parsererror|jqFormIO|validate|parseFromString|DOMParser|ajaxSettings|loadXML|async|XMLDOM|Microsoft|merge|notify|100|ajax|remove|ajaxStop|ajaxComplete|get|ajaxSuccess|handleError|safari|catch|globalEval|eval|script|specified|in|file|password|throw|nodeType|try|removeEventListener|multipart|POST|toString|jQuery'.split('|'),0,{}))
;
var commentbox = ".comment";
var ctrl = false;
var last_submit;
var speed = 'fast';
var ahah = false;
var firsttime_init = true;

/**
 * Attaches the ahah behavior to each ahah form element.
 */
Drupal.behaviors.ajax_comments = function(context) {
  $('#panels-comment-form').attr('id', 'comment-form');
  //$('#edit-submit').attr('id','ajax-comments-submit');
  $('.comment-form.form-submit').attr('id','ajax-comments-submit');
  $('#comment-form:not(.ajax-comments-processed)', context).addClass('ajax-comments-processed').each(function() {
    form = $(this);
    // Prepare the form when the DOM is ready.
    if ((Drupal.settings.rows_default == undefined) || (!Drupal.settings.rows_default)) {
      Drupal.settings.rows_default = $('textarea', form).attr('rows');
    }
    $('textarea', form).attr('rows', Drupal.settings.rows_default);
    if ((Drupal.settings.rows_in_reply == undefined) || (!Drupal.settings.rows_in_reply)) {
      Drupal.settings.rows_in_reply = Drupal.settings.rows_default;
    }
    if (Drupal.settings.always_expand_main_form == undefined) {
      Drupal.settings.always_expand_main_form = true;
    }
    if (Drupal.settings.blink_new == undefined) {
      Drupal.settings.blink_new = true;
    }

    $('#edit-upload', form).bind('change', function(){
      $('#ajax-comments-submit,#ajax-comments-preview', form).attr('disabled', 1);
    });
    
    // It's not possible to use 'click' or 'submit' events for ahah sumits, so
    // we should emulate it by up-down events. We need to check which elements
    // are actually clicked pressed, to make everything work correct.
    $('#ajax-comments-submit,#ajax-comments-preview', form).bind('mousedown keydown', function() { last_submit = $(this).attr('id'); });
    $('#ajax-comments-submit,#ajax-comments-preview', form).bind('mouseup', function() {
      if (last_submit == $(this).attr('id')) {
        ajax_comments_show_progress(context);
        ajax_comments_update_editors();
      }
    });
    $('#ajax-comments-submit,#ajax-comments-preview', form).bind('keyup', function(event) {
      if (last_submit == $(this).attr('id') && event.keyCode == 13) {
        ajax_comments_show_progress(context);
        ajax_comments_update_editors();
      }
    });
    
    // Enable comments buttons back when attachement is uploaded.
    $('#edit-attach', form).bind('mousedown keydown', function() {
      if (last_submit == $(this).attr('id')) {
        $('#ajax-comments-submit,#ajax-comments-preview', form).removeAttr('disabled');
      }
    });

    // Initializing main form.
    action = form.attr('action');

    // Creating title link.
    form.parents(".box").find("h2:not(.ajax-comments-processed),h3:not(.ajax-comments-processed),h4:not(.ajax-comments-processed)").addClass('ajax-comments-processed').each(function(){
      title = $(this).html();
      $(this).html('<a href="'+action+'" id="comment-form-title">'+title+'</a>');
      $(this).parents(".box").find(".content").attr('id','comment-form-content').removeClass("content");
    });

    // Expanding form if needed.
    page_url = document.location.toString();
    fragment = '';
    if (page_url.match('#')) {
      fragment = page_url.split('#')[1];
    }

    if ((fragment == 'comment-form'  || Drupal.settings.always_expand_main_form) && firsttime_init) {
      $('#comment-form-title', context).addClass('pressed');
      $('#comment-form-content').attr('cid', 0);
    }
    else {
      // Fast hide form.
      $('#comment-form-content', context).hide();
    }
    
    // Attaching event to title link.
    $('#comment-form-title:not(.ajax-comments-processed)', context).addClass('ajax-comments-processed').click(ajax_comments_reply_click);
    // Moving preview in a proper place.
    $('#comment-form-content').parents('.box').before($('#comment-preview'));
    if (!$('#comment-form-content').attr('cid')) {
      $('#comment-form-content').attr('cid', -1);
    }
    
    if(typeof(fix_control_size)!='undefined'){ fix_control_size(); }
  });
  
  $('.comment_reply a:not(.ajax-comments-processed)', context).addClass('ajax-comments-processed').click(ajax_comments_reply_click);
  $('.quote a:not(.ajax-comments-processed)', context).addClass('ajax-comments-processed').each(function(){
    href = $(this).attr('href');
    if (ajax_comments_is_reply_to_node(href)) {
      $(this).click(function(){
        $('#comment-form').attr('action', $(this).attr('href'));
        ajax_comments_reload_form(0);

        $('#comment-form-title', context).click();
        ajax_comments_scroll_to_comment_form();
        return false;
      });
    }
    else {
      $(this).click(ajax_comments_reply_click);
    }
  });
  
  // We should only bind ajax deletion on links with tokens to avoid CSRF attacks.
  $('.comment_delete a:not(.ajax-comments-processed)', context).each(function (){
    href = $(this).attr('href');
    if (href.indexOf('token=') > -1) {
      $(this).addClass('ajax-comments-processed').click(ajax_comments_delete_click);
    }
  });

  // Add Ctrl key listener for deletion feature.
  $(window).keydown(function(e) {
    if(e.keyCode == 17) {
      ctrl = true;
    }
  });
  $(window).keyup(function(e) {
    ctrl = false;
     // Add sending on Ctrl+Enter.
    if ((e.ctrlKey) && ((e.keyCode == 0xA) || (e.keyCode == 0xD)) && !submitted) {
      submitted = true;
      $('#ajax-comments-submit').click()
    }
 });


  firsttime_init = false;
};

/**
 * Reply link handler
 */
function ajax_comments_reply_click() {
  // We should only handle non presed links.
  if (!$(this).is('.pressed')){
    action = $(this).attr('href');
    link_cid = ajax_comments_get_cid_from_href(action);
    rows = Drupal.settings.rows_default;
    if ($('#comment-form-content').attr('cid') != link_cid) {
      // We should remove any WYSIWYG before moving controls.
      ajax_comments_remove_editors();

      // Move form from old position.
      if (ajax_comments_is_reply_to_node(action)) {
        $('#comment-form').removeClass('indented');
        if ($('#comment-form-content:visible').length) {
          $('#comment-form-content').after('<div style="height:' + $('#comment-form-content').height() + 'px;" class="sizer"></div>');
          $('.sizer').slideUp(speed, function(){ $(this).remove(); });
        }
        $(this).parents('h2,h3,h4').after($('#comment-form-content'));
        rows = Drupal.settings.rows_default;
        $('#comment-form-content').parents('.box').before($('#comment-preview'));
      }
      else {
        $('#comment-form').addClass('indented');
        if ($('#comment-form-content:visible').length) {
          $('#comment-form-content').after('<div style="height:' + $('#comment-form-content').height() + 'px;" class="sizer"></div>');
          $('.sizer').slideUp(speed, function(){ $(this).remove(); });
        }
        $(this).parents(commentbox).after($('#comment-form-content'));
        rows = Drupal.settings.rows_in_reply;
        $('#comment-form-content').prepend($('#comment-preview'));
      }
      $('#comment-form-content').hide();
    }

    // We don't need to load everything twice.
    if (!$(this).is('.last-clicked')) {
      // Reload form if preview is required.
      if ((Drupal.settings.comment_preview_required && $('#ajax-comments-submit').length) ||
        // Or if quoted comment.
        action.match('quote=1')
      ) {
        $('#comment-form').attr('action', action)
        ajax_comments_reload_form(link_cid);
      }
      else {
        ajax_comments_init_form(link_cid, rows);
      }
    }
    // ...and show the form after everything is done.
    ajax_comments_expand_form();
    
    $('.pressed').removeClass('pressed');
    $(this).addClass('pressed');
    $('.last-clicked').removeClass('last-clicked');
    $(this).addClass('last-clicked');
    $('#comment-form-content').attr('cid', link_cid);
  }
  else {
    // Handling double click.
    if ((!$(this).is('#comment-form-title')) && (Drupal.settings.always_expand_main_form)) {
//      $('#comment-form-title').click();
    }
    else {
      ajax_comments_close_form();
    }
  }

  if (typeof(fix_control_size) != 'undefined'){ fix_control_size(); }
  return false;
}

/**
 * Delete links handler.
 */
function ajax_comments_delete_click() {
  if ((ctrl) || (confirm(Drupal.t('Are you sure you want to delete the comment? Any replies to this comment will be lost. This action cannot be undone.')))) {
    // Taking link's href as AJAX url.
    comment = $(this).parents(commentbox);
    action = $(this).attr('href');
    action = action.replace(/comment\/delete\//, 'ajax_comments/instant_delete/');
    if (action) {
      $(this).parents(commentbox).fadeTo(speed, 0.5);
      $.ajax({
        type: "GET",
        url: action,
        success: function(result){
          if (result == 'OK') {
            ajax_comments_close_form();

            // If comment form is expanded on this module, we should collapse it first.
            if (comment.next().is('#comment-form-content')) {
              thread = comment.next().next('.indented, div > .indented');
            }
            else {
              thread = comment.next('.indented, div > .indented');
            }
            thread.animate({height:'hide', opacity:'hide'}, speed);
            comment.animate({height:'hide', opacity:'hide'}, speed, function(){
              thread.remove();
              comment.remove();
              if (!$(commentbox).length) {
                $('#comment-controls').animate({height:'hide', opacity:'hide'}, speed, function(){ $(this).remove(); });
              }
            });
          }
          else {
            alert('Sorry, token error.');
          }
        }
      });
    }
  }
  return false;
}

// ======================================================================
// Misc. functions
// ======================================================================

/**
 * Hide comment form, reload if needed.
 */
function ajax_comments_expand_form(focus) {
  $('#comment-form-content').animate({height:'show'}, speed, function() {
    if (focus) {
      $('#comment-form textarea').focus();
    }
    if ($.browser.msie) this.style.removeAttribute('filter'); 
  });
}

/**
 * Helper function for reply handler.
 */
function ajax_comments_init_form(pid, rows){
  // Resizing and clearing textarea.
  $('#comment-form textarea').attr('rows', rows);
  $('#comment-form:not(.fresh) textarea').attr('value','');

  // Clearing form.
  $('#comment-preview').empty();
  $('#comment-form .error').removeClass('error');

  // Set proper PID.
  $('#comment-form input[name=pid]').val(pid)

  // Now we can attach previously removed editors.
  ajax_comments_attach_editors();
  submit = false;
}

/**
 * Hide comment form, reload if needed.
 */
function ajax_comments_close_form(reload) {
  pid = $('#comment-form-content').attr('cid');
  $('#comment-form-content').animate({height:'hide'}, speed, function(){
    if (reload) {
      ajax_comments_reload_form(pid);
    }
  });
  $('.pressed').removeClass('pressed');
  $('#comment-form-content').attr('cid', -1);
  ajax_comments_hide_progress();
}

/**
 * Reload comments form from server.
 */
function ajax_comments_reload_form(pid) {
  action = $('#comment-form').attr('action');
  action = action.replace('comment/reply', 'ajax_comments/js_reload');

  if (pid > 0) {
    action = action.replace(/([?])$/, '/' + pid + '?');
    action = action.replace(/#comment-form/, '');
    
    rows = Drupal.settings.rows_in_reply;
  }
  else {
    rows = Drupal.settings.rows_default;
  }
  $('#comment-preview').hide();
//  ajax_comments_show_progress();

  $.ajax({
    type: "GET",
    url: action,
    success: function(result) {
      saved_class = $('#comment-form').attr('class');
      $('#comment-form-content').html(result);
      $('#comment-form').attr('class', saved_class);

      $('#comment-form').addClass('fresh');

      Drupal.attachBehaviors($('#comment-form-content form'));
	  pid = null;
      ajax_comments_init_form(pid, rows);
      ajax_comments_hide_progress();

      $('#comment-form').removeClass('fresh');
    }
  });
}

/**
 * Scrolling to a new comment.
 */
function ajax_comments_scroll_to_comment_form() {
  if ($.browser.msie) {
    height = document.documentElement.offsetHeight ;
  }
  else if (window.innerWidth && window.innerHeight) {
    height = window.innerHeight;
  }
  height = height / 2;
  offset = $('#comment-form-content').offset();
  if ((offset.top > $('html').scrollTop() + height) || (offset.top < $('html').scrollTop() - 20)) {
    $('html').animate({scrollTop: offset.top}, 'slow');
  }
}

/**
 * AHAH effect for comment previews.
 */
jQuery.fn.ajaxCommentsPreviewToggle = function() {
  var obj = $(this[0]);

  // Hide previous preview.
  $('#comment-preview > div:visible').animate({height:'hide', opacity:'hide'}, speed, function() { $(this).remove(); } );
  // Show fresh preview.
  $('#comment-preview').show();
  obj.animate({height:'show', opacity:'show'}, speed);
  ajax_comments_hide_progress();

  // Add submit button if it doesn't added yet.
  if (!$('#ajax-comments-submit').length && $('.preview-item').length) {
    $('#ajax-comments-preview').after('<input name="op" id="ajax-comments-submit" value="'+ Drupal.t("Save") +'" class="form-submit" type="submit">');
    // Re-attaching to new comment.
    Drupal.attachBehaviors($('#ajax-comments-submit'));
  }
};

/**
 * AHAH effect for comment submits.
 */
jQuery.fn.ajaxCommentsSubmitToggle = function() {
  var obj = $(this[0]);

  html = obj.html();
  if (html.indexOf('comment-new-success') > -1) {
    
    // Empty any preview before output comment.
    $('#comment-preview').slideUp(speed, function(){ $(this).empty(); });
    
    // Place new comment in proper place.
    ajax_comments_insert_new_comment(obj);

    // At last - showing it up.
    obj.animate({height:'show', opacity:'show'}, speed, function () {
      if ($.browser.msie) {
        height = document.documentElement.offsetHeight ;
      } else if (window.innerWidth && window.innerHeight) {
        height = window.innerHeight;
      }
      height = height / 2;
      offset = obj.offset();
      if ((offset.top > $('html').scrollTop() + height) || (offset.top < $('html').scrollTop() - 20)) {
        $('html').animate({scrollTop: offset.top - height}, 'slow', function(){
          // Blink a little bit to user, so he know where's his comment.
          if (Drupal.settings.blink_new) {
            obj.fadeTo('fast', 0.2).fadeTo('fast', 1).fadeTo('fast', 0.5).fadeTo('fast', 1).fadeTo('fast', 0.7).fadeTo('fast', 1, function() { if ($.browser.msie) this.style.removeAttribute('filter'); });
          }
        });
      }
      else {
        if (Drupal.settings.blink_new) {
          obj.fadeTo('fast', 0.2).fadeTo('fast', 1).fadeTo('fast', 0.5).fadeTo('fast', 1).fadeTo('fast', 0.7).fadeTo('fast', 1, function() { if ($.browser.msie) this.style.removeAttribute('filter'); });
        }
      }
      if ($.browser.msie) this.style.removeAttribute('filter');
    });

    // Re-attaching behaviors to new comment.
    Drupal.attachBehaviors(html);

    // Hiding comment form.
    ajax_comments_close_form(true);
  }
  else {
    $('#comment-preview').append(obj);
    obj.ajaxCommentsPreviewToggle(speed);
  }
};

function ajax_comments_insert_new_comment(comment) {
  if ($('#comment-form-content').attr('cid') == 0) {
    $('#comment-preview').before(comment);
  }
  else {
    if ($('#comment-form-content').next().is('.indented')) {
      $('#comment-form-content').next().append(comment);
    }
    else {
      $('#comment-form-content').before(comment);
      comment.wrap('<div class="indented"></div>');
    }
  }
}

/**
 * Remove editors from comments textarea (mostly to re-attach it).
 */
function ajax_comments_remove_editors() {
  ajax_comments_update_editors();
  if (typeof(Drupal.wysiwyg) != undefined) {
    $('#comment-form input.wysiwyg-processed:checked').each(function() {
      var params = Drupal.wysiwyg.getParams(this);
      Drupal.wysiwygDetach($(this), params);
    });
    return;
  }
  
  if (typeof(tinyMCE) != 'undefined') {
    if (tinyMCE.getInstanceById("edit-comment")) {
      tinyMCE.execCommand('mceRemoveControl', false, "edit-comment");
    }
  }
}

/**
 * Attach editors to comments textarea if needed.
 */
function ajax_comments_attach_editors() {
  if (typeof(Drupal.wysiwyg) != undefined) {
    $('#comment-form input.wysiwyg-processed:checked').each(function() {
      var params = Drupal.wysiwyg.getParams(this);
      Drupal.wysiwygAttach($(this), params);
    });
    return;
  }

  if (typeof(tinyMCE) != 'undefined') {
    tinyMCE.execCommand('mceAddControl', false, "edit-comment");
  }
}

/**
 * Update editors text to their textareas. Need to be done befor submits.
 */
function ajax_comments_update_editors() {
  // Update tinyMCE.
  if (typeof(tinyMCE) != 'undefined') {
    tinyMCE.triggerSave();
  }
  
  // Update FCKeditor.
  if (typeof(doFCKeditorSave) != 'undefined') {
    doFCKeditorSave();
  }
  if(typeof(FCKeditor_OnAfterLinkedFieldUpdate) != 'undefined'){
    FCKeditor_OnAfterLinkedFieldUpdate(FCKeditorAPI.GetInstance('edit-comment'));
  }
}



function ajax_comments_get_cid_from_href(action) {
  args = ajax_comments_get_args(action);

  // getting token params (/comment/delete/!cid!)
  if (args[1] == 'delete') {
    cid = args[2];
  }
  // getting token params (/comment/reply/nid/!cid!)
  else {
    if (typeof(args[3]) == 'undefined') {
      cid = 0;
    }
    else {
      cid = args[3];
    }
  }
  return cid;
}

function ajax_comments_is_reply_to_node(href) {
  args = ajax_comments_get_args(href);
  result = args[1] == 'reply' && args[2] && (typeof(args[3]) == 'undefined');
  return result;
}

function ajax_comments_get_args(url) {
  if (Drupal.settings.clean_url == '1') {
    var regexS = "(http(s)*:\/\/)*([^/]*)"+ Drupal.settings.basePath +"([^?#]*)";
    var regex = new RegExp( regexS );
    var results = regex.exec( url );
    args = results[4];
  }
  else {
    var regexS = "([&?])q=([^#&?]*)";
    var regex = new RegExp( regexS );
    var results = regex.exec( url );
    args = results[2];
  }
  args = args.split('/');
  if (Drupal.settings.language_mode == 1 || Drupal.settings.language_mode == 2) {
    for (l in Drupal.settings.language_list) {
      if (args[0] == Drupal.settings.language_list[l].language) {
        args.shift();
        break;
      }
    }
  }
  return args;
}

function ajax_comments_show_progress(context) {
  if (!context) {
    context = '#comment-form-content';
  }
  if (!$('#comment-form .ajax-comments-loader', context).length) {
    $('#comment-form', context).append('<div class="ajax-comments-loader"></div>');
  }
}
function ajax_comments_hide_progress(context) {
  if (!context) {
    context = '#comment-form-content';
  }
  $('#comment-form .ajax-comments-loader', context).fadeOut(speed, function(){ $(this).remove(); });
}
;
/**
 * Provides AJAX-like page updating via AHAH (Asynchronous HTML and HTTP).
 *
 * AHAH is a method of making a request via Javascript while viewing an HTML
 * page. The request returns a small chunk of HTML, which is then directly
 * injected into the page.
 *
 * Drupal uses this file to enhance form elements with #ahah[path] and
 * #ahah[wrapper] properties. If set, this file will automatically be included
 * to provide AHAH capabilities.
 */

/**
 * Attaches the ahah behavior to each ahah form element.
 */
Drupal.behaviors.ahah = function(context) {
    for (var base in Drupal.settings.ahah) {
        if (!$('#' + base + '.ahah-processed').size()) {
            var element_settings = Drupal.settings.ahah[base];

            $(element_settings.selector).each(function() {
                element_settings.element = this;
                var ahah = new Drupal.ahah(base, element_settings);
            });

            $('#' + base).addClass('ahah-processed');
        }
    }
};

/**
 * AHAH object.
 */
Drupal.ahah = function(base, element_settings) {
    // Set the properties for this object.
    this.element = element_settings.element;
    this.selector = element_settings.selector;
    this.event = element_settings.event;
    this.keypress = element_settings.keypress;
    this.url = element_settings.url;
    this.wrapper = '#' + element_settings.wrapper;
    this.effect = element_settings.effect;
    this.method = element_settings.method;
    this.progress = element_settings.progress;
    this.button = element_settings.button || {};
    this.immutable = element_settings.immutable;
    this.buildId = null;

    if (this.effect == 'none') {
        this.showEffect = 'show';
        this.hideEffect = 'hide';
        this.showSpeed = '';
    } else if (this.effect == 'fade') {
        this.showEffect = 'fadeIn';
        this.hideEffect = 'fadeOut';
        this.showSpeed = 'slow';
    } else {
        this.showEffect = this.effect + 'Toggle';
        this.hideEffect = this.effect + 'Toggle';
        this.showSpeed = 'slow';
    }

    // Record the form action and target, needed for iFrame file uploads.
    var form = $(this.element).parents('form');
    this.form_action = form.attr('action');
    this.form_target = form.attr('target');
    this.form_encattr = form.attr('encattr');

    // Set the options for the ajaxSubmit function.
    // The 'this' variable will not persist inside of the options object.
    var ahah = this;
    var options = {
        url: ahah.url,
        data: ahah.button,
        beforeSubmit: function(form_values, element_settings, options) {
            return ahah.beforeSubmit(form_values, element_settings, options);
        },
        beforeSend: function(request, options) {
            return ahah.beforeSend(request, options);
        },
        success: function(response, status) {
            // Sanity check for browser support (object expected).
            // When using iFrame uploads, responses must be returned as a string.
            if (typeof(response) == 'string') {
                response = Drupal.parseJson(response);
            }
            return ahah.success(response, status);
        },
        complete: function(response, status) {
            ahah.complete(response, status);
            if (status == 'error' || status == 'parsererror') {
                return ahah.error(response, ahah.url);
            }
        },
        dataType: 'json',
        contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
        type: 'POST'
    };

    // Bind the ajaxSubmit function to the element event.
    $(element_settings.element).bind(element_settings.event, function() {
        $(element_settings.element).parents('form').ajaxSubmit(options);
        return false;
    });
    // If necessary, enable keyboard submission so that AHAH behaviors
    // can be triggered through keyboard input as well as e.g. a mousedown
    // action.
    if (element_settings.keypress) {
        $(element_settings.element).keypress(function(event) {
            // Detect enter key.
            if (event.keyCode == 13) {
                $(element_settings.element).trigger(element_settings.event);
                return false;
            }
        });
    }
};

/**
 * Handler for the form redirection submission.
 */
Drupal.ahah.prototype.beforeSubmit = function(form_values, element, options) {
    // Disable the element that received the change.
    $(this.element).addClass('progress-disabled').attr('disabled', true);

    // Insert progressbar or throbber.
    if (this.progress.type == 'bar') {
        var progressBar = new Drupal.progressBar('ahah-progress-' + this.element.id, eval(this.progress.update_callback), this.progress.method, eval(this.progress.error_callback));
        if (this.progress.message) {
            progressBar.setProgress(-1, this.progress.message);
        }
        if (this.progress.url) {
            progressBar.startMonitoring(this.progress.url, this.progress.interval || 1500);
        }
        this.progress.element = $(progressBar.element).addClass('ahah-progress ahah-progress-bar');
        this.progress.object = progressBar;
        $(this.element).after(this.progress.element);
    } else if (this.progress.type == 'throbber') {
        this.progress.element = $('<div class="ahah-progress ahah-progress-throbber"><div class="throbber">&nbsp;</div></div>');
        if (this.progress.message) {
            $('.throbber', this.progress.element).after('<div class="message">' + this.progress.message + '</div>')
        }
        $(this.element).after(this.progress.element);
    }

    // Record the build-id.
    if (this.immutable) {
        var ahah = this;
        $.each(form_values, function() {
            if (this.name == 'form_build_id') {
                ahah.buildId = this.value;
                return false;
            }
        });
    }
};

/**
 * Modify the request object before it is sent.
 */
Drupal.ahah.prototype.beforeSend = function(request, options) {
    if (this.immutable) {
        request.setRequestHeader('X-Drupal-Accept-Build-Id', '1');
    }
}

/**
 * Handler for the form redirection completion.
 */
Drupal.ahah.prototype.success = function(response, status) {
    var wrapper = $(this.wrapper);
    var form = $(this.element).parents('form');
    // Manually insert HTML into the jQuery object, using $() directly crashes
    // Safari with long string lengths. http://dev.jquery.com/ticket/1152
    var new_content = $('<div></div>').html(response.data);

    // Restore the previous action and target to the form.
    form.attr('action', this.form_action);
    this.form_target ? form.attr('target', this.form_target) : form.removeAttr('target');
    this.form_encattr ? form.attr('target', this.form_encattr) : form.removeAttr('encattr');

    // Remove the progress element.
    if (this.progress.element) {
        $(this.progress.element).remove();
    }
    if (this.progress.object) {
        this.progress.object.stopMonitoring();
    }
    $(this.element).removeClass('progress-disabled').attr('disabled', false);

    // Add the new content to the page.
    Drupal.freezeHeight();
    if (this.method == 'replace') {
        wrapper.empty().append(new_content);
    } else {
        wrapper[this.method](new_content);
    }

    // Immediately hide the new content if we're using any effects.
    if (this.showEffect != 'show') {
        new_content.hide();
    }

    // Determine what effect use and what content will receive the effect, then
    // show the new content. For browser compatibility, Safari is excluded from
    // using effects on table rows.
    if (($.browser.safari && $("tr.ahah-new-content", new_content).size() > 0)) {
        new_content.show();
    } else if ($('.ahah-new-content', new_content).size() > 0) {
        $('.ahah-new-content', new_content).hide();
        new_content.show();
        $(".ahah-new-content", new_content)[this.showEffect](this.showSpeed);
    } else if (this.showEffect != 'show') {
        new_content[this.showEffect](this.showSpeed);
    }

    // Attach all javascript behaviors to the new content, if it was successfully
    // added to the page, this if statement allows #ahah[wrapper] to be optional.
    if (new_content.parents('html').length > 0) {
        Drupal.attachBehaviors(new_content);
    }

    Drupal.unfreezeHeight();
};

/**
 * Handler for the form redirection error.
 */
Drupal.ahah.prototype.error = function(response, uri) {
    alert(Drupal.ahahError(response, uri));
    // Resore the previous action and target to the form.
    $(this.element).parent('form').attr({
        action: this.form_action,
        target: this.form_target
    });
    // Remove the progress element.
    if (this.progress.element) {
        $(this.progress.element).remove();
    }
    if (this.progress.object) {
        this.progress.object.stopMonitoring();
    }
    // Undo hide.
    $(this.wrapper).show();
    // Re-enable the element.
    $(this.element).removeClass('progess-disabled').attr('disabled', false);
};

/**
 * Handler called when the request finishes, whether in failure or success.
 */
Drupal.ahah.prototype.complete = function(response, status) {
    // Update form build id if necessary.
    if (this.immutable) {
        var newBuildId = response.getResponseHeader('X-Drupal-Build-Id');
        if (this.buildId && newBuildId && this.buildId != newBuildId) {
            var $element = $('input[name="form_build_id"][value="' + this.buildId + '"]');
            $element.val(newBuildId);
            $element.attr('id', newBuildId);
        }
        this.buildId = null;
    }
};

Drupal.behaviors.textarea = function(context) {
  $('textarea.resizable:not(.textarea-processed)', context).each(function() {
    // Avoid non-processed teasers.
    if ($(this).is(('textarea.teaser:not(.teaser-processed)'))) {
      return false;  
    }
    var textarea = $(this).addClass('textarea-processed'), staticOffset = null;

    // When wrapping the text area, work around an IE margin bug.  See:
    // http://jaspan.com/ie-inherited-margin-bug-form-elements-and-haslayout
    $(this).wrap('<div class="resizable-textarea"><span></span></div>')
      .parent().append($('<div class="grippie"></div>').mousedown(startDrag));

    var grippie = $('div.grippie', $(this).parent())[0];
    grippie.style.marginRight = (grippie.offsetWidth - $(this)[0].offsetWidth) +'px';

    function startDrag(e) {
      staticOffset = textarea.height() - e.pageY;
      textarea.css('opacity', 0.25);
      $(document).mousemove(performDrag).mouseup(endDrag);
      return false;
    }

    function performDrag(e) {
      textarea.height(Math.max(32, staticOffset + e.pageY) + 'px');
      return false;
    }

    function endDrag(e) {
      $(document).unbind("mousemove", performDrag).unbind("mouseup", endDrag);
      textarea.css('opacity', 1);
    }
  });
};
;
/*
 * jQuery Form Plugin
 * version: 2.25 (08-APR-2009)
 * @requires jQuery v1.2.2 or later
 * @note This has been modified for ajax.module
 * Examples and documentation at: http://malsup.com/jquery/form/
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */
eval(function(p,a,c,k,e,r){e=function(c){return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--)r[e(c)]=k[c]||e(c);k=[function(e){return r[e]}];e=function(){return'\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c]);return p}(';(5($){$.B.1s=5(u){2(!4.G){R(\'1b: 2M 9 2N - 2O 2P 1t\');6 4}2(S u==\'5\')u={T:u};3 v=4.14(\'1c\')||1d.2Q.2R;v=(v.2S(/^([^#]+)/)||[])[1];v=v||\'\';u=$.1n({1e:v,H:4.14(\'1u\')||\'1Q\'},u||{});3 w={};4.L(\'C-1R-1S\',[4,u,w]);2(w.1T){R(\'1b: 9 1U 1o C-1R-1S L\');6 4}2(u.1v&&u.1v(4,u)===I){R(\'1b: 9 1f 1o 1v 1V\');6 4}3 a=4.1w(u.2T);2(u.J){u.O=u.J;K(3 n 1x u.J){2(u.J[n]2U 15){K(3 k 1x u.J[n])a.D({7:n,8:u.J[n][k]})}E a.D({7:n,8:u.J[n]})}}2(u.1y&&u.1y(a,4,u)===I){R(\'1b: 9 1f 1o 1y 1V\');6 4}4.L(\'C-9-1W\',[a,4,u,w]);2(w.1T){R(\'1b: 9 1U 1o C-9-1W L\');6 4}3 q=$.1z(a);2(u.H.2V()==\'1Q\'){u.1e+=(u.1e.2W(\'?\')>=0?\'&\':\'?\')+q;u.J=F}E u.J=q;3 x=4,V=[];2(u.2X)V.D(5(){x.1X()});2(u.2Y)V.D(5(){x.1Y()});2(!u.16&&u.17){3 y=u.T||5(){};V.D(5(a){$(u.17).2Z(a).P(y,1Z)})}E 2(u.T)V.D(u.T);u.T=5(a,b){K(3 i=0,M=V.G;i<M;i++)V[i].30(u,[a,b,x])};3 z=$(\'W:31\',4).18();3 A=I;K(3 j=0;j<z.G;j++)2(z[j])A=Q;2(u.20||A){2(u.21)$.32(u.21,1A);E 1A()}E $.33(u);4.L(\'C-9-34\',[4,u]);6 4;5 1A(){3 h=x[0];2($(\':W[7=9]\',h).G){35(\'36: 37 22 38 39 3a 3b "9".\');6}3 i=$.1n({},$.23,u);3 s=$.1n(Q,{},$.1n(Q,{},$.23),i);3 j=\'3c\'+(1B 3d().3e());3 k=$(\'<20 3f="\'+j+\'" 7="\'+j+\'" 24="25:26" />\');3 l=k[0];k.3g({3h:\'3i\',27:\'-28\',29:\'-28\'});3 m={1f:0,19:F,1g:F,3j:0,3k:\'n/a\',3l:5(){},2a:5(){},3m:5(){},3n:5(){4.1f=1;k.14(\'24\',\'25:26\')}};3 g=i.2b;2(g&&!$.1C++)$.1h.L("3o");2(g)$.1h.L("3p",[m,i]);2(s.2c&&s.2c(m,s)===I){s.2b&&$.1C--;6}2(m.1f)6;3 o=0;3 p=0;3 q=h.U;2(q){3 n=q.7;2(n&&!q.1i){u.O=u.O||{};u.O[n]=q.8;2(q.H=="X"){u.O[7+\'.x\']=h.Y;u.O[7+\'.y\']=h.Z}}}1j(5(){3 t=x.14(\'17\'),a=x.14(\'1c\');h.1k(\'17\',j);2(h.2d(\'1u\')!=\'2e\')h.1k(\'1u\',\'2e\');2(h.2d(\'1c\')!=i.1e)h.1k(\'1c\',i.1e);2(!u.3q){x.14({3r:\'2f/C-J\',3s:\'2f/C-J\'})}2(i.1D)1j(5(){p=Q;11()},i.1D);3 b=[];2g{2(u.O)K(3 n 1x u.O)b.D($(\'<W H="3t" 7="\'+n+\'" 8="\'+u.O[n]+\'" />\').2h(h)[0]);k.2h(\'1l\');l.2i?l.2i(\'2j\',11):l.3u(\'2k\',11,I);h.9()}3v{h.1k(\'1c\',a);t?h.1k(\'17\',t):x.3w(\'17\');$(b).2l()}},10);3 r=0;5 11(){2(o++)6;l.2m?l.2m(\'2j\',11):l.3x(\'2k\',11,I);3 c=Q;2g{2(p)3y\'1D\';3 d,N;N=l.2n?l.2n.2o:l.2p?l.2p:l.2o;2((N.1l==F||N.1l.2q==\'\')&&!r){r=1;o--;1j(11,2r);6}m.19=N.1l?N.1l.2q:F;m.1g=N.2s?N.2s:N;m.2a=5(a){3 b={\'3z-H\':i.16};6 b[a]};2(i.16==\'3A\'||i.16==\'3B\'){3 f=N.1E(\'1F\')[0];m.19=f?f.8:m.19}E 2(i.16==\'2t\'&&!m.1g&&m.19!=F){m.1g=2u(m.19)}d=$.3C(m,i.16)}3D(e){c=I;$.3E(i,m,\'2v\',e)}2(c){i.T(d,\'T\');2(g)$.1h.L("3F",[m,i])}2(g)$.1h.L("3G",[m,i]);2(g&&!--$.1C)$.1h.L("3H");2(i.2w)i.2w(m,c?\'T\':\'2v\');1j(5(){k.2l();m.1g=F},2r)};5 2u(s,a){2(1d.2x){a=1B 2x(\'3I.3J\');a.3K=\'I\';a.3L(s)}E a=(1B 3M()).3N(s,\'1G/2t\');6(a&&a.2y&&a.2y.1p!=\'3O\')?a:F}}};$.B.3P=5(c){6 4.2z().2A(\'9.C-1q\',5(){$(4).1s(c);6 I}).P(5(){$(":9,W:X",4).2A(\'2B.C-1q\',5(e){3 a=4.C;a.U=4;2(4.H==\'X\'){2(e.2C!=12){a.Y=e.2C;a.Z=e.3Q}E 2(S $.B.2D==\'5\'){3 b=$(4).2D();a.Y=e.2E-b.29;a.Z=e.2F-b.27}E{a.Y=e.2E-4.3R;a.Z=e.2F-4.3S}}1j(5(){a.U=a.Y=a.Z=F},10)})})};$.B.2z=5(){4.2G(\'9.C-1q\');6 4.P(5(){$(":9,W:X",4).2G(\'2B.C-1q\')})};$.B.1w=5(b){3 a=[];2(4.G==0)6 a;3 c=4[0];3 d=b?c.1E(\'*\'):c.22;2(!d)6 a;K(3 i=0,M=d.G;i<M;i++){3 e=d[i];3 n=e.7;2(!n)1H;2(b&&c.U&&e.H=="X"){2(!e.1i&&c.U==e)a.D({7:n+\'.x\',8:c.Y},{7:n+\'.y\',8:c.Z});1H}3 v=$.18(e,Q);2(v&&v.1r==15){K(3 j=0,2H=v.G;j<2H;j++)a.D({7:n,8:v[j]})}E 2(v!==F&&S v!=\'12\')a.D({7:n,8:v})}2(!b&&c.U){3 f=c.1E("W");K(3 i=0,M=f.G;i<M;i++){3 g=f[i];3 n=g.7;2(n&&!g.1i&&g.H=="X"&&c.U==g)a.D({7:n+\'.x\',8:c.Y},{7:n+\'.y\',8:c.Z})}}6 a};$.B.3T=5(a){6 $.1z(4.1w(a))};$.B.3U=5(b){3 a=[];4.P(5(){3 n=4.7;2(!n)6;3 v=$.18(4,b);2(v&&v.1r==15){K(3 i=0,M=v.G;i<M;i++)a.D({7:n,8:v[i]})}E 2(v!==F&&S v!=\'12\')a.D({7:4.7,8:v})});6 $.1z(a)};$.B.18=5(a){K(3 b=[],i=0,M=4.G;i<M;i++){3 c=4[i];3 v=$.18(c,a);2(v===F||S v==\'12\'||(v.1r==15&&!v.G))1H;v.1r==15?$.3V(b,v):b.D(v)}6 b};$.18=5(b,c){3 n=b.7,t=b.H,1a=b.1p.1I();2(S c==\'12\')c=Q;2(c&&(!n||b.1i||t==\'1m\'||t==\'3W\'||(t==\'1J\'||t==\'1K\')&&!b.1L||(t==\'9\'||t==\'X\')&&b.C&&b.C.U!=b||1a==\'13\'&&b.1M==-1))6 F;2(1a==\'13\'){3 d=b.1M;2(d<0)6 F;3 a=[],1N=b.3X;3 e=(t==\'13-2I\');3 f=(e?d+1:1N.G);K(3 i=(e?d:0);i<f;i++){3 g=1N[i];2(g.1t){3 v=g.8;2(!v)v=(g.1O&&g.1O[\'8\']&&!(g.1O[\'8\'].3Y))?g.1G:g.8;2(e)6 v;a.D(v)}}6 a}6 b.8};$.B.1Y=5(){6 4.P(5(){$(\'W,13,1F\',4).2J()})};$.B.2J=$.B.3Z=5(){6 4.P(5(){3 t=4.H,1a=4.1p.1I();2(t==\'1G\'||t==\'40\'||1a==\'1F\')4.8=\'\';E 2(t==\'1J\'||t==\'1K\')4.1L=I;E 2(1a==\'13\')4.1M=-1})};$.B.1X=5(){6 4.P(5(){2(S 4.1m==\'5\'||(S 4.1m==\'41\'&&!4.1m.42))4.1m()})};$.B.43=5(b){2(b==12)b=Q;6 4.P(5(){4.1i=!b})};$.B.2K=5(b){2(b==12)b=Q;6 4.P(5(){3 t=4.H;2(t==\'1J\'||t==\'1K\')4.1L=b;E 2(4.1p.1I()==\'2L\'){3 a=$(4).44(\'13\');2(b&&a[0]&&a[0].H==\'13-2I\'){a.45(\'2L\').2K(I)}4.1t=b}})};5 R(){2($.B.1s.46&&1d.1P&&1d.1P.R)1d.1P.R(\'[47.C] \'+15.48.49.4a(1Z,\'\'))}})(4b);',62,260,'||if|var|this|function|return|name|value|submit||||||||||||||||||||||||||||fn|form|push|else|null|length|type|false|data|for|trigger|max|doc|extraData|each|true|log|typeof|success|clk|callbacks|input|image|clk_x|clk_y||cb|undefined|select|attr|Array|dataType|target|a_fieldValue|responseText|tag|ajaxSubmit|action|window|url|aborted|responseXML|event|disabled|setTimeout|setAttribute|body|reset|extend|via|tagName|plugin|constructor|a_ajaxSubmit|selected|method|beforeSerialize|a_formToArray|in|beforeSubmit|param|fileUpload|new|active|timeout|getElementsByTagName|textarea|text|continue|toLowerCase|checkbox|radio|checked|selectedIndex|ops|attributes|console|GET|pre|serialize|veto|vetoed|callback|validate|a_resetForm|a_clearForm|arguments|iframe|closeKeepAlive|elements|ajaxSettings|src|about|blank|top|1000px|left|getResponseHeader|global|beforeSend|getAttribute|POST|multipart|try|appendTo|attachEvent|onload|load|remove|detachEvent|contentWindow|document|contentDocument|innerHTML|100|XMLDocument|xml|toXml|error|complete|ActiveXObject|documentElement|a_ajaxFormUnbind|bind|click|offsetX|offset|pageX|pageY|unbind|jmax|one|a_clearFields|a_selected|option|skipping|process|no|element|location|href|match|semantic|instanceof|toUpperCase|indexOf|resetForm|clearForm|html|apply|file|get|ajax|notify|alert|Error|Form|must|not|be|named|jqFormIO|Date|getTime|id|css|position|absolute|status|statusText|getAllResponseHeaders|setRequestHeader|abort|ajaxStart|ajaxSend|skipEncodingOverride|encoding|enctype|hidden|addEventListener|finally|removeAttr|removeEventListener|throw|content|json|script|httpData|catch|handleError|ajaxSuccess|ajaxComplete|ajaxStop|Microsoft|XMLDOM|async|loadXML|DOMParser|parseFromString|parsererror|a_ajaxForm|offsetY|offsetLeft|offsetTop|a_formSerialize|a_fieldSerialize|merge|button|options|specified|a_clearInputs|password|object|nodeType|a_enable|parent|find|debug|jquery|prototype|join|call|jQuery'.split('|'),0,{}));
/**
 * Automatic ajax validation
 *
 * @see http://drupal.org/project/ajax
 * @see irc://freenode.net/#drupy
 * @depends Drupal 6
 * @author brendoncrawford
 * @note This file uses a 79 character width limit.
 * 
 *
 */

Drupal.Ajax = new Object;

Drupal.Ajax.plugins = {};

Drupal.Ajax.firstRun = false;

/**
 * Init function.
 * This is being executed by Drupal behaviours.
 * See bottom of script.
 * 
 * @param {HTMLElement} context
 * @return {Bool}
 */
Drupal.Ajax.init = function(context) {
  var f, s;
  if (f = $('.ajax-form', context)) {
    if (!Drupal.Ajax.firstRun) {
      Drupal.Ajax.invoke('init');
      Drupal.Ajax.firstRun = true;
    }
    s = $('input[type="submit"]', f);
    s.click(function(){
      this.form.ajax_activator = $(this);
      return true;
    });
    f.each(function(){
      this.ajax_activator = null;
      $(this).submit(function(){
        if (this.ajax_activator === null) {
          this.ajax_activator = $('#edit-submit', this);
        }
        if (this.ajax_activator.hasClass('ajax-trigger')) {
          Drupal.Ajax.go($(this), this.ajax_activator);
          return false;
        }
        else {
          return true;
        }
      });
      return true;
    });
  }
  return true;
};

/**
 * Invokes plugins
 * 
 * @param {Object} formObj
 * @param {Object} submitter
 */
Drupal.Ajax.invoke = function(hook, args) {
  var plugin, r, ret;
  ret = true;
  for (plugin in Drupal.Ajax.plugins) {
    r = Drupal.Ajax.plugins[plugin](hook, args);
    if (r === false) {
      ret = false;
    }
  }
  return ret;
};

/**
 * Handles submission
 * 
 * @param {Object} submitter_
 * @return {Bool}
 */
Drupal.Ajax.go = function(formObj, submitter) {
  var submitterVal, submitterName, extraData;
  Drupal.Ajax.invoke('submit', {submitter:submitter});
  submitterVal = submitter.val();
  submitterName = submitter.attr('name');
  submitter.val(Drupal.t('Loading...'));
  extraData = {};
  extraData[submitterName] = submitterVal;
  extraData['drupal_ajax'] = '1';
  formObj.a_ajaxSubmit({
    extraData : extraData,
    beforeSubmit : function(data) {
      data[data.length] = {
        name : submitterName,
        value : submitterVal
      };
      data[data.length] = {
        name : 'drupal_ajax',
        value : '1'
      };
      return true;
    },
    dataType : 'json',
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      window.alert(Drupal.t('ajax.module: An unknown error has occurred.'));
      if (window.console) {
        console.log('error', arguments);
      }
      return true;
    },
    success: function(data){
      submitter.val(submitterVal);
      Drupal.Ajax.response(submitter, formObj, data);
      return true;
    }
  });
  return false;
};

/**
 * Handles messaging
 * 
 * @param {Object} formObj
 * @param {Object} submitter
 * @param {Object} data
 * @param {Object} options
 * @return {Bool}
 */
Drupal.Ajax.message = function(formObj, submitter, data, options) {
  var args;
  data.local = {
    submitter : submitter,
    form : formObj
  };
  if (Drupal.Ajax.invoke('message', data)) {
    Drupal.Ajax.writeMessage(data.local.form, data.local.submitter, options);
    Drupal.Ajax.invoke('afterMessage', data);
  }
  return true;
};

/**
 * Writes message
 * 
 * @param {Object} formObj
 * @param {Object} submitter
 * @param {Object} options
 * @return {Bool}
 */
Drupal.Ajax.writeMessage = function(formObj, submitter, options) {
  var i, _i, thisItem, log, errBox, h, data;
  if (options.action === 'notify') {
    // Cleanups
    $('.messages, .ajax-preview', formObj).remove();
    $('input, textarea').removeClass('error status warning required');
    // Preview
    if (options.type === 'preview') {
      log = $('<div>').addClass('ajax-preview');
      log.html(options.messages);
      formObj.prepend(log);
    }
    // Status, Error, Message
    else {
      log = $('<ul>');
      errBox = $(".messages." + options.type, formObj[0])
      for (i = 0, _i = options.messages.length; i < _i; i++) {
        thisItem = $('#' + options.messages[i].id, formObj[0])
        thisItem.addClass(options.type);
        if (options.messages[i].required) {
          thisItem.addClass('required');
        }
        log.append('<li>' + options.messages[i].value + '</li>');
      }
      if (errBox.length === 0) {
        errBox = $("<div class='messages " + options.type + "'>");
        formObj.prepend(errBox);
      }
      errBox.html(log);
    }
  }
  else if (options.action === 'clear') {
    $('.messages, .ajax-preview', formObj).remove();
  }
  return true;
};

/**
 * Updates message containers
 * 
 * @param {Object} updaters
 * @return {Bool}
 */
Drupal.Ajax.updater = function(updaters) {
  var i, _i, elm;
  for (i = 0, _i = updaters.length; i < _i; i++) {
    elm = $(updaters[i].selector);
    // HTML:IN
    if (updaters[i].type === 'html_in') {
      elm.html(updaters[i].value);
    }
    // HTML:OUT
    else if (updaters[i].type === 'html_out') {
      elm.replaceWith(updaters[i].value);
    }
    // FIELD
    else if (updaters[i].type === 'field') {
      elm.val(updaters[i].value);
    }
    // REMOVE
    else if(updaters[i].type === 'remove') {
      elm.remove();
    }
  }
  return true;
};

/**
 * Handles data response
 * 
 * @param {Object} submitter
 * @param {Object} formObj
 * @param {Object} data
 * @return {Bool}
 */
Drupal.Ajax.response = function(submitter, formObj, data){
  var newSubmitter;
  data.local = {
    submitter : submitter,
    form : formObj
  };
  /**
   * Failure
   */
  if (data.status === false) {
    Drupal.Ajax.updater(data.updaters);
    Drupal.Ajax.message(formObj, submitter, data, {
      action : 'notify',
      messages : data.messages_error,
      type : 'error'
    });
  }
  /**
   * Success
   */
  else {
    // Display preview
    if (data.preview !== null) {
      Drupal.Ajax.updater(data.updaters);
      Drupal.Ajax.message(formObj, submitter, data, {
        action : 'notify',
        messages : decodeURIComponent(data.preview),
        type : 'preview'
      });
    }
    // If no redirect, then simply show messages
    else if (data.redirect === null) {
      if (data.messages_status.length > 0) {
        Drupal.Ajax.message(formObj, submitter, data, {
          action : 'notify',
          messages : data.messages_status,
          type : 'status'
        });
      }
      if (data.messages_warning.length > 0) {
        Drupal.Ajax.message(formObj, submitter, data, {
          action : 'notify',
          messages : data.messages_warning,
          type : 'warning'
        });
      }
      if (data.messages_status.length === 0 &&
          data.messages_warning.length === 0) {
        Drupal.Ajax.message(formObj, submitter, data, {action:'clear'});
      }
    }
    // Redirect
    else {
      if (Drupal.Ajax.invoke('redirect', data)) {
        Drupal.Ajax.redirect( data.redirect );
      }
      else {
        Drupal.Ajax.updater(data.updaters);
        if (data.messages_status.length === 0 &&
            data.messages_warning.length === 0) {
          Drupal.Ajax.message(formObj, submitter, data, {action:'clear'});
        }
        else {
          Drupal.Ajax.message(formObj, submitter, data, {
            action : 'notify',
            messages : data.messages_status,
            type : 'status'
          });
        }
      }
    }
  }
  return true;
};


/**
 * Redirects to appropriate page
 * 
 * @todo
 *   Some of this functionality should possibly hapen on
 *   the server instead of client.
 * @param {String} url
 */
Drupal.Ajax.redirect = function(url) {
  window.location.href = url;
};

Drupal.behaviors.Ajax = Drupal.Ajax.init;


;
Drupal.behaviors.rate = function(context) {
  $('.rate-widget:not(.rate-processed)', context).addClass('rate-processed').each(function () {
    var widget = $(this);
    var ids = widget.attr('id').match(/^rate\-([a-z]+)\-([0-9]+)\-([0-9]+)\-([0-9])$/);
    var data = {
      content_type: ids[1],
      content_id: ids[2],
      widget_id: ids[3],
      widget_mode: ids[4]
    };
    
    $('a.rate-button', widget).click(function() {
      var token = this.getAttribute('href').match(/rate\=([a-f0-9]{32})/)[1];
      return Drupal.rateVote(widget, data, token);
    });
  });
}

Drupal.rateVote = function(widget, data, token) {
  // Invoke JavaScript hook.
  $.event.trigger('eventBeforeRate', [data]);

  $(".rate-info", widget).text(Drupal.t('Saving vote...'));

  // Random number to prevent caching, see http://drupal.org/node/1042216#comment-4046618
  var random = Math.floor(Math.random() * 99999);

//  var q = 'rate/vote/js?widget_id=' + data.widget_id + '&content_type=' + data.content_type + '&content_id=' + data.content_id + '&widget_mode=' + data.widget_mode + '&token=' + token + '&destination=' + escape(document.location) + '&r=' + random;
// Removed
  var q = 'rate/vote/js?widget_id=' + data.widget_id + '&content_type=' + data.content_type + '&content_id=' + data.content_id + '&widget_mode=' + data.widget_mode + '&token=' + token + '&r=' + random;
  if (data.value) {
    q = q + '&value=' + data.value;
  }

  $.get(Drupal.settings.basePath + q, function(data) {
    if (data.match(/^https?\:\/\/[^\/]+\/(.*)$/)) {
      // We got a redirect.
      document.location = data;
    }
    else {
      // get parent object
      var p = widget.parent();

      // Invoke JavaScript hook.
      $.event.trigger('eventAfterRate', [data]);

      widget.before(data);

      // remove widget
      widget.remove();
      widget = undefined;

      Drupal.attachBehaviors(p.get(0));
    }
  });

  return false;
}
;
var commentbox = ".comment";
var ctrl = false;
var last_submit;
var speed = 'fast';
var ahah = false;
var firsttime_init = true;

/**
 * Attaches the ahah behavior to each ahah form element.
 */
Drupal.behaviors.ajax_comments = function(context) {
  $('#panels-comment-form').attr('id', 'comment-form');
  //$('#edit-submit').attr('id','ajax-comments-submit');
  $('.comment-form.form-submit').attr('id','ajax-comments-submit');
  $('#comment-form:not(.ajax-comments-processed)', context).addClass('ajax-comments-processed').each(function() {
    form = $(this);
    // Prepare the form when the DOM is ready.
    if ((Drupal.settings.rows_default == undefined) || (!Drupal.settings.rows_default)) {
      Drupal.settings.rows_default = $('textarea', form).attr('rows');
    }
    $('textarea', form).attr('rows', Drupal.settings.rows_default);
    if ((Drupal.settings.rows_in_reply == undefined) || (!Drupal.settings.rows_in_reply)) {
      Drupal.settings.rows_in_reply = Drupal.settings.rows_default;
    }
    if (Drupal.settings.always_expand_main_form == undefined) {
      Drupal.settings.always_expand_main_form = true;
    }
    if (Drupal.settings.blink_new == undefined) {
      Drupal.settings.blink_new = true;
    }

    $('#edit-upload', form).bind('change', function(){
      $('#ajax-comments-submit,#ajax-comments-preview', form).attr('disabled', 1);
    });
    
    // It's not possible to use 'click' or 'submit' events for ahah sumits, so
    // we should emulate it by up-down events. We need to check which elements
    // are actually clicked pressed, to make everything work correct.
    $('#ajax-comments-submit,#ajax-comments-preview', form).bind('mousedown keydown', function() { last_submit = $(this).attr('id'); });
    $('#ajax-comments-submit,#ajax-comments-preview', form).bind('mouseup', function() {
      if (last_submit == $(this).attr('id')) {
        ajax_comments_show_progress(context);
        ajax_comments_update_editors();
      }
    });
    $('#ajax-comments-submit,#ajax-comments-preview', form).bind('keyup', function(event) {
      if (last_submit == $(this).attr('id') && event.keyCode == 13) {
        ajax_comments_show_progress(context);
        ajax_comments_update_editors();
      }
    });
    
    // Enable comments buttons back when attachement is uploaded.
    $('#edit-attach', form).bind('mousedown keydown', function() {
      if (last_submit == $(this).attr('id')) {
        $('#ajax-comments-submit,#ajax-comments-preview', form).removeAttr('disabled');
      }
    });

    // Initializing main form.
    action = form.attr('action');

    // Creating title link.
    form.parents(".box").find("h2:not(.ajax-comments-processed),h3:not(.ajax-comments-processed),h4:not(.ajax-comments-processed)").addClass('ajax-comments-processed').each(function(){
      title = $(this).html();
      $(this).html('<a href="'+action+'" id="comment-form-title">'+title+'</a>');
      $(this).parents(".box").find(".content").attr('id','comment-form-content').removeClass("content");
    });

    // Expanding form if needed.
    page_url = document.location.toString();
    fragment = '';
    if (page_url.match('#')) {
      fragment = page_url.split('#')[1];
    }

    if ((fragment == 'comment-form'  || Drupal.settings.always_expand_main_form) && firsttime_init) {
      $('#comment-form-title', context).addClass('pressed');
      $('#comment-form-content').attr('cid', 0);
    }
    else {
      // Fast hide form.
      $('#comment-form-content', context).hide();
    }
    
    // Attaching event to title link.
    $('#comment-form-title:not(.ajax-comments-processed)', context).addClass('ajax-comments-processed').click(ajax_comments_reply_click);
    // Moving preview in a proper place.
    $('#comment-form-content').parents('.box').before($('#comment-preview'));
    if (!$('#comment-form-content').attr('cid')) {
      $('#comment-form-content').attr('cid', -1);
    }
    
    if(typeof(fix_control_size)!='undefined'){ fix_control_size(); }
  });
  
  $('.comment_reply a:not(.ajax-comments-processed)', context).addClass('ajax-comments-processed').click(ajax_comments_reply_click);
  $('.quote a:not(.ajax-comments-processed)', context).addClass('ajax-comments-processed').each(function(){
    href = $(this).attr('href');
    if (ajax_comments_is_reply_to_node(href)) {
      $(this).click(function(){
        $('#comment-form').attr('action', $(this).attr('href'));
        ajax_comments_reload_form(0);

        $('#comment-form-title', context).click();
        ajax_comments_scroll_to_comment_form();
        return false;
      });
    }
    else {
      $(this).click(ajax_comments_reply_click);
    }
  });
  
  // We should only bind ajax deletion on links with tokens to avoid CSRF attacks.
  $('.comment_delete a:not(.ajax-comments-processed)', context).each(function (){
    href = $(this).attr('href');
    if (href.indexOf('token=') > -1) {
      $(this).addClass('ajax-comments-processed').click(ajax_comments_delete_click);
    }
  });

  // Add Ctrl key listener for deletion feature.
  $(window).keydown(function(e) {
    if(e.keyCode == 17) {
      ctrl = true;
    }
  });
  $(window).keyup(function(e) {
    ctrl = false;
     // Add sending on Ctrl+Enter.
    if ((e.ctrlKey) && ((e.keyCode == 0xA) || (e.keyCode == 0xD)) && !submitted) {
      submitted = true;
      $('#ajax-comments-submit').click()
    }
 });


  firsttime_init = false;
};

/**
 * Reply link handler
 */
function ajax_comments_reply_click() {
  // We should only handle non presed links.
  if (!$(this).is('.pressed')){
    action = $(this).attr('href');
    link_cid = ajax_comments_get_cid_from_href(action);
    rows = Drupal.settings.rows_default;
    if ($('#comment-form-content').attr('cid') != link_cid) {
      // We should remove any WYSIWYG before moving controls.
      ajax_comments_remove_editors();

      // Move form from old position.
      if (ajax_comments_is_reply_to_node(action)) {
        $('#comment-form').removeClass('indented');
        if ($('#comment-form-content:visible').length) {
          $('#comment-form-content').after('<div style="height:' + $('#comment-form-content').height() + 'px;" class="sizer"></div>');
          $('.sizer').slideUp(speed, function(){ $(this).remove(); });
        }
        $(this).parents('h2,h3,h4').after($('#comment-form-content'));
        rows = Drupal.settings.rows_default;
        $('#comment-form-content').parents('.box').before($('#comment-preview'));
      }
      else {
        $('#comment-form').addClass('indented');
        if ($('#comment-form-content:visible').length) {
          $('#comment-form-content').after('<div style="height:' + $('#comment-form-content').height() + 'px;" class="sizer"></div>');
          $('.sizer').slideUp(speed, function(){ $(this).remove(); });
        }
        $(this).parents(commentbox).after($('#comment-form-content'));
        rows = Drupal.settings.rows_in_reply;
        $('#comment-form-content').prepend($('#comment-preview'));
      }
      $('#comment-form-content').hide();
    }

    // We don't need to load everything twice.
    if (!$(this).is('.last-clicked')) {
      // Reload form if preview is required.
      if ((Drupal.settings.comment_preview_required && $('#ajax-comments-submit').length) ||
        // Or if quoted comment.
        action.match('quote=1')
      ) {
        $('#comment-form').attr('action', action)
        ajax_comments_reload_form(link_cid);
      }
      else {
        ajax_comments_init_form(link_cid, rows);
      }
    }
    // ...and show the form after everything is done.
    ajax_comments_expand_form();
    
    $('.pressed').removeClass('pressed');
    $(this).addClass('pressed');
    $('.last-clicked').removeClass('last-clicked');
    $(this).addClass('last-clicked');
    $('#comment-form-content').attr('cid', link_cid);
  }
  else {
    // Handling double click.
    if ((!$(this).is('#comment-form-title')) && (Drupal.settings.always_expand_main_form)) {
//      $('#comment-form-title').click();
    }
    else {
      ajax_comments_close_form();
    }
  }

  if (typeof(fix_control_size) != 'undefined'){ fix_control_size(); }
  return false;
}

/**
 * Delete links handler.
 */
function ajax_comments_delete_click() {
  if ((ctrl) || (confirm(Drupal.t('Are you sure you want to delete the comment? Any replies to this comment will be lost. This action cannot be undone.')))) {
    // Taking link's href as AJAX url.
    comment = $(this).parents(commentbox);
    action = $(this).attr('href');
    action = action.replace(/comment\/delete\//, 'ajax_comments/instant_delete/');
    if (action) {
      $(this).parents(commentbox).fadeTo(speed, 0.5);
      $.ajax({
        type: "GET",
        url: action,
        success: function(result){
          if (result == 'OK') {
            ajax_comments_close_form();

            // If comment form is expanded on this module, we should collapse it first.
            if (comment.next().is('#comment-form-content')) {
              thread = comment.next().next('.indented, div > .indented');
            }
            else {
              thread = comment.next('.indented, div > .indented');
            }
            thread.animate({height:'hide', opacity:'hide'}, speed);
            comment.animate({height:'hide', opacity:'hide'}, speed, function(){
              thread.remove();
              comment.remove();
              if (!$(commentbox).length) {
                $('#comment-controls').animate({height:'hide', opacity:'hide'}, speed, function(){ $(this).remove(); });
              }
            });
          }
          else {
            alert('Sorry, token error.');
          }
        }
      });
    }
  }
  return false;
}

// ======================================================================
// Misc. functions
// ======================================================================

/**
 * Hide comment form, reload if needed.
 */
function ajax_comments_expand_form(focus) {
  $('#comment-form-content').animate({height:'show'}, speed, function() {
    if (focus) {
      $('#comment-form textarea').focus();
    }
    if ($.browser.msie) this.style.removeAttribute('filter'); 
  });
}

/**
 * Helper function for reply handler.
 */
function ajax_comments_init_form(pid, rows){
  // Resizing and clearing textarea.
  $('#comment-form textarea').attr('rows', rows);
  $('#comment-form:not(.fresh) textarea').attr('value','');

  // Clearing form.
  $('#comment-preview').empty();
  $('#comment-form .error').removeClass('error');

  // Set proper PID.
  $('#comment-form input[name=pid]').val(pid)

  // Now we can attach previously removed editors.
  ajax_comments_attach_editors();
  submit = false;
}

/**
 * Hide comment form, reload if needed.
 */
function ajax_comments_close_form(reload) {
  pid = $('#comment-form-content').attr('cid');
  $('#comment-form-content').animate({height:'hide'}, speed, function(){
    if (reload) {
      ajax_comments_reload_form(pid);
    }
  });
  $('.pressed').removeClass('pressed');
  $('#comment-form-content').attr('cid', -1);
  ajax_comments_hide_progress();
}

/**
 * Reload comments form from server.
 */
function ajax_comments_reload_form(pid) {
  action = $('#comment-form').attr('action');
  action = action.replace('comment/reply', 'ajax_comments/js_reload');

  if (pid > 0) {
    action = action.replace(/([?])$/, '/' + pid + '?');
    action = action.replace(/#comment-form/, '');
    
    rows = Drupal.settings.rows_in_reply;
  }
  else {
    rows = Drupal.settings.rows_default;
  }
  $('#comment-preview').hide();
//  ajax_comments_show_progress();

  $.ajax({
    type: "GET",
    url: action,
    success: function(result) {
      saved_class = $('#comment-form').attr('class');
      $('#comment-form-content').html(result);
      $('#comment-form').attr('class', saved_class);

      $('#comment-form').addClass('fresh');

      Drupal.attachBehaviors($('#comment-form-content form'));
	  pid = null;
      ajax_comments_init_form(pid, rows);
      ajax_comments_hide_progress();

      $('#comment-form').removeClass('fresh');
    }
  });
}

/**
 * Scrolling to a new comment.
 */
function ajax_comments_scroll_to_comment_form() {
  if ($.browser.msie) {
    height = document.documentElement.offsetHeight ;
  }
  else if (window.innerWidth && window.innerHeight) {
    height = window.innerHeight;
  }
  height = height / 2;
  offset = $('#comment-form-content').offset();
  if ((offset.top > $('html').scrollTop() + height) || (offset.top < $('html').scrollTop() - 20)) {
    $('html').animate({scrollTop: offset.top}, 'slow');
  }
}

/**
 * AHAH effect for comment previews.
 */
jQuery.fn.ajaxCommentsPreviewToggle = function() {
  var obj = $(this[0]);

  // Hide previous preview.
  $('#comment-preview > div:visible').animate({height:'hide', opacity:'hide'}, speed, function() { $(this).remove(); } );
  // Show fresh preview.
  $('#comment-preview').show();
  obj.animate({height:'show', opacity:'show'}, speed);
  ajax_comments_hide_progress();

  // Add submit button if it doesn't added yet.
  if (!$('#ajax-comments-submit').length && $('.preview-item').length) {
    $('#ajax-comments-preview').after('<input name="op" id="ajax-comments-submit" value="'+ Drupal.t("Save") +'" class="form-submit" type="submit">');
    // Re-attaching to new comment.
    Drupal.attachBehaviors($('#ajax-comments-submit'));
  }
};

/**
 * AHAH effect for comment submits.
 */
jQuery.fn.ajaxCommentsSubmitToggle = function() {
  var obj = $(this[0]);

  html = obj.html();
  if (html.indexOf('comment-new-success') > -1) {
    
    // Empty any preview before output comment.
    $('#comment-preview').slideUp(speed, function(){ $(this).empty(); });
    
    // Place new comment in proper place.
    ajax_comments_insert_new_comment(obj);

    // At last - showing it up.
    obj.animate({height:'show', opacity:'show'}, speed, function () {
      if ($.browser.msie) {
        height = document.documentElement.offsetHeight ;
      } else if (window.innerWidth && window.innerHeight) {
        height = window.innerHeight;
      }
      height = height / 2;
      offset = obj.offset();
      if ((offset.top > $('html').scrollTop() + height) || (offset.top < $('html').scrollTop() - 20)) {
        $('html').animate({scrollTop: offset.top - height}, 'slow', function(){
          // Blink a little bit to user, so he know where's his comment.
          if (Drupal.settings.blink_new) {
            obj.fadeTo('fast', 0.2).fadeTo('fast', 1).fadeTo('fast', 0.5).fadeTo('fast', 1).fadeTo('fast', 0.7).fadeTo('fast', 1, function() { if ($.browser.msie) this.style.removeAttribute('filter'); });
          }
        });
      }
      else {
        if (Drupal.settings.blink_new) {
          obj.fadeTo('fast', 0.2).fadeTo('fast', 1).fadeTo('fast', 0.5).fadeTo('fast', 1).fadeTo('fast', 0.7).fadeTo('fast', 1, function() { if ($.browser.msie) this.style.removeAttribute('filter'); });
        }
      }
      if ($.browser.msie) this.style.removeAttribute('filter');
    });

    // Re-attaching behaviors to new comment.
    Drupal.attachBehaviors(html);

    // Hiding comment form.
    ajax_comments_close_form(true);
  }
  else {
    $('#comment-preview').append(obj);
    obj.ajaxCommentsPreviewToggle(speed);
  }
};

function ajax_comments_insert_new_comment(comment) {
  if ($('#comment-form-content').attr('cid') == 0) {
    $('#comment-preview').before(comment);
  }
  else {
    if ($('#comment-form-content').next().is('.indented')) {
      $('#comment-form-content').next().append(comment);
    }
    else {
      $('#comment-form-content').before(comment);
      comment.wrap('<div class="indented"></div>');
    }
  }
}

/**
 * Remove editors from comments textarea (mostly to re-attach it).
 */
function ajax_comments_remove_editors() {
  ajax_comments_update_editors();
  if (typeof(Drupal.wysiwyg) != undefined) {
    $('#comment-form input.wysiwyg-processed:checked').each(function() {
      var params = Drupal.wysiwyg.getParams(this);
      Drupal.wysiwygDetach($(this), params);
    });
    return;
  }
  
  if (typeof(tinyMCE) != 'undefined') {
    if (tinyMCE.getInstanceById("edit-comment")) {
      tinyMCE.execCommand('mceRemoveControl', false, "edit-comment");
    }
  }
}

/**
 * Attach editors to comments textarea if needed.
 */
function ajax_comments_attach_editors() {
  if (typeof(Drupal.wysiwyg) != undefined) {
    $('#comment-form input.wysiwyg-processed:checked').each(function() {
      var params = Drupal.wysiwyg.getParams(this);
      Drupal.wysiwygAttach($(this), params);
    });
    return;
  }

  if (typeof(tinyMCE) != 'undefined') {
    tinyMCE.execCommand('mceAddControl', false, "edit-comment");
  }
}

/**
 * Update editors text to their textareas. Need to be done befor submits.
 */
function ajax_comments_update_editors() {
  // Update tinyMCE.
  if (typeof(tinyMCE) != 'undefined') {
    tinyMCE.triggerSave();
  }
  
  // Update FCKeditor.
  if (typeof(doFCKeditorSave) != 'undefined') {
    doFCKeditorSave();
  }
  if(typeof(FCKeditor_OnAfterLinkedFieldUpdate) != 'undefined'){
    FCKeditor_OnAfterLinkedFieldUpdate(FCKeditorAPI.GetInstance('edit-comment'));
  }
}



function ajax_comments_get_cid_from_href(action) {
  args = ajax_comments_get_args(action);

  // getting token params (/comment/delete/!cid!)
  if (args[1] == 'delete') {
    cid = args[2];
  }
  // getting token params (/comment/reply/nid/!cid!)
  else {
    if (typeof(args[3]) == 'undefined') {
      cid = 0;
    }
    else {
      cid = args[3];
    }
  }
  return cid;
}

function ajax_comments_is_reply_to_node(href) {
  args = ajax_comments_get_args(href);
  result = args[1] == 'reply' && args[2] && (typeof(args[3]) == 'undefined');
  return result;
}

function ajax_comments_get_args(url) {
  if (Drupal.settings.clean_url == '1') {
    var regexS = "(http(s)*:\/\/)*([^/]*)"+ Drupal.settings.basePath +"([^?#]*)";
    var regex = new RegExp( regexS );
    var results = regex.exec( url );
    args = results[4];
  }
  else {
    var regexS = "([&?])q=([^#&?]*)";
    var regex = new RegExp( regexS );
    var results = regex.exec( url );
    args = results[2];
  }
  args = args.split('/');
  if (Drupal.settings.language_mode == 1 || Drupal.settings.language_mode == 2) {
    for (l in Drupal.settings.language_list) {
      if (args[0] == Drupal.settings.language_list[l].language) {
        args.shift();
        break;
      }
    }
  }
  return args;
}

function ajax_comments_show_progress(context) {
  if (!context) {
    context = '#comment-form-content';
  }
  if (!$('#comment-form .ajax-comments-loader', context).length) {
    $('#comment-form', context).append('<div class="ajax-comments-loader"></div>');
  }
}
function ajax_comments_hide_progress(context) {
  if (!context) {
    context = '#comment-form-content';
  }
  $('#comment-form .ajax-comments-loader', context).fadeOut(speed, function(){ $(this).remove(); });
}
;
/*!
 * jQuery Form Plugin
 * version: 3.37.0-2013.07.11
 * @requires jQuery v1.5 or later
 * Copyright (c) 2013 M. Alsup
 * Examples and documentation at: http://malsup.com/jquery/form/
 * Project repository: https://github.com/malsup/form
 * Dual licensed under the MIT and GPL licenses.
 * https://github.com/malsup/form#copyright-and-license
 */
/*global ActiveXObject */
;(function($) {
"use strict";

/*
    Usage Note:
    -----------
    Do not use both ajaxSubmit and ajaxForm on the same form.  These
    functions are mutually exclusive.  Use ajaxSubmit if you want
    to bind your own submit handler to the form.  For example,

    $(document).ready(function() {
        $('#myForm').on('submit', function(e) {
            e.preventDefault(); // <-- important
            $(this).ajaxSubmit({
                target: '#output'
            });
        });
    });

    Use ajaxForm when you want the plugin to manage all the event binding
    for you.  For example,

    $(document).ready(function() {
        $('#myForm').ajaxForm({
            target: '#output'
        });
    });

    You can also use ajaxForm with delegation (requires jQuery v1.7+), so the
    form does not have to exist when you invoke ajaxForm:

    $('#myForm').ajaxForm({
        delegation: true,
        target: '#output'
    });

    When using ajaxForm, the ajaxSubmit function will be invoked for you
    at the appropriate time.
*/

/**
 * Feature detection
 */
var feature = {};
feature.fileapi = $("<input type='file'/>").get(0).files !== undefined;
feature.formdata = window.FormData !== undefined;

var hasProp = !!$.fn.prop;

// attr2 uses prop when it can but checks the return type for
// an expected string.  this accounts for the case where a form 
// contains inputs with names like "action" or "method"; in those
// cases "prop" returns the element
$.fn.attr2 = function() {
    if ( ! hasProp )
        return this.attr.apply(this, arguments);
    var val = this.prop.apply(this, arguments);
    if ( ( val && val.jquery ) || typeof val === 'string' )
        return val;
    return this.attr.apply(this, arguments);
};

/**
 * ajaxSubmit() provides a mechanism for immediately submitting
 * an HTML form using AJAX.
 */
$.fn.ajaxSubmit = function(options) {
    /*jshint scripturl:true */

    // fast fail if nothing selected (http://dev.jquery.com/ticket/2752)
    if (!this.length) {
        log('ajaxSubmit: skipping submit process - no element selected');
        return this;
    }

    var method, action, url, $form = this;

    if (typeof options == 'function') {
        options = { success: options };
    }
    else if ( options === undefined ) {
        options = {};
    }

    method = options.type || this.attr2('method');
    action = options.url  || this.attr2('action');

    url = (typeof action === 'string') ? $.trim(action) : '';
    url = url || window.location.href || '';
    if (url) {
        // clean url (don't include hash vaue)
        url = (url.match(/^([^#]+)/)||[])[1];
    }

    options = $.extend(true, {
        url:  url,
        success: $.ajaxSettings.success,
        type: method || 'GET',
        iframeSrc: /^https/i.test(window.location.href || '') ? 'javascript:false' : 'about:blank'
    }, options);

    // hook for manipulating the form data before it is extracted;
    // convenient for use with rich editors like tinyMCE or FCKEditor
    var veto = {};
    this.trigger('form-pre-serialize', [this, options, veto]);
    if (veto.veto) {
        log('ajaxSubmit: submit vetoed via form-pre-serialize trigger');
        return this;
    }

    // provide opportunity to alter form data before it is serialized
    if (options.beforeSerialize && options.beforeSerialize(this, options) === false) {
        log('ajaxSubmit: submit aborted via beforeSerialize callback');
        return this;
    }

    var traditional = options.traditional;
    if ( traditional === undefined ) {
        traditional = $.ajaxSettings.traditional;
    }

    var elements = [];
    var qx, a = this.formToArray(options.semantic, elements);
    if (options.data) {
        options.extraData = options.data;
        qx = $.param(options.data, traditional);
    }

    // give pre-submit callback an opportunity to abort the submit
    if (options.beforeSubmit && options.beforeSubmit(a, this, options) === false) {
        log('ajaxSubmit: submit aborted via beforeSubmit callback');
        return this;
    }

    // fire vetoable 'validate' event
    this.trigger('form-submit-validate', [a, this, options, veto]);
    if (veto.veto) {
        log('ajaxSubmit: submit vetoed via form-submit-validate trigger');
        return this;
    }

    var q = $.param(a, traditional);
    if (qx) {
        q = ( q ? (q + '&' + qx) : qx );
    }
    if (options.type.toUpperCase() == 'GET') {
        options.url += (options.url.indexOf('?') >= 0 ? '&' : '?') + q;
        options.data = null;  // data is null for 'get'
    }
    else {
        options.data = q; // data is the query string for 'post'
    }

    var callbacks = [];
    if (options.resetForm) {
        callbacks.push(function() { $form.resetForm(); });
    }
    if (options.clearForm) {
        callbacks.push(function() { $form.clearForm(options.includeHidden); });
    }

    // perform a load on the target only if dataType is not provided
    if (!options.dataType && options.target) {
        var oldSuccess = options.success || function(){};
        callbacks.push(function(data) {
            var fn = options.replaceTarget ? 'replaceWith' : 'html';
            $(options.target)[fn](data).each(oldSuccess, arguments);
        });
    }
    else if (options.success) {
        callbacks.push(options.success);
    }

    options.success = function(data, status, xhr) { // jQuery 1.4+ passes xhr as 3rd arg
        var context = options.context || this ;    // jQuery 1.4+ supports scope context
        for (var i=0, max=callbacks.length; i < max; i++) {
            callbacks[i].apply(context, [data, status, xhr || $form, $form]);
        }
    };

    if (options.error) {
        var oldError = options.error;
        options.error = function(xhr, status, error) {
            var context = options.context || this;
            oldError.apply(context, [xhr, status, error, $form]);
        };
    }

     if (options.complete) {
        var oldComplete = options.complete;
        options.complete = function(xhr, status) {
            var context = options.context || this;
            oldComplete.apply(context, [xhr, status, $form]);
        };
    }
    // are there files to upload?

    // [value] (issue #113), also see comment:
    // https://github.com/malsup/form/commit/588306aedba1de01388032d5f42a60159eea9228#commitcomment-2180219
    var fileInputs = $('input[type=file]:enabled[value!=""]', this);

    var hasFileInputs = fileInputs.length > 0;
    var mp = 'multipart/form-data';
    var multipart = ($form.attr('enctype') == mp || $form.attr('encoding') == mp);

    var fileAPI = feature.fileapi && feature.formdata;
    log("fileAPI :" + fileAPI);
    var shouldUseFrame = (hasFileInputs || multipart) && !fileAPI;

    var jqxhr;

    // options.iframe allows user to force iframe mode
    // 06-NOV-09: now defaulting to iframe mode if file input is detected
    if (options.iframe !== false && (options.iframe || shouldUseFrame)) {
        // hack to fix Safari hang (thanks to Tim Molendijk for this)
        // see:  http://groups.google.com/group/jquery-dev/browse_thread/thread/36395b7ab510dd5d
        if (options.closeKeepAlive) {
            $.get(options.closeKeepAlive, function() {
                jqxhr = fileUploadIframe(a);
            });
        }
        else {
            jqxhr = fileUploadIframe(a);
        }
    }
    else if ((hasFileInputs || multipart) && fileAPI) {
        jqxhr = fileUploadXhr(a);
    }
    else {
        jqxhr = $.ajax(options);
    }

    $form.removeData('jqxhr').data('jqxhr', jqxhr);

    // clear element array
    for (var k=0; k < elements.length; k++)
        elements[k] = null;

    // fire 'notify' event
    this.trigger('form-submit-notify', [this, options]);
    return this;

    // utility fn for deep serialization
    function deepSerialize(extraData){
        var serialized = $.param(extraData, options.traditional).split('&');
        var len = serialized.length;
        var result = [];
        var i, part;
        for (i=0; i < len; i++) {
            // #252; undo param space replacement
            serialized[i] = serialized[i].replace(/\+/g,' ');
            part = serialized[i].split('=');
            // #278; use array instead of object storage, favoring array serializations
            result.push([decodeURIComponent(part[0]), decodeURIComponent(part[1])]);
        }
        return result;
    }

     // XMLHttpRequest Level 2 file uploads (big hat tip to francois2metz)
    function fileUploadXhr(a) {
        var formdata = new FormData();

        for (var i=0; i < a.length; i++) {
            formdata.append(a[i].name, a[i].value);
        }

        if (options.extraData) {
            var serializedData = deepSerialize(options.extraData);
            for (i=0; i < serializedData.length; i++)
                if (serializedData[i])
                    formdata.append(serializedData[i][0], serializedData[i][1]);
        }

        options.data = null;

        var s = $.extend(true, {}, $.ajaxSettings, options, {
            contentType: false,
            processData: false,
            cache: false,
            type: method || 'POST'
        });

        if (options.uploadProgress) {
            // workaround because jqXHR does not expose upload property
            s.xhr = function() {
                var xhr = $.ajaxSettings.xhr();
                if (xhr.upload) {
                    xhr.upload.addEventListener('progress', function(event) {
                        var percent = 0;
                        var position = event.loaded || event.position; /*event.position is deprecated*/
                        var total = event.total;
                        if (event.lengthComputable) {
                            percent = Math.ceil(position / total * 100);
                        }
                        options.uploadProgress(event, position, total, percent);
                    }, false);
                }
                return xhr;
            };
        }

        s.data = null;
            var beforeSend = s.beforeSend;
            s.beforeSend = function(xhr, o) {
                o.data = formdata;
                if(beforeSend)
                    beforeSend.call(this, xhr, o);
        };
        return $.ajax(s);
    }

    // private function for handling file uploads (hat tip to YAHOO!)
    function fileUploadIframe(a) {
        var form = $form[0], el, i, s, g, id, $io, io, xhr, sub, n, timedOut, timeoutHandle;
        var deferred = $.Deferred();

        if (a) {
            // ensure that every serialized input is still enabled
            for (i=0; i < elements.length; i++) {
                el = $(elements[i]);
                if ( hasProp )
                    el.prop('disabled', false);
                else
                    el.removeAttr('disabled');
            }
        }

        s = $.extend(true, {}, $.ajaxSettings, options);
        s.context = s.context || s;
        id = 'jqFormIO' + (new Date().getTime());
        if (s.iframeTarget) {
            $io = $(s.iframeTarget);
            n = $io.attr2('name');
            if (!n)
                 $io.attr2('name', id);
            else
                id = n;
        }
        else {
            $io = $('<iframe name="' + id + '" src="'+ s.iframeSrc +'" />');
            $io.css({ position: 'absolute', top: '-1000px', left: '-1000px' });
        }
        io = $io[0];


        xhr = { // mock object
            aborted: 0,
            responseText: null,
            responseXML: null,
            status: 0,
            statusText: 'n/a',
            getAllResponseHeaders: function() {},
            getResponseHeader: function() {},
            setRequestHeader: function() {},
            abort: function(status) {
                var e = (status === 'timeout' ? 'timeout' : 'aborted');
                log('aborting upload... ' + e);
                this.aborted = 1;

                try { // #214, #257
                    if (io.contentWindow.document.execCommand) {
                        io.contentWindow.document.execCommand('Stop');
                    }
                }
                catch(ignore) {}

                $io.attr('src', s.iframeSrc); // abort op in progress
                xhr.error = e;
                if (s.error)
                    s.error.call(s.context, xhr, e, status);
                if (g)
                    $.event.trigger("ajaxError", [xhr, s, e]);
                if (s.complete)
                    s.complete.call(s.context, xhr, e);
            }
        };

        g = s.global;
        // trigger ajax global events so that activity/block indicators work like normal
        if (g && 0 === $.active++) {
            $.event.trigger("ajaxStart");
        }
        if (g) {
            $.event.trigger("ajaxSend", [xhr, s]);
        }

        if (s.beforeSend && s.beforeSend.call(s.context, xhr, s) === false) {
            if (s.global) {
                $.active--;
            }
            deferred.reject();
            return deferred;
        }
        if (xhr.aborted) {
            deferred.reject();
            return deferred;
        }

        // add submitting element to data if we know it
        sub = form.clk;
        if (sub) {
            n = sub.name;
            if (n && !sub.disabled) {
                s.extraData = s.extraData || {};
                s.extraData[n] = sub.value;
                if (sub.type == "image") {
                    s.extraData[n+'.x'] = form.clk_x;
                    s.extraData[n+'.y'] = form.clk_y;
                }
            }
        }

        var CLIENT_TIMEOUT_ABORT = 1;
        var SERVER_ABORT = 2;
                
        function getDoc(frame) {
            /* it looks like contentWindow or contentDocument do not
             * carry the protocol property in ie8, when running under ssl
             * frame.document is the only valid response document, since
             * the protocol is know but not on the other two objects. strange?
             * "Same origin policy" http://en.wikipedia.org/wiki/Same_origin_policy
             */
            
            var doc = null;
            
            // IE8 cascading access check
            try {
                if (frame.contentWindow) {
                    doc = frame.contentWindow.document;
                }
            } catch(err) {
                // IE8 access denied under ssl & missing protocol
                log('cannot get iframe.contentWindow document: ' + err);
            }

            if (doc) { // successful getting content
                return doc;
            }

            try { // simply checking may throw in ie8 under ssl or mismatched protocol
                doc = frame.contentDocument ? frame.contentDocument : frame.document;
            } catch(err) {
                // last attempt
                log('cannot get iframe.contentDocument: ' + err);
                doc = frame.document;
            }
            return doc;
        }

        // Rails CSRF hack (thanks to Yvan Barthelemy)
        var csrf_token = $('meta[name=csrf-token]').attr('content');
        var csrf_param = $('meta[name=csrf-param]').attr('content');
        if (csrf_param && csrf_token) {
            s.extraData = s.extraData || {};
            s.extraData[csrf_param] = csrf_token;
        }

        // take a breath so that pending repaints get some cpu time before the upload starts
        function doSubmit() {
            // make sure form attrs are set
            var t = $form.attr2('target'), a = $form.attr2('action');

            // update form attrs in IE friendly way
            form.setAttribute('target',id);
            if (!method) {
                form.setAttribute('method', 'POST');
            }
            if (a != s.url) {
                form.setAttribute('action', s.url);
            }

            // ie borks in some cases when setting encoding
            if (! s.skipEncodingOverride && (!method || /post/i.test(method))) {
                $form.attr({
                    encoding: 'multipart/form-data',
                    enctype:  'multipart/form-data'
                });
            }

            // support timout
            if (s.timeout) {
                timeoutHandle = setTimeout(function() { timedOut = true; cb(CLIENT_TIMEOUT_ABORT); }, s.timeout);
            }

            // look for server aborts
            function checkState() {
                try {
                    var state = getDoc(io).readyState;
                    log('state = ' + state);
                    if (state && state.toLowerCase() == 'uninitialized')
                        setTimeout(checkState,50);
                }
                catch(e) {
                    log('Server abort: ' , e, ' (', e.name, ')');
                    cb(SERVER_ABORT);
                    if (timeoutHandle)
                        clearTimeout(timeoutHandle);
                    timeoutHandle = undefined;
                }
            }

            // add "extra" data to form if provided in options
            var extraInputs = [];
            try {
                if (s.extraData) {
                    for (var n in s.extraData) {
                        if (s.extraData.hasOwnProperty(n)) {
                           // if using the $.param format that allows for multiple values with the same name
                           if($.isPlainObject(s.extraData[n]) && s.extraData[n].hasOwnProperty('name') && s.extraData[n].hasOwnProperty('value')) {
                               extraInputs.push(
                               $('<input type="hidden" name="'+s.extraData[n].name+'">').val(s.extraData[n].value)
                                   .appendTo(form)[0]);
                           } else {
                               extraInputs.push(
                               $('<input type="hidden" name="'+n+'">').val(s.extraData[n])
                                   .appendTo(form)[0]);
                           }
                        }
                    }
                }

                if (!s.iframeTarget) {
                    // add iframe to doc and submit the form
                    $io.appendTo('body');
                    if (io.attachEvent)
                        io.attachEvent('onload', cb);
                    else
                        io.addEventListener('load', cb, false);
                }
                setTimeout(checkState,15);

                try {
                    form.submit();
                } catch(err) {
                    // just in case form has element with name/id of 'submit'
                    var submitFn = document.createElement('form').submit;
                    submitFn.apply(form);
                }
            }
            finally {
                // reset attrs and remove "extra" input elements
                form.setAttribute('action',a);
                if(t) {
                    form.setAttribute('target', t);
                } else {
                    $form.removeAttr('target');
                }
                $(extraInputs).remove();
            }
        }

        if (s.forceSync) {
            doSubmit();
        }
        else {
            setTimeout(doSubmit, 10); // this lets dom updates render
        }

        var data, doc, domCheckCount = 50, callbackProcessed;

        function cb(e) {
            if (xhr.aborted || callbackProcessed) {
                return;
            }
            
            doc = getDoc(io);
            if(!doc) {
                log('cannot access response document');
                e = SERVER_ABORT;
            }
            if (e === CLIENT_TIMEOUT_ABORT && xhr) {
                xhr.abort('timeout');
                deferred.reject(xhr, 'timeout');
                return;
            }
            else if (e == SERVER_ABORT && xhr) {
                xhr.abort('server abort');
                deferred.reject(xhr, 'error', 'server abort');
                return;
            }

            if (!doc || doc.location.href == s.iframeSrc) {
                // response not received yet
                if (!timedOut)
                    return;
            }
            if (io.detachEvent)
                io.detachEvent('onload', cb);
            else
                io.removeEventListener('load', cb, false);

            var status = 'success', errMsg;
            try {
                if (timedOut) {
                    throw 'timeout';
                }

                var isXml = s.dataType == 'xml' || doc.XMLDocument || $.isXMLDoc(doc);
                log('isXml='+isXml);
                if (!isXml && window.opera && (doc.body === null || !doc.body.innerHTML)) {
                    if (--domCheckCount) {
                        // in some browsers (Opera) the iframe DOM is not always traversable when
                        // the onload callback fires, so we loop a bit to accommodate
                        log('requeing onLoad callback, DOM not available');
                        setTimeout(cb, 250);
                        return;
                    }
                    // let this fall through because server response could be an empty document
                    //log('Could not access iframe DOM after mutiple tries.');
                    //throw 'DOMException: not available';
                }

                //log('response detected');
                var docRoot = doc.body ? doc.body : doc.documentElement;
                xhr.responseText = docRoot ? docRoot.innerHTML : null;
                xhr.responseXML = doc.XMLDocument ? doc.XMLDocument : doc;
                if (isXml)
                    s.dataType = 'xml';
                xhr.getResponseHeader = function(header){
                    var headers = {'content-type': s.dataType};
                    return headers[header];
                };
                // support for XHR 'status' & 'statusText' emulation :
                if (docRoot) {
                    xhr.status = Number( docRoot.getAttribute('status') ) || xhr.status;
                    xhr.statusText = docRoot.getAttribute('statusText') || xhr.statusText;
                }

                var dt = (s.dataType || '').toLowerCase();
                var scr = /(json|script|text)/.test(dt);
                if (scr || s.textarea) {
                    // see if user embedded response in textarea
                    var ta = doc.getElementsByTagName('textarea')[0];
                    if (ta) {
                        xhr.responseText = ta.value;
                        // support for XHR 'status' & 'statusText' emulation :
                        xhr.status = Number( ta.getAttribute('status') ) || xhr.status;
                        xhr.statusText = ta.getAttribute('statusText') || xhr.statusText;
                    }
                    else if (scr) {
                        // account for browsers injecting pre around json response
                        var pre = doc.getElementsByTagName('pre')[0];
                        var b = doc.getElementsByTagName('body')[0];
                        if (pre) {
                            xhr.responseText = pre.textContent ? pre.textContent : pre.innerText;
                        }
                        else if (b) {
                            xhr.responseText = b.textContent ? b.textContent : b.innerText;
                        }
                    }
                }
                else if (dt == 'xml' && !xhr.responseXML && xhr.responseText) {
                    xhr.responseXML = toXml(xhr.responseText);
                }

                try {
                    data = httpData(xhr, dt, s);
                }
                catch (err) {
                    status = 'parsererror';
                    xhr.error = errMsg = (err || status);
                }
            }
            catch (err) {
                log('error caught: ',err);
                status = 'error';
                xhr.error = errMsg = (err || status);
            }

            if (xhr.aborted) {
                log('upload aborted');
                status = null;
            }

            if (xhr.status) { // we've set xhr.status
                status = (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) ? 'success' : 'error';
            }

            // ordering of these callbacks/triggers is odd, but that's how $.ajax does it
            if (status === 'success') {
                if (s.success)
                    s.success.call(s.context, data, 'success', xhr);
                deferred.resolve(xhr.responseText, 'success', xhr);
                if (g)
                    $.event.trigger("ajaxSuccess", [xhr, s]);
            }
            else if (status) {
                if (errMsg === undefined)
                    errMsg = xhr.statusText;
                if (s.error)
                    s.error.call(s.context, xhr, status, errMsg);
                deferred.reject(xhr, 'error', errMsg);
                if (g)
                    $.event.trigger("ajaxError", [xhr, s, errMsg]);
            }

            if (g)
                $.event.trigger("ajaxComplete", [xhr, s]);

            if (g && ! --$.active) {
                $.event.trigger("ajaxStop");
            }

            if (s.complete)
                s.complete.call(s.context, xhr, status);

            callbackProcessed = true;
            if (s.timeout)
                clearTimeout(timeoutHandle);

            // clean up
            setTimeout(function() {
                if (!s.iframeTarget)
                    $io.remove();
                xhr.responseXML = null;
            }, 100);
        }

        var toXml = $.parseXML || function(s, doc) { // use parseXML if available (jQuery 1.5+)
            if (window.ActiveXObject) {
                doc = new ActiveXObject('Microsoft.XMLDOM');
                doc.async = 'false';
                doc.loadXML(s);
            }
            else {
                doc = (new DOMParser()).parseFromString(s, 'text/xml');
            }
            return (doc && doc.documentElement && doc.documentElement.nodeName != 'parsererror') ? doc : null;
        };
        var parseJSON = $.parseJSON || function(s) {
            /*jslint evil:true */
            return window['eval']('(' + s + ')');
        };

        var httpData = function( xhr, type, s ) { // mostly lifted from jq1.4.4

            var ct = xhr.getResponseHeader('content-type') || '',
                xml = type === 'xml' || !type && ct.indexOf('xml') >= 0,
                data = xml ? xhr.responseXML : xhr.responseText;

            if (xml && data.documentElement.nodeName === 'parsererror') {
                if ($.error)
                    $.error('parsererror');
            }
            if (s && s.dataFilter) {
                data = s.dataFilter(data, type);
            }
            if (typeof data === 'string') {
                if (type === 'json' || !type && ct.indexOf('json') >= 0) {
                    data = parseJSON(data);
                } else if (type === "script" || !type && ct.indexOf("javascript") >= 0) {
                    $.globalEval(data);
                }
            }
            return data;
        };

        return deferred;
    }
};

/**
 * ajaxForm() provides a mechanism for fully automating form submission.
 *
 * The advantages of using this method instead of ajaxSubmit() are:
 *
 * 1: This method will include coordinates for <input type="image" /> elements (if the element
 *    is used to submit the form).
 * 2. This method will include the submit element's name/value data (for the element that was
 *    used to submit the form).
 * 3. This method binds the submit() method to the form for you.
 *
 * The options argument for ajaxForm works exactly as it does for ajaxSubmit.  ajaxForm merely
 * passes the options argument along after properly binding events for submit elements and
 * the form itself.
 */
$.fn.ajaxForm = function(options) {
    options = options || {};
    options.delegation = options.delegation && $.isFunction($.fn.on);

    // in jQuery 1.3+ we can fix mistakes with the ready state
    if (!options.delegation && this.length === 0) {
        var o = { s: this.selector, c: this.context };
        if (!$.isReady && o.s) {
            log('DOM not ready, queuing ajaxForm');
            $(function() {
                $(o.s,o.c).ajaxForm(options);
            });
            return this;
        }
        // is your DOM ready?  http://docs.jquery.com/Tutorials:Introducing_$(document).ready()
        log('terminating; zero elements found by selector' + ($.isReady ? '' : ' (DOM not ready)'));
        return this;
    }

    if ( options.delegation ) {
        $(document)
            .off('submit.form-plugin', this.selector, doAjaxSubmit)
            .off('click.form-plugin', this.selector, captureSubmittingElement)
            .on('submit.form-plugin', this.selector, options, doAjaxSubmit)
            .on('click.form-plugin', this.selector, options, captureSubmittingElement);
        return this;
    }

    return this.ajaxFormUnbind()
        .bind('submit.form-plugin', options, doAjaxSubmit)
        .bind('click.form-plugin', options, captureSubmittingElement);
};

// private event handlers
function doAjaxSubmit(e) {
    /*jshint validthis:true */
    var options = e.data;
    if (!e.isDefaultPrevented()) { // if event has been canceled, don't proceed
        e.preventDefault();
        $(this).ajaxSubmit(options);
    }
}

function captureSubmittingElement(e) {
    /*jshint validthis:true */
    var target = e.target;
    var $el = $(target);
    if (!($el.is("[type=submit],[type=image]"))) {
        // is this a child element of the submit el?  (ex: a span within a button)
        var t = $el.closest('[type=submit]');
        if (t.length === 0) {
            return;
        }
        target = t[0];
    }
    var form = this;
    form.clk = target;
    if (target.type == 'image') {
        if (e.offsetX !== undefined) {
            form.clk_x = e.offsetX;
            form.clk_y = e.offsetY;
        } else if (typeof $.fn.offset == 'function') {
            var offset = $el.offset();
            form.clk_x = e.pageX - offset.left;
            form.clk_y = e.pageY - offset.top;
        } else {
            form.clk_x = e.pageX - target.offsetLeft;
            form.clk_y = e.pageY - target.offsetTop;
        }
    }
    // clear form vars
    setTimeout(function() { form.clk = form.clk_x = form.clk_y = null; }, 100);
}


// ajaxFormUnbind unbinds the event handlers that were bound by ajaxForm
$.fn.ajaxFormUnbind = function() {
    return this.unbind('submit.form-plugin click.form-plugin');
};

/**
 * formToArray() gathers form element data into an array of objects that can
 * be passed to any of the following ajax functions: $.get, $.post, or load.
 * Each object in the array has both a 'name' and 'value' property.  An example of
 * an array for a simple login form might be:
 *
 * [ { name: 'username', value: 'jresig' }, { name: 'password', value: 'secret' } ]
 *
 * It is this array that is passed to pre-submit callback functions provided to the
 * ajaxSubmit() and ajaxForm() methods.
 */
$.fn.formToArray = function(semantic, elements) {
    var a = [];
    if (this.length === 0) {
        return a;
    }

    var form = this[0];
    var els = semantic ? form.getElementsByTagName('*') : form.elements;
    if (!els) {
        return a;
    }

    var i,j,n,v,el,max,jmax;
    for(i=0, max=els.length; i < max; i++) {
        el = els[i];
        n = el.name;
        if (!n || el.disabled) {
            continue;
        }

        if (semantic && form.clk && el.type == "image") {
            // handle image inputs on the fly when semantic == true
            if(form.clk == el) {
                a.push({name: n, value: $(el).val(), type: el.type });
                a.push({name: n+'.x', value: form.clk_x}, {name: n+'.y', value: form.clk_y});
            }
            continue;
        }

        v = $.fieldValue(el, true);
        if (v && v.constructor == Array) {
            if (elements)
                elements.push(el);
            for(j=0, jmax=v.length; j < jmax; j++) {
                a.push({name: n, value: v[j]});
            }
        }
        else if (feature.fileapi && el.type == 'file') {
            if (elements)
                elements.push(el);
            var files = el.files;
            if (files.length) {
                for (j=0; j < files.length; j++) {
                    a.push({name: n, value: files[j], type: el.type});
                }
            }
            else {
                // #180
                a.push({ name: n, value: '', type: el.type });
            }
        }
        else if (v !== null && typeof v != 'undefined') {
            if (elements)
                elements.push(el);
            a.push({name: n, value: v, type: el.type, required: el.required});
        }
    }

    if (!semantic && form.clk) {
        // input type=='image' are not found in elements array! handle it here
        var $input = $(form.clk), input = $input[0];
        n = input.name;
        if (n && !input.disabled && input.type == 'image') {
            a.push({name: n, value: $input.val()});
            a.push({name: n+'.x', value: form.clk_x}, {name: n+'.y', value: form.clk_y});
        }
    }
    return a;
};

/**
 * Serializes form data into a 'submittable' string. This method will return a string
 * in the format: name1=value1&amp;name2=value2
 */
$.fn.formSerialize = function(semantic) {
    //hand off to jQuery.param for proper encoding
    return $.param(this.formToArray(semantic));
};

/**
 * Serializes all field elements in the jQuery object into a query string.
 * This method will return a string in the format: name1=value1&amp;name2=value2
 */
$.fn.fieldSerialize = function(successful) {
    var a = [];
    this.each(function() {
        var n = this.name;
        if (!n) {
            return;
        }
        var v = $.fieldValue(this, successful);
        if (v && v.constructor == Array) {
            for (var i=0,max=v.length; i < max; i++) {
                a.push({name: n, value: v[i]});
            }
        }
        else if (v !== null && typeof v != 'undefined') {
            a.push({name: this.name, value: v});
        }
    });
    //hand off to jQuery.param for proper encoding
    return $.param(a);
};

/**
 * Returns the value(s) of the element in the matched set.  For example, consider the following form:
 *
 *  <form><fieldset>
 *      <input name="A" type="text" />
 *      <input name="A" type="text" />
 *      <input name="B" type="checkbox" value="B1" />
 *      <input name="B" type="checkbox" value="B2"/>
 *      <input name="C" type="radio" value="C1" />
 *      <input name="C" type="radio" value="C2" />
 *  </fieldset></form>
 *
 *  var v = $('input[type=text]').fieldValue();
 *  // if no values are entered into the text inputs
 *  v == ['','']
 *  // if values entered into the text inputs are 'foo' and 'bar'
 *  v == ['foo','bar']
 *
 *  var v = $('input[type=checkbox]').fieldValue();
 *  // if neither checkbox is checked
 *  v === undefined
 *  // if both checkboxes are checked
 *  v == ['B1', 'B2']
 *
 *  var v = $('input[type=radio]').fieldValue();
 *  // if neither radio is checked
 *  v === undefined
 *  // if first radio is checked
 *  v == ['C1']
 *
 * The successful argument controls whether or not the field element must be 'successful'
 * (per http://www.w3.org/TR/html4/interact/forms.html#successful-controls).
 * The default value of the successful argument is true.  If this value is false the value(s)
 * for each element is returned.
 *
 * Note: This method *always* returns an array.  If no valid value can be determined the
 *    array will be empty, otherwise it will contain one or more values.
 */
$.fn.fieldValue = function(successful) {
    for (var val=[], i=0, max=this.length; i < max; i++) {
        var el = this[i];
        var v = $.fieldValue(el, successful);
        if (v === null || typeof v == 'undefined' || (v.constructor == Array && !v.length)) {
            continue;
        }
        if (v.constructor == Array)
            $.merge(val, v);
        else
            val.push(v);
    }
    return val;
};

/**
 * Returns the value of the field element.
 */
$.fieldValue = function(el, successful) {
    var n = el.name, t = el.type, tag = el.tagName.toLowerCase();
    if (successful === undefined) {
        successful = true;
    }

    if (successful && (!n || el.disabled || t == 'reset' || t == 'button' ||
        (t == 'checkbox' || t == 'radio') && !el.checked ||
        (t == 'submit' || t == 'image') && el.form && el.form.clk != el ||
        tag == 'select' && el.selectedIndex == -1)) {
            return null;
    }

    if (tag == 'select') {
        var index = el.selectedIndex;
        if (index < 0) {
            return null;
        }
        var a = [], ops = el.options;
        var one = (t == 'select-one');
        var max = (one ? index+1 : ops.length);
        for(var i=(one ? index : 0); i < max; i++) {
            var op = ops[i];
            if (op.selected) {
                var v = op.value;
                if (!v) { // extra pain for IE...
                    v = (op.attributes && op.attributes['value'] && !(op.attributes['value'].specified)) ? op.text : op.value;
                }
                if (one) {
                    return v;
                }
                a.push(v);
            }
        }
        return a;
    }
    return $(el).val();
};

/**
 * Clears the form data.  Takes the following actions on the form's input fields:
 *  - input text fields will have their 'value' property set to the empty string
 *  - select elements will have their 'selectedIndex' property set to -1
 *  - checkbox and radio inputs will have their 'checked' property set to false
 *  - inputs of type submit, button, reset, and hidden will *not* be effected
 *  - button elements will *not* be effected
 */
$.fn.clearForm = function(includeHidden) {
    return this.each(function() {
        $('input,select,textarea', this).clearFields(includeHidden);
    });
};

/**
 * Clears the selected form elements.
 */
$.fn.clearFields = $.fn.clearInputs = function(includeHidden) {
    var re = /^(?:color|date|datetime|email|month|number|password|range|search|tel|text|time|url|week)$/i; // 'hidden' is not in this list
    return this.each(function() {
        var t = this.type, tag = this.tagName.toLowerCase();
        if (re.test(t) || tag == 'textarea') {
            this.value = '';
        }
        else if (t == 'checkbox' || t == 'radio') {
            this.checked = false;
        }
        else if (tag == 'select') {
            this.selectedIndex = -1;
        }
		else if (t == "file") {
			if (/MSIE/.test(navigator.userAgent)) {
				$(this).replaceWith($(this).clone(true));
			} else {
				$(this).val('');
			}
		}
        else if (includeHidden) {
            // includeHidden can be the value true, or it can be a selector string
            // indicating a special test; for example:
            //  $('#myForm').clearForm('.special:hidden')
            // the above would clean hidden inputs that have the class of 'special'
            if ( (includeHidden === true && /hidden/.test(t)) ||
                 (typeof includeHidden == 'string' && $(this).is(includeHidden)) )
                this.value = '';
        }
    });
};

/**
 * Resets the form data.  Causes all form elements to be reset to their original value.
 */
$.fn.resetForm = function() {
    return this.each(function() {
        // guard against an input with the name of 'reset'
        // note that IE reports the reset function as an 'object'
        if (typeof this.reset == 'function' || (typeof this.reset == 'object' && !this.reset.nodeType)) {
            this.reset();
        }
    });
};

/**
 * Enables or disables any matching elements.
 */
$.fn.enable = function(b) {
    if (b === undefined) {
        b = true;
    }
    return this.each(function() {
        this.disabled = !b;
    });
};

/**
 * Checks/unchecks any matching checkboxes or radio buttons and
 * selects/deselects and matching option elements.
 */
$.fn.selected = function(select) {
    if (select === undefined) {
        select = true;
    }
    return this.each(function() {
        var t = this.type;
        if (t == 'checkbox' || t == 'radio') {
            this.checked = select;
        }
        else if (this.tagName.toLowerCase() == 'option') {
            var $sel = $(this).parent('select');
            if (select && $sel[0] && $sel[0].type == 'select-one') {
                // deselect all other options
                $sel.find('option').selected(false);
            }
            this.selected = select;
        }
    });
};

// expose debug var
$.fn.ajaxSubmit.debug = false;

// helper fn for console logging
function log() {
    if (!$.fn.ajaxSubmit.debug)
        return;
    var msg = '[jquery.form] ' + Array.prototype.join.call(arguments,'');
    if (window.console && window.console.log) {
        window.console.log(msg);
    }
    else if (window.opera && window.opera.postError) {
        window.opera.postError(msg);
    }
}

})(jQuery);
;
$(document).ready(function() {
    // status messages
    $('.messages').append('<a href="#name" class="btn-close" title="Sluiten"></a>');
    $('.messages .btn-close').click(function() {
        $(this).parent('div').fadeOut();
    });
    
    $('#navigation li').not('.active').hover(
        function() {
            $(this).addClass('hover');
        },
        function() {
            $(this).removeClass('hover');
        }
    );
    
    $('.primary-links li a').hover(
        function() {
            if(! $(this).hasClass('selekt')) {
                toggleSeperator(this);
            }
            $(this).addClass('hilite');
        },
        function() {
            if(! $(this).hasClass('selekt')) {
                toggleSeperator(this);
            }
            $(this).removeClass('hilite');
        }
    );

    $('.primary-links li a.selekt').each(function() {
        toggleSeperator(this);
    });

    function toggleSeperator(container) {
        var prev = $(container).parent().prev();
        var next = $(container).parent().next();
        if (prev != undefined && !prev.prev().hasClass('selekt')) {
            $(prev)
                .toggleClass('newsep')
                .toggleClass('newsept');
        }
        if (next != undefined && !next.next().hasClass('selekt')) {
            $(next)
                .toggleClass('newsep')
                .toggleClass('newsept');
        }
    }

  
    /**
     * Comment form (comment-form.tpl.php)
     * Anonymous comments
     */

    // Render h2 links useless
    $('h2.ajax-comments-processed a').removeAttr('href');
   
});

;
/*global window, document, jQuery, Drupal, tmgEvent */

function createCookie(name, value, days) {
    var date, expires;
    if (days) {
        date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    } else {
        expires = "";
    }
    document.cookie = name + "=" + value + expires + "; path=/";
}

function eraseCookie(name) {
    createCookie(name, "", -1);
}

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    var i, c;
    for (i = 0; i < ca.length; i++) {
        c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1, c.length);
        }
        if (c.indexOf(nameEQ) === 0) {
            return c.substring(nameEQ.length, c.length);
        }
    }
    return null;
}

function replaceCharacters(origString) {
    var inChar = '+';
    var outChar = ' ';
    var newString = origString.split(inChar);
    newString = newString.join(outChar);
    return newString;
}

var userstatus = false;
var tmgcookie = jQuery.parseJSON(decodeURIComponent(readCookie('TMGCOOKIE')));
if (tmgcookie) {
    userstatus = tmgcookie.user_status;
}

Drupal.comments = {};
Drupal.comments.analytics = function () {
    var role = "anonymousUser";
    if (userstatus) {
        role = "registeredUser";
        tmgEvent('deel reactie', role, window.location.href);
        if (document.getElementById('edit-facebook').checked) {
            tmgEvent('deel reactie', 'facebook', window.location.href);
        }
        if (document.getElementById('edit-twitter').checked) {
            tmgEvent('deel reactie', 'twitter', window.location.href);
        }
        if (document.getElementById('edit-google').checked) {
            tmgEvent('deel reactie', 'google', window.location.href);
        }
    }
}

// Drupal.behaviors.commentsLoginButton = function () {
//   if (userstatus) {
//     $('#comment-form .login-button').remove();
//   }
// }

Drupal.behaviors.statusMessages = function (context) {
    $('.messages').each(function (i, el) {
        if (!$(el).hasClass('hasTimeout')) {
            $(el).addClass('hasTimeout');
            setTimeout(deleteAllTimeouts, 20000);
        }
    });

    if ($('body.login-register').length > 0 && $('.messages').length > 0) {
        $('.messages').prependTo($('.form-wrapper').eq(0));
    }

}

Drupal.behaviors.faqMessages = function (context) {
    $('.faqicon').click(function (e) {
        var tPosX = e.pageX - 220;
        var tPosY = e.pageY - 70;
        $('.faqbody').css({
            top: tPosY,
            left: tPosX
        }).show();
        $('.faqbody').each(function (i, el) {
            if (!$(el).hasClass('hasTimeout')) {
                $(el).addClass('hasTimeout');
                setTimeout(deleteAllFaq, 5000);
            }
        });
    });
}

Drupal.reloadPage = function () {
    url = url.split('?')[0];
    location.href = url;
}

function deleteAllFaq() {
    $('.faqbody.hasTimeout').hide();
    $('.faqbody').removeClass('hasTimeout');
}

function deleteAllTimeouts() {
    $('.messages.hasTimeout').animate({
        height: 'toggle',
        opacity: 0
    }, 400, function () {
        $(this).remove();
    });
}

Drupal.behaviors.ajax_override = function () {

    if ($('#comment-form').length > 0) {
        $(".box").find(".content").attr('id', 'comment-form-content');

        if ($('#comment-form-content .ajax-comments-loader').length < 1) {
            $('#comment-form').before('<div class="ajax-comments-loader">Bezig met versturen van uw commentaar.</div>');
            $('.ajax-comments-loader').hide();
        }

        ajax_comments_show_progress = function (context) {
            if (!$('.ajax-comments-loader').is(":visible")) {
                $('.ajax-comments-loader').show();
            }
        }
        ajax_comments_hide_progress = function () {
            $('.ajax-comments-loader').fadeOut(speed, function () {
                ajax_comments_expand_form();
                $('.ajax-comments-loader').hide();
            });
        }

        $('a.comment_reply').on('click', function (e) {
            $('#wuzcontainer .box').html('<a href="#" id="reageerartikel" class="bluebutton">reageer op het artikel</a>')
        });

        $('.box').on('click', '#reageerartikel', function (e) {
            e.preventDefault();
            if (!$('.box #comment-form-content').length) {
                $("#comment-form-content").appendTo(".box");
                $("#comment-form-content input[name='pid']").val('');
                $("#comment-form-content").removeAttr('cid');
                $(".pressed").removeClass('pressed last-clicked');
                $("#reageerartikel").remove();
            }
        });

    }
};

// Drupal.behaviors.closeboxButton = function (context) {

//   $('#community-status a.close:not(.closebutton-behavior-processed)', context)
//     .addClass('closebutton-behavior-processed')
//     .click(function (e) {
//          e.preventDefault();
//          Drupal.tmc_login.resetLoginBox();
//       });
// }

window.gotosleep = false;

window.gogoPremium = function () {

    if (gotosleep) return;
    gotosleep = true;
    Drupal.tmc_login.premiumCheck();

    var commentSubmitButton = $('#comment-form input[type="submit"]');


    $('#edit-condition').click(function (e) {
        commentSubmitButton.toggle();
    });

    //$('#comment-form textarea').focus(function (e) {
    //    $(this).unbind('focus');
    //    $.post("/wuz/get_token", function (data) {
    //        $('#comment-form').append('<input type="hidden" name="form_token" />');
    //        $('input[name="form_token"]').val(data.token);
    //    });
    //});

    var maxchars = 500;
    $('#maxchars').html('Nog <strong>' + maxchars + '</strong> karakters');

    $('#edit-comment').keyup(function () {

        if ($(this).val().length > maxchars) {
            $(this).val($(this).val().substr(0, maxchars));
        }

        var chars = maxchars - $(this).val().length;
        $('#maxchars').html('Nog <strong>' + chars + '</strong> karakters');

        if (chars <= 0) {
            link = "/wuz/user/login"
            if (userstatus) link = "/wuz/node/add/blog";
            $('#maxchars').html('Nog <strong>' + chars + '</strong> karakters');
            $("#maxchars").append('<div class="error">Uw reactie overschrijdt het maximaal aantal karakters. <br/>Misschien wilt u uw mening wel kwijt in uw eigen blog? <a href=' + link + '>Klik hier</a></div>');
        }
    });

    if (userstatus) {

        $('#comment-form .login-button').remove();

        $('.community-subtitle').each(function () {
            var container = $(this);
            $('li.menu-parent a.slider', container).bind('click', function () {
                $(this).next('ul.menu-sub').slideToggle();
                return false;
            });
        })

        $('#navigation').show();

        $('.community-subtitle a[href="' + location.pathname + location.search + '"]').addClass('active');
        $('.community-subtitle a.active').parents('ul.menu-sub').show();
        $('.community-subtitle a.active').next('ul').show();

        if ($('#comment-form').length > 0) {
            $('#edit-name-wrapper').remove();
            $('#edit-mail-wrapper').remove();
            $('input[type="submit"]').show();
            $('#edit-condition').attr('checked', true);
            $('#login-button').remove();
        }

    } else {

        $('#navigation').remove();
        $("div.share-your-reply").remove();

        // $('#login-button').click(function(e) {
        //     e.preventDefault();
        //     Drupal.tmc_login.getLoginBox(this);
        // });
        if ($('#user-pass').length > 0) {
            $('#edit-name').removeClass('error');
        }

    }

    if (typeof (Lightbox) !== 'undefined' /*&& (document.location.pathname.match(/box\/premium/) || document.location.hostname.match(/landers/))*/ ) {
        var openingUrlLightbox = '';
        $("a[rel^='lightframe']").click(function (e) {
            openingUrlLightbox = this.href;
        });

        var old_end = Lightbox.end;
        Lightbox.end = function (caller) {
            if (openingUrlLightbox.match(/\/wuz\/esi\/node\/klacht/)) {
                url = document.location.href;
            }

            old_end(caller);

            if (document.location.href.match(/\/cc$/) && document.cookie.match(/pc_h=/)) document.cookie = 'pc_h=;path=/;domain=.telegraaf.nl';

            var to_premium = document.cookie.match(/to_premium=1/);

            if (to_premium) {
                document.cookie = 'to_premium=;path=/;domain=.telegraaf.nl';
                var loc = window.document.location;
                if (!loc.pathname.match(/^\/premium\//)) {
                    window.document.location = '//' + loc.host + '/premium' + loc.pathname;
                    return;
                }
            }
           Drupal.reloadPage();
        };
    }

};
$(document).ready(function () {
    gogoPremium();
});
$(window).load(function () {
    gogoPremium();
});;
WebFontConfig = {
  google: { families: [ 'Open+Sans:400,700:latin', 'Oswald:400,700:latin' ] }
};
(function() {
  var wf = document.createElement('script');
  wf.src = ('https:' == document.location.protocol ? 'https' : 'http') +
    '://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
  wf.type = 'text/javascript';
  wf.async = 'true';
  var s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(wf, s);
})();;
/**
 * Automatic ajax validation
 *
 * @see http://drupal.org/project/ajax
 * @see irc://freenode.net/#drupy
 * @depends Drupal 6
 * @author brendoncrawford
 * @note This file uses a 79 character width limit.
 * 
 * @note
 *   When using an Drupal.Ajax form within a Lightbox/Thickbox which is loaded via
 *   AJAX, be sure to call Drupal.attachBehaviors(LightBoxContainer) where
 *   LightBoxContainer is the DOM element containing the Lightbox/Thickbox.
 * 
 * @see http://drupal.org/node/114774#javascript-behaviors
 *
 */

/**
 * Ajax Forms plugin for thickbox
 * 
 * @param {String} hook
 * @param {Object} args
 * @return {Bool}
 */
Drupal.Ajax.plugins.thickbox = function(hook, args) {
  var tb_init_original;
  if (hook === 'scrollFind') {
    if (args.container.id === 'TB_window') {
      return false;
    }
    else {
      return true;
    }
  }
  else if (hook === 'init') {
    tb_init_original = window.tb_init;
    window.tb_init = function(domChunk){
      tb_init_original(domChunk);
      Drupal.attachBehaviors($('#TB_window'));
    }
  }
  return true;
}


;
