let advPropertiesData = [];
let advCurrentType = "all";
let searchDebounceTimer;

document.addEventListener("DOMContentLoaded", () => {
  fetchAdvProperties();

  const searchInput = document.getElementById("adv-search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.trim();

      clearTimeout(searchDebounceTimer);

      searchDebounceTimer = setTimeout(() => {
        fetchAdvProperties(query);
      }, 600);
    });
  }

  const filters = ["adv-rooms-select", "adv-price-min", "adv-price-max"];
  filters.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", applyLocalFilters);
  });
});

async function fetchAdvProperties(searchQuery = "") {
  const container = document.getElementById("adv-properties-container");

  container.innerHTML = `
        <div class="adv-loader" style="grid-column: 1/-1; text-align: center; padding: 50px;">
            <i class="fas fa-robot fa-spin fa-2x" style="color:var(--neon-primary);"></i>
            <p style="margin-top:15px; color:white; font-weight:bold;">جاري البحث الذكي...</p>
        </div>
    `;

  try {
    let url;
    if (searchQuery && searchQuery.length > 2) {
      url = `/api/ai-search?query=${encodeURIComponent(searchQuery)}&limit=50`;
    } else {
      url = "/api/properties?limit=100";
    }

    const response = await fetch(url);
    const data = await response.json();

    if (Array.isArray(data)) {
      advPropertiesData = data;
      applyLocalFilters();
    } else {
      advPropertiesData = [];
      renderAdvGrid([]);
    }
  } catch (error) {
    console.error("Error:", error);
    container.innerHTML = `
            <div class="adv-loader" style="color:#ff4444; grid-column:1/-1; text-align:center;">
                <i class="fas fa-exclamation-triangle fa-2x"></i>
                <br><br>حدث خطأ في الاتصال
            </div>`;
  }
}

window.updateAdvType = function (type) {
  advCurrentType = type;

  document
    .querySelectorAll(".adv-tab-btn")
    .forEach((btn) => btn.classList.remove("active"));
  const activeBtn = document.getElementById(`adv-btn-${type}`);
  if (activeBtn) activeBtn.classList.add("active");

  applyLocalFilters();
};

function applyLocalFilters() {
  const roomsInput = document.getElementById("adv-rooms-select");
  const minPriceInput = document.getElementById("adv-price-min");
  const maxPriceInput = document.getElementById("adv-price-max");

  if (!roomsInput || !minPriceInput || !maxPriceInput) return;

  const rooms = roomsInput.value;
  const minPrice = parseFloat(minPriceInput.value) || 0;
  const maxPrice = parseFloat(maxPriceInput.value) || Infinity;

  const filtered = advPropertiesData.filter((prop) => {
    let typeMatch = true;
    if (advCurrentType === "buy")
      typeMatch = prop.type === "بيع" || prop.type === "buy";
    if (advCurrentType === "rent")
      typeMatch = prop.type === "إيجار" || prop.type === "rent";

    let roomsMatch = true;
    if (rooms) {
      const propRooms = parseInt(prop.rooms) || 0;
      if (rooms === "4") roomsMatch = propRooms >= 4;
      else roomsMatch = propRooms == rooms;
    }

    let priceVal = prop.numericPrice;
    if (!priceVal && prop.price) {
      priceVal = parseFloat(prop.price.toString().replace(/[^0-9.]/g, ""));
    }
    priceVal = priceVal || 0;
    const priceMatch = priceVal >= minPrice && priceVal <= maxPrice;

    return typeMatch && roomsMatch && priceMatch;
  });

  renderAdvGrid(filtered);
}

function renderAdvGrid(properties) {
  const container = document.getElementById("adv-properties-container");
  container.innerHTML = "";

  if (properties.length === 0) {
    container.innerHTML = `
            <div class="adv-loader" style="color: #888; grid-column: 1 / -1; text-align: center; padding-top: 50px;">
                <i class="fas fa-search-minus fa-3x" style="margin-bottom: 20px; opacity: 0.5;"></i>
                <h3>لا توجد نتائج مطابقة</h3>
                <p>جرب كلمات بحث مختلفة أو قلل الفلاتر.</p>
            </div>
        `;
    return;
  }

  properties.forEach((prop) => {
    let bgImage = "logo.png";
    if (prop.imageUrl) bgImage = prop.imageUrl;
    else if (prop.imageUrls) {
      try {
        const arr =
          typeof prop.imageUrls === "string"
            ? JSON.parse(prop.imageUrls)
            : prop.imageUrls;
        if (arr.length > 0) bgImage = arr[0];
      } catch (e) {}
    }

    const priceText = prop.price
      ? parseInt(prop.price.toString().replace(/[^0-9]/g, "")).toLocaleString()
      : "0";
    const isSale = prop.type === "بيع" || prop.type === "buy";
    const typeClass = isSale ? "is-sale" : "is-rent";
    const typeText = isSale ? "للبيع" : "للإيجار";

    const roomsHtml = prop.rooms
      ? `<span class="adv-feat-item"><i class="fas fa-bed"></i> ${prop.rooms}</span>`
      : "";
    const bathsHtml = prop.bathrooms
      ? `<span class="adv-feat-item"><i class="fas fa-bath"></i> ${prop.bathrooms}</span>`
      : "";
    const areaHtml = prop.area
      ? `<span class="adv-feat-item"><i class="fas fa-ruler-combined"></i> ${prop.area} م²</span>`
      : "";

    let extraBadges = "";
    if (prop.isFeatured)
      extraBadges += `<span style="position:absolute; top:10px; right:10px; background:gold; color:black; padding:5px 8px; border-radius:5px; font-weight:bold; font-size:0.8rem; z-index:2; box-shadow: 0 2px 5px rgba(0,0,0,0.5);"><i class="fas fa-star"></i> مميز</span>`;

    let verifiedBadge = "";
    if (prop.is_verified)
      verifiedBadge = `<i class="fas fa-check-circle" style="color:#00d4ff; margin-right:5px;" title="مالك موثق"></i>`;

    const html = `
            <div class="adv-card" onclick="window.location.href='property-details?id=${prop.id}'" style="cursor: pointer;">
                <div class="adv-card-img-box">
                    <img src="${bgImage}" alt="${prop.title}" class="adv-card-img" loading="lazy">
                    <span class="adv-type-badge ${typeClass}">${typeText}</span>
                    <div class="adv-price-tag">${priceText} ج.م</div>
                    ${extraBadges}
                </div>

                <div class="adv-card-body">
                    <h3 class="adv-title" title="${prop.title}">${prop.title} ${verifiedBadge}</h3>
                    <div class="adv-features">
                        ${roomsHtml}
                        ${bathsHtml}
                        ${areaHtml}
                    </div>
                    <a href="property-details?id=${prop.id}" class="adv-details-btn">
                        عرض التفاصيل <i class="fas fa-arrow-left"></i>
                    </a>
                </div>
            </div>
        `;
    container.innerHTML += html;
  });
}

window.resetAdvFilters = function () {
  document.getElementById("adv-search-input").value = "";
  document.getElementById("adv-rooms-select").value = "";
  document.getElementById("adv-price-min").value = "";
  document.getElementById("adv-price-max").value = "";
  updateAdvType("all");
  fetchAdvProperties();
};
