/* =========================================================
   extras.js — نظرات مراجعین و نکات سلامت
   داده‌ها از content.js و config.js خوانده می‌شوند.
   ========================================================= */

window.SM = window.SM || {};

SM.extras = (function () {
  function esc(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function icon(id) {
    return '<svg viewBox="0 0 24 24" class="icon"><use href="#' + id + '"/></svg>';
  }
  function waLink(text) {
    return "https://wa.me/" + SM.config.phoneIntl + "?text=" + encodeURIComponent(text);
  }

  /* ---------- نظرات ---------- */
  function renderReviews() {
    var list = document.getElementById("reviewsList");
    var invite = document.getElementById("reviewInvite");
    var lead = document.getElementById("reviewsLead");
    if (!list || !invite) return;
    var data = SM.reviews || [];

    if (data.length) {
      list.innerHTML = data.map(function (r, i) {
        var initial = esc((r.name || "؟").trim().charAt(0));
        return (
          '<figure class="review glass spot reveal" data-tilt data-tilt-max="6" style="--d:' + ((i % 3) * 0.08).toFixed(2) + 's">' +
          '<span class="review__quote" aria-hidden="true">“</span>' +
          (r.title ? "<h3 class=\"review__title\">" + esc(r.title) + "</h3>" : "") +
          "<blockquote>" + esc(r.text) + "</blockquote>" +
          '<figcaption><span class="review__avatar">' + initial + "</span>" +
          "<span><strong>" + esc(r.name) + "</strong>" +
          (r.service || r.date ? "<small>" + esc([r.service, r.date].filter(Boolean).join(" · ")) + "</small>" : "") +
          "</span></figcaption></figure>"
        );
      }).join("");
      if (lead) lead.textContent = "تجربه‌ی مراجعانی که اجازه‌ی انتشار داده‌اند.";
    } else {
      list.hidden = true;
    }

    var msg = SM.config.whatsappGreeting + " می‌خواهم تجربه‌ام از جلسه ماساژ را برایتان بنویسم.";
    invite.innerHTML =
      '<span class="review-invite__icon">' + icon("i-heart") + "</span>" +
      "<div><h3>" + (data.length ? "شما هم تجربه‌تان را بنویسید" : "اولین تجربه‌ها به‌زودی اینجا") + "</h3>" +
      "<p>اگر جلسه‌ای با من داشته‌اید، خوشحال می‌شوم نظرتان را بدانم. نظر شما (با اجازه‌ی خودتان) در این بخش منتشر می‌شود.</p></div>" +
      '<div class="review-invite__actions">' +
      '<a class="btn btn--gold" href="' + waLink(msg) + '" target="_blank" rel="noopener">' + icon("i-whatsapp") + "ارسال نظر در واتساپ</a>" +
      '<a class="btn btn--ghost" href="https://instagram.com/' + esc(SM.config.instagram) + '" target="_blank" rel="noopener">' + icon("i-instagram") + "اینستاگرام</a>" +
      "</div>";
  }

  /* ---------- نکات (مقاله‌های کوتاه) ---------- */
  function renderTips() {
    var wrap = document.getElementById("tipsList");
    if (!wrap || !SM.tips) return;
    wrap.innerHTML = SM.tips.map(function (t, i) {
      return (
        '<article class="tip glass spot reveal" data-tilt data-tilt-max="6" tabindex="0" role="button"' +
        ' data-tip="' + esc(t.id) + '" aria-label="' + esc(t.title) + '" style="--d:' + ((i % 2) * 0.08).toFixed(2) + 's">' +
        '<span class="tip__icon">' + icon(t.icon) + "</span>" +
        '<span class="tip__meta">' + esc(t.read) + " مطالعه</span>" +
        "<h3>" + esc(t.title) + "</h3>" +
        "<p>" + esc(t.intro) + "</p>" +
        '<span class="tip__more">ادامه مطلب ' + icon("i-arrow") + "</span></article>"
      );
    }).join("");

    function open(card) {
      var id = card.getAttribute("data-tip");
      var tip = null;
      SM.tips.forEach(function (t) { if (t.id === id) tip = t; });
      if (!tip || !SM.render || !SM.render.openHTML) return;
      var pts = tip.points.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("");
      var html =
        '<span class="modal__cat">نکات سلامت · ' + esc(tip.read) + " مطالعه</span>" +
        '<h3 class="modal__title" id="modalTitle">' + esc(tip.title) + "</h3>" +
        "<p>" + esc(tip.intro) + "</p>" +
        '<div class="modal__section"><ul class="modal__list">' + pts + "</ul></div>" +
        '<p class="modal__note"><strong>یادآوری:</strong> این نوشته جنبه آموزشی دارد و جایگزین مشاوره پزشکی نیست.</p>' +
        '<div class="modal__actions"><a href="#booking" class="btn btn--gold" data-close>رزرو نوبت</a></div>';
      SM.render.openHTML(html, 168, card);
    }
    wrap.addEventListener("click", function (e) {
      var c = e.target.closest(".tip");
      if (c) open(c);
    });
    wrap.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var c = e.target.closest(".tip");
      if (c) { e.preventDefault(); open(c); }
    });
  }

  function init() {
    renderReviews();
    renderTips();
  }

  return { init: init };
})();
