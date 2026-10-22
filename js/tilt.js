/* =========================================================
   tilt.js — افکت سه‌بعدی (چرخش کارت‌ها با حرکت موس) + درخشش
   فقط روی دستگاه‌های دارای موس فعال می‌شود تا موبایل سبک بماند.
   ========================================================= */

window.SM = window.SM || {};

SM.tilt = (function () {
  function attach(el) {
    if (el.__tilt) return;
    el.__tilt = true;

    var max = parseFloat(el.getAttribute("data-tilt-max")) || 8;

    var glare = document.createElement("div");
    glare.className = "tilt-glare";
    el.appendChild(glare);

    var raf = null;
    var px = 0, py = 0;

    function apply() {
      raf = null;
      el.style.setProperty("--ry", (px * max).toFixed(2) + "deg");
      el.style.setProperty("--rx", (-py * max).toFixed(2) + "deg");
      el.style.setProperty("--gx", ((px + 0.5) * 100).toFixed(1) + "%");
      el.style.setProperty("--gy", ((py + 0.5) * 100).toFixed(1) + "%");
    }

    el.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      var r = el.getBoundingClientRect();
      px = (e.clientX - r.left) / r.width - 0.5;
      py = (e.clientY - r.top) / r.height - 0.5;
      el.classList.add("is-tilting");
      if (!raf) raf = requestAnimationFrame(apply);
    });

    el.addEventListener("pointerleave", function () {
      px = 0;
      py = 0;
      el.classList.remove("is-tilting");
      if (raf) cancelAnimationFrame(raf);
      apply();
    });
  }

  /* دکمه‌های طلایی کمی به سمت موس کشیده می‌شوند */
  function magnet(el) {
    if (el.__magnet) return;
    el.__magnet = true;
    el.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      var r = el.getBoundingClientRect();
      var x = (e.clientX - r.left - r.width / 2) * 0.18;
      var y = (e.clientY - r.top - r.height / 2) * 0.28;
      el.style.translate = x.toFixed(1) + "px " + y.toFixed(1) + "px";
    });
    el.addEventListener("pointerleave", function () {
      el.style.translate = "";
    });
  }

  function init(root) {
    if (!SM.isFinePointer || SM.reducedMotion) return;
    var scope = root || document;
    Array.prototype.forEach.call(scope.querySelectorAll("[data-tilt]"), attach);
    Array.prototype.forEach.call(scope.querySelectorAll(".btn--gold"), magnet);
  }

  return { init: init };
})();
