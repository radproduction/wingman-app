document.addEventListener("DOMContentLoaded", function () {
  if (window.Lenis) {
    var lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.1
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
    window.wingmanLenis = lenis;
  }

  var videoWrap = document.querySelector(".wingman-learns-video-wrap");

  if (!videoWrap) {
    return;
  }

  var video = videoWrap.querySelector(".wingman-learns-video");
  var cursor = videoWrap.querySelector(".wingman-video-cursor");

  if (!video || !cursor) {
    return;
  }

  videoWrap.addEventListener("mousemove", function (event) {
    var bounds = videoWrap.getBoundingClientRect();
    cursor.style.left = event.clientX - bounds.left + "px";
    cursor.style.top = event.clientY - bounds.top + "px";
    videoWrap.classList.add("is-cursor-active");
  });

  videoWrap.addEventListener("mouseleave", function () {
    videoWrap.classList.remove("is-cursor-active");
  });

  videoWrap.addEventListener("click", function () {
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  });

});
