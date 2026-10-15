(function (F) {
  var NAV = [
    { label: "Home", href: "index.html", pages: ["index.html"], current: true },
    { label: "Explore services", href: "services.html", pages: ["services.html"], current: true },
    { label: "Event themes", href: "themes.html", pages: ["themes.html"], current: true },
    /* In the source "How it works" targets the home page, so it is highlighted there too. */
    { label: "How it works", href: "index.html#how", pages: ["index.html"], current: false }
  ];

  function currentFile() {
    var file = window.location.pathname.split("/").pop() || "index.html";
    return file.indexOf(".") === -1 ? file + ".html" : file;
  }

  /* Header links and buttons depend on the demo role: customer, approved vendor, or vendor awaiting approval. */
  function roleLinks() {
    var role = F.store.getRole();
    var status = F.store.getVendorStatus();
    if (role === "vendor" && status === "approved") {
      return { nav: { label: "Vendor dashboard", href: "vendor-dashboard.html", pages: [] }, action: { label: "Vendor dashboard", href: "vendor-dashboard.html" }, cart: false };
    }
    if (role === "vendor") {
      return { nav: { label: "My application", href: "become-vendor.html", pages: ["become-vendor.html"] }, action: { label: "My application", href: "become-vendor.html" }, cart: false };
    }
    return { nav: { label: "For vendors", href: "become-vendor.html", pages: ["become-vendor.html"] }, action: null, cart: true };
  }

  function headerHtml(file, cartCount) {
    var role = roleLinks();
    var links = NAV.concat([role.nav]).map(function (item) {
      var active = item.pages.indexOf(file) !== -1;
      return '<a href="' + item.href + '"' + (active ? ' class="nav-active"' : "") + (active && item.current !== false ? ' aria-current="page"' : "") + ">" + item.label + "</a>";
    }).join("");
    var mobile = role.action || { label: "Dashboard", href: "dashboard.html" };
    var actions = role.cart
      ? '<a class="icon-button cart-button" href="cart.html" aria-label="Cart with ' + cartCount + ' items">' + F.icon("bag") + (cartCount > 0 ? "<span>" + cartCount + "</span>" : "") + "</a>" +
        '<a class="button button-ghost desktop-only" href="dashboard.html">Dashboard</a>' +
        '<a class="button button-primary desktop-only" href="planner.html">Plan my event</a>'
      : '<a class="button button-primary desktop-only" href="' + role.action.href + '">' + role.action.label + "</a>";
    return '<header class="site-header"><div class="nav-wrap">' +
      '<a class="brand" href="index.html" aria-label="Fiesta home"><span>f</span>fiesta.</a>' +
      '<nav class="nav-links" id="site-nav" aria-label="Main navigation">' + links + '<a class="mobile-only" href="' + mobile.href + '">' + mobile.label + '</a></nav>' +
      '<div class="nav-actions">' + actions +
        '<button type="button" class="icon-button menu-button" aria-label="Toggle menu" aria-expanded="false" aria-controls="site-nav">' + F.icon("menu") + "</button>" +
      "</div></div></header>";
  }

  function footerVendorLink() {
    var status = F.store.getVendorStatus();
    if (F.store.getRole() === "vendor") {
      return status === "approved" ? '<a href="vendor-dashboard.html">Vendor dashboard</a>' : '<a href="become-vendor.html">My application</a>';
    }
    return '<a href="become-vendor.html">Become a vendor</a>';
  }

  function footerHtml() {
    return '<footer><div class="footer-main">' +
      '<div><a class="brand footer-brand" href="index.html" aria-label="Fiesta home"><span>f</span>fiesta.</a><p>Thoughtful planning for celebrations that feel entirely your own.</p></div>' +
      '<div><strong>Explore</strong><a href="services.html">Services</a><a href="themes.html">Themes</a><a href="planner.html">Plan an event</a></div>' +
      '<div><strong>Company</strong><button type="button">About Fiesta</button><button type="button">Contact</button><button type="button">FAQs</button></div>' +
      '<div><strong>For vendors</strong>' + footerVendorLink() + '<button type="button">Vendor resources</button><a href="vendor-dashboard.html">Partner login</a></div>' +
      '</div><div class="footer-bottom"><span>© 2025 Fiesta. Made for meaningful moments.</span><span>Privacy · Terms · Accessibility</span></div></footer>';
  }

  function updateCartCount() {
    var link = F.$(".cart-button");
    if (!link) return;
    var count = F.store.getCart().length;
    link.setAttribute("aria-label", "Cart with " + count + " items");
    var badge = F.$("span", link);
    if (count > 0) {
      if (!badge) { badge = document.createElement("span"); link.appendChild(badge); }
      badge.textContent = count;
    } else if (badge) {
      badge.remove();
    }
  }

  function bindMenu() {
    var button = F.$(".menu-button");
    var nav = F.$(".nav-links");
    if (!button || !nav) return;
    function setOpen(open) {
      nav.classList.toggle("nav-open", open);
      button.setAttribute("aria-expanded", String(open));
      button.innerHTML = F.icon(open ? "close" : "menu");
    }
    button.addEventListener("click", function () { setOpen(!nav.classList.contains("nav-open")); });
    nav.addEventListener("click", function (event) { if (event.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("nav-open")) { setOpen(false); button.focus(); }
    });
  }

  /* DEMO ONLY: stands in for logging in and for the admin who approves vendors. */
  function mountDemoTools() {
    if (F.$("#demo-tools")) return;
    var app = F.store.getVendorApplication();
    var role = F.store.getRole();
    var status = F.store.getVendorStatus();
    function radio(name, value, label, checked, disabled) {
      return '<label class="demo-option' + (disabled ? " is-disabled" : "") + '"><input type="radio" name="' + name + '" value="' + value + '"' + (checked ? " checked" : "") + (disabled ? " disabled" : "") + "> " + label + "</label>";
    }
    var box = document.createElement("div");
    box.id = "demo-tools";
    box.className = "demo-tools";
    box.innerHTML = '<button type="button" class="demo-toggle" aria-expanded="false" aria-controls="demo-panel">Demo tools</button>' +
      '<div class="demo-panel" id="demo-panel" role="group" aria-label="Demo tools" hidden>' +
        "<p>Demo only. Real sign-in and admin approval are simulated here.</p>" +
        '<fieldset><legend>View Fiesta as</legend>' + radio("demo-role", "customer", "Customer", role === "customer") +
          radio("demo-role", "vendor", "Vendor", role === "vendor", !app) + "</fieldset>" +
        (app
          ? '<fieldset><legend>Vendor application status</legend>' + F.store.VENDOR_STATUSES.map(function (v) { return radio("demo-status", v, v.charAt(0).toUpperCase() + v.slice(1), status === v); }).join("") + "</fieldset>"
          : '<p class="demo-hint">No vendor account yet. <a href="become-vendor.html">Apply to become a vendor</a> to try the vendor role.</p>') +
        '<button type="button" class="demo-reset">Reset demo data</button></div>';
    document.body.appendChild(box);
    var toggle = F.$(".demo-toggle", box);
    var panel = F.$(".demo-panel", box);
    function setOpen(open) { panel.hidden = !open; toggle.setAttribute("aria-expanded", String(open)); }
    toggle.addEventListener("click", function () { setOpen(panel.hidden); });
    box.addEventListener("keydown", function (event) { if (event.key === "Escape" && !panel.hidden) { setOpen(false); toggle.focus(); } });
    box.addEventListener("change", function (event) {
      var input = event.target;
      if (input.name === "demo-role") F.store.setRole(input.value);
      else if (input.name === "demo-status") F.store.setVendorStatus(input.value);
      else return;
      window.location.reload();
    });
    F.$(".demo-reset", box).addEventListener("click", function () {
      F.confirmDialog({ title: "Reset demo data?", text: "This clears your plan, requests, vendor account and published services in this browser.", confirmLabel: "Reset", danger: true }).then(function (yes) {
        if (!yes) return;
        F.store.resetAll();
        window.location.href = "index.html";
      });
    });
  }

  F.ready(function () {
    var header = F.$("#site-header");
    var footer = F.$("#site-footer");
    if (header) {
      header.innerHTML = headerHtml(currentFile(), F.store.getCart().length);
      bindMenu();
      document.addEventListener("fiesta:change", updateCartCount);
      window.addEventListener("storage", updateCartCount);
    }
    if (footer) footer.innerHTML = footerHtml();
    F.hydrateIcons(document);
    mountDemoTools();
  });
})(window.Fiesta = window.Fiesta || {});
