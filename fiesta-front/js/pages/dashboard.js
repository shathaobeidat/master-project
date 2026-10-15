(function (F) {
  F.ready(function () {
    var list = F.$("#dash-list");
    if (!list) return;
    if (F.customerGate(F.$(".dashboard"))) return;
    var esc = F.escapeHtml;
    var store = F.store;
    var tab = "pending_approval";

    var EMPTY = {
      pending_approval: "No requests waiting. Requests you send appear here until a vendor answers.",
      active: "No confirmed bookings yet. They appear here when a vendor approves your request.",
      archived: "Nothing archived. Declined, expired and completed requests are kept here."
    };

    function render() {
      var bookings = store.getCustomerBookings();
      var groups = { pending_approval: [], active: [], archived: [] };
      bookings.forEach(function (b) { groups[store.getBucket(b)].push(b); });
      var pending = groups.pending_approval.length;
      var active = groups.active.length;
      var open = groups.pending_approval.concat(groups.active);
      var total = open.reduce(function (sum, b) { return sum + Number(b.servicePrice); }, 0);

      /* Event card */
      var planner = store.getPlanner();
      var complete = Object.keys(store.validatePlanner(planner)).length === 0;
      F.$("#dash-title").textContent = complete ? planner.type : "Your next celebration";
      F.$("#dash-meta-text").textContent = complete
        ? F.formatDate(planner.date) + " · " + planner.governorate + " · " + planner.guests + " guests"
        : "No event details yet";
      var percent = pending + active ? Math.round(active / (pending + active) * 100) : 0;
      F.$("#dash-status").textContent = !bookings.length ? "Planning" : pending ? "Awaiting vendors" : active ? "Confirmed" : "Planning";
      F.$("#dash-progress-value").textContent = percent + "%";
      F.$("#dash-progress-bar").style.width = percent + "%";
      var action = F.$("#dash-action");
      action.textContent = !complete ? "Plan my event" : store.getCart().length ? "Review and send" : bookings.length ? "View my requests" : "Choose services";
      action.setAttribute("href", !complete ? "planner.html" : store.getCart().length ? "planner.html?step=3" : bookings.length ? "cart.html" : "planner.html?step=2");

      /* Stats and tab counts */
      F.$("#stat-pending").textContent = pending;
      F.$("#stat-active").textContent = active;
      F.$("#stat-total").textContent = F.money(total, true);
      F.$("#count-pending").textContent = pending;
      F.$("#count-active").textContent = active;
      F.$("#count-archived").textContent = groups.archived.length;

      var shown = groups[tab];
      list.innerHTML = shown.length ? shown.map(function (b) {
        var st = F.bookingStatus(b);
        return '<div class="mini-vendor"><img src="' + esc(b.serviceImage) + '" alt=""><div><small>' + esc(b.vendorName) + " · " + esc(b.eventType) + "</small><strong>" + esc(b.serviceTitle) + "</strong>" +
          "<small>" + esc(F.formatDate(b.date)) + " · " + esc(F.formatTime(b.from)) + "–" + esc(F.formatTime(b.to)) + " · " + esc(b.governorate) + "</small></div>" +
          "<div class=\"mini-side\">" + F.statusPill(st.kind, st.label) + "<b>" + F.money(Number(b.servicePrice)) + "</b></div></div>";
      }).join("") : '<div class="empty-inline">' + EMPTY[tab] + "</div>";
      list.setAttribute("aria-labelledby", "tab-" + (tab === "pending_approval" ? "pending" : tab));
    }

    var select = F.bindTabs(F.$("#dash-tabs"), function (name) { tab = name; render(); });
    window.addEventListener("storage", render);
    F.hydrateIcons(document);
    render();
  });
})(window.Fiesta = window.Fiesta || {});
