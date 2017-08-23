function runTestForServer(server) {
  $("#ndtLatencyCell").removeClass("off");
  $("#ndtTestProgressBarLatency").show();
  $("#ndtTestProgressTextLatency").text("Measuring idle latency...");
  plotNdtLatency(null, null, null, null, null, null, null, null, null);
  var c2sPing = null;
  var s2cPing = null;
  var timeoutCallback = null;
  var timeout = null;
  var restartTimeout = function() {
    if (timeout)
      clearTimeout(timeout);
    timeout = setTimeout(timeoutCallback, 15000);
  }

  var idlePing = newPing(server.fqdn,
                         10,
                         function(v, pinger) {
                           $("#ndtTestProgressTextLatency").text("Measuring idle latency...");
                           if (pinger.sent === 1)
                             pinger.results.shift();
                           plotNdtLatency(idlePing.avgLatency(), idlePing.minLatency(), idlePing.maxLatency(), null, null, null, null, null, null);
                         },
                         function() {
                           var handlers = {
                             c2sStarted: function() {
                               restartTimeout();
                               $("#ndtUploadPlotContainer").html(makeMeterPlotHTML("ndtUploadPlot", "chart-upload", "Mbps", 0, 100, "ndtUploadPing", "ms"));
                               $("#ndtUploadCell").removeClass("off");
                               $("#ndtTestProgressBarUpload").show();
                               $("#ndtTestProgressTextLatency").text("Measuring upload latency...");
                               c2sPing = newPing(server.fqdn,
                                                 10,
                                                 function(v) {
                                                   $("#ndtTestProgressTextLatency").text("Measuring upload latency...");
                                                   plotNdtLatency(idlePing.avgLatency(), idlePing.minLatency(), idlePing.maxLatency(), c2sPing.avgLatency(), c2sPing.minLatency(), c2sPing.maxLatency(), null, null, null);
                                                   if (v >= 0)
                                                     updateMeterPlot2("ndtUploadPing", v.toFixed(0), "ms");
                                                 }, function(pinger) {
                                                   updateMeterPlot2("ndtUploadPing", pinger.avgLatency().toFixed(0), "ms")
                                                 });
                               startPing(c2sPing);
                             },
                             c2sStatus: function(s) {
                               restartTimeout();
                               $("#ndtTestProgressTextUpload").text(s);
                             },
                             c2sSpeedUpdate: function(v) {
                               restartTimeout();
                               updateMeterPlot("ndtUploadPlot", v.toFixed(0), 0, 100, "Mbps");
                             },
                             c2sSpeedComputed: function(v) {
                               restartTimeout();
                               updateMeterPlot("ndtUploadPlot", v.toFixed(0), 0, 100, "Mbps");
                             },
                             c2sCompleted: function() {
                               restartTimeout();
                               $("#ndtTestProgressBarUpload").hide();
                               $("#ndtTestProgressTextUpload").text("Upload test completed.");
                             },
                             s2cStarted: function() {
                               restartTimeout();
                               $("#ndtDownloadPlotContainer").html(makeMeterPlotHTML("ndtDownloadPlot", "chart-download", "Mbps", 0, 100, "ndtDownloadPing", "ms"));
                               $("#ndtDownloadCell").removeClass("off");
                               $("#ndtTestProgressBarDownload").show();
                               $("#ndtTestProgressTextLatency").text("Measuring download latency...");
                               s2cPing = newPing(server.fqdn,
                                                 10,
                                                 function(v) {
                                                   $("#ndtTestProgressTextLatency").text("Measuring download latency...");
                                                   plotNdtLatency(idlePing.avgLatency(), idlePing.minLatency(), idlePing.maxLatency(), c2sPing.avgLatency(), c2sPing.minLatency(), c2sPing.maxLatency(), s2cPing.avgLatency(), s2cPing.minLatency(), s2cPing.maxLatency());
                                                   if (v >= 0)
                                                     updateMeterPlot2("ndtDownloadPing", v.toFixed(0), "ms");
                                                 }, function(pinger) {
                                                   $("#ndtTestProgressBarLatency").hide();
                                                   $("#ndtTestProgressTextLatency").text("Latency measurement completed.");
                                                   updateMeterPlot2("ndtDownloadPing", pinger.avgLatency().toFixed(0), "ms")
                                                 });
                               startPing(s2cPing);
                             },
                             s2cStatus: function(s) {
                               restartTimeout();
                               $("#ndtTestProgressTextDownload").text(s);
                             },
                             s2cSpeedUpdate: function(v) {
                               restartTimeout();
                               updateMeterPlot("ndtDownloadPlot", v.toFixed(0), 0, 100, "Mbps");
                             },
                             s2cSpeedComputed: function(v) {
                               restartTimeout();
                               updateMeterPlot("ndtDownloadPlot", v.toFixed(0), 0, 100, "Mbps");
                             },
                             s2cCompleted: function() {
                               restartTimeout();
                               $("#ndtTestProgressBarDownload").hide();
                               $("#ndtTestProgressTextDownload").text("Download test completed.");
                             },
                             success: function(results) {
                               if (timeout)
                                 clearTimeout(timeout);
                               console.log(results);
                               $("#btnNdtTest").prop("disabled", false);
                               toast("Throughput test completed.");
                               findMyCc(function(cc, country) {
                                 simpleAjax("GET", "/stats/down-tput-" + cc + ".json", 10000, "json",
                                            function(json) {
                                              $("#ndtDownStats").removeClass("off");
                                              $("#ndtDownCountry").text(country);
                                              plotNdtStats(json, results.downloadSpeed, 'Throughput (Mbps)', 'ndtDownStatsChart', ndtDownStats);
                                            }, function() {
                                              $("#ndtDownStats").addClass("off");
                                            });
                                 simpleAjax("GET", "/stats/up-tput-" + cc + ".json", 10000, "json",
                                            function(json) {
                                              $("#ndtUpStats").removeClass("off");
                                              $("#ndtUpCountry").text(country);
                                              plotNdtStats(json, results.uploadSpeed, 'Throughput (Mbps)', 'ndtUpStatsChart', ndtUpStats);
                                            }, function() {
                                              $("#ndtUpStats").addClass("off");
                                            });
                               }, function(s) {
                               });
                             },
                             fail: null // defined below
                           };
                           handlers.fail = function(s) {
                             stopNdtHtml5Test();
                             toast("Falling back to Flash as the HTML5 client failed with error: " + s);
                             handlers.fail = function(s) {
                               if (timeout)
                                 clearTimeout(timeout);
                               handlers = {};
                               toast("Error: " + s);
                               $("#ndtTestProgressBarLatency").hide();
                               $("#ndtTestProgressBarUpload").hide();
                               $("#ndtTestProgressBarDownload").hide();
                               $("#ndtTestProgressTextLatency").text("Stopped due to error.");
                               $("#ndtTestProgressTextUpload").empty();
                               $("#ndtTestProgressTextDownload").empty();
                               $("#btnNdtTest").prop("disabled", false);
                             }
                             restartTimeout();
                             $("#ndt1").removeClass("off");
                             setTimeout(function() {
                               startNdtFlashTest(server, handlers);
                             }, 1000);
                           };
                           timeoutCallback = function() {
                             handlers.fail("Timeout");
                           };
                           restartTimeout();
                           startNdtHtml5Test(server, handlers);
                         });
  startPing(idlePing);
};

