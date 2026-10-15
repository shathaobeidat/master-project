(function (F) {
  F.$ = function (selector, root) { return (root || document).querySelector(selector); };
  F.$$ = function (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); };

  F.escapeHtml = function (value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  };

  /* money(420) -> "$420" (the source prints prices and totals without separators);
     money(3000, true) -> "$3,000" (the planner summary uses toLocaleString). */
  F.money = function (amount, grouped) {
    return "$" + (grouped ? Number(amount).toLocaleString() : amount);
  };

  /* ---- dates and times (ISO "YYYY-MM-DD" and "HH:MM" strings) ---- */
  function parseISO(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
  }
  function toISO(date) {
    function pad(n) { return (n < 10 ? "0" : "") + n; }
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
  }
  F.parseISO = parseISO;
  F.todayISO = function () { return toISO(new Date()); };
  F.addDaysISO = function (iso, days) {
    var d = parseISO(iso);
    if (!d) return "";
    d.setDate(d.getDate() + days);
    return toISO(d);
  };
  /* Whole days from today (local time) to the given date; negative when in the past. */
  F.daysFromToday = function (iso) {
    var d = parseISO(iso);
    if (!d) return NaN;
    var t = parseISO(F.todayISO());
    return Math.round((d - t) / 86400000);
  };
  F.formatDate = function (iso) {
    var d = parseISO(iso);
    return d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
  };
  F.formatTime = function (hhmm) {
    var m = /^(\d{2}):(\d{2})$/.exec(hhmm || "");
    if (!m) return "";
    var h = Number(m[1]);
    return ((h + 11) % 12 + 1) + ":" + m[2] + " " + (h < 12 ? "AM" : "PM");
  };
  F.plural = function (n, one, many) { return n + " " + (n === 1 ? one : (many || one + "s")); };
  /* "Book at least 7 days before the event" */
  F.noticeText = function (days) {
    days = Number(days) || 0;
    return days === 0 ? "No advance notice needed" : "Book at least " + F.plural(days, "day") + " before the event";
  };
  F.joinAnd = function (list) {
    return list.length > 1 ? list.slice(0, -1).join(", ") + " and " + list[list.length - 1] : (list[0] || "");
  };

  F.qs = function (name) {
    try { return new URLSearchParams(window.location.search).get(name); } catch (e) { return null; }
  };

  F.scrollToTop = function () { window.scrollTo({ top: 0, behavior: "smooth" }); };

  /* Runs fn once the DOM is parsed, keeping registration order. */
  F.ready = function (fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  };
})(window.Fiesta = window.Fiesta || {});
