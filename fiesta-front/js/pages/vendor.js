(function (F) {
  F.ready(function () {
    var view = F.$("#vendor-view");
    if (!view) return;
    var esc = F.escapeHtml;
    var store = F.store;

    var id = parseInt(F.qs("id"), 10);
    var service = store.getService(id);

    if (!service) {
      document.title = "Service not found · Fiesta";
      view.innerHTML = F.renderEmpty({
        icon: "search", size: 38,
        title: "We couldn't find that service",
        text: "The link may be out of date. Browse all Fiesta services instead.",
        action: { label: "Explore services", href: "services.html", variant: "primary" }
      });
      return;
    }

    var vendor = store.getVendor(service.vendorId);
    var vendorName = vendor ? vendor.name : "Fiesta vendor";
    document.title = service.title + " · " + vendorName;
    var saved = store.isFavorite(service.id);
    var isVendorView = store.getRole() === "vendor";
    var planner = store.getPlanner();

    var stats = vendor && vendor.rating
      ? "<div><strong>" + esc(vendor.rating) + "</strong><span>average rating</span></div><div><strong>" + esc(vendor.reviews) + "</strong><span>happy clients</span></div>"
      : "<div><strong>New</strong><span>on Fiesta</span></div><div><strong>0</strong><span>reviews so far</span></div>";
    stats += "<div><strong>" + esc(service.minBookingNoticeDays) + (service.minBookingNoticeDays === 1 ? " day" : " days") + "</strong><span>minimum notice</span></div>";

    view.innerHTML =
      '<div class="profile-cover"><img src="' + esc(service.image) + '" alt="' + esc(service.title) + ' cover">' +
        '<div class="profile-title"><span>' + esc(service.category) + "</span><h1>" + esc(service.title) + "</h1><p>" + F.icon("location", 17) + " " + esc(service.governorates.join(", ")) + " · by " + esc(vendorName) + "</p></div>" +
        '<button type="button" class="profile-heart' + (saved ? " heart-active" : "") + '" id="profile-save" aria-pressed="' + saved + '">' + F.icon("heart") + '<span id="save-label">' + (saved ? "Saved" : "Save") + "</span></button>" +
      "</div>" +
      '<div class="profile-layout"><div class="profile-main">' +
        "<h2>About this service</h2><p>" + esc(service.description) + "</p>" +
        '<div class="stats-row">' + stats + "</div>" +
        "<h2>Good to know</h2>" +
        '<dl class="detail-list"><div><dt>Event types</dt><dd><ul class="chip-row">' + service.eventTypes.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul></dd></div>" +
        "<div><dt>Available in</dt><dd>" + esc(service.governorates.join(", ")) + "</dd></div>" +
        "<div><dt>Booking notice</dt><dd>" + F.renderNotice(service.minBookingNoticeDays) + "</dd></div></dl>" +
        (vendor && vendor.reviews > 0
          ? "<h2>What clients say</h2><blockquote>“Every detail felt like us, only more beautiful than we could have imagined. The whole process was thoughtful and completely stress-free.”<cite>— Mariam A., verified client</cite></blockquote>"
          : "") +
      "</div>" +
      '<aside class="booking-card"><div><span>From</span><strong>' + F.money(Number(service.price)) + "</strong></div>" +
        '<label>Your event date<input type="date" id="f-date" min="' + F.todayISO() + '" value="' + esc(planner.date) + '" aria-describedby="date-message"></label>' +
        '<div class="available" id="available" hidden>' + F.icon("check") + " Meets the booking notice</div>" +
        '<p class="date-problem" id="date-message" role="status" hidden></p>' +
        (isVendorView
          ? '<p class="vendor-note">You are viewing Fiesta as a vendor. Switch to the customer view in Demo tools to request this service.</p>'
          : '<button type="button" class="button button-primary" id="add-to-plan">Add to event plan ' + F.icon("plus") + "</button>") +
        "<small>No payment is taken. Adding this lets you send a request to the vendor, who confirms or declines it.</small></aside></div>";

    var dateInput = F.$("#f-date");
    var okBox = F.$("#available");
    var problem = F.$("#date-message");

    /* Checks the chosen date against the service's minimum notice. Returns true when it can be requested. */
    function checkDate() {
      var result = store.checkNotice(service, dateInput.value);
      okBox.hidden = !dateInput.value || !result.ok;
      problem.hidden = result.ok;
      problem.textContent = result.message;
      if (result.ok) dateInput.removeAttribute("aria-invalid"); else dateInput.setAttribute("aria-invalid", "true");
      return result.ok;
    }

    var saveButton = F.$("#profile-save");
    saveButton.addEventListener("click", function () {
      var active = store.toggleFavorite(service.id);
      saveButton.classList.toggle("heart-active", active);
      saveButton.setAttribute("aria-pressed", String(active));
      F.$("#save-label").textContent = active ? "Saved" : "Save";
    });

    dateInput.addEventListener("input", function () {
      checkDate();
      /* Share the date with the planner so the request uses it. */
      var current = store.getPlanner();
      current.date = dateInput.value;
      store.setPlanner(current);
    });
    if (dateInput.value) checkDate();

    var add = F.$("#add-to-plan");
    if (add) add.addEventListener("click", function () {
      if (!dateInput.value) {
        problem.textContent = "Choose your event date first, so we can check the booking notice.";
        problem.hidden = false;
        dateInput.setAttribute("aria-invalid", "true");
        dateInput.focus();
        return;
      }
      if (!checkDate()) { dateInput.focus(); return; }
      store.addToCart(service.id);
      window.location.href = "cart.html";
    });
  });
})(window.Fiesta = window.Fiesta || {});
