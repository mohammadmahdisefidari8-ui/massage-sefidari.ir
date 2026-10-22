/* =========================================================
   fallback2d.js — پس‌زمینه جایگزین (Canvas دوبعدی)
   فقط وقتی استفاده می‌شود که Three.js یا WebGL در دسترس نباشد.
   پشته سنگ‌ها، هاله‌های رنگی و ذرات شناور را رسم می‌کند.
   ========================================================= */

window.SM = window.SM || {};

SM.fallback2d = (function () {
  function init(canvas) {
    if (!canvas) return false;
    var ctx = canvas.getContext("2d");
    if (!ctx) return false;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0;
    var mx = 0, my = 0, tx = 0, ty = 0;
    var particles = [];
    var blobs = [
      { x: 0.2, y: 0.3, r: 0.38, c: "18,184,158", s: 0.00021, p: 0 },
      { x: 0.8, y: 0.2, r: 0.34, c: "138,107,255", s: 0.00017, p: 2 },
      { x: 0.6, y: 0.85, r: 0.36, c: "240,190,70", s: 0.00023, p: 4 },
    ];

    function resize() {
      w = canvas.clientWidth || window.innerWidth;
      h = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var n = w < 760 ? 40 : 80;
      particles = [];
      for (var i = 0; i < n; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.8 + Math.random() * 2.2,
          v: 0.12 + Math.random() * 0.4,
          c: Math.random() < 0.55 ? "201,143,30" : "14,170,148",
          a: 0.3 + Math.random() * 0.6,
        });
      }
    }

    window.addEventListener("pointermove", function (e) {
      tx = (e.clientX / window.innerWidth) * 2 - 1;
      ty = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });

    function drawBlobs(t) {
      ctx.globalCompositeOperation = "source-over";
      blobs.forEach(function (b) {
        var cx = (b.x + Math.sin(t * b.s * 1000 + b.p) * 0.06) * w;
        var cy = (b.y + Math.cos(t * b.s * 1000 + b.p) * 0.06) * h;
        var r = b.r * Math.max(w, h) * 0.6;
        var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, "rgba(" + b.c + ",0.2)");
        g.addColorStop(1, "rgba(" + b.c + ",0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      });
      ctx.globalCompositeOperation = "source-over";
    }

    function drawStones(t) {
      var mobile = w < 900;
      var cx = (mobile ? w * 0.5 : w * 0.27) + mx * 12;
      var cy = (mobile ? h * 0.3 : h * 0.52) + Math.sin(t * 0.0009) * 8;
      var scale = Math.min(w, h) / (mobile ? 700 : 600);
      var sizes = [
        { rx: 150, ry: 46 },
        { rx: 116, ry: 38 },
        { rx: 86, ry: 30 },
        { rx: 56, ry: 22 },
      ];
      var y = cy + 100 * scale;

      // موج‌ها
      for (var k = 0; k < 3; k++) {
        var tt = ((t * 0.00022) + k / 3) % 1;
        ctx.beginPath();
        ctx.ellipse(cx, y + 36 * scale, (170 + tt * 220) * scale, (44 + tt * 56) * scale, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(201,143,30," + ((1 - tt) * 0.5).toFixed(3) + ")";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      sizes.forEach(function (s) {
        var rx = s.rx * scale, ry = s.ry * scale;
        var yy = y - ry * 0.85;
        var g = ctx.createRadialGradient(cx - rx * 0.3, yy - ry * 0.5, 4, cx, yy, rx);
        g.addColorStop(0, "#ffffff");
        g.addColorStop(0.6, "#f3e8d0");
        g.addColorStop(1, "#dcc9a0");
        ctx.beginPath();
        ctx.ellipse(cx, yy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.shadowColor = "rgba(120,90,20,0.25)";
        ctx.shadowBlur = 24;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(201,143,30,0.9)";
        ctx.lineWidth = 1.4;
        ctx.stroke();
        y -= ry * 1.7;
      });

      // گوی بالا
      var oy = y - 24 * scale + Math.sin(t * 0.002) * 5;
      var og = ctx.createRadialGradient(cx, oy, 0, cx, oy, 40 * scale);
      og.addColorStop(0, "rgba(255,226,140,1)");
      og.addColorStop(0.2, "rgba(236,180,60,0.6)");
      og.addColorStop(1, "rgba(236,180,60,0)");
      ctx.fillStyle = og;
      ctx.beginPath();
      ctx.arc(cx, oy, 40 * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawParticles() {
      particles.forEach(function (p) {
        p.y -= p.v;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        ctx.beginPath();
        ctx.arc(p.x + mx * 8 * p.r, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + p.c + "," + p.a + ")";
        ctx.fill();
      });
    }

    function frame(t) {
      mx += (tx - mx) * 0.05;
      my += (ty - my) * 0.05;
      ctx.clearRect(0, 0, w, h);
      drawBlobs(t);
      drawStones(t);
      drawParticles();
    }

    resize();
    window.addEventListener("resize", resize);

    if (SM.reducedMotion) {
      frame(0);
      return true;
    }

    var raf = null;
    function loop(t) {
      raf = requestAnimationFrame(loop);
      frame(t);
    }
    function start() { if (!raf) raf = requestAnimationFrame(loop); }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

    var visible = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && !document.hidden) start(); else stop();
      }).observe(canvas);
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else if (visible) start();
    });
    start();
    return true;
  }

  return { init: init };
})();
