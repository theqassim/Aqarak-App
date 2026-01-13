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
let isMapEnabled = false;

document.addEventListener("DOMContentLoaded", async () => {
  await fetchUserData();

  setupArabicNumbersSupport();
  initLocationSelects();

  const catSelect = document.getElementById("property-category");
  if (catSelect) {
    catSelect.addEventListener("change", toggleFields);
    toggleFields();
  }

  initMap(true);

  checkLocationOnLoad();
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
      icon: "fas fa-clock",
      animation: "fa-pulse",
      bgGradient:
        "linear-gradient(135deg, rgba(255,193,7,0.1), rgba(0,0,0,0.8))",
      btnText: "حسناً، فهمت",
    };
  } else if (type === "success") {
    config = {
      color: "#00ff88",
      icon: "fas fa-check-circle",
      animation: "fa-bounce",
      bgGradient:
        "linear-gradient(135deg, rgba(0,255,136,0.1), rgba(0,0,0,0.8))",
      btnText: "ممتاز، عرض العقار",
    };
  } else if (type === "error") {
    config = {
      color: "#ff4444",
      icon: "fas fa-times-circle",
      animation: "fa-shake",
      bgGradient:
        "linear-gradient(135deg, rgba(255,68,68,0.1), rgba(0,0,0,0.8))",
      btnText: "إغلاق وتصحيح",
    };
  }

  const modalHTML = `
        <div class="status-modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999; background: rgba(0,0,0,0.85); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; animation: fadeIn 0.3s;">
            <div class="status-modal-content" style="background: #1a1a1a; width: 90%; max-width: 450px; padding: 30px; border-radius: 20px; text-align: center; border: 1px solid ${
              config.color
            }; box-shadow: 0 0 30px ${
    config.color
  }40; position: relative; overflow: hidden;">
                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: ${
                  config.bgGradient
                }; z-index: 0;"></div>
                <div style="position: relative; z-index: 1;">
                    <div style="font-size: 4rem; color: ${
                      config.color
                    }; margin-bottom: 20px;"><i class="${config.icon} ${
    config.animation
  }"></i></div>
                    <h2 style="color: white; margin-bottom: 10px; font-family: 'Cairo', sans-serif;">${title}</h2>
                    <p style="color: #ccc; font-size: 1rem; line-height: 1.6; margin-bottom: 20px;">${subtitle}</p>
                    ${
                      marketingDesc
                        ? `<div style="background: rgba(255,255,255,0.05); border-right: 3px solid #00ff88; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: right;"><strong style="color: #00ff88; font-size: 0.85rem;"><i class="fas fa-magic"></i> الوصف المحسن:</strong><p style="color: #ddd; font-size: 0.9rem; margin-top: 5px; font-style: italic;">"${marketingDesc}"</p></div>`
                        : ""
                    }
                    ${
                      note
                        ? `<div style="background: rgba(255, 193, 7, 0.1); border: 1px dashed #ffc107; padding: 10px; border-radius: 8px; margin-bottom: 20px;"><span style="color: #ffc107; font-size: 0.9rem;">${note}</span></div>`
                        : ""
                    }
                    <button onclick="${
                      type === "error"
                        ? "closeModal()"
                        : "window.location.href='home'"
                    }" style="background: ${
    config.color
  }; color: #000; border: none; padding: 12px 35px; border-radius: 50px; font-weight: bold; font-size: 1rem; cursor: pointer; transition: 0.3s; box-shadow: 0 5px 15px ${
    config.color
  }40;">${config.btnText}</button>
                </div>
            </div>
        </div>
        <style>@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }</style>
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
function initMap(startDisabled = false) {
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
    if (!isMapEnabled) return;
    handleLocationSelect(e.latlng.lat, e.latlng.lng);
  });

  const searchInput = document.getElementById("map-search-input");
  if (searchInput) {
    searchInput.addEventListener("keypress", function (e) {
      if (!isMapEnabled) return;
      if (e.key === "Enter") {
        e.preventDefault();
        searchLocation();
      }
    });
    searchInput.addEventListener("input", function () {
      if (!isMapEnabled) return;
      if (this.value.length < 3)
        document.getElementById("search-suggestions").style.display = "none";
    });
  }

  if (startDisabled) {
    disableMapUI();
  }
}
async function searchLocation() {
  const query = document.getElementById("map-search-input").value;
  const resultsBox = document.getElementById("search-suggestions");

  if (!query) {
    resultsBox.style.display = "none";
    return;
  }

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    query + ", Egypt"
  )}&addressdetails=1&limit=5&accept-language=ar`;

  try {
    resultsBox.style.display = "block";
    resultsBox.innerHTML =
      '<div class="suggestion-item" style="justify-content:center; color:#00ff88;"><i class="fas fa-spinner fa-spin"></i> جاري البحث...</div>';

    const response = await fetch(url);
    const data = await response.json();

    resultsBox.innerHTML = "";

    if (data.length === 0) {
      resultsBox.innerHTML =
        '<div class="suggestion-item" style="color:#ff4444; justify-content:center;">لم يتم العثور على نتائج.</div>';
      setTimeout(() => (resultsBox.style.display = "none"), 3000);
      return;
    }

    data.forEach((place) => {
      const div = document.createElement("div");
      div.className = "suggestion-item";
      let displayName = place.display_name.split(",").slice(0, 3).join("، ");
      div.innerHTML = `<i class="fas fa-map-marker-alt"></i> <span>${displayName}</span>`;
      div.onclick = () => {
        document.getElementById("map-search-input").value = displayName;
        handleLocationSelect(place.lat, place.lon);
        resultsBox.style.display = "none";
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
  const btn = document.querySelector(".locate-fab-btn");
  const icon = btn.querySelector("i");

  icon.className = "fas fa-spinner fa-spin";

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handleLocationSelect(pos.coords.latitude, pos.coords.longitude);
        icon.className = "fas fa-check";
        btn.style.color = "#00ff88";
        setTimeout(() => {
          icon.className = "fas fa-crosshairs";
          btn.style.color = "black";
        }, 2000);
      },
      () => {
        alert("يرجى تفعيل الـ GPS والسماح للمتصفح بالوصول للموقع.");
        icon.className = "fas fa-crosshairs";
      }
    );
  } else {
    alert("المتصفح لا يدعم تحديد الموقع");
    icon.className = "fas fa-crosshairs";
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
      window.location.href = "authentication";
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

    btn.innerHTML =
      '<i class="fas fa-circle-notch fa-spin"></i> جاري المعالجة والنشر...';
    btn.classList.add("btn-loading");
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

function checkLocationOnLoad() {
  const userDecision = localStorage.getItem("user_loc_preference");

  if (navigator.geolocation) {
    navigator.permissions.query({ name: "geolocation" }).then((result) => {
      if (result.state === "granted") {
        enableMapUI();
        locateUserSilent();
      } else if (result.state === "denied") {
        disableMapUI();
      } else {
        disableMapUI();

        if (userDecision !== "later") {
          openPermModal();
        }
      }

      result.onchange = function () {
        if (this.state === "granted") enableMapUI();
        else disableMapUI();
      };
    });
  } else {
    disableMapUI();
  }
}

function requestLocationAccess() {
  closePermModal();

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        localStorage.setItem("user_loc_preference", "granted");
        enableMapUI();
        handleLocationSelect(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        console.warn("Location access denied or error:", err);
        disableMapUI();
      },
      { enableHighAccuracy: true }
    );
  } else {
    alert("المتصفح لا يدعم تحديد الموقع");
  }
}

