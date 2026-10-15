(function (F) {
  var esc = F.escapeHtml;

  F.vendorPage({ page: "bookings", title: "Bookings", intro: "Approve or reject requests for your services. Customers see your answer right away." }, function (ctx) {
    var store = F.store;
    var vendor = ctx.vendor;
    var tab = "pending_approval";
    var TABS = [
      { id: "pending_approval", label: "Pending approval", ar: "قيد الموافقة" },
      { id: "active", label: "Active", ar: "نشط حاليا" },
      { id: "archived", label: "Archived", ar: "الأرشيف" }
    ];
    var EMPTY = {
      pending_approval: "No requests waiting. New requests for your services appear here.",
      active: "No active bookings. Requests you approve appear here until the event.",
      archived: "Nothing archived yet. Rejected requests and past events are kept here."
    };

    ctx.main.innerHTML = '<div class="tabs" id="booking-tabs" role="tablist" aria-label="Booking status">' + TABS.map(function (t, i) {
      return '<button type="button" role="tab" id="btab-' + t.id + '" data-tab="' + t.id + '" aria-selected="' + (i === 0) + '"' + (i ? ' tabindex="-1"' : "") + ' aria-controls="booking-panel">' +
        '<span>' + t.label + ' <span class="tab-count" id="bcount-' + t.id + '">0</span></span><span class="tab-ar" lang="ar" dir="rtl">' + t.ar + "</span></button>";
    }).join("") + '</div><div id="booking-panel" role="tabpanel" aria-labelledby="btab-pending_approval" tabindex="0"></div><p class="toast" id="toast" role="status" hidden></p>';
    var panel = F.$("#booking-panel");
    var toast = F.$("#toast");
    var timer;

    function say(message) {
      toast.textContent = message;
      toast.hidden = false;
      clearTimeout(timer);
      timer = setTimeout(function () { toast.hidden = true; }, 5000);
    }

    function row(b, showActions) {
      var st = F.bookingStatus(b);
      var who = esc(b.customerName) + " for " + esc(b.serviceTitle);
      return "<tr>" +
        '<td data-label="Customer"><strong>' + esc(b.customerName) + "</strong><small>" + esc(b.id) + "</small></td>" +
        '<td data-label="Service">' + esc(b.serviceTitle) + "</td>" +
        '<td data-label="Event type">' + esc(b.eventType) + "</td>" +
        '<td data-label="Date and time">' + esc(F.formatDate(b.date)) + "<small>" + esc(F.formatTime(b.from)) + " – " + esc(F.formatTime(b.to)) + "</small></td>" +
        '<td data-label="Governorate">' + esc(b.governorate) + "</td>" +
        '<td data-label="Guests">' + esc(b.guests) + "</td>" +
        '<td data-label="Status">' + F.statusPill(st.kind, st.label) + "</td>" +
        '<td data-label="Actions" class="actions-cell">' + (showActions
          ? '<button type="button" class="button button-primary button-small" data-approve="' + esc(b.id) + '" aria-label="Approve request from ' + who + '">Approve</button>' +
            '<button type="button" class="button button-secondary button-small" data-reject="' + esc(b.id) + '" aria-label="Reject request from ' + who + '">Reject</button>'
          : '<span class="muted-dash" aria-hidden="true">—</span><span class="sr-only">No actions</span>') + "</td></tr>";
    }

    function render() {
      var groups = { pending_approval: [], active: [], archived: [] };
      store.getVendorBookings(vendor.id).forEach(function (b) { groups[store.getBucket(b)].push(b); });
      TABS.forEach(function (t) { F.$("#bcount-" + t.id).textContent = groups[t.id].length; });
      var shown = groups[tab];
      /* Soonest event first for open requests; newest first for archive. */
      if (tab !== "archived") shown = shown.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
      panel.setAttribute("aria-labelledby", "btab-" + tab);
      panel.innerHTML = shown.length
        ? '<div class="table-wrap"><table class="booking-table"><caption class="sr-only">' + TABS.filter(function (t) { return t.id === tab; })[0].label + ' bookings</caption><thead><tr><th scope="col">Customer</th><th scope="col">Service</th><th scope="col">Event type</th><th scope="col">Date and time</th><th scope="col">Governorate</th><th scope="col">Guests</th><th scope="col">Status</th><th scope="col">Actions</th></tr></thead><tbody>' +
          shown.map(function (b) { return row(b, tab === "pending_approval"); }).join("") + "</tbody></table></div>"
        : '<div class="empty-inline">' + EMPTY[tab] + "</div>";
      ctx.refreshNav();
    }

    F.bindTabs(F.$("#booking-tabs"), function (name) { tab = name; render(); });

    panel.addEventListener("click", function (event) {
      var approve = event.target.closest("[data-approve]");
      var reject = event.target.closest("[data-reject]");
      if (approve) {
        var id = approve.getAttribute("data-approve");
        if (store.decideBooking(id, "approve")) say("Request approved. It moved to Active, and the customer can see it.");
        render();
      } else if (reject) {
        var rid = reject.getAttribute("data-reject");
        var b = store.getBooking(rid);
        if (!b) return;
        F.confirmDialog({ title: "Reject this request?", text: "The customer will see that " + b.serviceTitle + " on " + F.formatDate(b.date) + " was declined. This can't be undone.", confirmLabel: "Reject request", danger: true }).then(function (yes) {
          if (!yes) { reject.focus(); return; }
          if (store.decideBooking(rid, "reject")) say("Request rejected. It moved to Archived.");
          render();
        });
      }
    });

    /* New requests can arrive from the customer tab. */
    window.addEventListener("storage", render);
    render();
  });
})(window.Fiesta = window.Fiesta || {});
