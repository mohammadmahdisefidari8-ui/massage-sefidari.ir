/* =========================================================
   config.js — اطلاعات تماس و تنظیمات سایت
   برای تغییر شماره، اینستاگرام و ... فقط همین فایل را ویرایش کنید.
   (توجه: لینک‌های داخل index.html هم باید با همین اطلاعات هماهنگ باشند.)
   ========================================================= */

window.SM = window.SM || {};

SM.config = {
  name: "محمدمهدی سفیداری",
  phoneLocal: "09039098647",          // برای تماس
  phoneIntl: "989039098647",          // برای واتساپ (بدون + و صفر)
  instagram: "massage_sefidari",
  whatsappGreeting: "سلام، وقت بخیر.",

};

/* ابزارهای کمکی مشترک */
SM.fa = function (n) {
  return String(n).replace(/\d/g, function (d) {
    return "۰۱۲۳۴۵۶۷۸۹"[d];
  });
};

SM.reducedMotion = window.matchMedia
  ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
  : false;

SM.isFinePointer = window.matchMedia
  ? window.matchMedia("(hover: hover) and (pointer: fine)").matches
  : true;
