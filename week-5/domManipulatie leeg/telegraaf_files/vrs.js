_vrtrack=function(){},function(a,b){var c,d=a._vrq||[],e="http://t1.visualrevenue.com/",f=new Date,g=18,h=function(a,b){for(var c=d.length;c--;)if(d[c][0]==a)return"undefined"==typeof b?d[c][1]:void(d[c][1]=b);"undefined"!=typeof b&&d.push([a,b])},i={poll_interval:50,timer:null,check_dom_tag:function(a,c){if(b.getElementsByTagName&&setTimeout){var d=b.getElementsByTagName(a);d&&d.length&&d.length>0?(clearTimeout(i.timer),c()):i.timer=setTimeout(function(){i.check_dom_tag(a,c)},i.poll_interval)}}},j=function(a,c,d){d=d||"";var e,f,g,h,i,j=b.getElementsByTagName("head");if(j)for(e=0,g=j.length;g>e;e++)if(i=j[e].getElementsByTagName(a))for(f=0,h=i.length;h>f;f++)if(i[f].getAttribute(c)&&(!d||d==i[f].getAttribute(c).toLowerCase()))return i[f];return null},k=function(a){if(a.indexOf("http://")>-1)return a;var c=function(a){return a.split("&").join("&amp;").split("<").join("&lt;").split('"').join("&quot;")},d=b.createElement("div");return d.innerHTML='<a href="'+c(a)+'">x</a>',d.firstChild.href},l=function(){var a=j("meta","property","vr:canonical");if(a&&a.content)return k(a.content);var c=j("link","rel","canonical");if(c&&c.href)return k(c.href);var d=j("meta","property","og:url");return d&&d.content?k(d.content):b.location.href},m=function(){var a=h("refurl");return"undefined"==typeof a&&(a=b.referrer),n()&&(a=c),a},n=function(){if(!E)return!1;var a=j("meta","http-equiv","refresh"),b=null,d=null;return a&&a.content&&(b=decodeURIComponent(q("__vrrefresh")),d=parseInt(a.content.split(";")[0],0),d=Math.round(d/60*100)/100+.1,r("__vrrefresh",encodeURIComponent(c),d,G),b===c)?!0:!1},o=function(){var a=j("meta","http-equiv","content-type");return a?(H=a.content.split("charset=")[1],H&&(H=H.split(";")[0]),H||(H=a.content.split(";")[1],H||(H=a.content))):(a=j("meta","charset",null),a&&(H=a.getAttribute("charset"))),h("charset",H),H},p=function(){var a={"co.uk":1,"co.il":1,"co.in":1,"co.ke":1,"co.ug":1,"com.my":1,"com.au":1},c=b.location.hostname,d=c.split("."),e=null;return d.length>=2&&(e=d.slice(-2).join("."),a[e]&&(e=d.slice(-3).join("."))),e},q=function(a){var c,d=a+"=",e=b.cookie.split(";");for(c=0;c<e.length;c++){for(var f=e[c];" "==f.charAt(0);)f=f.substring(1,f.length);if(0==f.indexOf(d))return f.substring(d.length,f.length)}return null},r=function(a,c,d,e){var f;if(d){var g=new Date;g.setTime(g.getTime()+60*d*1e3),f="; expires="+g.toGMTString()}else f="";b.cookie=a+"="+c+f+"; path=/; domain=."+e},s=function(){var a,b,c,d="0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");for(a=(new Date).getTime().toString(),c=0;32>c;c++)b=Math.floor(62*Math.random()),a+=d[b];return a},t=function(a){return a&&a.tagName&&"a"===a.tagName.toLowerCase()},u=function(a){for(var b=4,c=null;a&&b--;){if(t(a)){c=a;break}a=a.parentNode}return c},v=function(a,b){if(!b||null==a)return-1;var c,d,e=-1;for(c=0,d=a.length;d>c;c++)if(a[c].href===b.href&&(e+=1),a[c]===b)return e;return-1},w=function(a){for(var b,c=25,d=a;d&&c--&&d.getAttribute;){if(d.getAttribute("data-vr-zone")){b=d.getAttribute("data-vr-zone"),r("__vrz",encodeURIComponent(b),.4,G);break}d=d.parentNode}return b},x=function(a,c,d){var e=function(a){a=a||event,d.apply(b,[a,a.target||a.srcElement])};b.addEventListener?a.addEventListener(c,e,!1):b.attachEvent&&a.attachEvent("on"+c,e)},y=function(a){var b=new Image(1,1);b.src=a},z=function(a,c){c.id&&A(c.id);var d=b.createElement("script"),e=b.getElementsByTagName("script")[0];if(d.src=a,c.id&&(d.id=c.id),c.async&&(d.async=!0),c.onload){var f=!1;d.onload=d.onreadystatechange=function(){f||this.readyState&&"loaded"!==this.readyState&&"complete"!==this.readyState||(f=!0,c.onload(),d.onload=d.onreadystatechange=null,d.parentNode&&d.parentNode.removeChild(d))}}e.parentNode.insertBefore(d,e)},A=function(a){var c=b.getElementById(a);if(c){c.parentNode.removeChild(c);try{for(var d in c)delete c[d]}catch(e){}}},B=function(a){if(!a)return a;var b,c=[];for(b=0;b<a.length;b++)c.push(a.charCodeAt(b)<128?a.charAt(b):encodeURIComponent(a.charAt(b)));return encodeURIComponent(c.join(""))},C=function(a){return h("track_url",a.track_url),query="?idsite="+a.np,query+="&url="+a.track_url,query+="&seen_url="+a.seen_url,query+="&t="+a.title,query+="&c="+a.cookie,query+="&r="+a.timestamp,query+="&ypos="+a.ypos,query+="&debug="+a.debug,query+="&zone="+a.parentZone,a.ref_url&&(query+="&refurl="+a.ref_url),a.ref_np&&(query+="&refnp="+a.ref_np),a.norm_ref_url&&(query+="&norm_refurl="+a.norm_ref_url),a.conversion_id&&(query+="&cv_id="+a.conversion_id),a.content_type&&(query+="&content_type="+a.content_type),a.no_cookies&&(query+="&no_cookies=true"),a.manual_ping&&(query+="&man=true"),a.mx&&(query+="&mx="+a.mx,query+="&my="+a.my,query+="&sw="+a.sw),query+="&v="+g},D=h("id"),E=!h("no_cookies"),F=q("__vrf"),G=p(),H=null,I=function(a){a=a||{};var d=encodeURIComponent(b.title),g=a.conversion_id,h=q("__vry")||-1,i=q("__vrz")||-1;D=a.track_id||D;var j=q("__vrid");c=a.track_url||c;var k=a.ref_url,l=null;a.manual_ping?l=k:(l=q("__vru"),l&&(l=decodeURIComponent(l)));var m=q("__vrl");m=m?decodeURIComponent(m):a.seen_url||c;var n=q("__vrm"),o={};n&&(n=n.split("_"),o.x=n[0],o.y=n[1],o.screen_width=n[2]);var p=(new Date).getTime(),r=new Date-f,s=C({track_url:B(c),seen_url:B(m),ref_url:B(k),norm_ref_url:B(l),np:D,ref_np:j,title:d,cookie:F,debug:"loadTime."+r,timestamp:p,ypos:h,parentZone:B(i),conversion_id:g,content_type:H,mx:o.x,my:o.y,sw:o.screen_width,no_cookies:!E,manual_ping:a.manual_ping});y(e+s),a.automate},J=function(a){a=a||{};var b=a.refurl?a.refurl:c;I({automate:!!a.automate,conversion_id:a.conversion_id,manual_ping:!0,ref_url:b,track_id:a.track_id,track_url:a.track_url})},K=function(){if(!h("no_cookies")){var a=null,d=b.getElementsByTagName("a");x(b,"mousedown",function(e,f){var g=u(f);if(g){var h=v(d,g);w(g),r("__vrl",encodeURIComponent(g.href),.4,G),r("__vry",h,.4,G),r("__vru",encodeURIComponent(c),.4,G),q("__vrrefresh")&&r("__vrrefresh",-1,.001,G),r("__vrid",D,.4,G),a=f}else r("__vrl",-1,.001,G),r("__vry",-1,.001,G),r("__vrz",-1,.001,G);var i,j,k;e.pageX||e.pageY?(i=e.pageX,j=e.pageY):(e.clientX||e.clientY)&&(i=e.clientX+b.body.scrollLeft+b.documentElement.scrollLeft,j=e.clientY+b.body.scrollTop+b.documentElement.scrollTop),i&&(k=b.documentElement.clientWidth?b.documentElement.clientWidth:b.body.clientWidth,r("__vrm",i+"_"+j+"_"+k,.4,G))}),x(b,"mouseup",function(b,c){a&&c!==a&&(r("__vrl",-1,.001,G),r("__vry",-1,.001,G),r("__vrm",-1,.001,G),r("__vrz",-1,.001,G)),a=null})}};a._vrtrack=J,E&&!F&&(F=s(),r("__vrf",F,30,G)),i.check_dom_tag("body",function(){c=l(),H=o(),I({ref_url:m(),seen_url:b.location.href})}),K();var L,d,x,h,j,k,l,q,z,A,M="http://p.visualrevenue.com/",N=50,O=50,P=function(){if(L&&console&&console.log){var a=Array.prototype.slice.apply(arguments),b=new Date,c="VR_S ";c+=(b.getMinutes()>9?b.getMinutes():"0"+b.getMinutes())+":",c+=(b.getSeconds()>9?b.getSeconds():"0"+b.getSeconds())+".",c+=b.getMilliseconds()>9?b.getMilliseconds()>99?b.getMilliseconds():"0"+b.getMilliseconds():"00"+b.getMilliseconds(),a.unshift(c),console.log(a.join(" "))}},Q=function(){var a={};if(b.querySelectorAll){for(var c=b.querySelectorAll("*[data-vr-zone]"),d=0,e=c.length;e>d;d++){var f=c[d].getAttribute("data-vr-zone");a[f]?a[f].push(c[d]):a[f]=[c[d]]}return a}for(var g=b.all,d=0,e=g.length;e>d;d++){var h=g[d].getAttribute("data-vr-zone");h&&(a[h]?a[h].push(g[d]):a[h]=[g[d]])}return a},R=function(a,b,c){var d;return function(){var e=this,f=arguments,g=function(){c||a.apply(e,f),d=null};d?clearTimeout(d):c&&a.apply(e,f),d=setTimeout(g,b||100)}},S=function(a){return a.replace(/\s/g,"")},T=function(){function a(a){return a&&"string"==typeof a&&(a=escape(a).replace(/%26/g,"&").replace(/%23/g,"#").replace(/%3B/g,";"),c.innerHTML=a,c.innerText?(a=c.innerText,c.innerText=""):(a=c.textContent,c.textContent="")),unescape(a)}var c=b.createElement("div");return a}(),U=function(a,b){if(!a)return 0;var c,d=0,e="0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",f=a.substr(-b,b),g=f.length;for(c=0;g>c;c++)d=d+e.indexOf(f.charAt(c))+1;return d%b},V=function(a){var b=h("charset"),c="?transport="+a;return c+="&idsite="+h("id"),c+="&url="+(h("track_url")||l()),c+=b?"&content_type="+b:""},W=function(a){var b=M+V("jsonp"),c="callbackFn";b+="&callback=_vrq.jsonp."+c,d.jsonp={},d.jsonp[c]=a,z(b,{async:!0,id:"vr-script-002"})},X=function(a){P("Doing "+a.length+" headline test(s)");for(var b=U(q("__vrf"),2),c=Q(),d=0,e=a.length;e>d;d++)Y(a[d],c,b)},Y=function(a,b,c){var d="ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");if(P("Cookie Split: "+d[c]),b[a.config.data_vr_zone]){var e=a.content.new_titles[c],f=a.content.current_title,g=a.content.new_images[c],h=a.content.current_image,i=[];a.config.winner&&(e=a.config.winner.title,g=a.config.winner.image,P("A winner was sent, so use that instead"));for(var j=0,k=b[a.config.data_vr_zone].length;k>j&&(i.push($(h,g,b[a.config.data_vr_zone][j],!1)),i.push(Z(f,e,b[a.config.data_vr_zone][j],!1)),!i[0]&&!i[1]);j++);}else var l=20,m=setInterval(function(){if(b=Q(),b[a.config.data_vr_zone])Y(a,b,c);else{if(l>0)return l--,void P("Tries left to find zone: "+l);P('data-vr-zone "'+a.config.data_vr_zone+'" was not found on the page')}clearInterval(m)},100)},Z=function(a,c,d,e){if(!c||a==c)return P("Goal title is current title, do nothing"),!1;P("Searching for headline: "+a);for(var f,g=d.getElementsByTagName("a"),h=!1,i=S(T(a)).toLowerCase(),j=0,k=g.length;k>j;j++)f=g[j].innerHTML,f.length>=a.length&&(f=S(T(f)).toLowerCase(),f==i&&(h=!0,g[j].innerHTML=c,P("Headline found and replaced (anchor value)")));if(!h){if(b.getElementsByTagName){var l;for(j=0;k>j;j++){l=g[j].getElementsByTagName("*");for(var m=-1,n=l.length;++m<n;)child_html=l[m].innerHTML,child_html.length>=a.length/2&&(child_html=S(T(child_html)).toLowerCase(),child_html==i&&(h=!0,l[m].innerHTML=c,P("Headline found and replaced (child value)")))}}h||e||(P("Headline not found"),O>0?(setTimeout(function(){Z(a,c,d,!1),P("Tries left to find headline: "+O)},100),O--):P("Headline not found in zone"))}return h&&!e&&_(Z,a,c,d),h},$=function(a,b,c,d){if(!b||a==b)return P("Goal image is current image, do nothing"),!1;P("Searching for image: "+a);for(var e,f=c.getElementsByTagName("img"),g=!1,h=0,i=f.length;i>h;h++)e=f[h].src,(e==a||e==decodeURI(a))&&(g=!0,f[h].src=decodeURI(b),P("Image found and replaced"));return g||d||(P("Image not found"),N>0?(setTimeout(function(){$(a,b,c,!1),P("Tries left to find image: "+N)},100),N--):P("Image not found in zone")),g&&!d&&_($,a,b,c),g},_=function(a,b,c,d){var e=R(function(d){setTimeout(function(){a.call(a,b,c,d.relatedNode,!0)},1)},50,!0);x(d,"DOMNodeInserted",e)},ab=function(b,c){if(b.config.manip_test&&"#vr-test-modules"!=a.location.hash)return!1;if(c[b.config.container_zone])c[b.config.container_zone][0].innerHTML=b.served_html,P("Container zone found, loading module");else var d=30,e=setInterval(function(){var a=Q();if(a[b.config.container_zone])a[b.config.container_zone][0].innerHTML=b.served_html,P("Container zone found, loading module");else{if(d>0)return d--,void P("Tries left to find zone: "+d);P('data-vr-zone "'+b.config.container_zone+'" was not found on the page')}clearInterval(e)},100)},bb=function(a){P("Doing "+a.length+" module(s)");for(var b=Q(),c=0,d=a.length;d>c;c++)ab(a[c],b)},cb=function(){return navigator.userAgent.indexOf("VR FrontPage Fetcher")>-1},db=function(a){for(var b=[],c=[],d=0;d<a.length;d++)"content_test"==a[d].type?b.push(a[d]):"automation_module"==a[d].type&&c.push(a[d]);bb(c),X(b)},eb=function(){L=q("vr_js_log");var a=h("serving_tasks");a?(P("Inline serving tasks"),db(a)):(P("Get serving tasks (jsonp)"),W(db))};h("automate")&&!cb()&&eb()}(window,document);