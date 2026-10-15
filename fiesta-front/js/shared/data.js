(function (F) {
  var base = "https://images.unsplash.com/";
  function photo(id, w, q) { return base + id + "?auto=format&fit=crop&w=" + (w || 900) + "&q=" + (q || 85); }

  var photos = {
    hero: photo("photo-1665607437981-973dcd6a22bb", 1800, 88),
    romantic: photo("photo-1649615644613-758b850399c1"),
    pastel: photo("photo-1681497397524-0dabeca42094"),
    classic: photo("photo-1737682599438-319b61711b5f"),
    modern: photo("photo-1561593367-66c79c2294e6"),
    cake: photo("photo-1760401697752-ab723885ff27"),
    photo: photo("photo-1719257751404-1dea075324bd"),
    birthday: photo("photo-1562967005-a3c85514d3e9")
  };

  /* Same values the planner offers in step 1. */
  var eventTypes = ["Wedding", "Birthday", "Engagement", "Graduation", "Baby shower"];

  /* The 12 governorates of Jordan. A service lists one or more of them. */
  var governorates = ["Amman", "Irbid", "Zarqa", "Balqa", "Mafraq", "Jerash", "Ajloun", "Madaba", "Karak", "Tafilah", "Ma'an", "Aqaba"];

  var categories = ["All services", "Florals & Decor", "Photography", "Cakes & Desserts", "Catering", "Event Styling"];

  /* DEMO DATA. Vendors are the businesses behind the services. The registered
     demo vendor (id 101) is created in the store when someone applies. */
  var vendors = [
    { id: 1, name: "Luna Floral Studio", rating: 4.9, reviews: 128, governorate: "Amman" },
    { id: 2, name: "Frame & Vow", rating: 4.8, reviews: 94, governorate: "Amman" },
    { id: 3, name: "The Sugar Atelier", rating: 4.9, reviews: 76, governorate: "Zarqa" },
    { id: 4, name: "Gather Table Co.", rating: 4.7, reviews: 112, governorate: "Amman" },
    { id: 5, name: "Maison Moment", rating: 4.8, reviews: 63, governorate: "Irbid" },
    { id: 6, name: "Petal & Plinth", rating: 4.6, reviews: 51, governorate: "Amman" }
  ];

  /* DEMO DATA. Seed services 1-6 are the original six vendor entries; 7-11 give every
     event type a few options per category. Services published by vendors get ids from 1001. */
  var services = [
    { id: 1, vendorId: 1, title: "Garden romance florals", category: "Florals & Decor", eventTypes: ["Wedding", "Engagement"], governorates: ["Amman", "Zarqa", "Balqa"], price: 420, image: photos.romantic, minBookingNoticeDays: 7,
      description: "Organic florals and artful tablescapes designed around your story." },
    { id: 2, vendorId: 2, title: "Editorial event photography", category: "Photography", eventTypes: ["Wedding", "Engagement", "Graduation", "Birthday"], governorates: ["Amman", "Irbid", "Zarqa"], price: 560, image: photos.photo, minBookingNoticeDays: 10,
      description: "Editorial event photography with a warm, honest point of view." },
    { id: 3, vendorId: 3, title: "Sculptural cakes and dessert tables", category: "Cakes & Desserts", eventTypes: ["Wedding", "Birthday", "Engagement", "Baby shower"], governorates: ["Zarqa", "Amman", "Madaba"], price: 180, image: photos.cake, minBookingNoticeDays: 3,
      description: "Sculptural cakes, delicate pastries and dessert tables made by hand." },
    { id: 4, vendorId: 4, title: "Seasonal buffet catering", category: "Catering", eventTypes: ["Wedding", "Birthday", "Engagement", "Graduation"], governorates: ["Amman", "Zarqa", "Balqa", "Madaba"], price: 740, image: photos.birthday, minBookingNoticeDays: 14,
      description: "Seasonal menus and generous hospitality for modern celebrations." },
    { id: 5, vendorId: 5, title: "Full event styling", category: "Event Styling", eventTypes: ["Wedding", "Engagement", "Graduation"], governorates: ["Irbid", "Ajloun", "Jerash", "Mafraq"], price: 390, image: photos.classic, minBookingNoticeDays: 10,
      description: "Refined event styling from first moodboard to final place setting." },
    { id: 6, vendorId: 6, title: "Pastel floral installations", category: "Florals & Decor", eventTypes: ["Birthday", "Baby shower", "Graduation"], governorates: ["Amman", "Zarqa", "Madaba"], price: 310, image: photos.pastel, minBookingNoticeDays: 5,
      description: "Playful floral installations made for joyful, color-filled events." },
    { id: 7, vendorId: 3, title: "Dessert boxes and sweet tables", category: "Cakes & Desserts", eventTypes: ["Baby shower", "Graduation", "Birthday"], governorates: ["Amman", "Irbid", "Zarqa"], price: 120, image: photos.cake, minBookingNoticeDays: 2,
      description: "Hand-finished mini cakes, cookies and dessert boxes for guests to take home." },
    { id: 8, vendorId: 2, title: "Baby shower and family portraits", category: "Photography", eventTypes: ["Baby shower", "Birthday"], governorates: ["Amman", "Irbid"], price: 320, image: photos.photo, minBookingNoticeDays: 5,
      description: "Relaxed, natural coverage of the gathering plus a short family portrait session." },
    { id: 9, vendorId: 4, title: "Family party catering", category: "Catering", eventTypes: ["Birthday", "Baby shower"], governorates: ["Amman", "Irbid", "Zarqa"], price: 380, image: photos.birthday, minBookingNoticeDays: 7,
      description: "Generous shared platters and kid-friendly menus, served and cleared by our team." },
    { id: 10, vendorId: 5, title: "Stage and backdrop styling", category: "Event Styling", eventTypes: ["Graduation", "Birthday", "Baby shower"], governorates: ["Amman", "Irbid", "Balqa"], price: 450, image: photos.modern, minBookingNoticeDays: 7,
      description: "A custom backdrop, stage and photo corner styled to your colors." },
    { id: 11, vendorId: 6, title: "Balloon and floral garlands", category: "Florals & Decor", eventTypes: ["Birthday", "Baby shower", "Graduation"], governorates: ["Irbid", "Amman"], price: 200, image: photos.pastel, minBookingNoticeDays: 2,
      description: "Light, airy garlands that frame entrances, tables and photo walls." }
  ];

  var themes = [
    { name: "Romantic", image: photos.romantic, note: "Soft candlelight, garden roses and intimate details", colors: ["#DFC1C7", "#F4E7DE", "#7D4E5D"], eventTypes: ["Wedding", "Engagement"] },
    { name: "Classic Luxury", image: photos.classic, note: "Timeless formality with champagne accents", colors: ["#D8B779", "#F6F0E8", "#272329"], eventTypes: ["Wedding", "Engagement", "Graduation"] },
    { name: "Pastel Dream", image: photos.pastel, note: "A joyful mix of blush, lilac and soft gold", colors: ["#F0BFD0", "#CFC3E6", "#F5DCB0"], eventTypes: ["Birthday", "Baby shower", "Engagement"] },
    { name: "Modern", image: photos.modern, note: "Clean silhouettes and quietly confident details", colors: ["#D8D1C8", "#37333A", "#9B7863"], eventTypes: ["Birthday", "Graduation", "Wedding"] },
    { name: "Garden Party", image: photos.birthday, note: "Sage greens, linen and relaxed long tables", colors: ["#C9D8BE", "#F6EFE0", "#7C8F6A"], eventTypes: ["Birthday", "Baby shower", "Engagement"] }
  ];

  F.data = {
    photos: photos,
    eventTypes: eventTypes,
    governorates: governorates,
    categories: categories,
    /* Categories without the "All services" filter entry, for forms. */
    serviceCategories: categories.slice(1),
    vendors: vendors,
    services: services,
    themes: themes
  };
})(window.Fiesta = window.Fiesta || {});
