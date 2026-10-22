/* =========================================================
   gl-shaders.js — کد شیدرها (GLSL ES 1.0 برای حداکثر سازگاری)
   stone : سنگ پاستلی براق با نور گرم و حاشیه طلایی (fresnel)
   flat  : رنگ ساده (حلقه‌های طلایی و موج آب)
   points: ذرات و گوی‌های درخشان با اندازه متناسب با فاصله
   ========================================================= */

window.SM = window.SM || {};

SM.shaders = (function () {
  var PRECISION =
    "#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n";

  /* ---------- سنگ ---------- */
  var stoneVS =
    "attribute vec3 a_pos;\n" +
    "attribute vec3 a_nrm;\n" +
    "uniform mat4 u_vp;\n" +
    "uniform mat4 u_model;\n" +
    "varying vec3 v_n;\n" +
    "varying vec3 v_w;\n" +
    "varying vec3 v_l;\n" +
    "void main(){\n" +
    "  vec4 w = u_model * vec4(a_pos, 1.0);\n" +
    "  v_w = w.xyz;\n" +
    "  v_l = a_pos;\n" +
    "  v_n = mat3(u_model) * a_nrm;\n" +
    "  gl_Position = u_vp * w;\n" +
    "}\n";

  var stoneFS =
    PRECISION +
    "varying vec3 v_n;\n" +
    "varying vec3 v_w;\n" +
    "varying vec3 v_l;\n" +
    "uniform vec3 u_cam;\n" +
    "uniform vec3 u_base;\n" +
    "void main(){\n" +
    "  vec3 n = normalize(v_n);\n" +
    "  vec3 v = normalize(u_cam - v_w);\n" +
    "  vec3 l1 = normalize(vec3(0.5, 0.9, 0.8));\n" +
    "  vec3 l2 = normalize(vec3(-0.8, 0.2, 0.5));\n" +
    "  float d1 = max(dot(n, l1), 0.0);\n" +
    "  float d2 = max(dot(n, l2), 0.0);\n" +
    "  float s1 = pow(max(dot(n, normalize(l1 + v)), 0.0), 60.0);\n" +
    "  float fres = pow(1.0 - max(dot(n, v), 0.0), 2.5);\n" +
    "  float vein = sin(v_l.y * 9.0 + sin(v_l.x * 3.0 + v_l.z * 2.0) * 1.6) * 0.5 + 0.5;\n" +
    "  vec3 col = u_base * (0.9 + 0.1 * vein);\n" +
    "  col *= 0.6 + 0.4 * d1 + 0.12 * d2;\n" +
    "  col *= 0.84 + 0.16 * (n.y * 0.5 + 0.5);\n" +
    "  col += vec3(1.0, 0.97, 0.9) * s1 * 0.7;\n" +
    "  col = mix(col, vec3(0.6, 0.95, 0.88), d2 * 0.14);\n" +
    "  col = mix(col, vec3(0.86, 0.62, 0.2), fres * 0.38);\n" +
    "  gl_FragColor = vec4(col, 1.0);\n" +
    "}\n";

  /* ---------- رنگ ساده ---------- */
  var flatVS =
    "attribute vec3 a_pos;\n" +
    "uniform mat4 u_vp;\n" +
    "uniform mat4 u_model;\n" +
    "void main(){ gl_Position = u_vp * u_model * vec4(a_pos, 1.0); }\n";

  var flatFS =
    PRECISION +
    "uniform vec4 u_color;\n" +
    "void main(){ gl_FragColor = vec4(u_color.rgb * u_color.a, u_color.a); }\n";

  /* ---------- ذرات ---------- */
  var pointsVS =
    "attribute vec3 a_pos;\n" +
    "attribute vec4 a_col;\n" +
    "attribute float a_size;\n" +
    "uniform mat4 u_mvp;\n" +
    "uniform float u_time;\n" +
    "uniform float u_scale;\n" +
    "uniform float u_max;\n" +
    "uniform float u_drift;\n" +
    "varying vec3 v_c;\n" +
    "varying float v_a;\n" +
    "void main(){\n" +
    "  float s = a_col.a;\n" +
    "  vec3 p = a_pos;\n" +
    "  p.y += sin(u_time * 0.4 + s * 20.0) * 0.25 * u_drift;\n" +
    "  p.x += cos(u_time * 0.3 + s * 13.0) * 0.18 * u_drift;\n" +
    "  vec4 clip = u_mvp * vec4(p, 1.0);\n" +
    "  gl_Position = clip;\n" +
    "  gl_PointSize = min(a_size * u_scale / max(clip.w, 0.1), u_max);\n" +
    "  v_c = a_col.rgb;\n" +
    "  v_a = 0.6 + 0.4 * sin(u_time * 1.6 * u_drift + s * 40.0);\n" +
    "}\n";

  var pointsFS =
    PRECISION +
    "varying vec3 v_c;\n" +
    "varying float v_a;\n" +
    "uniform float u_gain;\n" +
    "void main(){\n" +
    "  float r = length(gl_PointCoord - 0.5) * 2.0;\n" +
    "  float a = 1.0 - smoothstep(0.0, 1.0, r);\n" +
    "  a = a * a * v_a * u_gain;\n" +
    "  gl_FragColor = vec4(v_c * a, a);\n" +
    "}\n";

  return {
    stone: { vs: stoneVS, fs: stoneFS },
    flat: { vs: flatVS, fs: flatFS },
    points: { vs: pointsVS, fs: pointsFS },
  };
})();
