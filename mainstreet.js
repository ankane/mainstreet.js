(function($) {
  // TODO pass SmartyStreets id in initializer
  var city, state, smartyStreetsAuthId;

  // found at http://davidwalsh.name/javascript-debounce-function
  // from underscore.js
  function debounce(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }

  var complete = debounce( function(q, cb) {
    $.getJSON("https://autocomplete-api.smartystreets.com/suggest?prefix=" + encodeURIComponent(q) + "&prefer=" + encodeURIComponent(city) + "," + encodeURIComponent(state) + "&auth-id=" + smartyStreetsAuthId + "&suggestions=10&callback=?", function (data) {
      cb((data["suggestions"] || []).slice(0, 3));
    })
  }, 200);

  function source(q, cb) {
    if (q.search(/.+ .+/) !== -1) {
      complete(q, cb);
    } else {
      cb([]);
    }
  }

  function storageSupported() {
    return typeof(Storage) !== "undefined";
  }

  // SmartyStreets does a questionable job without a city and state suggestion
  function setLocation() {
    try {
      city = sessionStorage.getItem("mainstreetCity");
      state = sessionStorage.getItem("mainstreetState");
    } catch (err) {
      // do nothing
    }
    if (!city || !state) {
      $.getJSON("https://freegeoip.net/json/", function(data) {
        city = data["city"];
        state = data["region_code"];
        try {
          sessionStorage.setItem("mainstreetCity", city);
          sessionStorage.setItem("mainstreetState", state);
        } catch (err) {
          // do nothing
        }
      });
    }
  }

  $.fn.mainstreet = function (authId) {
    smartyStreetsAuthId = authId;
    this.each( function () {
      var $this = $(this);
      $this.typeahead({}, {displayKey: "text", source: source});
      $this.on("typeahead:selected", function(e, suggestion, dataset) {
        $(":input:eq(" + ($(":input").index(this) + 1) + ")").focus();
      });
      // TODO better HTML
      $this.wrap('<div style="position: relative;"></div>');
      $this.after('<input name="address_unit" type="text" autocomplete="off" class="address-unit form-control input-lg" style="text-align: left; position: absolute; top: 0; right: 0; border: none; background-color: transparent; width: 100px;" placeholder="Unit #">')
      setLocation();
    });
    return this;
  };
}(jQuery));
