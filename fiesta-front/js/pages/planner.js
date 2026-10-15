(function (F) {
  F.ready(function () {
    var root = F.$("#planner-form");
    if (!root) return;
    if (F.customerGate(root)) return;
    var esc = F.escapeHtml;
    var store = F.store;

    var form = store.getPlanner();
    var step = 1;
    var category = "all"; /* "all", a category name, or "themes" */

    /* Optional deep link from the home page: planner.html?type=Wedding */
    var urlType = F.qs("type");
    if (urlType && F.data.eventTypes.indexOf(urlType) !== -1 && form.type !== urlType) { form.type = urlType; store.setPlanner(form); }

    var fields = { type: F.$("#f-type"), date: F.$("#f-date"), governorate: F.$("#f-governorate"), from: F.$("#f-from"), to: F.$("#f-to"), guests: F.$("#f-guests") };
    var LABELS = { type: "event type", date: "date", from: "start time", to: "end time", governorate: "governorate", guests: "guest count" };
    var panels = F.$$("[data-step]", root);
    var bars = F.$$("#progress-bars i");
    var label = F.$("#progress-label");
    var error = F.$("#form-error");
    var back = F.$("#btn-back");
    var next = F.$("#btn-next");
    var summary = F.$("#summary-card");
    var items = F.$("#summary-items");
    var picker = F.$("#picker");
    var chips = F.$("#category-chips");
    var bar = F.$("#selection-bar");

    function fill(select, first, values) {
      select.innerHTML = (first ? '<option value="">' + first + "</option>" : "") + values.map(function (v) { return "<option>" + esc(v) + "</option>"; }).join("");
    }
    fill(fields.type, "Choose an event type", F.data.eventTypes);
    fill(fields.governorate, "Choose a governorate", F.data.governorates);
    fields.date.min = F.todayISO();

    Object.keys(fields).forEach(function (key) {
      fields[key].value = form[key];
      var handler = function () {
        form[key] = fields[key].value;
        var saved = store.getPlanner();
        saved[key] = form[key];
        store.setPlanner(saved);
        fields[key].removeAttribute("aria-invalid");
      };
      fields[key].addEventListener("input", handler);
      fields[key].addEventListener("change", handler);
    });

    function showError(message) { error.textContent = message; error.hidden = false; }
    function hideError() { error.hidden = true; error.textContent = ""; }

    /* Validates step 1, marks invalid fields and shows one clear message. Returns true when valid. */
    function validateStep1() {
      var errors = store.validatePlanner(form);
      Object.keys(fields).forEach(function (key) {
        if (errors[key]) fields[key].setAttribute("aria-invalid", "true"); else fields[key].removeAttribute("aria-invalid");
      });
      var keys = Object.keys(errors);
      if (!keys.length) return true;
      var missing = keys.filter(function (k) { return !form[k]; }).map(function (k) { return LABELS[k]; });
      var others = keys.filter(function (k) { return form[k]; }).map(function (k) { return errors[k]; });
      var parts = [];
      if (missing.length) parts.push("Please complete your " + F.joinAnd(missing) + ".");
      showError(parts.concat(others).join(" "));
      var first = fields[keys[0]];
      if (first) first.focus();
      return false;
    }

    /* ---------------------------------------------------------- step 2 */
    function selectionText() {
      var services = store.getCartServices();
      var themes = store.getPlanner().themes;
      if (!services.length && !themes.length) return "Nothing selected yet. Request a service to add it to your plan.";
      var total = services.reduce(function (sum, s) { return sum + Number(s.price); }, 0);
      var parts = [];
      if (services.length) parts.push(F.plural(services.length, "service"));
      if (themes.length) parts.push(F.plural(themes.length, "theme"));
      return parts.join(" and ") + " selected" + (services.length ? " · Estimated " + F.money(total, true) : "");
    }
    function updateBar() { bar.textContent = selectionText(); }

    function renderChips() {
      var entries = [["all", "All"]].concat(F.data.serviceCategories.map(function (c) { return [c, c]; })).concat([["themes", "Themes"]]);
      chips.innerHTML = entries.map(function (e) {
        return '<button type="button" data-category="' + esc(e[0]) + '" aria-pressed="' + (category === e[0]) + '">' + esc(e[1]) + "</button>";
      }).join("");
    }

    function renderPicker() {
      var services = category === "themes" ? [] : store.findServices({
        eventType: form.type, governorate: form.governorate, category: category === "all" ? "" : category
      });
      var themes = category === "all" || category === "themes" ? store.getThemes(form.type) : [];
      var selectedThemes = store.getPlanner().themes;
      var html = "";
      if (category !== "themes") {
        html += '<h3 class="picker-heading">Services <span>' + services.length + "</span></h3>" + (services.length
          ? '<div class="vendor-grid">' + services.map(function (s) { return F.renderServiceCard(s, { mode: "request", newTab: true, requested: store.inCart(s.id) }); }).join("") + "</div>"
          : '<p class="picker-empty">No ' + (category === "all" ? "" : esc(category) + " ") + "services for " + esc(form.type.toLowerCase()) + " events in " + esc(form.governorate) + " yet. Try another category, or change your details in step 1.</p>");
      }
      if (themes.length) {
        html += '<h3 class="picker-heading">Themes <span>' + themes.length + '</span></h3><div class="vendor-grid">' +
          themes.map(function (t) { return F.renderThemeCard(t, { mode: "select", selected: selectedThemes.indexOf(t.name) !== -1 }); }).join("") + "</div>";
      }
      picker.innerHTML = html;
      F.hydrateIcons(picker);
    }

    function renderStep2() {
      F.$("#context-pill").textContent = form.type + " · " + form.governorate + " · " + F.formatDate(form.date);
      renderChips();
      renderPicker();
      updateBar();
    }

    /* Updates one request button in place so keyboard focus is not lost. */
    function paintRequest(button, on) {
      button.setAttribute("aria-pressed", String(on));
      button.classList.toggle("button-primary", on);
      button.classList.toggle("button-secondary", !on);
      F.$(".request-label", button).innerHTML = on ? F.icon("check", 17) + " Requested" : "Request service";
    }

    picker.addEventListener("click", function (event) {
      var request = event.target.closest("[data-request]");
      if (request) {
        var id = Number(request.getAttribute("data-request"));
        var message = F.$('[data-message="' + id + '"]', picker);
        message.hidden = true;
        if (store.inCart(id)) {
          store.removeFromCart(id);
          paintRequest(request, false);
        } else {
          var service = store.getService(id);
          var notice = service ? store.checkNotice(service, form.date) : { ok: false, message: "This service is no longer available." };
          if (!notice.ok) { message.textContent = notice.message; message.hidden = false; return; }
          store.addToCart(id);
          paintRequest(request, true);
        }
        updateBar();
        return;
      }
      var theme = event.target.closest("[data-theme]");
      if (theme) {
        var on = store.toggleTheme(theme.getAttribute("data-theme"));
        theme.setAttribute("aria-pressed", String(on));
        theme.classList.toggle("button-primary", on);
        theme.classList.toggle("button-secondary", !on);
        theme.innerHTML = on ? F.icon("check", 17) + " Selected" : "Select theme";
        theme.closest(".theme-card").classList.toggle("selected-card", on);
        updateBar();
      }
    });

    chips.addEventListener("click", function (event) {
      var chip = event.target.closest("[data-category]");
      if (!chip) return;
      category = chip.getAttribute("data-category");
      F.$$("button", chips).forEach(function (b) { b.setAttribute("aria-pressed", String(b === chip)); });
      renderPicker();
    });
    F.$("#edit-details").addEventListener("click", function () { go(1); });

    /* ---------------------------------------------------------- step 3 */
    function renderSummary() {
      var rows = [
        ["Event", form.type], ["Date", F.formatDate(form.date)],
        ["Time", F.formatTime(form.from) + " – " + F.formatTime(form.to)], ["Location", form.governorate],
        ["Guests", form.guests]
      ];
      summary.innerHTML = rows.map(function (r) { return "<div><span>" + r[0] + "</span><strong>" + esc(r[1]) + "</strong></div>"; }).join("");

      var services = store.getCartServices();
      var themes = store.getPlanner().themes.filter(function (name) {
        return store.getThemes(form.type).some(function (t) { return t.name === name; });
      });
      var problems = store.validateRequests(form, services);
      var total = services.reduce(function (sum, s) { return sum + Number(s.price); }, 0);

      var html = '<h3 class="picker-heading">Selected services <span>' + services.length + "</span></h3>";
      html += services.length ? '<ul class="summary-list">' + services.map(function (s) {
        var vendor = store.getVendor(s.vendorId);
        return '<li class="summary-row' + (problems[s.id] ? " has-problem" : "") + '"><img src="' + esc(s.image) + '" alt="">' +
          "<div><strong>" + esc(s.title) + "</strong><span>" + esc(vendor ? vendor.name : "") + " · " + esc(s.category) + "</span>" +
          (problems[s.id] ? '<em class="row-problem">' + esc(problems[s.id]) + "</em>" : "") + "</div>" +
          "<b>" + F.money(Number(s.price), true) + '</b><button type="button" class="link-button" data-remove-service="' + s.id + '" aria-label="Remove ' + esc(s.title) + '">Remove</button></li>';
      }).join("") + "</ul>" : '<p class="picker-empty">No services selected yet. Go back and request at least one service.</p>';
      html += '<h3 class="picker-heading">Selected themes <span>' + themes.length + "</span></h3>";
      html += themes.length ? '<ul class="summary-list">' + themes.map(function (name) {
        return '<li class="summary-row summary-theme"><div><strong>' + esc(name) + '</strong></div><button type="button" class="link-button" data-remove-theme="' + esc(name) + '" aria-label="Remove ' + esc(name) + ' theme">Remove</button></li>';
      }).join("") + "</ul>" : '<p class="picker-empty">Open to ideas. No theme selected.</p>';
      html += '<div class="summary-total"><span>Estimated total</span><strong>' + F.money(total, true) + "</strong><small>Sum of the selected services. Vendors confirm final prices. You won’t be charged.</small></div>";
      items.innerHTML = html;
    }

    items.addEventListener("click", function (event) {
      var s = event.target.closest("[data-remove-service]");
      var t = event.target.closest("[data-remove-theme]");
      if (s) store.removeFromCart(s.getAttribute("data-remove-service"));
      else if (t) store.toggleTheme(t.getAttribute("data-remove-theme"));
      else return;
      hideError();
      renderSummary();
    });

    /* ------------------------------------------------------- navigation */
    function update() {
      panels.forEach(function (p) { p.hidden = Number(p.getAttribute("data-step")) !== step; });
      bars.forEach(function (b, i) { b.classList.toggle("filled", i + 1 <= step); });
      label.textContent = "Step " + step + " of 3";
      back.classList.toggle("is-hidden", step === 1);
      next.innerHTML = (step === 3 ? "Send requests" : "Continue") + " " + F.icon("arrow");
      if (step === 2) renderStep2();
      if (step === 3) renderSummary();
    }
    function go(n) {
      step = n;
      hideError();
      update();
      var heading = F.$('[data-step="' + step + '"] h2', root);
      if (heading) heading.focus({ preventScroll: true });
      F.scrollToTop();
    }

    next.addEventListener("click", function () {
      if (step === 1) { if (validateStep1()) go(2); return; }
      if (step === 2) { go(3); return; }
      var result = store.createBookings(store.getPlanner());
      if (!result.ok) {
        var keys = Object.keys(result.errors);
        if (result.errors.cart) showError(result.errors.cart);
        else if (keys.some(function (k) { return fields[k]; })) { go(1); validateStep1(); }
        else { showError("Fix the highlighted services before sending your requests."); }
        return;
      }
      window.location.href = "cart.html?sent=" + result.bookings.length;
    });
    back.addEventListener("click", function () { if (step > 1) go(step - 1); });

    update();
    /* planner.html?step=3 opens the summary when the details are valid. */
    if (F.qs("step") === "3" && Object.keys(store.validatePlanner(form)).length === 0) go(3);
  });
})(window.Fiesta = window.Fiesta || {});
