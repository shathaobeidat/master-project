(function (F) {
  var esc = F.escapeHtml;

  F.vendorPage({ page: "services", title: "My services", intro: "Publish and manage what customers can request. Changes appear on the marketplace straight away." }, function (ctx) {
    var store = F.store;
    var vendor = ctx.vendor;
    var main = ctx.main;
    var editingId = null;
    var image = ""; /* URL or data URL of the chosen image */

    ctx.actions.innerHTML = '<button type="button" class="button button-primary" id="add-service">' + F.icon("plus") + " Add service</button>";
    main.innerHTML = '<div id="service-grid"></div><p class="toast" id="toast" role="status" hidden></p>' +
      '<dialog class="modal" id="service-dialog" aria-labelledby="service-dialog-title"></dialog>';
    var grid = F.$("#service-grid");
    var toast = F.$("#toast");
    var dialog = F.$("#service-dialog");
    var toastTimer;

    function say(message) {
      toast.textContent = message;
      toast.hidden = false;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { toast.hidden = true; }, 5000);
    }

    /* ----------------------------------------------------------- list */
    function render() {
      var services = store.getVendorServices(vendor.id);
      grid.innerHTML = services.length
        ? '<div class="vendor-grid">' + services.map(function (s) {
            return F.renderServiceCard(s, { mode: "manage", footer:
              '<div class="card-actions"><button type="button" class="button button-secondary button-small" data-edit="' + s.id + '" aria-label="Edit ' + esc(s.title) + '">' + F.icon("edit", 16) + " Edit</button>" +
              '<button type="button" class="button button-secondary button-small" data-delete="' + s.id + '" aria-label="Delete ' + esc(s.title) + '">' + F.icon("trash", 16) + " Delete</button></div>" });
          }).join("") + "</div>"
        : F.renderEmpty({ icon: "bag", size: 42, title: "Publish your first service", text: "Add a service with its price, event types and where you work. Customers can find and request it right away.", action: { label: "Add service", variant: "primary", attrs: 'data-open-form="new"' } });
    }

    /* ----------------------------------------------------------- form */
    function checkboxes(name, values, checked) {
      return values.map(function (v, i) {
        return '<label class="check-item"><input type="checkbox" name="' + name + '" value="' + esc(v) + '"' + (checked.indexOf(v) !== -1 ? " checked" : "") + ' data-first="' + (i === 0) + '"> <span>' + esc(v) + "</span></label>";
      }).join("");
    }
    function samples() {
      var keys = ["romantic", "pastel", "classic", "modern", "cake", "photo", "birthday"];
      return keys.map(function (k) {
        return '<label class="sample"><input type="radio" name="sample" value="' + esc(F.data.photos[k]) + '"><img src="' + esc(F.data.photos[k]) + '" alt="Sample photo: ' + k + '"></label>';
      }).join("");
    }
    function err(id) { return '<p class="field-error" id="err-' + id + '" hidden></p>'; }

    function formHtml(s) {
      s = s || { title: "", description: "", price: "", category: "", eventTypes: [], governorates: [], minBookingNoticeDays: "" };
      return '<form id="service-form" novalidate><div class="modal-body">' +
        '<h2 id="service-dialog-title">' + (editingId ? "Edit service" : "Add service") + "</h2>" +
        '<div class="form-summary" id="form-summary" role="alert" tabindex="-1" hidden></div>' +
        '<div class="vf"><label for="sv-title">Title</label><input id="sv-title" maxlength="80" value="' + esc(s.title) + '" placeholder="e.g. Garden romance florals" aria-describedby="err-title">' + err("title") + "</div>" +
        '<div class="vf"><label for="sv-description">Description</label><textarea id="sv-description" rows="4" maxlength="600" placeholder="What is included, and what makes it yours?" aria-describedby="err-description">' + esc(s.description) + "</textarea>" + err("description") + "</div>" +
        '<div class="vf-row"><div class="vf"><label for="sv-price">Price (USD)</label><input type="number" id="sv-price" min="1" step="1" value="' + esc(s.price) + '" placeholder="e.g. 400" aria-describedby="err-price">' + err("price") + "</div>" +
        '<div class="vf"><label for="sv-notice">Minimum booking notice (days)</label><input type="number" id="sv-notice" min="0" max="365" step="1" value="' + esc(s.minBookingNoticeDays) + '" placeholder="e.g. 7" aria-describedby="err-notice">' + err("notice") + "</div></div>" +
        '<div class="vf"><label for="sv-category">Category</label><select id="sv-category" aria-describedby="err-category"><option value="">Choose a category</option>' +
          F.data.serviceCategories.map(function (c) { return "<option" + (c === s.category ? " selected" : "") + ">" + esc(c) + "</option>"; }).join("") + "</select>" + err("category") + "</div>" +
        '<fieldset class="vf" aria-describedby="err-eventTypes"><legend>Event types</legend><div class="check-grid" id="grp-eventTypes">' + checkboxes("eventTypes", F.data.eventTypes, s.eventTypes) + "</div>" + err("eventTypes") + "</fieldset>" +
        '<fieldset class="vf" aria-describedby="err-governorates"><legend>Governorates <button type="button" class="link-button" id="toggle-all">Select all</button></legend><div class="check-grid" id="grp-governorates">' + checkboxes("governorates", F.data.governorates, s.governorates) + "</div>" + err("governorates") + "</fieldset>" +
        '<fieldset class="vf" aria-describedby="err-image"><legend>Image</legend><div class="samples">' + samples() + "</div>" +
          '<div class="upload-row"><label class="button button-secondary button-small" for="sv-file">Upload your own</label><input type="file" id="sv-file" accept="image/*" class="sr-only"><span id="file-name">or pick a sample above</span></div>' +
          '<div class="image-preview" id="image-preview" hidden><img alt="Selected image preview"></div>' + err("image") + "</fieldset>" +
        '<div class="modal-actions"><button type="button" class="button button-ghost" id="cancel-form">Cancel</button><button type="submit" class="button button-primary">' + (editingId ? "Save changes" : "Publish service") + "</button></div>" +
        "</div></form>";
    }

    function setImage(value, label) {
      image = value;
      var preview = F.$("#image-preview", dialog);
      preview.hidden = !value;
      if (value) F.$("img", preview).src = value;
      if (label) F.$("#file-name", dialog).textContent = label;
      F.$$('input[name="sample"]', dialog).forEach(function (r) { r.checked = r.value === value; });
    }

    function openForm(service) {
      editingId = service ? service.id : null;
      dialog.innerHTML = formHtml(service);
      setImage(service ? service.image : "", service ? "Current image" : "");
      dialog.showModal();
      F.$("#sv-title", dialog).focus();
    }

    /* Downscales uploads so several images fit in localStorage. */
    function readImage(file, done) {
      if (!/^image\//.test(file.type)) { done(null, "Choose an image file (JPG, PNG or WebP)."); return; }
      if (file.size > 10 * 1024 * 1024) { done(null, "That image is over 10 MB. Choose a smaller one."); return; }
      var reader = new FileReader();
      reader.onerror = function () { done(null, "We couldn't read that file. Try another image."); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { done(null, "We couldn't open that image. Try another file."); };
        img.onload = function () {
          var scale = Math.min(1, 900 / img.width);
          var canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
          done(canvas.toDataURL("image/jpeg", 0.82));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }

    function values() {
      function checked(name) { return F.$$('input[name="' + name + '"]:checked', dialog).map(function (i) { return i.value; }); }
      return {
        title: F.$("#sv-title", dialog).value.trim(), description: F.$("#sv-description", dialog).value.trim(),
        price: F.$("#sv-price", dialog).value, notice: F.$("#sv-notice", dialog).value,
        category: F.$("#sv-category", dialog).value, eventTypes: checked("eventTypes"), governorates: checked("governorates"), image: image
      };
    }

    function validate(v) {
      var e = {};
      if (!v.title) e.title = "Enter a title for your service.";
      if (v.description.length < 20) e.description = v.description ? "Add a little more detail. The description needs at least 20 characters." : "Enter a description of at least 20 characters.";
      if (v.price === "" || !(Number(v.price) >= 1)) e.price = "Enter a price of $1 or more.";
      if (v.notice === "" || !/^\d+$/.test(v.notice) || Number(v.notice) > 365) e.notice = "Enter the notice in whole days, from 0 to 365.";
      if (!v.category) e.category = "Choose a category.";
      if (!v.eventTypes.length) e.eventTypes = "Select at least one event type.";
      if (!v.governorates.length) e.governorates = "Select at least one governorate.";
      if (!v.image) e.image = "Choose or upload an image.";
      return e;
    }

    var CONTROL = { title: "#sv-title", description: "#sv-description", price: "#sv-price", notice: "#sv-notice", category: "#sv-category", eventTypes: '#grp-eventTypes input', governorates: '#grp-governorates input', image: 'input[name="sample"]' };

    function showErrors(errors) {
      var keys = Object.keys(CONTROL);
      keys.forEach(function (k) {
        var msg = F.$("#err-" + k, dialog);
        var control = F.$(CONTROL[k], dialog);
        msg.hidden = !errors[k];
        msg.textContent = errors[k] || "";
        /* Single controls carry aria-invalid; checkbox and image groups are described by their error text. */
        if (control && /^(title|description|price|notice|category)$/.test(k)) {
          if (errors[k]) control.setAttribute("aria-invalid", "true"); else control.removeAttribute("aria-invalid");
        }
      });
      var summary = F.$("#form-summary", dialog);
      var failing = keys.filter(function (k) { return errors[k]; });
      summary.hidden = !failing.length;
      summary.textContent = failing.length ? "Please fix the " + F.plural(failing.length, "highlighted field") + " below to continue." : "";
      if (failing.length) { var first = F.$(CONTROL[failing[0]], dialog); (first || summary).focus(); }
    }

    dialog.addEventListener("submit", function (event) {
      event.preventDefault();
      var v = values();
      var errors = validate(v);
      showErrors(errors);
      if (Object.keys(errors).length) return;
      var result = store.saveService({
        id: editingId, vendorId: vendor.id, title: v.title, category: v.category, eventTypes: v.eventTypes, governorates: v.governorates,
        price: Number(v.price), description: v.description, image: v.image, minBookingNoticeDays: Number(v.notice)
      });
      if (!result.ok) {
        var summary = F.$("#form-summary", dialog);
        summary.textContent = "Your browser storage is full, so this couldn't be saved. Choose a smaller image or delete an old service, then try again.";
        summary.hidden = false;
        summary.focus();
        return;
      }
      var wasEdit = !!editingId;
      dialog.close();
      render();
      say(wasEdit ? "Changes saved." : "Service published. It now appears on the marketplace.");
      var again = F.$('[data-edit="' + result.service.id + '"]', grid);
      if (again) again.focus();
    });

    dialog.addEventListener("click", function (event) {
      if (event.target === dialog || event.target.closest("#cancel-form")) { dialog.close(); return; }
      if (event.target.closest("#toggle-all")) {
        var boxes = F.$$('input[name="governorates"]', dialog);
        var all = boxes.every(function (b) { return b.checked; });
        boxes.forEach(function (b) { b.checked = !all; });
        event.target.textContent = all ? "Select all" : "Clear all";
      }
    });
    dialog.addEventListener("change", function (event) {
      if (event.target.name === "sample") setImage(event.target.value, "Sample photo selected");
      if (event.target.id === "sv-file" && event.target.files[0]) {
        var file = event.target.files[0];
        readImage(file, function (data, problem) {
          if (problem) { var m = F.$("#err-image", dialog); m.textContent = problem; m.hidden = false; return; }
          F.$("#err-image", dialog).hidden = true;
          setImage(data, file.name);
        });
      }
    });

    /* ----------------------------------------------- list interactions */
    F.$("#add-service").addEventListener("click", function () { openForm(null); });
    main.addEventListener("click", function (event) {
      if (event.target.closest("[data-open-form]")) { openForm(null); return; }
      var edit = event.target.closest("[data-edit]");
      if (edit) {
        var s = store.getVendorServices(vendor.id).filter(function (x) { return x.id === Number(edit.getAttribute("data-edit")); })[0];
        if (s) openForm(s);
        return;
      }
      var del = event.target.closest("[data-delete]");
      if (del) {
        var id = Number(del.getAttribute("data-delete"));
        var service = store.getVendorServices(vendor.id).filter(function (x) { return x.id === id; })[0];
        if (!service) return;
        F.confirmDialog({ title: "Delete this service?", text: "“" + service.title + "” will be removed from the marketplace. Requests customers already sent stay in your bookings.", confirmLabel: "Delete service", danger: true }).then(function (yes) {
          if (!yes) { del.focus(); return; }
          store.deleteService(id);
          render();
          say("Service deleted.");
          F.$("#add-service").focus();
        });
      }
    });

    render();
    if (F.qs("new") === "1") openForm(null);
  });
})(window.Fiesta = window.Fiesta || {});
