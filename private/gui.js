var tabs = ["dashboard",
            "throughput",
            "latency",
            "browser",
            "media",
            "connection",
            "website",
            "tomography",
            "whois",
            "terms"];

function openTab(name) {
  $(".demo-layout > main > div.on").removeClass("on");
  $(".mdl-layout-title.on").removeClass("on");
  $(".demo-layout .demo-navigation .mdl-navigation__link.on").removeClass("on");
  $("#" + name).addClass("on");
  $("#" + name + "Title").addClass("on");
  $("#" + name + "Nav").addClass("on");
  document.title = $("#" + name + "Title").html().replace(/<i.*i>/, "");
  try {
    ga('set', 'page', '/' + name);
    ga('send', 'pageview');
  } catch(e) {}
}

function hashChanged() {
  var tabName = window.location.hash.length > 0 ? window.location.hash.substring(1) : tabs[0];
  if ($.inArray(tabName, tabs) >= 0)
    openTab(tabName);
}

$(window).on('hashchange', hashChanged);
hashChanged();

(function(){
  $('a').not('[href*="mailto:"]').each(function() {
    var isInternalLink = new RegExp('/' + window.location.host + '/');
    if (!isInternalLink.test(this.href)) {
      $(this).attr('target', '_blank');
    }
  });
})();

function toast(s) {
  document.querySelector("#snackbar").MaterialSnackbar.showSnackbar({
                                                                      message: s
                                                                    });
}

$(window).resize(function() {
  if (this.resizeTimeout)
    clearTimeout(this.resizeTimeout);
  this.resizeTimeout = setTimeout(function() {
    $(this).trigger('resizeEnd');
  }, 300);
});

// Show interactive content to bots
if (/bot|crawler|spider|robot|crawling/i.test(navigator.userAgent)) {
  $(".off").addClass("onn");
  $(".demo-layout > main > div").addClass("onn");
}
