(function (F) {
  F.ready(function () {
    var esc = F.escapeHtml;

    var themeWrap = F.$("#theme-preview");
    if (themeWrap) {
      themeWrap.innerHTML = F.data.themes.slice(0, 3).map(function (theme, index) {
        return '<a class="theme-tile theme-' + (index + 1) + '" href="themes.html">' +
          '<img src="' + esc(theme.image) + '" alt="' + esc(theme.name) + ' event inspiration">' +
          "<div><small>Curated theme</small><strong>" + esc(theme.name) + "</strong><span>" + esc(theme.note) + "</span></div></a>";
      }).join("");
    }

    var vendorWrap = F.$("#home-vendors");
    if (vendorWrap) {
      vendorWrap.innerHTML = F.store.getServices().slice(0, 3).map(function (s) { return F.renderServiceCard(s, { mode: "browse" }); }).join("");
      F.bindHearts(vendorWrap);
    }
  });
})(window.Fiesta = window.Fiesta || {});
