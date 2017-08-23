function simpleAjax(type, url, timeout, dataType, success, fail)
{
  $.ajax({
    type: type,
    url: url,
    timeout: timeout,
    dataType: dataType,
    success: function(obj) {
      success(obj);
    },
    error: function(request, errorText, httpErrorText) {
      if (request.status === 0) {
        fail("Connection failure.");
      } else if (request.status === 404) {
        fail("Page not found.");
      } else if (exception === 'parsererror') {
        fail('Response from server was incomplete or corrupted.');
      } else if (exception === 'timeout') {
        fail('Timeout when connecting to server.');
      } else if (exception === 'abort') {
        fail('Request aborted.');
      } else {
        fail('Failed to connect to server: ' + httpErrorText);
      }
    }
  });
}

function stringToIP(s) {
  return (s.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/) || s.match(/\b(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}\b/) || [null])[0];
}

function getMyIPsNetp(callback) {
  simpleAjax("GET", "https://whois.netperf.tools", 1000, "text", function(result) {
    if (result) {
      ip = stringToIP(result.split('\n')[0]);
      callback([ip]);
    } else {
      callback([]);
    }
  }, callback([]));
}

function getMyIPs(callback) {
  // https://github.com/diafygi/webrtc-ips
  // The MIT License (MIT)
  // Copyright (c) 2015 Daniel Roesler

  var ips = {};
  var RTCPeerConnection = window.RTCPeerConnection
      || window.mozRTCPeerConnection
      || window.webkitRTCPeerConnection;
  var useWebKit = !!window.webkitRTCPeerConnection;
  // Bypass naive webrtc blocking using an iframe
  if (!RTCPeerConnection) {
    var win = iframe.contentWindow;
    RTCPeerConnection = win.RTCPeerConnection
        || win.mozRTCPeerConnection
        || win.webkitRTCPeerConnection;
    useWebKit = !!win.webkitRTCPeerConnection;
  }
  // Minimal requirements for data connection
  var mediaConstraints = {
    optional: [{RtpDataChannels: true}]
  };
  var servers = {iceServers: [{urls: "stun:stun.services.mozilla.com"}]};
  // Construct a new RTCPeerConnection
  var pc = new RTCPeerConnection(servers, mediaConstraints);

  // Handle a string that might contain an IP address
  function handleCandidate(s) {
    var ip = stringToIP(s);
    if (ip) {
      ips[ip] = true;
    }
  }
  // Listen for candidate events
  pc.onicecandidate = function(ice) {
    if (ice.candidate)
      handleCandidate(ice.candidate.candidate);
  };
  // Create a dummy data channel
  pc.createDataChannel("");
  // Create an offer sdp
  pc.createOffer(function(result) {
    // Trigger the stun server request
    pc.setLocalDescription(result, function() {}, function() {});
  }, function() {});

  setTimeout(function() {
    // Read candidate info from local description
    var lines = pc.localDescription.sdp.split('\n');
    lines.forEach(function(line) {
      if (line.indexOf('a=candidate:') === 0)
        handleCandidate(line);
    });
    pc.close();
    var result = [];
    for (var ip in ips) {
      if (ips.hasOwnProperty(ip) && !ipIsPrivate(ip)){
        result.push(ip);
      }
    }
    if (result.length > 0) {
      callback(result);
    } else {
      simpleAjax("GET", "https://whois.netperf.tools", 1000, "text", function(result) {
        if (result) {
          ip = stringToIP(result.split('\n')[0]);
          callback([ip]);
        } else {
          callback([]);
        }
      }, function(err) {callback([]); });
    }
  }, 1000);
}

function ipIsPrivate(ip) {
  ip = stringToIP(ip);
  return ip.startsWith("10.") ||
      ip.startsWith("192.168.") ||
      ip.startsWith("172.16.") ||
      ip.startsWith("172.17.") ||
      ip.startsWith("172.18.") ||
      ip.startsWith("172.19.") ||
      ip.startsWith("172.20.") ||
      ip.startsWith("172.21.") ||
      ip.startsWith("172.22.") ||
      ip.startsWith("172.23.") ||
      ip.startsWith("172.24.") ||
      ip.startsWith("172.25.") ||
      ip.startsWith("172.26.") ||
      ip.startsWith("172.27.") ||
      ip.startsWith("172.28.") ||
      ip.startsWith("172.29.") ||
      ip.startsWith("172.30.") ||
      ip.startsWith("172.31.");
}

