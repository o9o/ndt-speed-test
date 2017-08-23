ipMapChart = null;
ipMapChartData = null;
ipMapChartOptions = null;

function startIpLookup(ip) {
  try {
    ga('set', 'page', '/whois-lookup');
    ga('send', 'pageview');
  } catch(e) {}
  $("#ipIp").empty();
  $("#ipNet").empty();
  $("#ipDescr").empty();
  $("#ipAsn").empty();
  $("#ipAsName").empty();
  $("#ipAsDescr").empty();
  $("#ipCc").empty();
  $("#ipCountry").empty();

  $("#ipLookupCell").removeClass("off");
  $("#ipSearching").removeClass("off");
  $("#ipLookupMap").removeClass("off");

  ipMapChart = new google.visualization.GeoChart(document.getElementById('ipMap'));
  ipMapChartData = google.visualization.arrayToDataTable([
                                                           ['Country', 'Located']
                                                         ]);
  ipMapChartOptions = {
    legend: 'none',
    backgroundColor: '#81d4fa',
    datalessRegionColor: '#ffffff',
    defaultColor: '#f5f5f5',
  };
  ipMapChart.draw(ipMapChartData, ipMapChartOptions);


  if (typeof(ip) !== "string")
    ip = $("#ip").val();
  $("#ipIp").text(ip);
  var whoisDone = false;
  var geoDone = false;
  if (stringToIP(ip)) {
    lookupIp(ip, function(ip, asn, descr, source, net) {
      $("#ipAsn").text(asn);
      $("#ipNet").text(net);
      $("#ipDescr").text(descr);
      lookupAsn(asn, function(asn, name, descr) {
        $("#ipAsName").text(name);
        $("#ipAsDescr").text(descr);
        whoisDone = true;
        if (whoisDone && geoDone)
          $("#ipSearching").addClass("off");
      }, function(s) {
        toast("AS lookup failed: " + s);
        $("#ipSearching").addClass("off");
      });
    }, function(s) {
      toast("WHOIS lookup failed: " + s);
      $("#ipSearching").addClass("off");
    });
    geoIp(ip, function(ip, cc, country) {
      $("#ipCc").text(cc);
      $("#ipCountry").text(country);
      geoDone = true;
      if (whoisDone && geoDone)
        $("#ipSearching").addClass("off");
      ipMapChartData = google.visualization.arrayToDataTable([
            ['Country', 'Located'],
            [cc, 1]
          ]);
      ipMapChartOptions = {
        legend: 'none',
        region: cc2Continent(cc),
        backgroundColor: '#81d4fa',
        datalessRegionColor: '#ffffff',
        defaultColor: '#f5f5f5',
      };
      ipMapChart.draw(ipMapChartData, ipMapChartOptions);
    }, function(s) {
      toast("Geolocation lookup failed: " + s);
      $("#ipSearching").addClass("off");
    });
  } else {
    toast("Invalid IP address");
    $("#ipSearching").addClass("off");
  }
}

function startMyIpLookup() {
  try {
    ga('set', 'page', '/whois-myip-lookup');
    ga('send', 'pageview');
  } catch(e) {}
  $("#ipIp").empty();
  $("#ipNet").empty();
  $("#ipDescr").empty();
  $("#ipAsn").empty();
  $("#ipAsName").empty();
  $("#ipAsDescr").empty();
  $("#ipCc").empty();
  $("#ipCountry").empty();
  $("#ipSearching").removeClass("off");
  getMyIPs(function(ips) {
    var bestIp = null;
    for (var i in ips) {
      var ip = ips[i];
      if (!ipIsPrivate(ip))
        bestIp = ip;
    }
    if (bestIp) {
      startIpLookup(bestIp);
    } else {
      toast("Could not find your IP address");
      $("#ipSearching").addClass("off");
    }
  });
}

//redraw charts when window resize is completed
$(window).on('resizeEnd', function() {
  if (ipMapChart)
    ipMapChart.draw(ipMapChartData, ipMapChartOptions);
});

(function(){
  $("#btnIpLookup").click(startIpLookup);
  $("#ip").keypress(function(event) {
    if (event.which === 13)
       startIpLookup();
  });
  $("#btnMyIpLookup").click(startMyIpLookup);
})();
