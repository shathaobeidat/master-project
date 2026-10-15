(function (F) {
  var KEYS = {
    favorites: "fiesta-favorites",
    cart: "fiesta-cart",
    planner: "fiesta-planner",
    vendor: "fiesta-vendor-application",
    session: "fiesta-session",
    services: "fiesta-services",
    bookings: "fiesta-bookings"
  };
  /* Keys from earlier versions of the demo, removed on reset. */
  var LEGACY_KEYS = ["fiesta-theme", "fiesta-booked"];

  var PLANNER_DEFAULTS = { type: "", date: "", from: "", to: "", governorate: "", guests: "50–100", themes: [] };
  var VENDOR_STATUSES = ["pending", "approved", "rejected"];

  /* DEMO ONLY: there is no real authentication. One browser holds one demo customer and at most one
     demo vendor account; the "current role" is switched from the demo tools panel. */
  var DEMO_CUSTOMER = { id: "customer-demo", name: "Mariam A." };
  var DEMO_VENDOR_ID = 101;

  /* localStorage with an in-memory fallback if storage is blocked or unavailable. */
  var memory = {};
  var usable = true;
  try {
    window.localStorage.setItem("__fiesta_test__", "1");
    window.localStorage.removeItem("__fiesta_test__");
  } catch (e) { usable = false; }

  function read(key) {
    if (usable) { try { return window.localStorage.getItem(key); } catch (e) { /* fall through */ } }
    return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : null;
  }
  /* Returns false only when real storage rejected the write (for example quota exceeded). */
  function write(key, value) {
    var saved = true;
    if (usable) {
      try { window.localStorage.setItem(key, value); } catch (e) { saved = false; }
    }
    if (saved) memory[key] = value;
    try { document.dispatchEvent(new CustomEvent("fiesta:change", { detail: { key: key } })); } catch (e) { /* ignore */ }
    return saved;
  }
  function remove(key) {
    delete memory[key];
    if (usable) { try { window.localStorage.removeItem(key); } catch (e) { /* ignore */ } }
  }
  function readJSON(key, fallback) {
    var raw = read(key);
    if (raw === null) return fallback;
    try { var value = JSON.parse(raw); return value === null ? fallback : value; } catch (e) { return fallback; }
  }
  function writeJSON(key, value) { return write(key, JSON.stringify(value)); }
  function list(key) {
    var value = readJSON(key, []);
    return Array.isArray(value) ? value : [];
  }
  function inList(array, value) { return Array.isArray(array) && array.indexOf(value) !== -1; }
  function strings(value) {
    return Array.isArray(value) ? value.filter(function (v) { return typeof v === "string"; }) : [];
  }

  var store = {
    KEYS: KEYS,
    VENDOR_STATUSES: VENDOR_STATUSES,
    DEMO_CUSTOMER: DEMO_CUSTOMER,
    DEMO_VENDOR_ID: DEMO_VENDOR_ID,

    /* ------------------------------------------------------------ favorites */
    getFavorites: function () {
      return list(KEYS.favorites).filter(function (id) { return typeof id === "number"; });
    },
    isFavorite: function (id) { return store.getFavorites().indexOf(Number(id)) !== -1; },
    /* Returns the new favorite state of the service. */
    toggleFavorite: function (id) {
      id = Number(id);
      var favorites = store.getFavorites();
      var index = favorites.indexOf(id);
      if (index === -1) favorites.push(id); else favorites.splice(index, 1);
      writeJSON(KEYS.favorites, favorites);
      return index === -1;
    },

    /* ------------------------------------------------- request list ("cart") */
    /* The cart holds service ids the customer wants to request for the planned event. */
    getCart: function () {
      var ids = list(KEYS.cart).map(function (item) {
        return Number(item && typeof item === "object" ? item.id : item);
      }).filter(function (id) { return id > 0; });
      return ids.filter(function (id, i) { return ids.indexOf(id) === i; });
    },
    inCart: function (id) { return store.getCart().indexOf(Number(id)) !== -1; },
    addToCart: function (id) {
      id = Number(id);
      var cart = store.getCart();
      if (cart.indexOf(id) === -1) { cart.push(id); writeJSON(KEYS.cart, cart); }
    },
    removeFromCart: function (id) {
      writeJSON(KEYS.cart, store.getCart().filter(function (x) { return x !== Number(id); }));
    },
    clearCart: function () { writeJSON(KEYS.cart, []); },
    /* Cart entries resolved to services; ids whose service no longer exists are skipped. */
    getCartServices: function () {
      return store.getCart().map(store.getService).filter(Boolean);
    },

    /* -------------------------------------------------------------- planner */
    getPlanner: function () {
      var saved = readJSON(KEYS.planner, {});
      if (!saved || typeof saved !== "object") saved = {};
      var result = {};
      Object.keys(PLANNER_DEFAULTS).forEach(function (key) {
        if (key === "themes") result.themes = strings(saved.themes);
        else result[key] = typeof saved[key] === "string" ? saved[key] : PLANNER_DEFAULTS[key];
      });
      /* Older saves used a free-text "city". */
      if (!result.governorate && inList(F.data.governorates, saved.city)) result.governorate = saved.city;
      return result;
    },
    setPlanner: function (value) { writeJSON(KEYS.planner, value); },
    toggleTheme: function (name) {
      var planner = store.getPlanner();
      var index = planner.themes.indexOf(name);
      if (index === -1) planner.themes.push(name); else planner.themes.splice(index, 1);
      store.setPlanner(planner);
      return index === -1;
    },

    /* Checks the step 1 details. Returns { field: message }, empty when everything is valid. */
    validatePlanner: function (form) {
      var errors = {};
      if (!inList(F.data.eventTypes, form.type)) errors.type = "Choose an event type.";
      if (!form.date) errors.date = "Choose the event date.";
      else if (F.daysFromToday(form.date) < 0) errors.date = "The event date can't be in the past.";
      if (!form.from) errors.from = "Choose a start time.";
      if (!form.to) errors.to = "Choose an end time.";
      else if (form.from && form.to <= form.from) errors.to = "The end time must be after the start time.";
      if (!inList(F.data.governorates, form.governorate)) errors.governorate = "Choose a governorate.";
      if (!form.guests) errors.guests = "Choose the expected number of guests.";
      return errors;
    },

    /* -------------------------------------------------- roles (DEMO ONLY) */
    getCustomer: function () { return DEMO_CUSTOMER; },
    /* "customer" (default) or "vendor". Vendor only applies once a vendor application exists. */
    getRole: function () {
      var session = readJSON(KEYS.session, {});
      return session && session.role === "vendor" && store.getVendorApplication() ? "vendor" : "customer";
    },
    setRole: function (role) { writeJSON(KEYS.session, { role: role === "vendor" ? "vendor" : "customer" }); },

    /* Vendor profile and status. The application from become-vendor.html is the vendor profile:
       { id, name, category, governorate, email, price, years, link, about, status, submittedAt, reviewedAt }. */
    getVendorApplication: function () {
      var saved = readJSON(KEYS.vendor, null);
      if (!saved || typeof saved !== "object") return null;
      saved.id = DEMO_VENDOR_ID;
      saved.status = inList(VENDOR_STATUSES, saved.status) ? saved.status : "pending";
      if (!saved.governorate && saved.city) saved.governorate = saved.city;
      return saved;
    },
    setVendorApplication: function (value) { return writeJSON(KEYS.vendor, value); },
    /* Registers (or updates) the demo vendor. New and resubmitted applications are always pending. */
    submitVendorApplication: function (fields) {
      var existing = store.getVendorApplication();
      var application = {};
      Object.keys(fields).forEach(function (key) { application[key] = fields[key]; });
      application.id = DEMO_VENDOR_ID;
      application.status = "pending";
      application.submittedAt = (existing && existing.submittedAt) || new Date().toISOString();
      application.resubmittedAt = existing ? new Date().toISOString() : "";
      application.reviewedAt = "";
      store.setVendorApplication(application);
      store.setRole("vendor");
      return application;
    },
    /* "none", "pending", "approved" or "rejected". */
    getVendorStatus: function () {
      var app = store.getVendorApplication();
      return app ? app.status : "none";
    },
    /* Stands in for the admin decision (see the demo tools panel). */
    setVendorStatus: function (status) {
      var app = store.getVendorApplication();
      if (!app || !inList(VENDOR_STATUSES, status)) return false;
      app.status = status;
      app.reviewedAt = status === "pending" ? "" : new Date().toISOString();
      store.setVendorApplication(app);
      return true;
    },
    isApprovedVendor: function () { return store.getRole() === "vendor" && store.getVendorStatus() === "approved"; },
    getCurrentVendorId: function () { return store.getVendorApplication() ? DEMO_VENDOR_ID : null; },

    /* --------------------------------------------------------- vendors */
    getVendors: function () {
      var vendors = F.data.vendors.slice();
      var app = store.getVendorApplication();
      if (app) vendors.push({ id: DEMO_VENDOR_ID, name: app.name, rating: null, reviews: 0, governorate: app.governorate || "", status: app.status });
      return vendors;
    },
    getVendor: function (id) {
      return store.getVendors().filter(function (v) { return v.id === Number(id); })[0] || null;
    },

    /* -------------------------------------------------------- services */
    /* Seed services plus the services published by vendors. Services of a vendor that is
       not currently approved are hidden from customers. */
    getServices: function () {
      var approved = store.getVendorStatus() === "approved";
      var published = list(KEYS.services).filter(function (s) {
        return s && typeof s === "object" && (s.vendorId !== DEMO_VENDOR_ID || approved);
      });
      return F.data.services.concat(published);
    },
    getService: function (id) {
      return store.getServices().filter(function (s) { return s.id === Number(id); })[0] || null;
    },
    /* A vendor's own published services, whatever the vendor's status. */
    getVendorServices: function (vendorId) {
      return list(KEYS.services).filter(function (s) { return s && s.vendorId === Number(vendorId); });
    },
    /* Adds a service (no id) or updates one (id). Returns { ok, service }; ok is false if storage is full. */
    saveService: function (service) {
      var all = list(KEYS.services);
      var item = {
        id: service.id, vendorId: Number(service.vendorId), title: service.title, category: service.category,
        eventTypes: service.eventTypes.slice(), governorates: service.governorates.slice(), price: Number(service.price),
        description: service.description, image: service.image, minBookingNoticeDays: Number(service.minBookingNoticeDays)
      };
      var index = -1;
      all.forEach(function (s, i) { if (item.id && s.id === item.id) index = i; });
      if (index === -1) {
        item.id = all.reduce(function (max, s) { return Math.max(max, s.id); }, 1000) + 1;
        all.push(item);
      } else {
        all[index] = item;
      }
      return { ok: writeJSON(KEYS.services, all), service: item };
    },
    deleteService: function (id) {
      writeJSON(KEYS.services, list(KEYS.services).filter(function (s) { return s.id !== Number(id); }));
      store.removeFromCart(id);
    },
    /* Services that fit an event type, and optionally a governorate and a category. */
    findServices: function (filter) {
      filter = filter || {};
      return store.getServices().filter(function (s) {
        return (!filter.eventType || inList(s.eventTypes, filter.eventType)) &&
          (!filter.governorate || inList(s.governorates, filter.governorate)) &&
          (!filter.category || s.category === filter.category);
      });
    },
    getThemes: function (eventType) {
      return F.data.themes.filter(function (t) { return !eventType || inList(t.eventTypes, eventType); });
    },

    /* The minimum booking notice rule. eventDate is "YYYY-MM-DD". Returns { ok, message, earliest }. */
    checkNotice: function (service, eventDate) {
      if (!eventDate) return { ok: true, unknown: true, message: "" };
      var days = F.daysFromToday(eventDate);
      var needed = Number(service.minBookingNoticeDays) || 0;
      if (days < 0) return { ok: false, message: "The event date is in the past. Choose a future date.", earliest: F.addDaysISO(F.todayISO(), needed) };
      if (days < needed) {
        var earliest = F.addDaysISO(F.todayISO(), needed);
        return {
          ok: false, earliest: earliest,
          message: "This service needs at least " + F.plural(needed, "day") + " notice, and your event is " + (days === 0 ? "today" : "in " + F.plural(days, "day")) +
            ". Choose a date on or after " + F.formatDate(earliest) + "."
        };
      }
      return { ok: true, message: "" };
    },

    /* -------------------------------------------------------- bookings */
    getBookings: function () {
      return list(KEYS.bookings).filter(function (b) { return b && typeof b === "object"; });
    },
    /* Tab a booking belongs to. Events that are over move to archived on their own. */
    getBucket: function (booking) {
      if (booking.status === "archived") return "archived";
      return F.daysFromToday(booking.date) < 0 ? "archived" : booking.status;
    },
    /* Why a booking is archived: "rejected", "completed" or "expired". */
    getArchiveReason: function (booking) {
      if (booking.status === "archived") return booking.outcome || "completed";
      return booking.status === "active" ? "completed" : "expired";
    },
    getCustomerBookings: function () {
      return store.getBookings().filter(function (b) { return b.customerId === DEMO_CUSTOMER.id; })
        .sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; });
    },
    getVendorBookings: function (vendorId) {
      return store.getBookings().filter(function (b) { return b.vendorId === Number(vendorId); })
        .sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; });
    },
    getBooking: function (id) {
      return store.getBookings().filter(function (b) { return b.id === id; })[0] || null;
    },

    /* Checks every cart service against the planner details. Returns { serviceId: message }. */
    validateRequests: function (form, services) {
      var problems = {};
      var bookings = store.getCustomerBookings();
      services.forEach(function (s) {
        var notice;
        if (!inList(s.eventTypes, form.type)) problems[s.id] = "Not offered for " + form.type.toLowerCase() + " events.";
        else if (!inList(s.governorates, form.governorate)) problems[s.id] = "Not available in " + form.governorate + ".";
        else if (!(notice = store.checkNotice(s, form.date)).ok) problems[s.id] = notice.message;
        else if (bookings.some(function (b) { return b.serviceId === s.id && b.date === form.date && store.getBucket(b) !== "archived"; })) {
          problems[s.id] = "You already sent a request for this service on " + F.formatDate(form.date) + ".";
        }
      });
      return problems;
    },

    /* Creates one pending_approval booking per cart service and empties the cart.
       Returns { ok, bookings, errors } where errors is { field | serviceId: message }. */
    createBookings: function (form) {
      var errors = store.validatePlanner(form);
      if (Object.keys(errors).length) return { ok: false, bookings: [], errors: errors };
      var services = store.getCartServices();
      if (!services.length) return { ok: false, bookings: [], errors: { cart: "Add at least one service to send a request." } };
      var problems = store.validateRequests(form, services);
      if (Object.keys(problems).length) return { ok: false, bookings: [], errors: problems };

      var all = store.getBookings();
      var next = all.reduce(function (max, b) { return Math.max(max, Number(String(b.id).replace(/\D/g, "")) || 0); }, 1000);
      var now = new Date().toISOString();
      var created = services.map(function (s) {
        next += 1;
        var vendor = store.getVendor(s.vendorId);
        return {
          id: "BK-" + next, serviceId: s.id, vendorId: s.vendorId, customerId: DEMO_CUSTOMER.id,
          eventType: form.type, date: form.date, from: form.from, to: form.to, governorate: form.governorate, guests: form.guests,
          status: "pending_approval", createdAt: now,
          /* Snapshots so the booking still reads well if the service is edited or deleted later. */
          serviceTitle: s.title, serviceImage: s.image, servicePrice: s.price, vendorName: vendor ? vendor.name : "",
          customerName: DEMO_CUSTOMER.name
        };
      });
      var ok = writeJSON(KEYS.bookings, all.concat(created));
      if (!ok) return { ok: false, bookings: [], errors: { cart: "Your browser storage is full, so the requests couldn't be saved." } };
      store.clearCart();
      return { ok: true, bookings: created, errors: {} };
    },
    /* decision: "approve" -> active, "reject" -> archived (outcome "rejected"). */
    decideBooking: function (id, decision) {
      var all = store.getBookings();
      var found = false;
      all.forEach(function (b) {
        if (b.id !== id || b.status !== "pending_approval") return;
        found = true;
        b.respondedAt = new Date().toISOString();
        if (decision === "approve") b.status = "active";
        else { b.status = "archived"; b.outcome = "rejected"; }
      });
      if (found) writeJSON(KEYS.bookings, all);
      return found;
    },

    /* Clears all demo data (used by the demo tools panel). */
    resetAll: function () {
      Object.keys(KEYS).map(function (k) { return KEYS[k]; }).concat(LEGACY_KEYS).forEach(remove);
      try { document.dispatchEvent(new CustomEvent("fiesta:change", { detail: { key: "reset" } })); } catch (e) { /* ignore */ }
    }
  };

  F.store = store;
})(window.Fiesta = window.Fiesta || {});
