/* =========================================================
   render.js — ساخت کارت‌های ماساژ، فیلتر، نقطه‌های کاروسل و مودال جزئیات
   ========================================================= */

window.SM = window.SM || {};

SM.render = (function () {
  var grid, filters, dots, modal, dialog, body;
  var lastFocus = null;
  var dotTicking = false;

  function esc(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function byId(id) {
    for (var i = 0; i < SM.massages.length; i++) {
      if (SM.massages[i].id === id) return SM.massages[i];
    }
    return null;
  }

  /* ---------- کارت‌ها ---------- */
  function cardHTML(m, i) {
    var top3 = m.benefits.slice(0, 3).map(function (b) {
      return "<li>" + esc(b) + "</li>";
    }).join("");

    return (
      '<article class="mcard reveal" data-tilt data-tilt-max="7" tabindex="0" role="button"' +
      ' data-id="' + esc(m.id) + '" data-cat="' + esc(m.cat) + '"' +
      ' style="--h:' + m.hue + ";--d:" + ((i % 3) * 0.08).toFixed(2) + 's"' +
      ' aria-label="جزئیات ' + esc(m.name) + '">' +
      '<span class="mcard__orb"></span>' +
      '<span class="mcard__num">' + SM.fa(i + 1) + "</span>" +
      '<span class="mcard__cat">' + esc(SM.categories[m.cat]) + "</span>" +
      "<h3>" + esc(m.name) + "</h3>" +
      '<small class="mcard__en">' + esc(m.en) + "</small>" +
      "<p>" + esc(m.intro) + "</p>" +
      '<ul class="mcard__benefits">' + top3 + "</ul>" +
      '<span class="mcard__more">جزئیات و همه فواید ' +
      '<svg viewBox="0 0 24 24" class="icon"><use href="#i-arrow"/></svg></span>' +
      "</article>"
    );
  }

  function renderCards() {
    grid.innerHTML = SM.massages.map(cardHTML).join("");
  }

  /* ---------- نقطه‌های کاروسل (موبایل) ---------- */
  function visibleCards() {
    return Array.prototype.filter.call(grid.querySelectorAll(".mcard"), function (c) {
      return !c.classList.contains("is-hidden");
    });
  }

  function buildDots() {
    if (!dots) return;
    dots.innerHTML = visibleCards().map(function () { return "<i></i>"; }).join("");
    updateDots();
  }

  function updateDots() {
    dotTicking = false;
    if (!dots) return;
    var cards = visibleCards();
    if (!cards.length) return;
    var gr = grid.getBoundingClientRect();
    var center = gr.left + gr.width / 2;
    var best = 0, bestD = Infinity;
    cards.forEach(function (c, i) {
      var r = c.getBoundingClientRect();
      var d = Math.abs(r.left + r.width / 2 - center);
      if (d < bestD) { bestD = d; best = i; }
    });
    Array.prototype.forEach.call(dots.children, function (d, i) {
      d.classList.toggle("is-on", i === best);
    });
  }

  /* ---------- فیلتر ---------- */
  function applyFilter(key) {
    var cards = grid.querySelectorAll(".mcard");
    var n = 0;
    Array.prototype.forEach.call(cards, function (card) {
      var show = key === "all" || card.getAttribute("data-cat") === key;
      card.classList.toggle("is-hidden", !show);
      if (show) {
        card.classList.add("is-in");
        card.classList.remove("is-entering");
        void card.offsetWidth; // ری‌استارت انیمیشن
        card.style.setProperty("--i", (n * 0.06).toFixed(2) + "s");
        card.classList.add("is-entering");
        n++;
      }
    });
    grid.scrollLeft = 0;
    buildDots();
  }

  function initFilters() {
    filters.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter");
      if (!btn) return;
      Array.prototype.forEach.call(filters.querySelectorAll(".filter"), function (b) {
        b.classList.remove("is-active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-selected", "true");
      applyFilter(btn.getAttribute("data-filter"));
    });
  }

  /* ---------- مودال ---------- */
  function modalHTML(m) {
    var benefits = m.benefits.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("");
    var suitable = m.suitable.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("");
    var wa =
      "https://wa.me/" + SM.config.phoneIntl + "?text=" +
      encodeURIComponent(SM.config.whatsappGreeting + " می‌خواهم برای «" + m.name + "» نوبت رزرو کنم.");

    return (
      '<span class="modal__cat">' + esc(SM.categories[m.cat]) + "</span>" +
      '<h3 class="modal__title" id="modalTitle">' + esc(m.name) + "</h3>" +
      '<span class="modal__en">' + esc(m.en) + "</span>" +
      "<p>" + esc(m.intro) + "</p>" +
      '<div class="modal__section"><h4>فواید این ماساژ</h4><ul class="modal__list">' + benefits + "</ul></div>" +
      '<div class="modal__section"><h4>مناسب برای</h4><ul class="modal__list">' + suitable + "</ul></div>" +
      (m.note ? '<p class="modal__note"><strong>نکته:</strong> ' + esc(m.note) + "</p>" : "") +
      '<div class="modal__actions">' +
      '<a href="#booking" class="btn btn--gold" data-book="' + esc(m.id) + '">رزرو این ماساژ</a>' +
      '<a href="' + wa + '" target="_blank" rel="noopener" class="btn btn--ghost">' +
      '<svg viewBox="0 0 24 24" class="icon"><use href="#i-whatsapp"/></svg>پرسش در واتساپ</a>' +
      "</div>"
    );
  }

  function openModal(id, trigger) {
    var m = byId(id);
    if (!m || !modal) return;
    lastFocus = trigger || document.activeElement;
    body.innerHTML = modalHTML(m);
    dialog.style.setProperty("--h", m.hue);
    dialog.scrollTop = 0;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-locked");
    var close = modal.querySelector(".modal__close");
    if (close) close.focus({ preventScroll: true });
  }

  /* مودال عمومی (برای مقاله‌های نکات سلامت) */
  function openHTML(html, hue, trigger) {
    if (!modal) return;
    lastFocus = trigger || document.activeElement;
    body.innerHTML = html;
    dialog.style.setProperty("--h", hue || 168);
    dialog.scrollTop = 0;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-locked");
    var close = modal.querySelector(".modal__close");
    if (close) close.focus({ preventScroll: true });
  }

  function closeModal() {
    if (!modal.classList.contains("is-open")) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-locked");
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  function initModal() {
    grid.addEventListener("click", function (e) {
      var card = e.target.closest(".mcard");
      if (card) openModal(card.getAttribute("data-id"), card);
    });
    grid.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var card = e.target.closest(".mcard");
      if (card) {
        e.preventDefault();
        openModal(card.getAttribute("data-id"), card);
      }
    });

    modal.addEventListener("click", function (e) {
      if (e.target.closest("[data-close]")) {
        closeModal();
        return;
      }
      var book = e.target.closest("[data-book]");
      if (book) {
        lastFocus = null;
        closeModal();
        if (SM.booking) SM.booking.selectService(book.getAttribute("data-book"));
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeModal();
    });
  }

  function init() {
    grid = document.getElementById("massageGrid");
    filters = document.getElementById("filters");
    dots = document.getElementById("gridDots");
    modal = document.getElementById("modal");
    if (!grid || !filters || !modal || !SM.massages) return;
    dialog = modal.querySelector(".modal__dialog");
    body = document.getElementById("modalBody");

    renderCards();
    initFilters();
    initModal();
    buildDots();

    grid.addEventListener("scroll", function () {
      if (!dotTicking) {
        dotTicking = true;
        requestAnimationFrame(updateDots);
      }
    }, { passive: true });
    window.addEventListener("resize", updateDots);
  }

  return { init: init, open: openModal, openHTML: openHTML };
})();
