/* =========================================================
   finder.js — «کدام ماساژ مناسب شماست؟»
   کاربر هدف و ناحیه بدن را انتخاب می‌کند؛ بر اساس برچسب‌های data.js
   (SM.goals / SM.areas / SM.tags) بهترین ماساژها پیشنهاد می‌شوند.
   ========================================================= */

window.SM = window.SM || {};

SM.finder = (function () {
  var state = { goal: null, areas: [] };
  var goalsBox, areasBox, resultBox, bodyMap;

  function esc(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function labelOf(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i].label;
    return id;
  }

  /* ---------- امتیازدهی ---------- */
  function score(m) {
    var s = 0;
    var goalHit = state.goal && m.goals.indexOf(state.goal) > -1;
    if (goalHit) s += 3;
    var areaHits = state.areas.filter(function (a) { return m.areas.indexOf(a) > -1; });
    s += Math.min(areaHits.length, 3) * 1.5;
    return { s: s, goalHit: goalHit, areaHits: areaHits };
  }

  function recommend() {
    var list = SM.massages.map(function (m, i) {
      var r = score(m);
      return { m: m, i: i, s: r.s, goalHit: r.goalHit, areaHits: r.areaHits };
    }).filter(function (x) { return x.s > 0; });
    list.sort(function (a, b) { return b.s - a.s || a.i - b.i; });
    return list.slice(0, 2);
  }

  function reasonText(x) {
    var parts = [];
    if (x.goalHit) parts.push("«" + labelOf(SM.goals, state.goal) + "»");
    if (x.areaHits.length) {
      parts.push(x.areaHits.map(function (a) { return labelOf(SM.areas, a); }).join("، "));
    }
    return "مناسب برای " + parts.join(" و ") + ".";
  }

  /* ---------- نمایش ---------- */
  function renderResult() {
    if (!state.goal && !state.areas.length) {
      resultBox.innerHTML =
        '<div class="finder__empty"><svg viewBox="0 0 24 24" class="icon"><use href="#i-sparkle"/></svg>' +
        "<span>هدف یا ناحیه‌ی بدن را انتخاب کنید تا پیشنهادها اینجا نمایش داده شوند.</span></div>";
      return;
    }
    var recs = recommend();
    if (!recs.length) {
      resultBox.innerHTML =
        '<div class="finder__empty"><span>برای این ترکیب پیشنهاد مشخصی ندارم. با من تماس بگیرید تا با هم انتخاب کنیم.</span></div>';
      return;
    }
    resultBox.innerHTML = recs.map(function (x, n) {
      return (
        '<article class="rcard" style="--h:' + x.m.hue + ";--i:" + (n * 0.1).toFixed(2) + 's">' +
        '<span class="rcard__tag">' + (n === 0 ? "بهترین پیشنهاد" : "گزینه دوم") + "</span>" +
        "<h4>" + esc(x.m.name) + "</h4>" +
        "<p>" + esc(reasonText(x)) + "</p>" +
        '<div class="rcard__actions">' +
        '<button type="button" class="btn btn--ghost" data-open="' + esc(x.m.id) + '">جزئیات و فواید</button>' +
        '<a href="#booking" class="btn btn--gold" data-book="' + esc(x.m.id) + '">رزرو</a>' +
        "</div></article>"
      );
    }).join("");
  }

  function syncUI() {
    Array.prototype.forEach.call(goalsBox.children, function (b) {
      b.setAttribute("aria-checked", b.getAttribute("data-id") === state.goal ? "true" : "false");
    });
    Array.prototype.forEach.call(areasBox.children, function (b) {
      b.setAttribute("aria-pressed", state.areas.indexOf(b.getAttribute("data-id")) > -1 ? "true" : "false");
    });
    Array.prototype.forEach.call(bodyMap.querySelectorAll(".zone"), function (z) {
      z.classList.toggle("is-on", state.areas.indexOf(z.getAttribute("data-zone")) > -1);
    });
    renderResult();
  }

  /* ---------- رویدادها ---------- */
  function toggleArea(id) {
    var i = state.areas.indexOf(id);
    if (id === "full") {
      state.areas = i > -1 ? [] : ["full"];
    } else {
      state.areas = state.areas.filter(function (a) { return a !== "full"; });
      if (i > -1) state.areas = state.areas.filter(function (a) { return a !== id; });
      else state.areas.push(id);
    }
    syncUI();
  }

  function build() {
    goalsBox.innerHTML = SM.goals.map(function (g) {
      return '<button type="button" class="choice" role="radio" aria-checked="false" data-id="' + g.id + '">' + esc(g.label) + "</button>";
    }).join("");
    areasBox.innerHTML = SM.areas.map(function (a) {
      return '<button type="button" class="choice" aria-pressed="false" data-id="' + a.id + '">' + esc(a.label) + "</button>";
    }).join("");

    goalsBox.addEventListener("click", function (e) {
      var b = e.target.closest(".choice");
      if (!b) return;
      var id = b.getAttribute("data-id");
      state.goal = state.goal === id ? null : id;
      syncUI();
    });

    areasBox.addEventListener("click", function (e) {
      var b = e.target.closest(".choice");
      if (b) toggleArea(b.getAttribute("data-id"));
    });

    bodyMap.addEventListener("click", function (e) {
      var z = e.target.closest(".zone");
      if (z) toggleArea(z.getAttribute("data-zone"));
    });
    bodyMap.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var z = e.target.closest(".zone");
      if (z) {
        e.preventDefault();
        toggleArea(z.getAttribute("data-zone"));
      }
    });

    resultBox.addEventListener("click", function (e) {
      var open = e.target.closest("[data-open]");
      if (open && SM.render) {
        SM.render.open(open.getAttribute("data-open"), open);
        return;
      }
      var book = e.target.closest("[data-book]");
      if (book && SM.booking) SM.booking.selectService(book.getAttribute("data-book"));
    });
  }

  function init() {
    goalsBox = document.getElementById("finderGoals");
    areasBox = document.getElementById("finderAreas");
    resultBox = document.getElementById("finderResult");
    bodyMap = document.getElementById("bodyMap");
    if (!goalsBox || !areasBox || !resultBox || !bodyMap || !SM.goals) return;
    build();
    syncUI();
  }

  return { init: init };
})();
