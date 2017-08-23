function newPing(server, count, pingUpdate, pingCompleted) {
  return {
    server: server,
    pingUpdate: pingUpdate,
    pingCompleted: pingCompleted,
    count: count || 5,
    intervalMs: 1 * 1000,
    timeoutMs: 5 * 1000,
    results: [],
    sent: 0,
    minLatency: function() {
      if (!this.results.length)
        return null;
      return this.results.filter(function(v) {
        return v >= 0;
      }).reduce(function(previous, current) {
        return previous < current ? previous : current
      });
    },
    maxLatency: function() {
      if (!this.results.length)
        return null;
      return this.results.filter(function(v) {
        return v >= 0;
      }).reduce(function(previous, current) {
        return previous > current ? previous : current;
      })
    },
    avgLatency: function() {
      if (!this.results.length)
        return null;
      return this.results.filter(function(v) {
        return v >= 0;
      }).reduce(function(previous, current) {
        return previous + current;
      }) / this.results.length;
    }
  };
}

function startPing(pinger) {
  var callback = function(s) {
    var tsEnd = new Date().getTime();
    var latency = tsEnd - pinger.tsStart;
    if (latency >= pinger.timeoutMs)
      latency = -1;
    pinger.count--;
    pinger.results.push(latency);
    pinger.pingUpdate(latency, pinger);
    if (pinger.count > 0) {
      pinger.next = setTimeout(function() {
        startPing(pinger);
      }, pinger.intervalMs - latency);
    } else {
      pinger.pingCompleted(pinger);
    }
  };

  pinger.tsStart = new Date().getTime();
  pinger.sent++;
  simpleAjax("GET",
             "https://" + pinger.server + ":81/favicon." + new Date().getTime(),
             pinger.timeoutMs,
             "json",
             callback,
             callback);
};
