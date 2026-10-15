(function (F) {
  var esc = F.escapeHtml;

  F.vendorPage({ page: "overview", title: "Vendor dashboard", intro: "Your services and booking requests at a glance." }, function (ctx) {
    var store = F.store;
    var vendor = ctx.vendor;
    ctx.actions.innerHTML = '<a class="button button-primary" href="vendor-services.html?new=1">' + F.icon("plus") + " Add service</a>";

    function render() {
      var services = store.getVendorServices(vendor.id);
      var bookings = store.getVendorBookings(vendor.id);
      var pending = bookings.filter(function (b) { return store.getBucket(b) === "pending_approval"; });
      var active = bookings.filter(function (b) { return store.getBucket(b) === "active"; });

      var stats = [
        { n: services.length, label: "Published services", hint: services.length ? "Manage services" : "Publish your first service", href: "vendor-services.html" },
        { n: pending.length, label: "Pending requests", hint: pending.length ? "Review requests" : "Nothing waiting", href: "vendor-bookings.html" },
        { n: active.length, label: "Active bookings", hint: "See bookings", href: "vendor-bookings.html" }
      ];
      var html = '<div class="vstats">' + stats.map(function (s) {
        return '<a class="vstat" href="' + s.href + '"><span>' + s.label + "</span><strong>" + s.n + "</strong><small>" + s.hint + "</small></a>";
      }).join("") + "</div>";

      html += '<section class="vpanel" aria-labelledby="waiting-title"><div class="vpanel-head"><h2 id="waiting-title">Waiting for your answer</h2>' +
        (pending.length ? '<a class="text-link" href="vendor-bookings.html">Review all ' + F.icon("arrow") + "</a>" : "") + "</div>";
      html += pending.length
        ? pending.slice(0, 4).map(function (b) {
            return '<div class="vrow"><div><strong>' + esc(b.customerName) + "</strong><span>" + esc(b.serviceTitle) + " · " + esc(b.eventType) + "</span></div>" +
              "<span>" + esc(F.formatDate(b.date)) + " · " + esc(b.governorate) + "</span>" + F.statusPill("pending", "Pending approval") + "</div>";
          }).join("")
        : '<div class="empty-inline">' + (services.length
            ? "No requests waiting. When a customer requests one of your services it shows up here."
            : "Publish a service and customers can start sending you requests.") + "</div>";
      html += "</section>";
      ctx.main.innerHTML = html;
      F.hydrateIcons(ctx.main);
      ctx.refreshNav();
    }
    window.addEventListener("storage", render);
    render();
  });
})(window.Fiesta = window.Fiesta || {});
