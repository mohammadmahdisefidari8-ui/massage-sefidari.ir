/* =========================================================
   booking.js — فرم رزرو: ساخت پیام آماده و ارسال به واتساپ
   ========================================================= */

window.SM = window.SM || {};

SM.booking = (function () {
  var form, select, errorBox;

  function fillSelect() {
    var html = '<option value="">هنوز مطمئن نیستم (مشاوره می‌خواهم)</option>';
    SM.massages.forEach(function (m) {
      html += '<option value="' + m.id + '">' + m.name + "</option>";
    });
    select.innerHTML = html;
  }

  function selectService(id) {
    if (!select) return;
    select.value = id;
    var name = document.getElementById("fName");
    if (name) {
      setTimeout(function () { name.focus({ preventScroll: true }); }, 700);
    }
  }

  function clean(v) {
    return (v || "").replace(/\s+/g, " ").trim();
  }

  function buildMessage() {
    var name = clean(document.getElementById("fName").value);
    var day = clean(document.getElementById("fDay").value);
    var time = clean(document.getElementById("fTime").value);
    var note = clean(document.getElementById("fNote").value);
    var serviceName = select.options[select.selectedIndex].text;
    var hasService = select.value !== "";

    var lines = [];
    lines.push(SM.config.whatsappGreeting);
    lines.push("من " + name + " هستم و می‌خواهم برای ماساژ نوبت رزرو کنم.");
    lines.push("نوع ماساژ: " + (hasService ? serviceName : "نیاز به راهنمایی دارم"));
    if (day) lines.push("روز مورد نظر: " + day);
    if (time) lines.push("ساعت مورد نظر: " + time);
    if (note) lines.push("توضیحات: " + note);
    return lines.join("\n");
  }

  function onSubmit(e) {
    e.preventDefault();
    var name = clean(document.getElementById("fName").value);
    if (name.length < 2) {
      errorBox.textContent = "لطفاً نام خود را وارد کنید.";
      document.getElementById("fName").focus();
      return;
    }
    errorBox.textContent = "";

    var url = "https://wa.me/" + SM.config.phoneIntl + "?text=" + encodeURIComponent(buildMessage());
    var w = window.open(url, "_blank", "noopener");
    if (!w) window.location.href = url; // اگر مرورگر پاپ‌آپ را بست
  }

  function init() {
    form = document.getElementById("bookForm");
    select = document.getElementById("fService");
    errorBox = document.getElementById("formError");
    if (!form || !select || !SM.massages) return;
    fillSelect();
    form.addEventListener("submit", onSubmit);
  }

  return { init: init, selectService: selectService };
})();
