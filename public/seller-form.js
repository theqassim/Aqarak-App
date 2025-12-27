const egyptLocations = {
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
    "باب الشعرية",
    "مصر القديمة",
    "عابدين",
    "الموسكي",
    "الأزبكية",
    "الجمالية",
    "بولاق",
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
    "اللبان",
    "الجمرك",
    "المنشية",
    "العطارين",
    "كرموز",
  ],
  القليوبية: [
    "بنها",
    "شبرا الخيمة",
    "قليوب",
    "الخانكة",
    "القناطر الخيرية",
    "طوخ",
    "العبور",
    "كفر شكر",
    "شبين القناطر",
    "قها",
    "الخصوص",
  ],
  الدقهلية: [
    "المنصورة",
    "طلخا",
    "ميت غمر",
    "السنبلاوين",
    "دكرنس",
    "بلقاس",
    "اجا",
    "شربين",
    "منية النصر",
    "المنزلة",
    "المطرية",
    "الجمالية",
    "نبروه",
    "تمى الأمديد",
    "بني عبيد",
    "ميت سلسيل",
    "محلة دمنة",
  ],
  الشرقية: [
    "الزقازيق",
    "العاشر من رمضان",
    "منيا القمح",
    "بلبيس",
    "فاقوس",
    "أبو حماد",
    "ديرب نجم",
    "ههيا",
    "أبو كبير",
    "كفر صقر",
    "أولاد صقر",
    "مشتول السوق",
    "الإبراهيمية",
    "الحسينية",
    "صان الحجر",
    "القنايات",
    "القرين",
  ],
  الغربية: [
    "طنطا",
    "المحلة الكبرى",
    "كفر الزيات",
    "زفتى",
    "السنطة",
    "بسيون",
    "قطور",
    "سمنود",
  ],
  المنوفية: [
    "شبين الكوم",
    "مدينة السادات",
    "منوف",
    "أشمون",
    "قويسنا",
    "تلا",
    "الباجور",
    "الشهداء",
    "بركة السبع",
    "سرس الليان",
  ],
  البحيرة: [
    "دمنهور",
    "كفر الدوار",
    "إيتاي البارود",
    "أبو حمص",
    "رشيد",
    "كوم حمادة",
    "وادي النطرون",
    "أبو المطامير",
    "الدلنجات",
    "حوش عيسى",
    "المحمودية",
    "الرحمانية",
    "شبراخيت",
    "ادكو",
    "النوبارية الجديدة",
  ],
  دمياط: [
    "دمياط",
    "رأس البر",
    "دمياط الجديدة",
    "فارسكور",
    "الزرقا",
    "كفر سعد",
    "السرو",
    "الروضة",
    "ميت أبو غالب",
    "عزبة البرج",
  ],
  بورسعيد: [
    "بورسعيد",
    "بورفؤاد",
    "حي الشرق",
    "حي العرب",
    "حي المناخ",
    "حي الضواحي",
    "حي الجنوب",
    "حي الزهور",
  ],
  الاسماعيلية: [
    "الاسماعيلية",
    "التل الكبير",
    "فايد",
    "القنطرة شرق",
    "القنطرة غرب",
    "أبو صوير",
    "القصاصين",
  ],
  السويس: ["السويس", "الأربعين", "عتاقة", "الجناين", "فيصل"],
  "كفر الشيخ": [
    "كفر الشيخ",
    "دسوق",
    "فوه",
    "مطوبس",
    "بلطيم",
    "سيدي سالم",
    "بيلا",
    "الحامول",
    "قلين",
    "الرياض",
    "برج البرلس",
  ],
  الفيوم: ["الفيوم", "سنورس", "إطسا", "طامية", "أبشواي", "يوسف الصديق"],
  "بني سويف": [
    "بني سويف",
    "الواسطى",
    "ناصر",
    "اهناسيا",
    "ببا",
    "الفشن",
    "سمسطا",
  ],
  المنيا: [
    "المنيا",
    "ملوي",
    "مغاغة",
    "بني مزار",
    "سمالوط",
    "أبو قرقاص",
    "ديرمواس",
    "العدوة",
    "مطاي",
  ],
  أسيوط: [
    "أسيوط",
    "ديروط",
    "القوصية",
    "أبنوب",
    "منفلوط",
    "أبو تيج",
    "الغنايم",
    "ساحل سليم",
    "البداري",
    "صدفا",
    "الفتح",
  ],
  سوهاج: [
    "سوهاج",
    "جرجا",
    "طمه",
    "طهطا",
    "المراغة",
    "البلينا",
    "المنشأة",
    "أخميم",
    "ساقلتة",
    "دار السلام",
    "جهينة",
  ],
  قنا: [
    "قنا",
    "نجع حمادي",
    "دشنا",
    "قوص",
    "فرشوط",
    "قفط",
    "نقادة",
    "الوقف",
    "أبو تشت",
  ],
  الأقصر: ["الأقصر", "إسنا", "أرمنت", "القرنة", "طيبة", "الزينية", "البياضية"],
  أسوان: ["أسوان", "كوم أمبو", "إدفو", "نصر النوبة", "دراو", "أبو سمبل"],
  "البحر الأحمر": [
    "الغردقة",
    "الجونة",
    "سفاجا",
    "القصير",
    "مرسى علم",
    "رأس غارب",
    "حلايب",
    "شلاتين",
  ],
  "جنوب سيناء": [
    "شرم الشيخ",
    "دهب",
    "نويبع",
    "طابا",
    "طور سيناء",
    "سانت كاترين",
    "رأس سدر",
    "أبو رديس",
    "أبو زنيمة",
  ],
  مطروح: [
    "مرسى مطروح",
    "العلمين",
    "مارينا",
    "الضبعة",
    "سيوة",
    "الحمام",
    "النجيلة",
    "السلوم",
    "براني",
  ],
  "الوادي الجديد": ["الخارجة", "الداخلة", "الفرافرة", "باريس", "بلاط"],
  "شمال سيناء": ["العريش", "الشيخ زويد", "رفح", "بئر العبد", "الحسنة", "نخل"],
};
let selectedFiles = [];
let map, marker, circle;

