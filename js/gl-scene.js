/* =========================================================
   gl-scene.js — صحنه سه‌بعدی هیرو (WebGL خالص، بدون Three.js)
   پشته سنگ‌های پاستلی متعادل + حلقه‌های موج آب + گوی‌های مداری + ذرات رنگی
   - کیفیت خودکار: روی گوشی ضعیف، رزولوشن کم می‌شود
   - وقتی هیرو دیده نمی‌شود یا تب مخفی است، رندر متوقف می‌شود
   - اگر WebGL نباشد false برمی‌گرداند و fallback2d جایگزین می‌شود
   ========================================================= */

window.SM = window.SM || {};

SM.scene = (function () {
  var FOV = (40 * Math.PI) / 180;
  var DIST = 11;

  var RADII = [1.55, 1.2, 0.92, 0.62];
  // رنگ پاستلی سنگ‌ها: کرم، نعنایی، هلویی، یاسی
  var BASES = [
    [0.98, 0.93, 0.84],
    [0.8, 0.94, 0.9],
    [0.99, 0.87, 0.82],
    [0.88, 0.85, 0.98],
  ];
  var SPEEDS = [0.3, -0.22, 0.18, -0.26];

  var ORBIT_COLORS = [
    [0.07, 0.72, 0.62],
    [0.92, 0.66, 0.15],
    [0.92, 0.28, 0.5],
    [0.48, 0.35, 0.94],
    [0.07, 0.72, 0.62],
    [0.92, 0.66, 0.15],
    [0.48, 0.35, 0.94],
  ];

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function init(canvas) {
    var m4 = SM.m4;
    if (!m4 || !SM.geo || !SM.shaders || !canvas) return false;

    var gl = null;
    try {
      var opts = { antialias: true, alpha: true, premultipliedAlpha: true, depth: true };
      gl = canvas.getContext("webgl", opts) || canvas.getContext("experimental-webgl", opts);
    } catch (e) {
      gl = null;
    }
    if (!gl) return false;

    var isMobile = Math.min(window.innerWidth, window.innerHeight) < 700;

    /* ---------- متغیرهای حالت ---------- */
    var pStone, pFlat, pPts;
    var stones, rims, ripples, shadowMesh, orbBuf, orbData, orbCount, cloudBuf, cloudCount;
    var stackH = 3;
    var maxPoint = 64;

    var P = m4.create(), VP = m4.create(), TCAM = m4.create();
    var G = m4.create(), L = m4.create(), M = m4.create(), MV = m4.create();
    var camPos = new Float32Array([0, 0, DIST]);

    var aspect = 1, pxScale = 1, perfScale = 1;
    var gx = 0, gy = 0, gS = 1;
    var tx = 0, ty = 0, mx = 0, my = 0;
    var raf = null, running = false, lost = false, heroVisible = true;
    var startTime = performance.now();
    var lastOpacity = -1;

    /* ---------- ابزارهای WebGL ---------- */
    function compile(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        if (window.console) console.warn("shader:", gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    }

    function program(def) {
      var vs = compile(gl.VERTEX_SHADER, def.vs);
      var fs = compile(gl.FRAGMENT_SHADER, def.fs);
      if (!vs || !fs) return null;
      var p = gl.createProgram();
      gl.attachShader(p, vs);
      gl.attachShader(p, fs);
      gl.bindAttribLocation(p, 0, "a_pos");
      gl.bindAttribLocation(p, 1, "a_nrm");
      gl.bindAttribLocation(p, 2, "a_col");
      gl.bindAttribLocation(p, 3, "a_size");
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
      p.u = {};
      return p;
    }

    function U(p, name) {
      if (!(name in p.u)) p.u[name] = gl.getUniformLocation(p, name);
      return p.u[name];
    }

    function buffer(target, data, usage) {
      var b = gl.createBuffer();
      gl.bindBuffer(target, b);
      gl.bufferData(target, data, usage || gl.STATIC_DRAW);
      return b;
    }

    function mesh(g) {
      return {
        pos: buffer(gl.ARRAY_BUFFER, g.pos),
        nrm: buffer(gl.ARRAY_BUFFER, g.nrm),
        idx: buffer(gl.ELEMENT_ARRAY_BUFFER, g.idx),
        count: g.idx.length,
      };
    }

    function drawMesh(m, withNormals) {
      gl.bindBuffer(gl.ARRAY_BUFFER, m.pos);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      if (withNormals) {
        gl.bindBuffer(gl.ARRAY_BUFFER, m.nrm);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
      } else {
        gl.disableVertexAttribArray(1);
      }
      gl.disableVertexAttribArray(2);
      gl.disableVertexAttribArray(3);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.idx);
      gl.drawElements(gl.TRIANGLES, m.count, gl.UNSIGNED_SHORT, 0);
    }

    function drawPoints(buf, count, mvp, t, drift, gain) {
      gl.useProgram(pPts);
      gl.uniformMatrix4fv(U(pPts, "u_mvp"), false, mvp);
      gl.uniform1f(U(pPts, "u_time"), t);
      gl.uniform1f(U(pPts, "u_scale"), pxScale);
      gl.uniform1f(U(pPts, "u_max"), maxPoint);
      gl.uniform1f(U(pPts, "u_drift"), drift);
      gl.uniform1f(U(pPts, "u_gain"), gain);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0);
      gl.enableVertexAttribArray(2);
      gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 32, 12);
      gl.enableVertexAttribArray(3);
      gl.vertexAttribPointer(3, 1, gl.FLOAT, false, 32, 28);
      gl.disableVertexAttribArray(1);
      gl.drawArrays(gl.POINTS, 0, count);
    }

    /* ---------- ساخت صحنه ---------- */
    function setup() {
      pStone = program(SM.shaders.stone);
      pFlat = program(SM.shaders.flat);
      pPts = program(SM.shaders.points);
      if (!pStone || !pFlat || !pPts) return false;

      var range = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);
      maxPoint = range && range[1] ? Math.min(range[1], 256) : 64;

      // پشته سنگ‌ها
      stones = [];
      rims = [];
      var baseY = 0;
      var i;
      for (i = 0; i < RADII.length; i++) {
        var r = RADII[i];
        var h = r * 0.36;
        var y = baseY + h;
        stones.push({
          mesh: mesh(SM.geo.ellipsoid(r, h, r * 0.92, isMobile ? 40 : 56, isMobile ? 26 : 36)),
          y: y,
          base: new Float32Array(BASES[i]),
          speed: SPEEDS[i],
          phase: i * 1.3,
        });
        rims.push({ mesh: mesh(SM.geo.torus(r * 1.002, 0.016, 140, 8, 0.92)), y: y, speed: SPEEDS[i], phase: i * 1.3 });
        baseY += h * 2 * 0.86;
      }
      stackH = baseY + RADII[RADII.length - 1] * 0.36 * 0.3;
      for (i = 0; i < stones.length; i++) {
        stones[i].y -= stackH / 2;
        rims[i].y -= stackH / 2;
      }

      // سایه نرم زیر پشته (چند دیسک شفاف روی هم)
      shadowMesh = mesh(SM.geo.ellipsoid(1, 0.002, 1, 40, 4));

      // موج‌های آب
      var ringGeo = mesh(SM.geo.annulus(0.965, 1, 128));
      ripples = [ringGeo, ringGeo, ringGeo];

      // گوی‌های مداری + گوی بالای پشته (بافر پویا)
      orbCount = 2 + ORBIT_COLORS.length;
      orbData = new Float32Array(orbCount * 8);
      orbBuf = buffer(gl.ARRAY_BUFFER, orbData, gl.DYNAMIC_DRAW);
      setOrb(0, 0, 0, 0, 0.95, 0.68, 0.16, 0.11, 1.6);
      setOrb(1, 0, 0, 0, 1.0, 0.85, 0.45, 0.2, 0.55);
      for (i = 0; i < ORBIT_COLORS.length; i++) {
        var c = ORBIT_COLORS[i];
        setOrb(2 + i, 0, 0, 0, c[0], c[1], c[2], 0.3 + i * 0.37, 0.55 + (i % 3) * 0.18);
      }

      // ذرات
      cloudCount = isMobile ? 260 : 620;
      var cd = new Float32Array(cloudCount * 8);
      var palette = [
        [0.92, 0.66, 0.15],
        [0.07, 0.72, 0.62],
        [0.48, 0.35, 0.94],
        [0.92, 0.28, 0.5],
      ];
      for (i = 0; i < cloudCount; i++) {
        var rad = 3 + Math.random() * 8;
        var th = Math.random() * Math.PI * 2;
        var ph = Math.acos(2 * Math.random() - 1);
        var pick = Math.random();
        var col = palette[Math.min(3, Math.floor(pick * 4))];
        var o = i * 8;
        cd[o] = rad * Math.sin(ph) * Math.cos(th);
        cd[o + 1] = rad * Math.cos(ph) * 0.7;
        cd[o + 2] = rad * Math.sin(ph) * Math.sin(th);
        cd[o + 3] = col[0];
        cd[o + 4] = col[1];
        cd[o + 5] = col[2];
        cd[o + 6] = Math.random();
        cd[o + 7] = 0.06 + Math.random() * 0.1;
      }
      cloudBuf = buffer(gl.ARRAY_BUFFER, cd);

      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.clearColor(0, 0, 0, 0);
      return true;
    }

    /* گوی شماره i را در بافر می‌نویسد: موقعیت، رنگ، seed، اندازه */
    function setOrb(i, x, y, z, r, g, b, seed, size) {
      var o = i * 8;
      orbData[o] = x;
      orbData[o + 1] = y;
      orbData[o + 2] = z;
      orbData[o + 3] = r;
      orbData[o + 4] = g;
      orbData[o + 5] = b;
      orbData[o + 6] = seed;
      orbData[o + 7] = size;
    }

    /* ---------- اندازه و چیدمان ---------- */
    function resize() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      var dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.75 : 2) * perfScale;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      aspect = w / h;
      m4.perspective(P, FOV, aspect, 0.1, 80);
      m4.translation(TCAM, 0, 0, -DIST);
      m4.multiply(VP, P, TCAM);
      pxScale = canvas.height / (2 * Math.tan(FOV / 2));
      layout();
    }

    function layout() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      var halfH = DIST * Math.tan(FOV / 2);
      var halfW = halfH * aspect;
      var unit = h / (2 * halfH); // پیکسل CSS به‌ازای هر واحد دنیا
      var fullH = stackH + 1.6; // ارتفاع پشته + گوی بالا

      if (aspect > 1.15) {
        // حالت کنار هم: متن راست، صحنه چپ
        gS = clamp((h * 0.62) / (fullH * unit), 0.5, 1.15);
        gx = -halfW * (w > 900 ? 0.5 : 0.52);
        gy = 0;
      } else {
        // حالت عمودی: صحنه بالای متن، در فضای خالی بین هدر و متن
        var hero = canvas.parentElement;
        var content = hero ? hero.querySelector(".hero__content") : null;
        var topPx = 70;
        var bottomPx = h * 0.45;
        if (content) {
          bottomPx = content.getBoundingClientRect().top - hero.getBoundingClientRect().top - 6;
        }
        var band = Math.max(bottomPx - topPx, 110);
        gS = clamp((band * 0.9) / (fullH * unit), 0.38, 1.05);
        gS = Math.min(gS, (w * 0.78) / (RADII[0] * 2 * unit));
        gx = 0;
        gy = (h / 2 - (topPx + band / 2)) / unit;
      }
    }

    /* ---------- یک فریم ---------- */
    function render(t) {
      var sy = window.scrollY || 0;
      var vh = window.innerHeight || 1;
      var fade = clamp(1 - sy / (vh * 0.9), 0, 1);
      if (Math.abs(fade - lastOpacity) > 0.01) {
        canvas.style.opacity = fade.toFixed(2);
        lastOpacity = fade;
      }

      mx += (tx - mx) * 0.05;
      my += (ty - my) * 0.05;

      var gry = mx * 0.3 + Math.sin(t * 0.3) * 0.08 + sy * 0.0025;
      var grx = my * 0.14;
      m4.compose(G, gx, gy + Math.sin(t * 0.9) * 0.09, 0, gry, grx, gS);

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // --- سنگ‌ها (مات) ---
      gl.disable(gl.BLEND);
      gl.depthMask(true);
      gl.useProgram(pStone);
      gl.uniformMatrix4fv(U(pStone, "u_vp"), false, VP);
      gl.uniform3fv(U(pStone, "u_cam"), camPos);
      var i, s;
      for (i = 0; i < stones.length; i++) {
        s = stones[i];
        m4.compose(L, 0, s.y, 0, t * s.speed + s.phase, 0, 1);
        m4.multiply(M, G, L);
        gl.uniformMatrix4fv(U(pStone, "u_model"), false, M);
        gl.uniform3fv(U(pStone, "u_base"), s.base);
        drawMesh(s.mesh, true);
      }

      // --- حلقه‌های طلایی ---
      gl.useProgram(pFlat);
      gl.uniformMatrix4fv(U(pFlat, "u_vp"), false, VP);
      gl.uniform4f(U(pFlat, "u_color"), 0.84, 0.6, 0.12, 1);
      for (i = 0; i < rims.length; i++) {
        s = rims[i];
        m4.compose(L, 0, s.y, 0, t * s.speed + s.phase, 0, 1);
        m4.multiply(M, G, L);
        gl.uniformMatrix4fv(U(pFlat, "u_model"), false, M);
        drawMesh(s.mesh, false);
      }

      // --- موج‌های آب (جمع‌شونده) ---
      gl.enable(gl.BLEND);
      gl.depthMask(false);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      // سایه نرم زیر پشته
      var shadowY = -stackH / 2 - 0.02;
      gl.useProgram(pFlat);
      for (i = 0; i < 5; i++) {
        m4.compose(L, 0, shadowY, 0, 0, 0, 1.25 + i * 0.3);
        m4.multiply(M, G, L);
        gl.uniformMatrix4fv(U(pFlat, "u_model"), false, M);
        gl.uniform4f(U(pFlat, "u_color"), 0.42, 0.3, 0.1, 0.075);
        drawMesh(shadowMesh, false);
      }

      var rippleY = -stackH / 2 - 0.1;
      for (i = 0; i < ripples.length; i++) {
        var k = (t * 0.22 + i / ripples.length) % 1;
        var sc = 1.7 + k * 3.6;
        m4.compose(L, 0, rippleY, 0, 0, 0, sc);
        m4.multiply(M, G, L);
        gl.useProgram(pFlat);
        gl.uniformMatrix4fv(U(pFlat, "u_model"), false, M);
        gl.uniform4f(U(pFlat, "u_color"), 0.8, 0.56, 0.12, (1 - k) * 0.5);
        drawMesh(ripples[i], false);
      }

      // --- گوی‌ها و ذرات (درخشان) ---
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      var topY = stackH / 2 + 0.5 + Math.sin(t * 2) * 0.08;
      orbData[1] = topY;
      orbData[9] = topY;
      for (i = 0; i < ORBIT_COLORS.length; i++) {
        var o = (2 + i) * 8;
        var a = t * (0.25 + (i % 3) * 0.12) + (i / ORBIT_COLORS.length) * Math.PI * 2;
        var rad = 2.6 + (i % 4) * 0.5;
        orbData[o] = Math.cos(a) * rad;
        orbData[o + 1] = (i % 2 ? 1 : -1) * (0.4 + (i % 3) * 0.55) + Math.sin(a * 1.7) * 0.35;
        orbData[o + 2] = Math.sin(a) * rad * 0.7;
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, orbBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, orbData);
      m4.multiply(MV, VP, G);
      drawPoints(orbBuf, orbCount, MV, t, 0, 1.0);

      m4.compose(L, gx * 0.35, 0, 0, t * 0.03, Math.sin(t * 0.05) * 0.05, 1);
      m4.multiply(M, VP, L);
      drawPoints(cloudBuf, cloudCount, M, t, 1, 0.5);

      gl.depthMask(true);
    }

    /* ---------- حلقه رندر و کیفیت خودکار ---------- */
    var frames = 0, acc = 0, lastTs = 0, tuned = 0;

    function loop(ts) {
      raf = requestAnimationFrame(loop);
      var dt = lastTs ? ts - lastTs : 16;
      lastTs = ts;
      render((performance.now() - startTime) / 1000);

      // بعد از ۹۰ فریم: اگر کند بود رزولوشن را کم کن (حداکثر ۳ بار)
      if (tuned < 3 && dt < 250) {
        acc += dt;
        frames++;
        if (frames >= 90) {
          if (acc / frames > 27 && perfScale > 0.5) {
            perfScale -= 0.2;
            resize();
          }
          frames = 0;
          acc = 0;
          tuned++;
        }
      }
    }

    function start() {
      if (running || lost) return;
      running = true;
      lastTs = 0;
      raf = requestAnimationFrame(loop);
    }

    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    }

    function syncRunning() {
      if (heroVisible && !document.hidden && !lost && !SM.reducedMotion) start();
      else stop();
    }

    /* ---------- راه‌اندازی ---------- */
    if (!setup()) return false;
    resize();

    window.addEventListener("resize", function () {
      isMobile = Math.min(window.innerWidth, window.innerHeight) < 700;
      resize();
      if (SM.reducedMotion) render(0.8);
    });

    window.addEventListener(
      "pointermove",
      function (e) {
        tx = (e.clientX / window.innerWidth) * 2 - 1;
        ty = (e.clientY / window.innerHeight) * 2 - 1;
      },
      { passive: true }
    );

    if ("ResizeObserver" in window) {
      var hero = canvas.parentElement;
      var content = hero && hero.querySelector(".hero__content");
      if (content) new ResizeObserver(layout).observe(content);
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
        syncRunning();
      }).observe(canvas);
    }
    document.addEventListener("visibilitychange", syncRunning);

    canvas.addEventListener("webglcontextlost", function (e) {
      e.preventDefault();
      lost = true;
      stop();
    });
    canvas.addEventListener("webglcontextrestored", function () {
      lost = false;
      if (setup()) {
        resize();
        syncRunning();
      }
    });

    if (SM.reducedMotion) render(0.8);
    else start();

    return { relayout: layout };
  }

  return { init: init };
})();
