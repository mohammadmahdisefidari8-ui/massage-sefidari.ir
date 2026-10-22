/* =========================================================
   gl-math.js — ریاضیات ماتریسی کوچک (۴×۴، ستون‌محور) برای صحنه سه‌بعدی
   ========================================================= */

window.SM = window.SM || {};

SM.m4 = (function () {
  var tmp = new Float32Array(16);
  var rA = new Float32Array(16);
  var rB = new Float32Array(16);

  function create() {
    var m = new Float32Array(16);
    m[0] = m[5] = m[10] = m[15] = 1;
    return m;
  }

  function identity(o) {
    o.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    return o;
  }

  /* o = a × b */
  function multiply(o, a, b) {
    for (var c = 0; c < 4; c++) {
      for (var r = 0; r < 4; r++) {
        tmp[c * 4 + r] =
          a[r] * b[c * 4] +
          a[4 + r] * b[c * 4 + 1] +
          a[8 + r] * b[c * 4 + 2] +
          a[12 + r] * b[c * 4 + 3];
      }
    }
    o.set(tmp);
    return o;
  }

  function perspective(o, fovy, aspect, near, far) {
    var t = 1 / Math.tan(fovy / 2);
    var nf = 1 / (near - far);
    o.set([t / aspect, 0, 0, 0, 0, t, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
    return o;
  }

  function translation(o, x, y, z) {
    identity(o);
    o[12] = x;
    o[13] = y;
    o[14] = z;
    return o;
  }

  function rotX(o, a) {
    var c = Math.cos(a), s = Math.sin(a);
    o.set([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
    return o;
  }

  function rotY(o, a) {
    var c = Math.cos(a), s = Math.sin(a);
    o.set([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]);
    return o;
  }

  /* o = T(tx,ty,tz) × Ry(ry) × Rx(rx) × S(s) */
  function compose(o, tx, ty, tz, ry, rx, s) {
    rotY(rA, ry);
    rotX(rB, rx);
    multiply(o, rA, rB);
    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 3; j++) o[i * 4 + j] *= s;
    }
    o[12] = tx;
    o[13] = ty;
    o[14] = tz;
    return o;
  }

  return {
    create: create,
    identity: identity,
    multiply: multiply,
    perspective: perspective,
    translation: translation,
    rotX: rotX,
    rotY: rotY,
    compose: compose,
  };
})();