function locateUserSilent() {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      handleLocationSelect(pos.coords.latitude, pos.coords.longitude);
    },
    () => {}
  );
}

function enableMapUI() {
  isMapEnabled = true;
  const wrapper = document.querySelector(".map-wrapper");
  if (wrapper) wrapper.classList.remove("map-disabled");

  const searchInput = document.getElementById("map-search-input");
  const searchBtn = document.querySelector(".map-search-btn");
  const locateBtn = document.querySelector(".locate-fab-btn");
  const overlay = document.getElementById("mapLockOverlay");

  if (searchInput) searchInput.disabled = false;
  if (searchBtn) searchBtn.disabled = false;
  if (locateBtn) locateBtn.disabled = false;
  if (overlay) overlay.style.display = "none";
}

function disableMapUI() {
  isMapEnabled = false;
  const wrapper = document.querySelector(".map-wrapper");
  if (wrapper) wrapper.classList.add("map-disabled");

  const searchInput = document.getElementById("map-search-input");
  const searchBtn = document.querySelector(".map-search-btn");
  const locateBtn = document.querySelector(".locate-fab-btn");
  const overlay = document.getElementById("mapLockOverlay");

  if (searchInput) searchInput.disabled = true;
  if (searchBtn) searchBtn.disabled = true;
  if (locateBtn) locateBtn.disabled = true;

  if (overlay) {
    overlay.style.display = "flex";
    overlay.onclick = openPermModal;
  }
}

function openPermModal() {
  const modal = document.getElementById("locationPermModal");
  if (modal) modal.classList.add("show");
}

function closePermModal() {
  const modal = document.getElementById("locationPermModal");
  if (modal) modal.classList.remove("show");

  if (localStorage.getItem("user_loc_preference") !== "granted") {
    localStorage.setItem("user_loc_preference", "later");
  }
}