var server = null;

function selectServer(s) {
  server = s;
  $("#ndtStatusServer").removeClass("off");
  $("#ndtStatusServer").html(String(server.fqdn).replace(".measurement-lab.org", "").replace("ndt-iupui-", "") + " located in " + server.city + ("country" in server ? ", " + server.country : ""));
  $("#ndtStatusServerSearching").addClass("off");
}

function selectActiveServer(mlabServers, success, fail) {
  if (mlabServers.length === 0) {
    selectServer(null);
    toast("Error: cannot contact server");
    fail("Error: cannot contact server");
  } else {
    var s = mlabServers[0];
    mlabServers = mlabServers.slice(1);
    var tsStart = new Date().getTime();
    var timeoutMs = 5000;
    var callback = function(txt) {
      var tsEnd = new Date().getTime();
      var latency = tsEnd - tsStart;
      if (latency >= timeoutMs) {
        // Server down
        selectActiveServer(mlabServers, success, fail);
      } else {
        // Server up or network down
        selectServer(s);
        success(s);
      }
    };
    simpleAjax("GET",
               "https://" + s.fqdn + ":81/favicon." + new Date().getTime(),
               timeoutMs,
               "json",
               callback,
               callback);
  }
}

function selectServerFromGui(success, fail) {
  var mode = $("input[name=ndtSelectType]:checked").val();
  $("#ndtStatusServer").empty();
  $("#ndtStatusServerSearching").removeClass("off");
  if (mode === "auto") {
    selectClosestNdtServer(function(s) {
      selectServer(s);
      success(s);
    }, function(s) {
      toast("Error: " + s);
      fail(s);
    });
  } else if (mode === "metro") {
    var city = $("#ndtSelectMetro").val();
    var asn = $("#ndtSelectNet").val();
    selectActiveServer(shuffle(ndtByCityAsn[city][asn].servers), success, fail);
  } else if (mode === "net") {
    var city = $("#ndtSelectMetro").val();
    var asn = $("#ndtSelectNet").val();
    selectActiveServer(shuffle(ndtByAsnCity[asn].cities[city]), success, fail);
  }
}

