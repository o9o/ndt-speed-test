function selectClosestNdtServer(success, fail) {
  simpleAjax("GET", "https://mlab-ns.appspot.com/ndt_ssl?policy=geo", 5000, "json", success, fail);
}

function selectNdtServerByMetro(metro, success, fail) {
  simpleAjax("GET", "https://mlab-ns.appspot.com/ndt_ssl?policy=metro&metro=" + metro, 5000, "json", success, fail);
}
