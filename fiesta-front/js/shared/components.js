(function (F) {
  var esc = F.escapeHtml;

  function locationText(list) {
    list = list || [];
    return list.length > 2 ? list[0] + " +" + (list.length - 1) : list.join(", ");
  }

  /* "Book at least 7 days before the event" tag. Pass a blocked message to show it as an error. */
  F.renderNotice = function (days, blocked) {
    return '<span class="notice-tag' + (blocked ? " notice-blocked" : "") + '">' + F.icon("clock", 15) + "<span>" + esc(F.noticeText(days)) + "</span></span>";
  };

  F.statusPill = function (kind, label) {
    return '<span class="status-pill status-' + esc(kind) + '">' + esc(label) + "</span>";
  };

  /* Kind and label for a booking, as shown to customers and vendors. */
  F.bookingStatus = function (booking) {
    var bucket = F.store.getBucket(booking);
    if (bucket === "pending_approval") return { kind: "pending", label: "Pending approval" };
    if (bucket === "active") return { kind: "active", label: "Active" };
    var reason = F.store.getArchiveReason(booking);
    if (reason === "rejected") return { kind: "rejected", label: "Declined" };
    return { kind: "archived", label: reason === "expired" ? "Expired" : "Completed" };
  };

  /* Service card. options: { mode: "browse" | "request" | "manage", requested, newTab, footer }.
     browse: heart + links to vendor.html?id=N. request: adds a Request service button (planner step 2).
     manage: the vendor's own card with description and chips; footer holds Edit / Delete. */
  F.renderServiceCard = function (service, options) {
    options = options || {};
    var mode = options.mode || "browse";
    var id = Number(service.id);
    var href = "vendor.html?id=" + id;
    var target = options.newTab ? ' target="_blank" rel="noopener"' : "";
    var vendor = F.store.getVendor(service.vendorId);
    var vendorName = vendor ? vendor.name : "Fiesta vendor";
    var rating = vendor && vendor.rating
      ? '<span class="rating">' + F.icon("star", 14) + " " + esc(vendor.rating) + " (" + esc(vendor.reviews) + ")</span>"
      : '<span class="rating">New on Fiesta</span>';
    var active = F.store.isFavorite(id);
    var manage = mode === "manage";

    var heart = mode === "browse"
      ? '<button type="button" class="heart' + (active ? " heart-active" : "") + '" data-heart="' + id + '" aria-label="Save ' + esc(service.title) + '" aria-pressed="' + active + '">' + F.icon("heart") + "</button>"
      : "";
    var picture = '<img src="' + esc(service.image) + '" alt="' + (manage ? "" : esc(service.title)) + '">';
    var image = '<div class="vendor-image">' + heart +
      (manage ? picture : '<a class="image-button" href="' + href + '"' + target + ">" + picture + "</a>") + "</div>";

    var inner = "<small>" + esc(service.category) + "</small>" +
      "<strong>" + esc(service.title) + "</strong>" +
      (manage ? "" : '<em class="card-vendor">by ' + esc(vendorName) + "</em>") +
      (manage ? '<p class="card-desc">' + esc(service.description) + "</p>" : "") +
      (manage
        ? '<ul class="chip-row" aria-label="Event types">' + service.eventTypes.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" +
          '<div class="card-where">' + F.icon("location", 15) + "<span>" + esc(service.governorates.join(", ")) + "</span></div>"
        : "<div><span>" + F.icon("location", 15) + " " + esc(locationText(service.governorates)) + "</span>" + rating + "</div>") +
      F.renderNotice(service.minBookingNoticeDays) +
      "<p>From <b>" + F.money(Number(service.price)) + "</b></p>";
    var copy = manage
      ? '<div class="vendor-copy">' + inner + "</div>"
      : '<a class="vendor-copy" href="' + href + '"' + target + ">" + inner + "</a>";

    var footer = options.footer || "";
    if (mode === "request") {
      var on = !!options.requested;
      footer = '<div class="card-footer">' +
        '<button type="button" class="button ' + (on ? "button-primary" : "button-secondary") + ' request-button" data-request="' + id + '" aria-pressed="' + on + '">' +
        '<span class="request-label">' + (on ? F.icon("check", 17) + " Requested" : "Request service") + "</span></button>" +
        '<p class="card-message" role="status" data-message="' + id + '" hidden></p></div>';
    } else if (footer) {
      footer = '<div class="card-footer">' + footer + "</div>";
    }
    return '<article class="vendor-card vendor-card-' + mode + '" data-service="' + id + '">' + image + copy + footer + "</article>";
  };
  /* Original name, kept so older callers keep working. */
  F.renderVendorCard = function (service) { return F.renderServiceCard(service, { mode: "browse" }); };

  /* Theme card. options: { mode: "use" | "select", selected, heading }. */
  F.renderThemeCard = function (theme, options) {
    options = options || {};
    var tag = options.heading || "h3";
    var selected = !!options.selected;
    var label = options.mode === "select"
      ? (selected ? F.icon("check", 17) + " Selected" : "Select theme")
      : (selected ? "Selected" : "Use this theme") + " " + F.icon("arrow");
    return '<article class="theme-card' + (selected ? " selected-card" : "") + '">' +
      '<div class="theme-image"><img src="' + esc(theme.image) + '" alt="' + esc(theme.name) + ' event"></div>' +
      '<div class="theme-copy"><div class="palette">' + theme.colors.map(function (c) { return '<i style="background-color:' + esc(c) + '"></i>'; }).join("") + "</div>" +
      "<small>Curated collection</small><" + tag + ">" + esc(theme.name) + "</" + tag + "><p>" + esc(theme.note) + ".</p>" +
      '<ul class="chip-row" aria-label="Works for">' + theme.eventTypes.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" +
      '<button type="button" class="button ' + (selected ? "button-primary" : "button-secondary") + '" data-theme="' + esc(theme.name) + '" aria-pressed="' + selected + '">' + label + "</button></div></article>";
  };

  /* One delegated listener per container: toggles the favorite and updates every matching heart. */
  F.bindHearts = function (root) {
    if (!root || root.getAttribute("data-hearts-bound")) return;
    root.setAttribute("data-hearts-bound", "true");
    root.addEventListener("click", function (event) {
      var button = event.target.closest("[data-heart]");
      if (!button || !root.contains(button)) return;
      var id = button.getAttribute("data-heart");
      var active = F.store.toggleFavorite(id);
      F.$$('[data-heart="' + id + '"]', root).forEach(function (el) {
        el.classList.toggle("heart-active", active);
        el.setAttribute("aria-pressed", String(active));
      });
    });
  };

  /* Empty state. options: { icon, size, title, text, action: { label, href?, attrs?, variant } } */
  F.renderEmpty = function (options) {
    var action = "";
    if (options.action) {
      var a = options.action;
      var variant = a.variant || "primary";
      action = a.href
        ? '<a class="button button-' + variant + '" href="' + esc(a.href) + '">' + esc(a.label) + "</a>"
        : '<button type="button" class="button button-' + variant + '" ' + (a.attrs || "") + ">" + esc(a.label) + "</button>";
    }
    return '<div class="empty">' + F.icon(options.icon, options.size) +
      "<h2>" + esc(options.title) + "</h2><p>" + esc(options.text) + "</p>" + action + "</div>";
  };

  /* Tabs with arrow-key support. Buttons need role="tab" and data-tab. Returns select(name). */
  F.bindTabs = function (tablist, onSelect) {
    var tabs = F.$$('[role="tab"]', tablist);
    function select(name, focus) {
      tabs.forEach(function (tab) {
        var on = tab.getAttribute("data-tab") === name;
        tab.setAttribute("aria-selected", String(on));
        tab.tabIndex = on ? 0 : -1;
        if (on && focus) tab.focus();
      });
      onSelect(name);
    }
    tablist.addEventListener("click", function (event) {
      var tab = event.target.closest('[role="tab"]');
      if (tab) select(tab.getAttribute("data-tab"));
    });
    tablist.addEventListener("keydown", function (event) {
      var index = tabs.indexOf(document.activeElement);
      if (index === -1) return;
      var next = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      select(tabs[(next + tabs.length) % tabs.length].getAttribute("data-tab"), true);
    });
    return select;
  };

  /* Modal confirmation built on <dialog>. options: { title, text, confirmLabel, danger }. Resolves true or false. */
  F.confirmDialog = function (options) {
    return new Promise(function (resolve) {
      var dialog = document.createElement("dialog");
      if (typeof dialog.showModal !== "function") { resolve(window.confirm(options.text)); return; }
      var titleId = "confirm-title-" + Date.now();
      dialog.className = "modal modal-small";
      dialog.setAttribute("aria-labelledby", titleId);
      dialog.innerHTML = '<div class="modal-body"><h2 id="' + titleId + '">' + esc(options.title) + "</h2><p>" + esc(options.text) + "</p>" +
        '<div class="modal-actions"><button type="button" class="button button-ghost" data-answer="no">Cancel</button>' +
        '<button type="button" class="button ' + (options.danger ? "button-danger" : "button-primary") + '" data-answer="yes">' + esc(options.confirmLabel || "Confirm") + "</button></div></div>";
      document.body.appendChild(dialog);
      var result = false;
      dialog.addEventListener("click", function (event) {
        var button = event.target.closest("[data-answer]");
        if (button) { result = button.getAttribute("data-answer") === "yes"; dialog.close(); }
        else if (event.target === dialog) dialog.close();
      });
      dialog.addEventListener("close", function () { dialog.remove(); resolve(result); });
      dialog.showModal();
      F.$('[data-answer="no"]', dialog).focus();
    });
  };

  /* Vendor application status screen (pending, rejected or approved). */
  F.renderVendorStatus = function (app) {
    var name = esc(app.name || "");
    var hello = name ? "Thank you, " + name + ". " : "";
    var ref = "<strong>VND-1024</strong>";
    var screens = {
      pending: {
        icon: "clock", tone: "pending", eyebrow: "Application under review", title: "Your application is under review",
        text: hello + "Our team is reviewing your demo application " + ref + ". The vendor dashboard unlocks as soon as it is approved. You can still update your details while you wait.",
        actions: '<a class="button button-primary" href="index.html">Back to home</a><a class="button button-secondary" href="services.html">Explore services</a><a class="button button-ghost" href="become-vendor.html?edit=1" data-edit>Edit application</a>'
      },
      rejected: {
        icon: "close", tone: "rejected", eyebrow: "Application not approved", title: "Your application wasn't approved",
        text: hello + "We couldn't approve application " + ref + " this time. Review your details, make any changes and resubmit it for another look.",
        actions: '<a class="button button-primary" href="become-vendor.html?edit=1" data-edit>Edit and resubmit</a><a class="button button-ghost" href="index.html">Back to home</a>'
      },
      approved: {
        icon: "check", tone: "approved", eyebrow: "Application approved", title: "You're approved",
        text: hello + "Your vendor account is active. Publish your services and they appear to customers straight away.",
        actions: '<a class="button button-primary" href="vendor-dashboard.html">Open vendor dashboard</a><a class="button button-secondary" href="vendor-services.html">Add a service</a>'
      }
    };
    var s = screens[app.status] || screens.pending;
    return '<div class="status-screen status-screen-' + s.tone + '"><div class="apply-mark status-mark-' + s.tone + '">' + F.icon(s.icon, 38) + "</div>" +
      '<div class="eyebrow">' + s.eyebrow + "</div><h2>" + s.title + "</h2><p>" + s.text + '</p><div class="apply-success-actions">' + s.actions + "</div></div>";
  };

  /* Customer-only pages: when the demo role is "vendor", replaces the container with a notice.
     Returns true when the page content should not be shown. */
  F.customerGate = function (container) {
    if (F.store.getRole() !== "vendor") return false;
    container.innerHTML = F.renderEmpty({
      icon: "users", size: 38, title: "You're viewing Fiesta as a vendor",
      text: "Planning and requesting services is for customers. Switch to the customer view to continue (demo only).",
      action: { label: "Switch to customer view", variant: "primary", attrs: "data-switch-customer" }
    });
    container.addEventListener("click", function (event) {
      if (!event.target.closest("[data-switch-customer]")) return;
      F.store.setRole("customer");
      window.location.reload();
    });
    return true;
  };
})(window.Fiesta = window.Fiesta || {});