function startNdtTest() {
  try {
    ga('set', 'page', '/throughput-test');
    ga('send', 'pageview');
  } catch(e) {}

  $("#btnNdtTest").prop("disabled", true);
  $("#ndtLatencyCell").addClass("off");
  $("#ndtUploadCell").addClass("off");
  $("#ndtDownloadCell").addClass("off");
  $("#ndtStatusCell").removeClass("off");
  $("#ndtServerCell").removeClass("off");
  if (server) {
    runTestForServer(server);
  } else {
    selectServerFromGui(function(s) {
      runTestForServer(s);
    }, function() {
      $("#btnNdtTest").prop("disabled", false);
    });
  }
}

(function(){
  $("#btnNdtTest").click(startNdtTest);
  $("#btnNdtMetrics").click(function() {
    if ($("#ndtMetrics").hasClass("off")) {
      $("#ndtMetrics").removeClass("off");
      $("#btnNdtMetrics").text("Hide FAQ");
      try {
        ga('set', 'page', '/throughput-doc');
        ga('send', 'pageview');
      } catch(e) {}
    } else {
      $("#ndtMetrics").addClass("off");
      $("#btnNdtMetrics").text("FAQ");
    }
    return false;
  });
  $("#btnNdtOptions").click(function() {
    $("#ndtServerCell").removeClass("off");
    return false;
  });
})();

var ndtLatencyPlot = null;
var ndtLatencyPlotData = null;
var ndtLatencyPlotOptions = null;

var ndtDownStats = {plot: null, data: null, options: null};
var ndtUpStats = {plot: null, data: null, options: null};

function rangeTooltip(avg, min, max, prec, unit) {
  if (!isNaN(parseFloat(avg)))
    return "Average " + avg.toFixed(prec) + ", min " + min.toFixed(prec) + ", max " + max.toFixed(prec) + " " + unit;
  return "";
}

function plotNdtLatency(idleAvg, idleMin, idleMax,
                        upAvg, upMin, upMax,
                        downAvg, downMin, downMax) {
  var data = new google.visualization.DataTable();
  data.addColumn('string', 'x');
  data.addColumn('number', 'Idle');
  data.addColumn({id:'min1', type:'number', role:'interval'});
  data.addColumn({id:'max1', type:'number', role:'interval'});
  data.addColumn({type: 'string', role: 'tooltip'});
  data.addColumn('number', 'Upload');
  data.addColumn({id:'min2', type:'number', role:'interval'});
  data.addColumn({id:'max2', type:'number', role:'interval'});
  data.addColumn({type: 'string', role: 'tooltip'});
  data.addColumn('number', 'Download');
  data.addColumn({id:'min3', type:'number', role:'interval'});
  data.addColumn({id:'max3', type:'number', role:'interval'});
  data.addColumn({type: 'string', role: 'tooltip'});

  data.addRows([
                 ['Idle', idleAvg, idleMin, idleMax, 'Idle latency\n' + rangeTooltip(idleAvg, idleMin, idleMax, 0, 'ms'), null, null, null, null, null, null, null, null],
                 ['Upload', null, null, null, null, upAvg, upMin, upMax, 'Upload latency\n' + rangeTooltip(upAvg, upMin, upMax, 0, 'ms'), null, null, null, null],
                 ['Download', null, null, null, null, null, null, null, null, downAvg, downMin, downMax, 'Download latency\n' + rangeTooltip(downAvg, downMin, downMax, 0, 'ms')]
               ]);
  var options = {
    title:'Latency (ms)',
    curveType:'function',
    series: {
      0: {'color': '#999'},
      1: {'color': '#00B8D4'},
      2: {'color': '#00C853'}
    },
    pointSize: 4,
    lineWidth: 0,
    intervals: {
      style: 'sticks',
      lineWidth: 1.5
    },
    legend: 'none',
    hAxis: {
      textStyle: {
        fontSize: 12
      }
    },
    vAxis: {
      minValue: 0,
      textStyle: {
        fontSize: 12
      }
    },
    chartArea: {
      left: 40,
      top: 30,
      bottom: 50,
      right: 0,
      width: '100%',
      height: '80%'
    },
    fontName: 'sans-serif',
    titleTextStyle: {
      fontSize: 14,
      bold: true
    },
    tooltip: {
      textStyle: {
        fontSize: 14
      }
    }
  };
  if (!ndtLatencyPlot)
    ndtLatencyPlot = new google.visualization.LineChart(document.getElementById('ndtLatencyChart'));
  ndtLatencyPlotData = data;
  ndtLatencyPlotOptions = options;
  ndtLatencyPlot.draw(data, options);
}

