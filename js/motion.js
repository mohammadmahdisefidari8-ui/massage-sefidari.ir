/* =========================================================
   motion.js — جلوه‌های حرکتی حرفه‌ای
   ۱) تأخیر پلکانی خودکار برای کارت‌ها   ۲) پارالاکس ملایم پس‌زمینه و تصاویر
   ۳) نور دنبال‌کننده‌ی موس روی کارت‌ها  ۴) موج کلیک روی دکمه‌ها
   همه با احترام به «کاهش حرکت» و بدون تأثیر روی موبایل‌های ضعیف.
   ========================================================= */

window.SM = window.SM || {};

SM.motion = (function () {
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ۱) تأخیر پلکانی */
  function stagger() {
    var groups = [".benefits", ".contact-cards", ".stats", ".reviews", ".tips", ".visit", ".timeline", ".faq"];
    groups.forEach(function (g) {
      $$(g).forEach(function (wrap) {
        $$(".reveal", wrap).forEach(function (el, i) {
          if (!el.style.getPropertyValue("--d")) el.style.setProperty("--d", Math.min(i, 6) * 0.07 + "s");
        });
      });
    });
  }

  /* ۲) پارالاکس: فقط متغیر CSS را عوض می‌کنیم (بدون چیدمان مجدد) */
  function parallax() {
    if (SM.reducedMotion) return;
    var root = document.documentElement;
    var targets = $$("[data-parallax]");
    var ticking = false;

    function update() {
      ticking = false;
      var y = window.scrollY || 0;
      root.style.setProperty("--sy", y.toFixed(0));
      var vh = window.innerHeight;
      targets.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var p = (r.top + r.height / 2 - vh / 2) / vh; // -1..1
        var k = parseFloat(el.getAttribute("data-parallax")) || 30;
        el.style.setProperty("--py", (-p * k).toFixed(1) + "px");
      });
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ۳) نور دنبال‌کننده روی کارت‌ها (فقط موس) */
  function spotlight() {
    if (!SM.isFinePointer || SM.reducedMotion) return;
    document.addEventListener("pointermove", function (e) {
      var card = e.target.closest && e.target.closest(".spot");
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - r.left).toFixed(0) + "px");
      card.style.setProperty("--my", (e.clientY - r.top).toFixed(0) + "px");
    }, { passive: true });
  }

  /* ۴) موج کلیک روی دکمه‌ها */
  function ripple() {
    if (SM.reducedMotion) return;
    document.addEventListener("pointerdown", function (e) {
      var btn = e.target.closest && e.target.closest(".btn");
      if (!btn) return;
      var r = btn.getBoundingClientRect();
      var size = Math.max(r.width, r.height) * 1.6;
      var s = document.createElement("span");
      s.className = "ripple";
      s.style.width = s.style.height = size + "px";
      s.style.left = e.clientX - r.left - size / 2 + "px";
      s.style.top = e.clientY - r.top - size / 2 + "px";
      btn.appendChild(s);
      setTimeout(function () { s.remove(); }, 700);
    });
  }

  function init() {
    stagger();
    parallax();
    spotlight();
    ripple();
  }

  return { init: init };
})();
