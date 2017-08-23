(function() {
  // https://mdn-samples.mozilla.org/s/webrtc-capturestill/
  // public domain
  var streaming = false;

  // The various HTML elements we need to configure or control. These
  // will be set by the startup() function.
  var video = null;
  var _stream = null;
  navigator.getMedia = navigator.getUserMedia ||
                       navigator.webkitGetUserMedia ||
                       navigator.mozGetUserMedia ||
                       navigator.msGetUserMedia;
  window.AudioContext = window.AudioContext || window.webkitAudioContext;

  var audioContext = null;
  var analyser = null;
  var microphone = null;
  var javascriptNode = null;

  function startup() {
    video = document.getElementById('mediaVideo');
    navigator.getMedia(
      {
        video: true,
        audio: true
      },
      function(stream) {
        _stream = stream;
        if (navigator.mozGetUserMedia) {
          video.mozSrcObject = stream;
        } else {
          var vendorURL = window.URL || window.webkitURL;
          video.src = vendorURL.createObjectURL(stream);
        }
        video.play();
        video.volume = 0.1;
        video.setAttribute("controls", "");
        audioContext = new window.AudioContext();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        javascriptNode = audioContext.createScriptProcessor(2 * 4096, 1, 1);
        analyser.smoothingTimeConstant = 0.3;
        analyser.fftSize = 64;
        microphone.connect(analyser);
        analyser.connect(javascriptNode);
        javascriptNode.connect(audioContext.destination);

        var canvas = document.getElementById("mediaMic");
        var ctx = canvas.getContext("2d");
        javascriptNode.onaudioprocess = function() {
          var array =  new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(array);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          var grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
          grad.addColorStop(0,"#FF0000");
          grad.addColorStop(0.5, "yellow");
          grad.addColorStop(1,"#00FF00");
          ctx.fillStyle = grad;
          for (var i = 0; i < array.length; i++) {
            var v = array[i] / 256.;
            var x1 = (canvas.width * i ) / array.length;
            var x2 = (canvas.width * (i + 1)) / array.length;
            ctx.fillRect(x1, canvas.height*(1.0 - v), canvas.width / array.length, canvas.height*v);
          }
        };
        javascriptNode.onended = function() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          video.removeAttribute("controls");
        }
      },
      function(err) {
        toast("An error occured! " + err);
        $("#btnMediaTest").text("Start");
        streaming = false;
      }
    );

    video.addEventListener('canplay', function(ev) {
      if (!streaming) {
        video.play();
        streaming = true;
      }
    }, false);
  }
  $("#btnMediaTest").click(function() {
    if (!streaming) {
      try {
        ga('set', 'page', '/media-test');
        ga('send', 'pageview');
      } catch(e) {}
      $("#btnMediaTest").text("Stop");
      startup();
    } else {
      $("#btnMediaTest").text("Start");
      streaming = false;
      if (_stream.stop) {
        _stream.stop();
      } else {
        var tracks = _stream.getTracks();
        for (var i in tracks)
          tracks[i].stop();
      }
    }
  });
})();
