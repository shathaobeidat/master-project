(function (F) {
  F.ready(function () {
    var body = F.$("#results-body");
    if (!body) return;
    var esc = F.escapeHtml;

    var query = F.$("#f-query");
    var category = F.$("#f-category");
    var eventType = F.$("#f-event");
    var governorate = F.$("#f-governorate");
    var sort = F.$("#f-sort");
    var count = F.$("#results-count");

    function options(first, items) {
      return [first].concat(items).map(function (v) { return "<option>" + esc(v) + "</option>"; }).join("");
    }
    category.innerHTML = F.data.categories.map(function (c) { return "<option>" + esc(c) + "</option>"; }).join("");
    eventType.innerHTML = options("All event types", F.data.eventTypes);
    governorate.innerHTML = options("All governorates", F.data.governorates);

    /* Optional deep links: services.html?event=Wedding&governorate=Amman&category=Catering */
    [["event", eventType], ["governorate", governorate], ["category", category]].forEach(function (pair) {
      var value = F.qs(pair[0]);
      if (value && F.$$("option", pair[1]).some(function (o) { return o.value === value; })) pair[1].value = value;
    });

    function results() {
      var text = query.value.trim().toLowerCase();
      var list = F.store.getServices().filter(function (s) {
        var vendor = F.store.getVendor(s.vendorId);
        return (category.value === "All services" || s.category === category.value) &&
          (eventType.value === "All event types" || s.eventTypes.indexOf(eventType.value) !== -1) &&
          (governorate.value === "All governorates" || s.governorates.indexOf(governorate.value) !== -1) &&
          (s.title + " " + s.category + " " + (vendor ? vendor.name : "")).toLowerCase().indexOf(text) !== -1;
      });
      function rating(s) { var v = F.store.getVendor(s.vendorId); return v && v.rating ? v.rating : 0; }
      if (sort.value === "Price: low to high") list = list.slice().sort(function (a, b) { return a.price - b.price; });
      if (sort.value === "Highest rated") list = list.slice().sort(function (a, b) { return rating(b) - rating(a); });
      return list;
    }

    function render() {
      var list = results();
      count.innerHTML = "<strong>" + list.length + "</strong> " + (list.length === 1 ? "service" : "services") + " found";
      body.innerHTML = list.length
        ? '<div class="vendor-grid">' + list.map(function (s) { return F.renderServiceCard(s, { mode: "browse" }); }).join("") + "</div>"
        : F.renderEmpty({
            icon: "search", size: 38,
            title: "No perfect matches yet",
            text: "Try broadening your filters, or clear them to see every service.",
            action: { label: "Clear filters", variant: "secondary", attrs: 'data-action="clear-filters"' }
          });
    }

    /* Resets search, category, event type and governorate (sort stays). */
    function clear() {
      query.value = "";
      category.value = "All services";
      eventType.value = "All event types";
      governorate.value = "All governorates";
      render();
    }

    query.addEventListener("input", render);
    [category, eventType, governorate, sort].forEach(function (el) { el.addEventListener("change", render); });
    F.$("#clear-all").addEventListener("click", clear);
    body.addEventListener("click", function (event) {
      if (event.target.closest('[data-action="clear-filters"]')) clear();
    });
    F.bindHearts(body);
    render();
  });
})(window.Fiesta = window.Fiesta || {});