function plotNdtStats(json, target, label, id, obj) {
  obj.data = new google.visualization.DataTable();
  obj.data.addColumn('number', 'Value');
  obj.data.addColumn('number', 'Count');
  obj.data.addColumn({type:'string', role:'annotation'});
  var peak = 1.0;
  for (var i = 0; i < json.length; i++) {
    if (parseFloat(json[i][1]) > peak)
      peak = parseFloat(json[i][1]);
  }

  var found = false;
  for (var i = 0; i < json.length-1; i++) {
    var v1 = parseFloat(json[i+0][0]);
    var v2 = parseFloat(json[i+1][0]);
    var h = parseFloat(json[i][1]);
    obj.data.addRow([v2, h, v1 <= target && target < v2 ? "You are here" : null]);
    found = found || (v1 <= target && target < v2);
    if (found && h < peak / 100.0)
      break;
  }
  obj.options = {
    hAxis: {
      title: label
    },
    vAxis: {
      title: 'Number of measurements'
    },
    legend: 'none'
  };
  if (!obj.plot)
    obj.plot = new google.visualization.ColumnChart(document.getElementById(id));
  obj.plot.draw(obj.data, obj.options);
}

//redraw charts when window resize is completed
$(window).on('resizeEnd', function() {
  if (ndtLatencyPlot)
    ndtLatencyPlot.draw(ndtLatencyPlotData, ndtLatencyPlotOptions);
  if (ndtDownStats.plot)
    ndtDownStats.plot.draw(ndtDownStats.data, ndtDownStats.options);
  if (ndtUpStats.plot)
    ndtUpStats.plot.draw(ndtUpStats.data, ndtUpStats.options);
});

(function(){
  var parts = ["&#6", "lto", ".", "mai", ":", "contact", "4;", "netperf", "tools"];
  $("#ctct").html('<a href="' + parts[3] + parts[1] + parts[4] +
                  parts[5] + parts[0] + parts[6] + parts[7] +
                  parts[2] + parts[8] + '">' +
                  parts[5] + parts[0] + parts[6] + parts[7] +
                  parts[2] + parts[8] + "</a>");
})();

function ndtSelectMetroChanged() {
  var mode = $("input[name=ndtSelectType]:checked").val();
  if (mode === "metro") {
    $("#ndtSelectNet").empty();
    var city = $("#ndtSelectMetro").val();
    for (var asn in ndtByCityAsn[city]) {
      $("#ndtSelectNet").append($("<option />").val(asn).text(asn + " " + ndtByCityAsn[city][asn].asname));
    }
  }
  selectServerFromGui(pass, pass);
}

function ndtSelectNetChanged() {
  var mode = $("input[name=ndtSelectType]:checked").val();
  if (mode === "net") {
    $("#ndtSelectMetro").empty();
    var asn = $("#ndtSelectNet").val();
    for (var city in ndtByAsnCity[asn].cities) {
      $("#ndtSelectMetro").append($("<option />").val(city).text(city));
    }
  }
  selectServerFromGui(pass, pass);
}

function ndtSelectTypeChanged() {
  var mode = $("input[name=ndtSelectType]:checked").val();
  var prevCity = $("#ndtSelectMetro").val();
  var prevAsn = $("#ndtSelectNet").val();
  if (mode === "auto") {
    $("#ndtSelectMetroRow").hide();
    $("#ndtSelectNetRow").hide();
    selectServerFromGui(pass, pass);
  } else if (mode === "metro") {
    $("#ndtSelectMetroRow").show();
    $("#ndtSelectNetRow").show();
    $("#ndtSelectMetroRow").after($("#ndtSelectNetRow"));
    $("#ndtSelectMetro").empty();
    for (var city in ndtByCityAsn) {
      $("#ndtSelectMetro").append($("<option />").val(city).text(city));
    }
    if (prevCity)
      $("#ndtSelectMetro").val(prevCity);
    ndtSelectMetroChanged();
  } else if (mode === "net") {
    $("#ndtSelectMetroRow").show();
    $("#ndtSelectNetRow").show();
    $("#ndtSelectNetRow").after($("#ndtSelectMetroRow"));
    $("#ndtSelectNet").empty();
    for (var asn in ndtByAsnCity) {
      $("#ndtSelectNet").append($("<option />").val(asn).text(asn + " " + ndtByAsnCity[asn].asname));
    }
    if (prevAsn)
      $("#ndtSelectNet").val(prevAsn);
    ndtSelectNetChanged();
  }
}
$('input[name=ndtSelectType]:radio').change(ndtSelectTypeChanged);
ndtSelectTypeChanged();
$('#ndtSelectMetro').change(ndtSelectMetroChanged);
$('#ndtSelectNet').change(ndtSelectNetChanged);
