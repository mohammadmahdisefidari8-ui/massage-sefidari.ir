/* =========================================================
   gl-geometry.js — ساخت شکل‌ها: بیضی‌گون (سنگ)، حلقه (torus) و دایره تخت (موج)
   خروجی هر تابع: { pos, nrm, idx } آماده آپلود به GPU
   ========================================================= */

window.SM = window.SM || {};

SM.geo = (function () {
  function pack(pos, nrm, idx) {
    return {
      pos: new Float32Array(pos),
      nrm: new Float32Array(nrm),
      idx: new Uint16Array(idx),
    };
  }

  /* سنگ: بیضی‌گون با شعاع‌های a (x)، b (y)، c (z) */
  function ellipsoid(a, b, c, seg, rings) {
    var pos = [], nrm = [], idx = [];
    var i, j;
    for (i = 0; i <= rings; i++) {
      var th = (i / rings) * Math.PI;
      var st = Math.sin(th), ct = Math.cos(th);
      for (j = 0; j <= seg; j++) {
        var ph = (j / seg) * Math.PI * 2;
        var x = st * Math.cos(ph), y = ct, z = st * Math.sin(ph);
        pos.push(x * a, y * b, z * c);
        // نرمال بیضی‌گون = گرادیان معادله سطح
        var nx = x / a, ny = y / b, nz = z / c;
        var l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        nrm.push(nx / l, ny / l, nz / l);
      }
    }
    for (i = 0; i < rings; i++) {
      for (j = 0; j < seg; j++) {
        var p = i * (seg + 1) + j;
        var q = p + seg + 1;
        idx.push(p, q, p + 1, q, q + 1, p + 1);
      }
    }
    return pack(pos, nrm, idx);
  }

  /* حلقه افقی (حول محور Y) با شعاع R و ضخامت r؛ ez کشیدگی در محور z */
  function torus(R, r, segMajor, segMinor, ez) {
    var pos = [], nrm = [], idx = [];
    var i, j;
    ez = ez || 1;
    for (i = 0; i <= segMajor; i++) {
      var u = (i / segMajor) * Math.PI * 2;
      var cu = Math.cos(u), su = Math.sin(u);
      for (j = 0; j <= segMinor; j++) {
        var v = (j / segMinor) * Math.PI * 2;
        var cv = Math.cos(v), sv = Math.sin(v);
        var nx = cv * cu, ny = sv, nz = cv * su;
        pos.push(R * cu + r * nx, r * ny, R * ez * su + r * nz);
        nrm.push(nx, ny, nz);
      }
    }
    for (i = 0; i < segMajor; i++) {
      for (j = 0; j < segMinor; j++) {
        var p = i * (segMinor + 1) + j;
        var q = p + segMinor + 1;
        idx.push(p, q, p + 1, q, q + 1, p + 1);
      }
    }
    return pack(pos, nrm, idx);
  }

  /* حلقه تخت (موج آب) روی صفحه XZ */
  function annulus(inner, outer, seg) {
    var pos = [], nrm = [], idx = [];
    for (var i = 0; i <= seg; i++) {
      var a = (i / seg) * Math.PI * 2;
      var c = Math.cos(a), s = Math.sin(a);
      pos.push(c * inner, 0, s * inner, c * outer, 0, s * outer);
      nrm.push(0, 1, 0, 0, 1, 0);
    }
    for (i = 0; i < seg; i++) {
      var p = i * 2;
      idx.push(p, p + 1, p + 2, p + 1, p + 3, p + 2);
    }
    return pack(pos, nrm, idx);
  }

  return { ellipsoid: ellipsoid, torus: torus, annulus: annulus };
})();
