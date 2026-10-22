/* =========================================================
   ui.js — لودر، هدر، منوی موبایل، نمایش هنگام اسکرول،
   شمارنده‌ها، سوالات متداول، نور موس، رفتار کیبورد موبایل
   ========================================================= */

window.SM = window.SM || {};

SM.ui = (function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var revealsStarted = false;

  /* ---------- Loader ---------- */
  function initLoader() {
    var loader = $("#loader");
    var hidden = false;

    function hide() {
      if (hidden) return;
      hidden = true;
      if (loader) loader.classList.add("is-hidden");
      document.body.classList.remove("is-locked");
      document.documentElement.classList.add("is-ready");
      startReveals();
    }

    if (!loader) {
      hide();
      return;
    }
    document.body.classList.add("is-locked");

    // حداقل ۹۰۰ میلی‌ثانیه نمایش، حداکثر ۳ ثانیه
    var minDelay = new Promise(function (r) { setTimeout(r, 900); });
    var loaded = new Promise(function (r) {
      if (document.readyState === "complete") r();
      else window.addEventListener("load", r, { once: true });
    });
    Promise.all([minDelay, loaded]).then(hide);
    setTimeout(hide, 3000);
  }

  /* ---------- Header + Progress + FAB ---------- */
  function initScroll() {
    var header = $("#header");
    var bar = $("#scrollProgress");
    var fab = $("#fab");
    var toTop = $("#toTop");
    var ticking = false;

    function update() {
      var y = window.scrollY || window.pageYOffset;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (header) header.classList.toggle("is-scrolled", y > 20);
      if (fab) fab.classList.toggle("is-scrolled", y > 600);
      if (bar) bar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    update();

    if (toTop) {
      toTop.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  }

  /* ---------- Mobile menu ---------- */
  function initMenu() {
    var burger = $("#burger");
    var nav = $("#nav");
    if (!burger || !nav) return;
    var use = $("use", burger);

    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "بستن منو" : "باز کردن منو");
      if (use) use.setAttribute("href", open ? "#i-close" : "#i-menu");
      document.body.classList.toggle("is-locked", open);
    }

    burger.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });
    $$("a", nav).forEach(function (a) {
      a.addEventListener("click", function () { setOpen(false); });
    });
    // کلیک بیرون از منو، آن را می‌بندد
    document.addEventListener("click", function (e) {
      if (!nav.classList.contains("is-open")) return;
      if (e.target.closest("#nav") || e.target.closest("#burger")) return;
      setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 900 && nav.classList.contains("is-open")) setOpen(false);
    });
  }

  /* ---------- Active link on scroll ---------- */
  function initActiveNav() {
    if (!("IntersectionObserver" in window)) return;
    var links = $$(".nav a[href^='#']");
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          links.forEach(function (l) { l.classList.remove("is-active"); });
          map[en.target.id].classList.add("is-active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });

    Object.keys(map).forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) io.observe(sec);
    });
  }

  /* ---------- Reveal + Counters (بعد از پایان لودر شروع می‌شوند) ---------- */
  function startReveals() {
    if (revealsStarted) return;
    revealsStarted = true;
    initReveal();
    initCounters();
  }

  function initReveal() {
    var items = $$(".reveal, .reveal-left, .reveal-right");
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el) { io.observe(el); });
  }

  function initCounters() {
    var els = $$("[data-count]");
    if (!els.length) return;

    function run(el) {
      var target = parseInt(el.getAttribute("data-count"), 10) || 0;
      if (SM.reducedMotion) { el.textContent = SM.fa(target); return; }
      var dur = 1600;
      var start = null;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = SM.fa(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { run(el); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          run(en.target);
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- FAQ accordion ---------- */
  function initFaq() {
    var list = $("#faqList");
    if (!list) return;
    list.addEventListener("click", function (e) {
      var btn = e.target.closest(".faq__q");
      if (!btn) return;
      var item = btn.parentElement;
      var answer = $(".faq__a", item);
      var willOpen = !item.classList.contains("is-open");

      $$(".faq__item.is-open", list).forEach(function (other) {
        other.classList.remove("is-open");
        $(".faq__q", other).setAttribute("aria-expanded", "false");
        $(".faq__a", other).style.maxHeight = "0px";
      });

      if (willOpen) {
        item.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
        answer.style.maxHeight = answer.scrollHeight + "px";
      }
    });
    // اگر اندازه صفحه عوض شد (چرخش گوشی)، ارتفاع پاسخ باز را دوباره حساب کن
    window.addEventListener("resize", function () {
      var open = $(".faq__item.is-open .faq__a", list);
      if (open) open.style.maxHeight = open.scrollHeight + "px";
    });
  }

  /* ---------- Cursor glow (فقط دسکتاپ) ---------- */
  function initCursor() {
    var glow = $("#cursorGlow");
    if (!glow || !SM.isFinePointer || SM.reducedMotion) return;
    var x = 0, y = 0, raf = null;
    window.addEventListener("pointermove", function (e) {
      if (e.pointerType && e.pointerType !== "mouse") return;
      x = e.clientX;
      y = e.clientY;
      glow.classList.add("is-on");
      if (!raf) {
        raf = requestAnimationFrame(function () {
          glow.style.transform = "translate(" + x + "px," + y + "px)";
          raf = null;
        });
      }
    }, { passive: true });
    document.addEventListener("pointerleave", function () { glow.classList.remove("is-on"); });
  }

  /* ---------- وقتی کیبورد موبایل باز است، دوک پایین مخفی شود ---------- */
  function initKeyboard() {
    var fields = "INPUT,TEXTAREA,SELECT";
    document.addEventListener("focusin", function (e) {
      if (fields.indexOf(e.target.tagName) > -1) document.body.classList.add("kb-open");
    });
    document.addEventListener("focusout", function () {
      document.body.classList.remove("kb-open");
    });
  }

  /* ---------- Footer year ---------- */
  function initYear() {
    var el = $("#year");
    if (!el) return;
    try {
      el.textContent = new Date().toLocaleDateString("fa-IR", { year: "numeric" });
    } catch (err) { /* مقدار پیش‌فرض HTML می‌ماند */ }
  }

  function init() {
    initLoader();
    initScroll();
    initMenu();
    initActiveNav();
    initFaq();
    initCursor();
    initKeyboard();
    initYear();
  }

  return { init: init };
})();
