(function (F) {
  F.ready(function () {
    var form = F.$("#apply-form");
    if (!form) return;
    var esc = F.escapeHtml;
    var store = F.store;

    var ids = ["name", "category", "governorate", "email", "price", "years", "link", "about"];
    var el = {};
    ids.forEach(function (id) { el[id] = F.$("#bv-" + id); });
    var terms = F.$("#bv-terms");
    var error = F.$("#apply-error");
    var status = F.$("#apply-success");
    var submit = F.$("#apply-submit");
    var cancel = F.$("#apply-cancel");

    /* Categories and governorates come from the shared data, without "All services". */
    el.category.innerHTML = '<option value="">Choose a category</option>' +
      F.data.serviceCategories.map(function (c) { return "<option>" + esc(c) + "</option>"; }).join("");
    el.governorate.innerHTML = '<option value="">Choose a governorate</option>' +
      F.data.governorates.map(function (g) { return "<option>" + esc(g) + "</option>"; }).join("");

    function fill(saved) {
      ids.forEach(function (id) { el[id].value = saved[id] || ""; });
    }

    var app = store.getVendorApplication();

    function showStatus() {
      form.hidden = true;
      status.hidden = false;
      status.innerHTML = F.renderVendorStatus(app);
    }
    function showForm() {
      form.hidden = false;
      status.hidden = true;
      terms.checked = false;
      error.hidden = true;
      var resubmit = app && app.status === "rejected";
      submit.firstChild.textContent = resubmit ? "Resubmit application " : app ? "Save changes " : "Submit application ";
      cancel.hidden = !app;
      el.name.focus();
    }

    function validate() {
      var missing = [];
      var parts = [];
      if (!el.name.value.trim()) missing.push("business name");
      if (!el.category.value) missing.push("category");
      if (!el.governorate.value) missing.push("governorate");
      if (missing.length) parts.push("Please complete your " + F.joinAnd(missing) + ".");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.email.value.trim())) parts.push("Please enter a valid email address.");
      if (!terms.checked) parts.push("Please confirm the demo notice.");
      return parts.join(" ");
    }

    if (app) {
      fill(app);
      if (F.qs("edit") === "1" && app.status !== "approved") showForm(); else showStatus();
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var message = validate();
      if (message) {
        error.textContent = message;
        error.hidden = false;
        return;
      }
      error.hidden = true;
      var fields = {};
      ids.forEach(function (id) { fields[id] = el[id].value.trim(); });
      store.submitVendorApplication(fields);
      /* A fresh page load shows the vendor links in the header and lands on the status screen. */
      window.location.href = "become-vendor.html?saved=1#apply";
    });

    status.addEventListener("click", function (event) {
      if (!event.target.closest("[data-edit]")) return;
      event.preventDefault();
      showForm();
    });
    cancel.addEventListener("click", function () { showStatus(); status.scrollIntoView({ block: "center" }); });
  });
})(window.Fiesta = window.Fiesta || {});
