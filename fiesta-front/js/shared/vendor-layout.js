(function (F) {
  var esc = F.escapeHtml;

  var NAV = [
    { id: "overview", label: "Overview", href: "vendor-dashboard.html", icon: "grid" },
    { id: "services", label: "My services", href: "vendor-services.html", icon: "bag" },
    { id: "bookings", label: "Bookings", href: "vendor-bookings.html", icon: "inbox" }
  ];

  /* Vendor pages share this shell. It checks the demo role and application status first:
       - no vendor account, or viewing as customer: a notice, nothing else
       - pending or rejected: the status screen (the dashboard stays blocked)
       - approved: a sidebar layout separate from the customer site.
     options: { page: "overview" | "services" | "bookings", title, intro, actions }.
     render(ctx) gets { vendor, main, actions, refreshNav }. */
  F.vendorPage = function (options, render) {
    F.ready(function () {
      var root = F.$("#vendor-app");
      if (!root) return;
      var store = F.store;
      var app = store.getVendorApplication();

      function gate(html) {
        document.title = "Vendor area | Fiesta";
        root.innerHTML = '<div class="vendor-gate">' + html + "</div>";
        F.hydrateIcons(root);
      }

      if (!app) {
        gate(F.renderEmpty({
          icon: "users", size: 38, title: "This area is for Fiesta vendors",
          text: "Apply to become a vendor to publish services and receive booking requests. Applications are reviewed before the dashboard unlocks.",
          action: { label: "Become a vendor", href: "become-vendor.html", variant: "primary" }
        }));
        return;
      }
      if (store.getRole() !== "vendor") {
        gate(F.renderEmpty({
          icon: "users", size: 38, title: "You're viewing Fiesta as a customer",
          text: "Switch to your vendor account to open the vendor area (demo only).",
          action: { label: "Switch to vendor view", variant: "primary", attrs: "data-switch-vendor" }
        }));
        root.addEventListener("click", function (event) {
          if (!event.target.closest("[data-switch-vendor]")) return;
          store.setRole("vendor");
          window.location.reload();
        });
        return;
      }
      if (app.status !== "approved") {
        gate(F.renderVendorStatus(app));
        return;
      }

      /* Approved: swap the customer header and footer for the vendor shell. */
      var header = F.$("#site-header");
      var footer = F.$("#site-footer");
      if (header) header.innerHTML = "";
      if (footer) footer.innerHTML = "";
      document.title = options.title + " | Fiesta vendor";

      function pendingCount() {
        return store.getVendorBookings(app.id).filter(function (b) { return store.getBucket(b) === "pending_approval"; }).length;
      }
      var nav = NAV.map(function (item) {
        var current = item.id === options.page;
        var count = item.id === "bookings" ? '<span class="vnav-count" id="vnav-count" hidden></span>' : "";
        return '<a href="' + item.href + '"' + (current ? ' class="is-current" aria-current="page"' : "") + ">" + F.icon(item.icon, 19) + "<span>" + item.label + "</span>" + count + "</a>";
      }).join("");

      root.innerHTML = '<div class="vshell">' +
        '<aside class="vside"><a class="brand vbrand" href="vendor-dashboard.html" aria-label="Fiesta vendor dashboard"><span>f</span>fiesta.<small>vendor</small></a>' +
          '<nav class="vnav" aria-label="Vendor navigation">' + nav + "</nav>" +
          '<div class="vside-foot"><div class="vbusiness"><strong>' + esc(app.name) + '</strong><span class="status-pill status-approved">Approved</span></div>' +
            '<a href="index.html">Browse the marketplace</a><button type="button" id="vendor-to-customer">Switch to customer view</button></div></aside>' +
        '<div class="vmain"><header class="vtop"><div><h1>' + esc(options.title) + "</h1>" + (options.intro ? "<p>" + esc(options.intro) + "</p>" : "") +
          '</div><div class="vtop-actions" id="vtop-actions"></div></header><div class="vcontent" id="vcontent"></div></div></div>';

      function refreshNav() {
        var badge = F.$("#vnav-count");
        var n = pendingCount();
        badge.hidden = n === 0;
        badge.textContent = n;
        badge.setAttribute("aria-label", n + " pending requests");
      }
      refreshNav();

      F.$("#vendor-to-customer").addEventListener("click", function () {
        store.setRole("customer");
        window.location.href = "index.html";
      });

      render({ vendor: app, main: F.$("#vcontent"), actions: F.$("#vtop-actions"), refreshNav: refreshNav });
    });
  };
})(window.Fiesta = window.Fiesta || {});
