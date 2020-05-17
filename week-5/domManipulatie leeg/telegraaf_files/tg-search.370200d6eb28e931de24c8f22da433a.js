var $tg = (function() {
    /*  Make the whole article div natively clickable.
        Wrap all items in the resulting list page in an anchor tag.
        Done dynamically because otherwise (building it from the HTML, for instance)
        would break the layout. */
    var wrapLinks = function(articleSelector, wrapperClass) {
        $(articleSelector).each(function() {

            var $item = $(this),
                url = $item.data("url");

            var wrapLink = $("<a/>").attr("href", url);
            if (wrapperClass) {
                wrapLink.addClass(wrapperClass);
            }
            $item.wrap(wrapLink);
        });
    };

    /* Allows for typing anywhere on the page, and focus on the given input */
    var initFocusOnKeypress = function(inputSelector) {

        // Listen for a key-press anywhere on the document
        $(document).on("keypress", function(ev) {

            var nodeName = ev.target.nodeName;

            // If the keypress is done from an input, stop this function
            if ("INPUT" === nodeName) {
                return;
            }

            var searchField = $(inputSelector),
                currentValue = searchField.val();

            // Add a space to the current value, so new search term is separated
            searchField.trigger("focus").val(currentValue + " ");
        });
    };

    var pagetype;
    var setPageType = function(pt) {
        pagetype = pt;
    };
    var getPageType = function() {
        return pagetype;
    };

    var origin = function() {
        if (!window.location.origin) {
            var port = window.location.port ? ':' + window.location.port : '';
            return window.location.protocol + "//" + window.location.hostname + port;
        } else {
            return window.location.origin;
        }
    };

    // Reveal the functions to the global scope under the $tg namespace
    return {
        wrapLinks: wrapLinks,
        initFocusOnKeypress: initFocusOnKeypress,
        getOriginFromURL: origin,
        pageType: {
            get: getPageType,
            set: setPageType
        }
    };

})();


$(function() {

    var searchMainField = $(".search-mainfield");

    searchMainField.keypress(function(event) {
        if (event.which == 13) {
            event.preventDefault();
            $('.search-box-form').submit();
        }
    });

    $('.search-box-form').submit(function(event) {
        var searchTerm = $(this).find('.search-mainfield').val();
        if (searchTerm !== "") {
            searchTerm = $.trim(searchTerm);
            var targetURL = $tg.getOriginFromURL() + "/zoeken/?pagetype=" + $tg.pageType.get() + "&q=" + searchTerm.replace(/\ /g, "_");
            // $tmg.console.log("redirecting to the url " + targetURL);
            window.location.href = targetURL;
        }
        event.preventDefault();
    });

    // Test for HTML5's input-placeholder support
    var i = document.createElement("input");
    if (typeof i.placeholder === "undefined") {
        // If there's no support, run the fallback

        var placeholder = searchMainField.attr("placeholder"),
            placeholderClass = "search-box-placeholder";

        // First time - add the placeholder
        if (searchMainField.val() === "") {
            searchMainField.val(placeholder);
            searchMainField.addClass(placeholderClass);
        }

        searchMainField.focus(function() {
            // If there is no user input / showing the placeholder text
            if (searchMainField.val() === placeholder) {
                // Clear the field and remove the CSS class
                searchMainField.val("");
                searchMainField.removeClass(placeholderClass);
            }
        });

        searchMainField.blur(function() {
            // If there was no user text input
            if (searchMainField.val() == "" || searchMainField.val() == placeholder) {
                // Add the placeholder text and the auxiliar CSS class
                searchMainField.val(placeholder);
                searchMainField.addClass(placeholderClass);
            }
        });

        // Clean up on form submission
        searchMainField.closest("form").submit(function() {
            if (searchMainField.val() == placeholder) {
                searchMainField.val("");
            }
        });
    }

    // Wrap article in links to make its whole <div> clickable
    $tg.wrapLinks(".tg-article");
});