document.addEventListener("DOMContentLoaded", async () => {
  await fetchUserData();

  setupArabicNumbersSupport();
  initLocationSelects();

  const catSelect = document.getElementById("property-category");
  if (catSelect) {
    catSelect.addEventListener("change", toggleFields);
    toggleFields();
  }

  initMap();
});

function initLocationSelects() {
  const govSelect = document.getElementById("gov-select");
  const citySelect = document.getElementById("city-select");

  Object.keys(egyptLocations).forEach((gov) => {
    const option = document.createElement("option");
    option.value = gov;
    option.textContent = gov;
    govSelect.appendChild(option);
  });

  govSelect.addEventListener("change", function () {
    const selectedGov = this.value;
    citySelect.innerHTML = '<option value="">اختر المدينة...</option>';

    if (selectedGov && egyptLocations[selectedGov]) {
      egyptLocations[selectedGov].forEach((city) => {
        const option = document.createElement("option");
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
      });
    }
  });
}

function showStatusModal(
  type,
  title,
  subtitle,
  note = "",
  marketingDesc = "",
  location = ""
) {
  const oldModal = document.querySelector(".status-modal-overlay");
  if (oldModal) oldModal.remove();

  let config = {};
  if (type === "review") {
    config = {
      color: "#ffc107",
      bgIcon: "#ffc107",
      icon: "fas fa-hourglass-half",
      btnText: "فهمت، شكراً",
    };
  } else if (type === "success") {
    config = {
      color: "#00ff88",
      bgIcon: "#00c853",
      icon: "fas fa-check-double",
      btnText: "روعة، تمام!",
    };
  } else if (type === "error") {
    config = {
      color: "#ff4444",
      bgIcon: "#d32f2f",
      icon: "fas fa-exclamation-triangle",
      btnText: "حاول مجدداً",
    };
  }

  const modalHTML = `
        <div class="status-modal-overlay">
            <div class="status-modal-content" style="border-color: ${
              config.color
            }; box-shadow: 0 0 30px ${config.color}30;">
                <div class="status-icon-wrapper" style="background: ${
                  config.bgIcon
                }; box-shadow: 0 0 20px ${config.bgIcon}60;">
                    <i class="${config.icon} fa-beat-gradient"></i>
                </div>
                <h3 class="status-title">${title}</h3>
                <p class="status-subtitle">${subtitle}</p>

                ${
                  marketingDesc
                    ? `
                <div class="status-note-box" style="border-right-color: #00ff88; background: rgba(0,255,136,0.05);">
                    <strong style="color: #00ff88; display:block; margin-bottom:5px; font-size:0.85rem;">
                        <i class="fas fa-magic"></i> وصف تسويقي ذكي (AI):
                    </strong>
                    <span style="color: #eee; font-size: 0.9rem; font-style: italic;">"${marketingDesc}"</span>
                </div>`
                    : ""
                }

                ${
                  location
                    ? `<p style="color: #888; font-size: 0.8rem; margin-bottom: 15px;"><i class="fas fa-map-pin"></i> المنطقة: ${location}</p>`
                    : ""
                }

                <button onclick="${
                  type === "error"
                    ? "closeModal()"
                    : "window.location.href='home'"
                }" 
                    class="btn-status-action" 
                    style="background: ${config.bgIcon};">
                    ${config.btnText}
                </button>
            </div>
        </div>
    `;
  document.body.insertAdjacentHTML("beforeend", modalHTML);
}

