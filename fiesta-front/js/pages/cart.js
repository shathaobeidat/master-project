(function (F) {
  F.ready(function () {
    var view = F.$("#cart-view");
    var body = F.$("#cart-body");
    var notice = F.$("#cart-notice");
    if (!view || !body) return;
    if (F.customerGate(view)) return;
    var esc = F.escapeHtml;
    var store = F.store;

    var sent = parseInt(F.qs("sent"), 10);
    if (sent > 0) {
      notice.innerHTML = '<div class="sent-banner">' + F.icon("check", 22) + "<div><strong>" + F.plural(sent, "request") + " sent.</strong> " +
        "Each vendor will approve or decline. You'll see their answer below and on your dashboard.</div></div>";
    }

    var STATUS_HELP = {
      pending: function (b) { return "Waiting for " + b.vendorName + " to respond."; },
      active: function (b) { return "Confirmed by " + b.vendorName + "."; },
      rejected: function (b) { return b.vendorName + " couldn't take this request."; },
      archived: function (b) { return "This request is closed."; }
    };

    function detailsHtml(planner, complete) {
      if (!complete) {
        return '<h2>Event details</h2><p class="details-missing">Add your event type, date, time and governorate so vendors know what you need.</p>' +
          '<a class="button button-secondary" href="planner.html">Add event details</a>';
      }
      var rows = [["Event", planner.type], ["Date", F.formatDate(planner.date)], ["Time", F.formatTime(planner.from) + " – " + F.formatTime(planner.to)],
        ["Location", planner.governorate], ["Guests", planner.guests]];
      if (planner.themes.length) rows.push(["Themes", planner.themes.join(", ")]);
      return '<h2>Event details</h2><dl class="event-details">' + rows.map(function (r) { return "<div><dt>" + r[0] + "</dt><dd>" + esc(r[1]) + "</dd></div>"; }).join("") +
        '</dl><a class="text-link" href="planner.html">Edit details</a>';
    }

    function render() {
      var planner = store.getPlanner();
      var complete = Object.keys(store.validatePlanner(planner)).length === 0;
      var draft = store.getCartServices();
      var bookings = store.getCustomerBookings();

      if (!draft.length && !bookings.length) {
        body.innerHTML = F.renderEmpty({
          icon: "bag", size: 42,
          title: "Your plan is waiting",
          text: "Request trusted professionals and build your celebration in one place.",
          action: { label: "Plan my event", href: "planner.html", variant: "primary" }
        });
        return;
      }

      var problems = complete ? store.validateRequests(planner, draft) : {};
      var subtotal = draft.reduce(function (sum, s) { return sum + Number(s.price); }, 0);
      var fee = Math.round(subtotal * 0.05);

      var html = '<div class="cart-layout"><section aria-labelledby="draft-title"><h2 class="cart-heading" id="draft-title">Ready to send <span>' + draft.length + "</span></h2>";
      html += draft.length ? draft.map(function (s) {
        var vendor = store.getVendor(s.vendorId);
        return '<article class="cart-item"><img src="' + esc(s.image) + '" alt=""><div><small>' + esc(s.category) + "</small><h3>" + esc(s.title) + "</h3>" +
          "<p>" + esc(vendor ? vendor.name : "") + " · " + F.noticeText(s.minBookingNoticeDays) + "</p>" +
          (problems[s.id] ? '<p class="cart-problem">' + esc(problems[s.id]) + "</p>" : "") +
          '<button type="button" data-remove="' + s.id + '">Remove</button></div><strong>' + F.money(Number(s.price)) + "</strong></article>";
      }).join("") : '<p class="cart-hint">Nothing waiting to be sent. Add services in the planner or from the services page.</p>';
      html += '<a class="button button-secondary" href="' + (complete ? "planner.html?step=2" : "planner.html") + '">' + F.icon("plus") + " Add another service</a></section>" +
        '<aside class="total-card">' + detailsHtml(planner, complete);
      if (draft.length) {
        html += "<hr><h2>Estimate</h2><div><span>Services</span><strong>" + F.money(subtotal) + "</strong></div>" +
          "<div><span>Service fee</span><strong>" + F.money(fee) + "</strong></div><hr>" +
          '<div class="grand-total"><span>Estimated total</span><strong>' + F.money(subtotal + fee) + "</strong></div>" +
          "<p>You won’t be charged. Vendors confirm final prices after they approve.</p>" +
          '<a class="button button-primary" href="' + (complete ? "planner.html?step=3" : "planner.html") + '">' + (complete ? "Review and send requests " : "Add event details ") + F.icon("arrow") + "</a>";
      }
      html += "</aside></div>";

      html += '<section class="requests-section" aria-labelledby="sent-title"><h2 class="cart-heading" id="sent-title">Sent requests <span>' + bookings.length + "</span></h2>";
      html += bookings.length ? bookings.map(function (b) {
        var st = F.bookingStatus(b);
        return '<article class="cart-item request-item"><img src="' + esc(b.serviceImage) + '" alt=""><div><small>' + esc(b.eventType) + " · " + esc(F.formatDate(b.date)) + " · " + esc(F.formatTime(b.from)) + "–" + esc(F.formatTime(b.to)) + "</small>" +
          "<h3>" + esc(b.serviceTitle) + "</h3><p>" + esc(b.vendorName) + " · " + esc(b.governorate) + " · " + esc(b.guests) + " guests</p>" +
          '<p class="request-help">' + esc(STATUS_HELP[st.kind](b)) + "</p></div><div class=\"request-side\">" + F.statusPill(st.kind, st.label) + "<strong>" + F.money(Number(b.servicePrice)) + "</strong></div></article>";
      }).join("") : '<p class="cart-hint">Requests you send appear here with their status.</p>';
      html += "</section>";
      body.innerHTML = html;
    }

    body.addEventListener("click", function (event) {
      var remove = event.target.closest("[data-remove]");
      if (!remove) return;
      store.removeFromCart(remove.getAttribute("data-remove"));
      render();
    });
    /* Statuses change when a vendor responds in another tab. */
    window.addEventListener("storage", render);

    render();
  });
})(window.Fiesta = window.Fiesta || {});
