(function (F) {
  F.ready(function () {
    var grid = F.$("#themes-grid");
    if (!grid) return;
    var esc = F.escapeHtml;
    var filter = F.$("#f-event");
    var count = F.$("#themes-count");
    var ALL = "All types";

    filter.innerHTML = [ALL].concat(F.data.eventTypes).map(function (t) { return "<option>" + esc(t) + "</option>"; }).join("");
    var fromUrl = F.qs("event");
    if (fromUrl && F.data.eventTypes.indexOf(fromUrl) !== -1) filter.value = fromUrl;

    function render() {
      var selected = F.store.getPlanner().themes;
      var list = F.store.getThemes(filter.value === ALL ? "" : filter.value);
      count.textContent = F.plural(list.length, "theme") + (filter.value === ALL ? "" : " for " + filter.value.toLowerCase());
      grid.innerHTML = list.length
        ? list.map(function (theme) { return F.renderThemeCard(theme, { mode: "use", heading: "h2", selected: selected.indexOf(theme.name) !== -1 }); }).join("")
        : F.renderEmpty({ icon: "search", size: 38, title: "No themes for this event yet", text: "Choose another event type, or show every theme.", action: { label: "Show all types", variant: "secondary", attrs: 'data-action="show-all"' } });
    }

    filter.addEventListener("change", render);
    grid.addEventListener("click", function (event) {
      if (event.target.closest('[data-action="show-all"]')) { filter.value = ALL; render(); return; }
      var button = event.target.closest("[data-theme]");
      if (!button) return;
      var name = button.getAttribute("data-theme");
      var planner = F.store.getPlanner();
      if (planner.themes.indexOf(name) === -1) {
        planner.themes.push(name);
        /* Carry the chosen filter over so the planner opens on the right event type. */
        if (!planner.type && filter.value !== ALL) planner.type = filter.value;
        F.store.setPlanner(planner);
      }
      window.location.href = "planner.html";
    });
    render();
  });
})(window.Fiesta = window.Fiesta || {});