function closeModal() {
  const modal = document.querySelector(".status-modal-overlay");
  if (modal) modal.remove();
}

function setupArabicNumbersSupport() {
  const targetInputs = document.querySelectorAll(
    'input[name="propertyPrice"], input[name="propertyArea"], input[name="propertyRooms"], input[name="propertyBathrooms"], input[name="propertyFloors"]'
  );

  targetInputs.forEach((input) => {
    input.style.direction = "ltr";
    input.style.textAlign = "right";
    input.setAttribute("placeholder", "0");

    input.addEventListener("input", function (e) {
      let val = this.value;

      const arabicNumbers = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
      const persianNumbers = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

      val = val.replace(/[٠-٩]/g, (d) => arabicNumbers.indexOf(d));
      val = val.replace(/[۰-۹]/g, (d) => persianNumbers.indexOf(d));

      val = val.replace(/[^0-9]/g, "");

      if (this.value !== val) {
        this.value = val;
      }
    });

    input.addEventListener("paste", function (e) {
      e.preventDefault();
      let pastedData = (e.clipboardData || window.clipboardData).getData(
        "text"
      );
      pastedData = pastedData
        .replace(/[٠-٩]/g, (d) => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)])
        .replace(/[^0-9]/g, "");
      document.execCommand("insertText", false, pastedData);
    });
  });
}

function toggleFields() {
  const category = document.getElementById("property-category").value;

  const groups = {
    level: document.getElementById("level-group"),
    buildingDetails: document.getElementById("building-details-group"),
    rooms: document.getElementById("rooms-group"),
    finish: document.getElementById("finishing-group"),
    landType: document.getElementById("land-type-group"),
  };

  Object.values(groups).forEach((g) => {
    if (g) g.style.display = "none";
  });

  switch (category) {
    case "apartment":
    case "duplex":
    case "office":
      if (groups.level) groups.level.style.display = "block";
      if (groups.rooms) groups.rooms.style.display = "flex";
      if (groups.finish) groups.finish.style.display = "block";
      break;

    case "villa":
    case "chalet":
      if (groups.rooms) groups.rooms.style.display = "flex";
      if (groups.finish) groups.finish.style.display = "block";
      break;

    case "building":
      if (groups.buildingDetails) groups.buildingDetails.style.display = "flex";
      if (groups.finish) groups.finish.style.display = "block";
      break;

    case "land":
      if (groups.landType) groups.landType.style.display = "block";
      break;

    case "store":
    case "warehouse":
      if (groups.finish) groups.finish.style.display = "block";
      break;

    default:
      if (groups.rooms) groups.rooms.style.display = "flex";
      if (groups.finish) groups.finish.style.display = "block";
  }
}
function initMap() {
  const defaultLat = 30.0444;
  const defaultLng = 31.2357;

  map = L.map("map").setView([defaultLat, defaultLng], 13);

  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 20,
    }
  ).addTo(map);

  map.on("click", async function (e) {
    handleLocationSelect(e.latlng.lat, e.latlng.lng);
  });

  const searchInput = document.getElementById("map-search-input");
  if (searchInput) {
    searchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        searchLocation();
      }
    });
    searchInput.addEventListener("input", function () {
      if (this.value.length < 3)
        document.getElementById("search-suggestions").style.display = "none";
    });
  }
}

