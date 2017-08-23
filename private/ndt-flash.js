var flashNdt = {
    object: document.getElementById("ndt1"),
    running: false
};

function getFlashNdtServer() {
  return flashNdt.object.get_host();
}

function getFlashNdtVar(name) {
  return flashNdt.object.getNDTvar(name);
}

function appendDebugOutput(s) {
  // log("Debug:" + s);
}

function appendErrors(s) {
  log("Error:" + s + " for server " + getFlashNdtServer());
}

function c2sStatus(s) {
  // log("#### c2sStatus:" + s);
  flashNdt.handlers.c2sStatus(s);
}

function c2sSpeedUpdate(s) {
  // log("#### c2sSpeedUpdate:" + s);
  flashNdt.handlers.c2sSpeedUpdate(parseFloat(s));
  flashNdt.results.downloadSpeedTimeline.push(parseFloat(s));
}

function c2sSpeedComputed(s) {
  // log("#### c2sSpeedComputed:" + s);
  flashNdt.handlers.c2sSpeedComputed(parseFloat(s));
  flashNdt.results.downloadSpeed = parseFloat(s);
}

function s2cStatus(s) {
  // log("#### s2cStatus:" + s);
  flashNdt.handlers.s2cStatus(s);
}

function s2cSpeedUpdate(s) {
  // log("#### s2cSpeedUpdate:" + s);
  flashNdt.handlers.s2cSpeedUpdate(parseFloat(s));
  flashNdt.results.uploadSpeedTimeline.push(parseFloat(s));
}

function s2cSpeedComputed(s) {
  // log("#### s2cSpeedComputed:" + s);
  flashNdt.handlers.s2cSpeedComputed(parseFloat(s));
  flashNdt.results.uploadSpeed = parseFloat(s);
}


function testStarted(testType) {
  if (testType === "ClientToServerThroughput") {
    flashNdt.handlers.c2sStarted();
  } else if (testType === "ServerToClientThroughput") {
    flashNdt.handlers.s2cStarted();
  }
  // log("Starting test " + testType + " for server " + getFlashNdtServer());
}

function testCompleted(testType) {
  // log("testCompleted " + testType);
  if (testType === "ClientToServerThroughput") {
    flashNdt.handlers.c2sCompleted();
  } else if (testType === "ServerToClientThroughput") {
    flashNdt.handlers.s2cCompleted();
  }
}

function allTestsCompleted() {
  // log("Test completed " + " for server " + getFlashNdtServer());
  flashNdt.running = false;
  flashNdt.handlers.success(flashNdt.results);
}

function parseDiagnosis(diagnosis) {
  var lines = diagnosis.split("\n");
  var result = { vars: {} };
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    // name: value
    var p = line.indexOf(": ");
    if (p > 0) {
      var name = line.substring(0, p);
      var value = line.substring(p + 2);
      result.vars[name] = value;
    } else {
      // TODO
    }
  }
  return result;
}

function resultsProcessed() {
  setTimeout(function() {
    var diagnosis = flashNdt.object.get_diagnosis();
    log(diagnosis);
    flashNdt.results.diagnosis = diagnosis;
    flashNdt.results.diagnosisParsed = parseDiagnosis(diagnosis);
//    log("RTT: avg " + avgRtt.toFixed(1) + " ms, min " + minRtt.toFixed(1) + " ms, max " + maxRtt.toFixed(1) + " ms" +
//        " for server " + server);
//    log("Duplicate ACKs (usually indicate packet loss): " + dupAcksIn + " received, " + dupAcksOut + " sent" +
//        " by server " + server);
//    log("Retransmissions (usually indicate packet loss): " + pktsRetrans + " overall, " + fastRetrans + " fast" +
//        " by server " + server);
//    log("Selective ACKs (usually indicate packet loss): " + sAcksIn + " received" +
//        " by server " + server);
    // handlers.
  }, 1000);
}

function startNdtFlashTest(server, handlers) {
  log(server);
  if (flashNdt.running) {
      handlers.fail("Another test is currently running.");
      return;
  }

  try {
    flashNdt.object.get_status();
    flashNdt.running = true;
    flashNdt.handlers = handlers;
    flashNdt.results = {};
    flashNdt.results.downloadSpeedTimeline = [];
    flashNdt.results.uploadSpeedTimeline = [];
    flashNdt.object.set_host(server.fqdn);
    flashNdt.object.run_test();
  } catch (e) {
    log(e);
    flashNdt.running = false;
    handlers.fail("Flash disabled.");
  }
}
