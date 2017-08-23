var html5Ndt = {
    object: null
};

function startNdtHtml5Test(server, handlers) {
  log(server);

  try {
    html5Ndt.results = {};
    html5Ndt.handlers = handlers;
    html5Ndt.results.downloadSpeedTimeline = [];
    html5Ndt.results.uploadSpeedTimeline = [];
    html5Ndt.object = new NDTWrapper(server.fqdn, html5Ndt);
    html5Ndt.object.get_status();
    html5Ndt.object.run_test();
  } catch (e) {
    log(e);
    handlers.fail("HTML5 NDT client failed.");
  }
}

function stopNdtHtml5Test() {
  try {
    html5Ndt.object.reset();
  } catch(e) {}
}
