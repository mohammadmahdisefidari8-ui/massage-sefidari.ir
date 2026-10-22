/* =========================================================
   main.js — نقطه شروع؛ ماژول‌ها را به ترتیب راه‌اندازی می‌کند
   ========================================================= */

(function () {
  function start() {
    // ۱) ابتدا کارت‌ها، راهنمای انتخاب و فرم ساخته شوند تا بقیه ماژول‌ها آن‌ها را ببینند
    if (SM.render) SM.render.init();
    if (SM.finder) SM.finder.init();
    if (SM.booking) SM.booking.init();
    if (SM.extras) SM.extras.init();   // نظرات، نکات، آدرس (قبل از ui تا reveal ببیندشان)
    if (SM.motion) SM.motion.init();

    // ۲) رابط کاربری: لودر، منو، افکت‌های اسکرول، سوالات متداول
    if (SM.ui) SM.ui.init();

    // ۳) افکت سه‌بعدی تیلت روی کارت‌ها (فقط موس)
    if (SM.tilt) SM.tilt.init();

    // ۴) صحنه سه‌بعدی هیرو (با جایگزین ۲بعدی در صورت نبود WebGL)
    var canvas = document.getElementById("heroCanvas");
    var scene = null;
    try {
      scene = SM.scene ? SM.scene.init(canvas) : null;
    } catch (e) {
      scene = null;
    }
    if (!scene && canvas && SM.fallback2d) {
      // بوم تازه می‌سازیم تا از context قبلی (WebGL) آزاد باشد
      var fresh = canvas.cloneNode(false);
      canvas.parentNode.replaceChild(fresh, canvas);
      SM.fallback2d.init(fresh);
    }

    // بعد از لود فونت، ارتفاع متن هیرو عوض می‌شود؛ چیدمان صحنه را دوباره حساب کن
    if (scene && scene.relayout && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { scene.relayout(); });
    }
    window.addEventListener("load", function () {
      if (scene && scene.relayout) scene.relayout();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
