let advPropertiesData = [];
let advCurrentType = "all";
let searchDebounceTimer;

const advLocations = {
  القاهرة: [
    "التجمع الخامس",
    "مدينة نصر",
    "المعادي",
    "مصر الجديدة",
    "الشروق",
    "مدينتي",
    "الرحاب",
    "العاصمة الإدارية",
    "المقطم",
    "الزيتون",
    "عين شمس",
    "شبرا",
    "حلوان",
    "المرج",
    "وسط البلد",
    "جاردن سيتي",
    "الزمالك",
    "المنيل",
    "حدائق القبة",
    "العباسية",
    "المطرية",
    "السيدة زينب",
    "الوايلي",
    "مصر القديمة",
    "عابدين",
    "الموسكي",
    "النزهة",
    "السلام",
    "البساتين",
    "دار السلام",
    "طره",
    "15 مايو",
    "التبين",
    "بدر",
  ],
  الجيزة: [
    "6 أكتوبر",
    "الشيخ زايد",
    "الهرم",
    "فيصل",
    "الدقي",
    "المهندسين",
    "العجوزة",
    "إمبابة",
    "حدائق الأهرام",
    "الوراق",
    "بولاق الدكرور",
    "المنيب",
    "البدرشين",
    "العياط",
    "الصف",
    "أطفيح",
    "كرداسة",
    "أوسيم",
    "الحوامدية",
    "أبو النمرس",
    "منشأة القناطر",
    "الواحات البحرية",
  ],
  الإسكندرية: [
    "سموحة",
    "ميامي",
    "المنتزه",
    "العجمي",
    "سيدي بشر",
    "الإبراهيمية",
    "كامب شيزار",
    "الشاطبي",
    "محرم بك",
    "العصافرة",
    "المندرة",
    "سان ستيفانو",
    "جليم",
    "رشدي",
    "كفر عبده",
    "سيدي جابر",
    "الساحل الشمالي",
    "برج العرب",
    "البيطاش",
    "الهانوفيل",
    "العامرية",
    "الدخيلة",
    "المكس",
    "المنشية",
  ],
  القليوبية: [
    "بنها",
    "شبرا الخيمة",
    "قليوب",
    "الخانكة",
    "القناطر الخيرية",
    "طوخ",
    "العبور",
  ],
  الدقهلية: [
    "المنصورة",
    "طلخا",
    "ميت غمر",
    "السنبلاوين",
    "دكرنس",
    "بلقاس",
    "جمصة",
  ],
  الشرقية: ["الزقازيق", "العاشر من رمضان", "منيا القمح", "بلبيس", "فاقوس"],
  الغربية: ["طنطا", "المحلة الكبرى", "كفر الزيات", "زفتى"],
  المنوفية: ["شبين الكوم", "مدينة السادات", "منوف", "أشمون"],
  البحيرة: ["دمنهور", "كفر الدوار", "إيتاي البارود", "وادي النطرون"],
  دمياط: ["دمياط", "رأس البر", "دمياط الجديدة"],
  بورسعيد: ["بورسعيد", "بورفؤاد"],
  الاسماعيلية: ["الاسماعيلية", "فايد", "القنطرة"],
  السويس: ["السويس", "العين السخنة"],
  "كفر الشيخ": ["كفر الشيخ", "دسوق", "بلطيم"],
  مطروح: ["مرسى مطروح", "العلمين", "مارينا", "الساحل الشمالي"],
  "البحر الأحمر": ["الغردقة", "الجونة", "سفاجا", "مرسى علم"],
  "جنوب سيناء": ["شرم الشيخ", "دهب", "نويبع", "سانت كاترين"],
};

document.addEventListener("DOMContentLoaded", () => {
  fetchAdvProperties();
  initAdvLocationFilters();

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

  const filters = [
    "adv-rooms-select",
    "adv-price-min",
    "adv-price-max",
    "adv-gov-select",
    "adv-city-select",
  ];
  filters.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", applyLocalFilters);
  });
});

function initAdvLocationFilters() {
  const govSelect = document.getElementById("adv-gov-select");
  const citySelect = document.getElementById("adv-city-select");

  if (!govSelect || !citySelect) return;

  Object.keys(advLocations).forEach((gov) => {
    const option = document.createElement("option");
    option.value = gov;
    option.textContent = gov;
    govSelect.appendChild(option);
  });

  govSelect.addEventListener("change", function () {
    const selectedGov = this.value;
    citySelect.innerHTML = '<option value="">المدينة: الكل</option>';

    if (selectedGov && advLocations[selectedGov]) {
      advLocations[selectedGov].forEach((city) => {
        const option = document.createElement("option");
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
      });
    }
    applyLocalFilters();
  });
}

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
    container.innerHTML = `<p style="text-align:center; color:red;">خطأ في الاتصال</p>`;
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
  const govInput = document.getElementById("adv-gov-select");
  const cityInput = document.getElementById("adv-city-select");

  if (!roomsInput) return;

  const rooms = roomsInput.value;
  const minPrice = parseFloat(minPriceInput.value) || 0;
  const maxPrice = parseFloat(maxPriceInput.value) || Infinity;
  const selectedGov = govInput.value;
  const selectedCity = cityInput.value;

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

    let priceVal =
      prop.numericPrice ||
      parseFloat((prop.price || "0").replace(/[^0-9.]/g, "")) ||
      0;
    const priceMatch = priceVal >= minPrice && priceVal <= maxPrice;

    let govMatch = true;
    if (selectedGov) {
      govMatch = (prop.governorate || "").trim() === selectedGov;
    }

    let cityMatch = true;
    if (selectedCity) {
      cityMatch = (prop.city || "").trim() === selectedCity;
    }

    return typeMatch && roomsMatch && priceMatch && govMatch && cityMatch;
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
                <p>جرب تغيير خيارات البحث.</p>
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
    const verifiedBadge = prop.is_verified
      ? `<i class="fas fa-check-circle" style="color:#00d4ff; margin-right:5px;"></i>`
      : "";

    const locationText = prop.city
      ? `<i class="fas fa-map-marker-alt"></i> ${prop.city}`
      : "";

    const html = `
            <div class="adv-card" onclick="window.location.href='property?id=${
              prop.id
            }'" style="cursor: pointer;">
                <div class="adv-card-img-box">
                    <img src="${bgImage}" alt="${
      prop.title
    }" class="adv-card-img" loading="lazy">
                    <span class="adv-type-badge ${typeClass}">${typeText}</span>
                    <div class="adv-price-tag">${priceText} ج.م</div>
                </div>

                <div class="adv-card-body">
                    <h3 class="adv-title" title="${prop.title}">${
      prop.title
    } ${verifiedBadge}</h3>
                    <div style="font-size:0.8rem; color:#888; margin-bottom:10px;">${locationText}</div>
                    
                    <div class="adv-features">
                        ${
                          prop.rooms
                            ? `<span><i class="fas fa-bed"></i> ${prop.rooms}</span>`
                            : ""
                        }
                        ${
                          prop.bathrooms
                            ? `<span><i class="fas fa-bath"></i> ${prop.bathrooms}</span>`
                            : ""
                        }
                        ${
                          prop.area
                            ? `<span><i class="fas fa-ruler-combined"></i> ${prop.area} م²</span>`
                            : ""
                        }
                    </div>
                    <a href="property?id=${
                      prop.id
                    }" class="adv-details-btn">
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
  document.getElementById("adv-gov-select").value = "";
  document.getElementById("adv-city-select").innerHTML =
    '<option value="">المدينة: الكل</option>';
  updateAdvType("all");
  fetchAdvProperties();
};