function log(x)
{
  console.log(x);
}

function pass(x)
{
}

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");
}

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  var angleInRadians = angleInDegrees * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

function describeArc(x, y, radius, startAngle, endAngle) {
    var start = polarToCartesian(x, y, radius, endAngle);
    var end = polarToCartesian(x, y, radius, startAngle);
    var arcSweep = endAngle - startAngle <= 180 ? "0" : "1";
    var d = [
        "M", start.x, start.y,
        "A", radius, radius, 0, arcSweep, 0, end.x, end.y
    ].join(" ");
    return d;
}

function makeMeterPlotHTML(name, cls, unit, min, max, name2, unit2) {
  var totalAngle = 270.;
  var startAngle = 90. + (360. - totalAngle) / 2.;
  var r = 50;
  var w = 10;
  return '<svg id="' + name + '" viewbox="0 0 100 100" class="' + cls + '">' +
    '<g>' +
    '  <path id="' + name + 'All" class="' + cls + '-all" fill="none" stroke-width="10" d="' +
      describeArc(r, r, r - w/2., startAngle, startAngle + totalAngle) + '" />' +
    '  <path id="' + name + 'Pie" class="' + cls + '-pie" fill="none" stroke-width="10" d="' +
      describeArc(r, r, r - w/2., startAngle, startAngle + 1) + '" />' + '"/>' +
    '</g>' +
    '<text x="49" y="45" font-size="16" text-anchor="end"><tspan id="' + name + 'Text">0</tspan></text>' +
    '<text x="51" y="45" font-size="10" text-anchor="start"><tspan id="' + name + 'Unit"> ' + unit + '</tspan></text>' +
    '<text x="49" y="58" font-size="10" text-anchor="end"><tspan id="' + name2 + 'Text">0</tspan></text>' +
    '<text x="51" y="58" font-size="9" text-anchor="start"><tspan id="' + name2 + 'Unit"> ' + unit2 + '</tspan></text>' +
    '<text x="14" y="95" font-size="10" text-anchor="middle" id="' + name + 'Min">' + min + '</text>' +
    '<text x="87" y="95" font-size="10" text-anchor="middle" id="' + name + 'Max">' + max + '</text>' +
  '</svg>';
}

function updateMeterPlot(name, value, min, max, unit) {
  var x = (value - min) / (max - min);
  x = Math.max(0, Math.min(x, 1));
  var totalAngle = 270.;
  var angle = x * totalAngle;
  var startAngle = 90. + (360. - totalAngle) / 2.;
  var endAngle = startAngle + angle;
  var r = 50;
  var w = 10;
  $("#" + name + "Pie").attr("d", describeArc(r, r, r - w/2., startAngle, endAngle));
  $("#" + name + "All").attr("d", describeArc(r, r, r - w/2., startAngle, startAngle + totalAngle));
  $("#" + name + "Text").text(value);
  $("#" + name + "Unit").text(unit);
  $("#" + name + "Min").text(min);
  $("#" + name + "Max").text(max);
}

function updateMeterPlot2(name2, value2, unit2) {
  $("#" + name2 + "Text").text(value2);
  $("#" + name2 + "Unit").text(unit2);
}

// Attempts to determine the absolute path of a script, minus the name of the
// script itself.
function getScriptPath() {
  var scripts = document.getElementsByTagName('script');
  var fileRegex = new RegExp('\/ndt-wrapper\.js$');
  var path = '';
  if (scripts && scripts.length > 0) {
    for(var i in scripts) {
      if(scripts[i].src && scripts[i].src.match(fileRegex)) {
        path = scripts[i].src.replace(fileRegex, '');
        break;
      }
    }
  }
  return path.substring(location.origin.length);
}

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// http://stackoverflow.com/a/6274398
function shuffle(array) {
    var counter = array.length;
    // While there are elements in the array
    while (counter > 0) {
        // Pick a random index
        var index = Math.floor(Math.random() * counter);
        // Decrease counter by 1
        counter--;
        // And swap the last element with it
        var temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }
    return array;
}