async function searchLocation() {
  const query = document.getElementById("map-search-input").value;
  const resultsBox = document.getElementById("search-suggestions");

  if (!query) return;

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    query + ", Egypt"
  )}&addressdetails=1&limit=5&accept-language=ar`;

  try {
    resultsBox.innerHTML =
      '<div class="suggestion-item" style="justify-content:center; color:#00ff88;"><i class="fas fa-spinner fa-spin"></i> جاري البحث...</div>';
    resultsBox.style.display = "block";

    const response = await fetch(url);
    const data = await response.json();

    resultsBox.innerHTML = "";

    if (data.length === 0) {
      resultsBox.innerHTML =
        '<div class="suggestion-item" style="color:#ff4444; justify-content:center;">لم يتم العثور على نتائج.</div>';
      return;
    }

    data.forEach((place) => {
      const div = document.createElement("div");
      div.className = "suggestion-item";

      let displayName = place.display_name.split(",")[0];
      const addr = place.address || {};
      if (addr.city || addr.town || addr.suburb) {
        displayName += `، ${addr.city || addr.town || addr.suburb}`;
      }

      div.innerHTML = `<i class="fas fa-map-marker-alt"></i> <span>${displayName}</span>`;

      div.onclick = () => {
        document.getElementById("map-search-input").value = displayName;
        handleLocationSelect(place.lat, place.lon);
      };
      resultsBox.appendChild(div);
    });
  } catch (error) {
    resultsBox.style.display = "none";
  }
}

async function handleLocationSelect(lat, lng) {
  map.setView([lat, lng], 17);

  if (marker) map.removeLayer(marker);
  if (circle) map.removeLayer(circle);

  marker = L.marker([lat, lng])
    .addTo(map)
    .bindPopup("الموقع المحدد")
    .openPopup();
  circle = L.circle([lat, lng], {
    color: "#00ff88",
    fillColor: "#00ff88",
    fillOpacity: 0.1,
    radius: 500,
  }).addTo(map);

  document.getElementById("lat").value = lat;
  document.getElementById("lng").value = lng;
  document.getElementById("search-suggestions").style.display = "none";

  await fetchNearbyServices(lat, lng);
}

async function fetchNearbyServices(lat, lng) {
  const statusMsg = document.getElementById("map-status-text");
  statusMsg.innerHTML =
    '<i class="fas fa-spinner fa-spin"></i> جاري تحليل المنطقة بالذكاء الاصطناعي...';
  statusMsg.style.color = "#00d4ff";

  const query = `
        [out:json];
        (
          node["amenity"~"school|hospital|university|bank|pharmacy|cafe|gym|place_of_worship"](around:800, ${lat}, ${lng});
          way["amenity"~"school|hospital|university|bank|pharmacy|cafe|gym|place_of_worship"](around:800, ${lat}, ${lng});
          node["shop"~"supermarket|mall|bakery|clothes"](around:800, ${lat}, ${lng});
          way["shop"~"supermarket|mall|bakery|clothes"](around:800, ${lat}, ${lng});
        );
        out center 15; 
    `;

  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
    });
    const data = await response.json();

    const services = new Set();
    data.elements.forEach((el) => {
      let name = el.tags["name:ar"] || el.tags.name || null;
      if (name) services.add(name);
    });

    const servicesArray = Array.from(services).slice(0, 10);
    document.getElementById("nearby_services").value = servicesArray.join(", ");

    if (servicesArray.length > 0) {
      statusMsg.innerHTML = `<i class="fas fa-check-circle"></i> تم العثور على ${servicesArray.length} خدمات حيوية حول العقار!`;
      statusMsg.style.color = "#00ff88";
    } else {
      statusMsg.innerHTML =
        "⚠️ المنطقة هادئة، سيتم الاعتماد على الموقع الجغرافي فقط.";
      statusMsg.style.color = "#ff9800";
    }
  } catch (error) {
    statusMsg.innerText = "فشل التحليل التلقائي.";
  }
}

window.locateUser = function () {
  const btn = document.querySelector(".locate-btn");
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handleLocationSelect(pos.coords.latitude, pos.coords.longitude);
        btn.innerHTML = originalText;
      },
      () => {
        alert("يرجى تفعيل الـ GPS");
        btn.innerHTML = originalText;
      }
    );
  } else {
    alert("المتصفح لا يدعم تحديد الموقع");
    btn.innerHTML = originalText;
  }
};

async function fetchUserData() {
  try {
    const response = await fetch("/api/auth/me");
    const data = await response.json();
    if (data.isAuthenticated) {
      document.getElementById("seller-name").value =
        data.name || "مستخدم عقارك";
      document.getElementById("seller-phone").value = data.phone || "";
    } else {
      window.location.href = "index";
    }
  } catch (e) {}
}

const imgInput = document.getElementById("property-images");
if (imgInput) {
  imgInput.addEventListener("change", function (e) {
    const MAX_SIZE = 10 * 1024 * 1024;
    let rejectedCount = 0;

    Array.from(e.target.files).forEach((file) => {
      if (file.size > MAX_SIZE) {
        rejectedCount++;
      } else {
        selectedFiles.push(file);
      }
    });

    if (rejectedCount > 0)
      alert(`⚠️ تم رفض ${rejectedCount} صورة لأن حجمها أكبر من 10 ميجا.`);
    if (selectedFiles.length > 10) {
      alert("⚠️ الحد الأقصى 10 صور فقط، سيتم استخدام أول 10 صور.");
      selectedFiles = selectedFiles.slice(0, 10);
    }

    renderPreviews();
    this.value = "";
  });
}

function renderPreviews() {
  const container = document.getElementById("image-preview-container");
  container.innerHTML = "";
  selectedFiles.forEach((file, index) => {
    const div = document.createElement("div");
    div.className = "preview-item";

    const img = document.createElement("img");
    const reader = new FileReader();
    reader.onload = (e) => (img.src = e.target.result);
    reader.readAsDataURL(file);

    const btn = document.createElement("button");
    btn.className = "btn-remove-img";
    btn.innerHTML = '<i class="fas fa-times"></i>';
    btn.onclick = (e) => {
      e.preventDefault();
      selectedFiles.splice(index, 1);
      renderPreviews();
    };

    div.appendChild(img);
    div.appendChild(btn);
    container.appendChild(div);
  });
}

document
  .getElementById("seller-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;

    if (selectedFiles.length === 0) {
      alert("📸 يرجى إضافة صورة واحدة على الأقل للعقار.");
      return;
    }

    btn.innerHTML = '<i class="fas fa-robot fa-spin"></i> جاري الفحص الذكي...';
    btn.disabled = true;

    const formData = new FormData(e.target);
    formData.delete("images[]");
    selectedFiles.forEach((file) => formData.append("images", file));

    try {
      const response = await fetch("/api/submit-seller-property", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (result.status === "approved") {
        showStatusModal(
          "success",
          result.title,
          result.message,
          "",
          result.marketing_desc,
          result.location
        );
      } else if (result.status === "pending") {
        showStatusModal(
          "review",
          result.title,
          result.message,
          "تم تحويل طلبك للمراجعة اليدوية للتأكد من بعض التفاصيل."
        );
      } else {
        showStatusModal(
          "error",
          result.title || "عذراً، مرفوض",
          result.message || "الإعلان لا يطابق سياسات النشر."
        );
      }
    } catch (error) {
      showStatusModal(
        "error",
        "خطأ في الاتصال",
        "تعذر الوصول للسيرفر، يرجى التحقق من الإنترنت."
      );
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  });
document.addEventListener("input", function (e) {
  if (
    e.target.type === "number" ||
    e.target.type === "tel" ||
    e.target.classList.contains("number-only")
  ) {
    let val = e.target.value;
    val = val.replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
    e.target.value = val.replace(/[^0-9.]/g, "");
  }
});
