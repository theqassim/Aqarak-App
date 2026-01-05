import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://scncapmhnshjpocenqpm.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbmNhcG1obnNoanBvY2VucXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTQyNTcsImV4cCI6MjA3OTM3MDI1N30.HHyZ73siXlTCVrp9I8qxAm4aMfx3R9r1sYvNWzBh9dI";
const supabase = createClient(supabaseUrl, supabaseKey);

const style = document.createElement("style");
style.innerHTML = `
/* CSS التقييمات */
    .rating-stars { color: #FFD700; font-size: 0.9rem; margin-right: 5px; }
    .btn-rate { 
        background: transparent; border: 1px solid #FFD700; color: #FFD700; 
        padding: 2px 8px; border-radius: 10px; font-size: 0.7rem; 
        cursor: pointer; margin-right: 5px; transition:0.3s; 
    }
    .btn-rate:hover { background: #FFD700; color: #000; }
    
    /* مودال التقييم */
    .star-rating-input { direction: rtl; display: flex; justify-content: center; gap: 10px; font-size: 2rem; margin: 15px 0; }
    .star-rating-input i { cursor: pointer; color: #444; transition: 0.3s; }
    .star-rating-input i.active { color: #FFD700; }
    /* تصميم مودال الحالة */
    .status-modal-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.95); z-index: 10000; display: flex;
        justify-content: center; align-items: center; backdrop-filter: blur(5px);
    }
    .status-modal-content {
        background: #1c2630; padding: 30px; border-radius: 20px;
        width: 90%; max-width: 400px; text-align: center;
        border: 1px solid #333; position: relative;
        box-shadow: 0 0 30px rgba(0,0,0,0.5);
    }
    .status-icon-box { font-size: 3.5rem; margin-bottom: 20px; }
    .status-note-box {
        background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;
        margin: 20px 0; text-align: right; border-right: 4px solid;
    }
    .btn-status-action {
        width: 100%; padding: 15px; border-radius: 50px; border: none;
        font-weight: bold; font-size: 1.1rem; cursor: pointer; margin-top: 10px;
    }
    
    /* 🔥 تصميم علامة التوثيق الذهبية (Facebook Style) 🔥 */
    .fb-gold-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;  /* حجم الدائرة */
        height: 18px;
        background-color: #FFD700; /* اللون الذهبي */
        color: #fff; /* لون علامة الصح أبيض */
        border-radius: 50%;
        font-size: 10px; /* حجم علامة الصح */
        margin: 0 5px;
        border: 1.5px solid #fff; /* حدود بيضاء لتفصيلها عن الخلفية */
        box-shadow: 0 0 8px rgba(255, 215, 0, 0.6); /* توهج خفيف */
        vertical-align: middle;
        transform: translateY(-1px); /* ضبط المحاذاة مع النص */
    }

    /* باقي الستايلات (فيديو، مودال تعديل، إلخ) */
    .video-btn-modern {
        background: linear-gradient(135deg, #ff0000, #c0392b);
        color: white; border: none; padding: 12px 30px; border-radius: 50px;
        display: flex; align-items: center; gap: 15px; cursor: pointer;
        font-size: 1.1rem; font-weight: bold; box-shadow: 0 10px 20px rgba(192, 57, 43, 0.4);
        transition: all 0.3s ease; margin: 20px auto; width: fit-content; text-decoration: none;
    }
    .video-btn-modern:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(192, 57, 43, 0.6); }
    
    .guest-action-box {
        text-align: center; padding: 30px 20px; background: rgba(255, 255, 255, 0.03);
        border: 1px dashed #00ff88; border-radius: 15px; margin-top: 20px;
    }
    .guest-btns-wrapper { display: flex; gap: 15px; justify-content: center; margin-top: 15px; flex-wrap: wrap; }
    .btn-login-action { background: transparent; border: 2px solid #00ff88; color: #00ff88; padding: 10px 25px; border-radius: 50px; text-decoration: none; font-weight: bold; transition: 0.3s; }
    .btn-login-action:hover { background: #00ff88; color: #000; }
    .btn-register-action { background: #00ff88; border: 2px solid #00ff88; color: #000; padding: 10px 25px; border-radius: 50px; text-decoration: none; font-weight: bold; transition: 0.3s; }
    .btn-register-action:hover { background: transparent; color: #00ff88; }

    .edit-modal-overlay {
        display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.85); z-index: 9999; align-items: center; justify-content: center;
        backdrop-filter: blur(5px);
    }
    .edit-modal-content {
        background: #1c2630; padding: 25px; border-radius: 15px; border: 1px solid #00ff88;
        width: 95%; max-width: 600px; box-shadow: 0 0 30px rgba(0, 255, 136, 0.15);
        max-height: 90vh; overflow-y: auto;
    }
    .edit-input-group { margin-bottom: 15px; }
    .edit-input-group label { display: block; color: #aaa; margin-bottom: 5px; font-size: 0.9rem; font-weight: bold; }
    .edit-input { width: 100%; padding: 12px; background: #2a3b4c; border: 1px solid #444; color: #fff; border-radius: 8px; outline: none; font-size: 1rem; transition: 0.3s; }
    .edit-input:focus { border-color: #00ff88; box-shadow: 0 0 8px rgba(0,255,136,0.2); }
    .edit-actions { display: flex; gap: 10px; margin-top: 25px; }
    .btn-save { background: linear-gradient(45deg, #00ff88, #00cc6a); color: #000; border: none; padding: 12px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; flex: 2; transition: 0.3s; }
    .btn-save:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,255,136,0.3); }
    .btn-cancel { background: #ff4444; color: #fff; border: none; padding: 12px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; flex: 1; transition: 0.3s; }
    .btn-cancel:hover { background: #cc0000; }

    .img-grid-container { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
    .img-box { position: relative; width: 100px; height: 80px; border-radius: 8px; overflow: hidden; border: 2px solid #444; transition: 0.3s; }
    .img-box img { width: 100%; height: 100%; object-fit: cover; }
    .img-box:hover { border-color: #00ff88; }
    .delete-img-btn { position: absolute; top: 2px; right: 2px; background: rgba(255,68,68,0.9); color: white; border: none; width: 22px; height: 22px; border-radius: 50%; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10; }
    .delete-img-btn:hover { background: #ff0000; transform: scale(1.1); }
`;
document.head.appendChild(style);

window.formatPrice = (price, type) => {
  if (!price) return "N/A";
  const formatted = parseFloat(price).toLocaleString("ar-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 0,
  });
  return `<span class="detail-price">${formatted}</span> ${
    type === "rent" || type === "إيجار" ? "/ شهرياً" : ""
  }`;
};

window.getTypeTag = (type) => {
  if (type === "buy" || type === "شراء" || type === "بيع")
    return `<span class="property-type sale">للبيع</span>`;
  else if (type === "rent" || type === "إيجار")
    return `<span class="property-type rent">للإيجار</span>`;
  return "";
};

window.openOfferModal = () => {
  document.getElementById("offer-modal").style.display = "flex";
};
window.closeOfferModal = () => {
  document.getElementById("offer-modal").style.display = "none";
};

window.toggleFavorite = async (propertyId) => {
  const btn = document.getElementById("favoriteBtn");
  const favIcon = btn.querySelector("i");
  const isFavorite = btn.classList.contains("is-favorite");
  const method = isFavorite ? "DELETE" : "POST";
  const url = isFavorite ? `/api/favorites/${propertyId}` : `/api/favorites`;
  const body = isFavorite ? null : JSON.stringify({ propertyId });

  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (response.status === 401) {
      alert("يجب تسجيل الدخول لإضافة العقار للمفضلة.");
      window.location.href = "authentication";
      return;
    }
    if (response.ok || response.status === 409) {
      if (isFavorite) {
        btn.classList.remove("is-favorite");
        favIcon.className = "far fa-heart";
        alert("تمت الإزالة من المفضلة.");
      } else {
        btn.classList.add("is-favorite");
        favIcon.className = "fas fa-heart";
        alert("تمت الإضافة للمفضلة.");
      }
    }
  } catch (error) {
    console.error("Favorite Error:", error);
  }
};

window.shareProperty = async (title) => {
  const shareData = {
    title: `عقارك - ${title}`,
    text: `شاهد هذا العقار المميز على موقع عقارك: ${title}`,
    url: window.location.href,
  };
  try {
    if (navigator.share) await navigator.share(shareData);
    else {
      await navigator.clipboard.writeText(window.location.href);
      alert("تم نسخ الرابط!");
    }
  } catch (err) {
    console.error("Error sharing:", err);
  }
};

window.handleWhatsappClick = async (link) => {
  window.open(link, "_blank");
};

async function loadSimilarProperties(currentProperty) {
  const container = document.getElementById("similar-properties-container");
  const header = document.querySelector(".similar-properties-section h2");
  if (header)
    header.innerHTML = '<i class="fas fa-lightbulb"></i> عقارات مقترحة لك';

  try {
    const response = await fetch(
      `/api/properties/suggested/${currentProperty.id}`
    );
    const suggested = await response.json();

    if (!suggested || suggested.length === 0) {
      container.innerHTML =
        '<p style="text-align:center; color:#777;">لا توجد اقتراحات حالياً.</p>';
      return;
    }

    container.innerHTML = "";
    suggested.slice(0, 3).forEach((prop) => {
      const priceVal = prop.price
        ? Number(prop.price.replace(/[^0-9.]/g, "")).toLocaleString()
        : "N/A";
      const card = `
                <div class="property-card neon-glow" onclick="window.location.href='property?id=${
                  prop.id
                }'" style="position:relative; cursor:pointer;">
                    ${
                      prop.isFeatured
                        ? '<span style="position:absolute; top:10px; right:10px; background:#ffc107; color:black; padding:2px 6px; border-radius:4px; font-size:0.7rem; font-weight:bold; z-index:2;">مميز</span>'
                        : ""
                    }
                    <div style="height:180px; overflow:hidden;">
                        <img src="${
                          prop.imageUrl || "logo.png"
                        }" style="width:100%; height:100%; object-fit:cover;">
                    </div>
                    <div class="card-content" style="padding:10px;">
                        <h4 style="font-size:1rem; margin-bottom:5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:white;">${
                          prop.title
                        }</h4>
                        <p class="price" style="font-size:1rem; color:var(--neon-primary); font-weight:bold;">${priceVal} ج.م</p>
                    </div>
                </div>
            `;
      container.innerHTML += card;
    });
  } catch (e) {
    container.innerHTML = "";
  }
}

async function prefillUserData() {
  try {
    const res = await fetch("/api/auth/me");
    const data = await res.json();

    if (data.isAuthenticated) {
      const nameInput = document.getElementById("offer-name");
      const phoneInput = document.getElementById("offer-phone");

      if (nameInput && data.name) nameInput.value = data.name;
      if (phoneInput && data.phone) phoneInput.value = data.phone;
    }
  } catch (e) {
    console.error("Error prefilling user data", e);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  prefillUserData();
  const container = document.getElementById("property-detail-container");
  const loadingMessage = document.getElementById("loading-message");
  let currentImageIndex = 0;
  let imageUrls = [];

  const updateMainImage = (mainImage) => {
    if (imageUrls.length > 0) {
      mainImage.src = imageUrls[currentImageIndex];
      document.querySelectorAll(".thumbnail-image").forEach((thumb, index) => {
        thumb.classList.toggle("active", index === currentImageIndex);
      });
    }
  };

  try {
    let userRole = "guest";
    let currentUserPhone = null;
    let isAuthenticated = false;

    try {
      const authRes = await fetch("/api/auth/me");
      const authData = await authRes.json();
      if (authData.isAuthenticated) {
        userRole = authData.role;
        currentUserPhone = authData.phone;
        isAuthenticated = true;
        window.isPaymentActive = authData.isPaymentActive;
      }
    } catch (e) {
      console.log("Guest User");
    }

    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get("id");
    if (!propertyId) throw new Error("رابط غير صالح.");

    const response = await fetch(`/api/property/${propertyId}`);
    if (!response.ok) throw new Error("العقار غير موجود.");

    const property = await response.json();

    window.currentProperty = property;

    imageUrls = [];
    if (property.imageUrls) {
      if (Array.isArray(property.imageUrls)) imageUrls = property.imageUrls;
      else if (typeof property.imageUrls === "string") {
        try {
          imageUrls = JSON.parse(property.imageUrls);
        } catch (e) {
          imageUrls = [property.imageUrl];
        }
      }
    }
    if (!imageUrls || imageUrls.length === 0)
      imageUrls = property.imageUrl ? [property.imageUrl] : ["logo.png"];
    imageUrls = imageUrls.filter((u) => u && u.trim() !== "");

    if (loadingMessage) loadingMessage.style.display = "none";

    const ownerPhone = property.sellerPhone || "01008102237";
    const formattedOwnerPhone = ownerPhone.replace(/\D/g, "").startsWith("0")
      ? "2" + ownerPhone
      : ownerPhone;
    const whatsappLink = `https://wa.me/${formattedOwnerPhone}?text=${encodeURIComponent(
      `أنا مهتم بالعقار: ${property.title} (كود: ${property.hiddenCode})`
    )}`;

    const verifiedBadge = property.is_verified
      ? `<span class="fb-gold-badge" title="موثق"><i class="fas fa-check"></i></span>`
      : "";

    let publisherHTML = "";
    let publisherStatsBadge = "";
    let profileImgSrc = property.profile_picture || "logo.png";

    let ratingStats = { average: 0, count: 0 };
    try {
      const rRes = await fetch(`/api/reviews/stats/${property.sellerPhone}`);
      const contentType = rRes.headers.get("content-type");
      if (rRes.ok && contentType && contentType.includes("application/json")) {
        ratingStats = await rRes.json();
      } else {
        console.warn("Rating API returned non-JSON response");
      }
    } catch (e) {
      console.error("Error loading ratings, defaulting to 0.");
    }

    const starsHTML = `
        <div style="display:flex; align-items:center; gap: 6px; background: rgba(0,0,0,0.3); padding: 4px 10px; border-radius: 20px; border: 1px solid #444;">
            <i class="fas fa-star" style="color: #FFD700; font-size: 0.9rem;"></i>
            <span style="color: #fff; font-weight: bold; font-size: 0.9rem;">${
              ratingStats.average || "0.0"
            }</span>
            <span style="color: #888; font-size: 0.8rem;">(${
              ratingStats.count || 0
            })</span>
        </div>
    `;

    const rateButtonHTML =
      isAuthenticated && currentUserPhone !== property.sellerPhone
        ? `
        <button onclick="openRateModal('${property.sellerPhone}', '${property.sellerName}')" 
            style="background: transparent; border: 1px solid var(--neon-primary); color: var(--neon-primary); 
            padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; cursor: pointer; transition: 0.3s; display: flex; align-items: center; gap: 5px;">
            <i class="far fa-edit"></i> تقييم
        </button>
    `
        : "";

    let reportBtnHTML = "";
    if (isAuthenticated && currentUserPhone !== property.sellerPhone) {
      reportBtnHTML = `
            <button onclick="document.getElementById('report-modal').style.display='flex'" 
                style="background: transparent; border: none; color: #ff4444; font-size: 0.9rem; cursor: pointer; opacity: 0.7; transition: 0.3s;" title="إبلاغ">
                <i class="fas fa-flag"></i>
            </button>
        `;
    }

    const profileLink = property.publisherUsername
      ? `profile?u=${property.publisherUsername}`
      : "#";

    if (property.publisherUsername) {
      try {
        const statsRes = await fetch(
          `/api/public/profile/${property.publisherUsername}`
        );
        if (
          statsRes.ok &&
          statsRes.headers.get("content-type")?.includes("application/json")
        ) {
          const statsData = await statsRes.json();
          const count = statsData.properties ? statsData.properties.length : 0;
          publisherStatsBadge = `
                    <span style="font-size: 0.75rem; color: #aaa; background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 4px; margin-top:4px; display:inline-block;">
                        <i class="fas fa-building"></i> ${count} عقار
                    </span>
                `;
        }
      } catch (e) {}
    }

    publisherHTML = `
        <div class="publisher-card" style="
            margin-top: 20px; 
            padding: 16px; 
            border-radius: 16px; 
            background: linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.2) 100%); 
            border: 1px solid rgba(255,255,255,0.1);
            position: relative;
            overflow: hidden;
        ">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                <a href="${profileLink}" style="text-decoration: none; position: relative;">
                    <img src="${profileImgSrc}" onerror="this.src='logo.png'" style="width: 55px; height: 55px; border-radius: 50%; object-fit: cover; border: 2px solid var(--neon-primary); box-shadow: 0 0 10px rgba(0,255,136,0.2);" alt="Publisher">
                    ${
                      property.publisherUsername
                        ? '<div style="position: absolute; bottom: 0; right: 0; width: 12px; height: 12px; background: #00ff88; border-radius: 50%; border: 2px solid #1a1a1a;"></div>'
                        : ""
                    }
                </a>
                
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <p style="color: #888; font-size: 0.75rem; margin: 0;">الناشر</p>
                        ${reportBtnHTML}
                    </div>
                    
                    <a href="${profileLink}" style="display: block; color: #fff; text-decoration: none; font-weight: bold; font-size: 1.1rem; margin: 2px 0;">
                        ${
                          property.sellerName || "مستخدم عقارك"
                        } ${verifiedBadge}
                    </a>
                    
                    ${publisherStatsBadge}
                </div>
            </div>

            <div style="height: 1px; background: rgba(255,255,255,0.1); margin-bottom: 12px;"></div>

            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
                ${starsHTML}
                ${rateButtonHTML}
            </div>
        </div>
    `;
    let actionSectionHTML = "";
    let makeOfferButtonHTML = "";

    if (isAuthenticated) {
      const negOwnerPhone = property.sellerPhone
        ? property.sellerPhone.replace(/\D/g, "").startsWith("0")
          ? "2" + property.sellerPhone
          : property.sellerPhone
        : "201008102237";
      const negLink = `https://wa.me/${negOwnerPhone}?text=${encodeURIComponent(
        `سلام عليكم، كنت محتاج أتفاوض بخصوص السعر للعقار: ${property.title}`
      )}`;

      makeOfferButtonHTML = `
                <button onclick="window.handleWhatsappClick('${negLink}')" class="btn-offer" style="background: linear-gradient(45deg, #ff9800, #ff5722); color: white; border: none; padding: 5px 15px; border-radius: 5px; cursor: pointer; font-weight: bold;">
                    <i class="fas fa-handshake"></i> تفاوض
                </button>
            `;

      let ownerControlsHTML = "";
      const isOwner =
        currentUserPhone &&
        property.sellerPhone &&
        currentUserPhone === property.sellerPhone;
      const isAdmin = userRole === "admin";

      if (isOwner || isAdmin) {
        const controlTitle = isAdmin
          ? "تحكم الإدارة 🛡️"
          : "أنت صاحب هذا العقار 👑";

        let featureBtnHTML = "";
        if (window.isPaymentActive && !property.isFeatured) {
          featureBtnHTML = `
                        <button onclick="openFeatureModal(${property.id})" class="btn-neon-auth" style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); border:none; color: black; flex: 1.5; margin-bottom:10px; width:100%; box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3); position: relative; overflow: hidden;">
                            <i class="fas fa-crown" style="margin-left:5px;"></i> ترقية لمميز
                            <div style="position:absolute; top:0; left:0; width:100%; height:100%; background:linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent); transform:skewX(-20deg) translateX(-150%); animation: shine 3s infinite;"></div>
                        </button>
                        <style>@keyframes shine { 0% { transform: skewX(-20deg) translateX(-150%); } 20% { transform: skewX(-20deg) translateX(150%); } 100% { transform: skewX(-20deg) translateX(150%); } }</style>
                    `;
        } else if (property.isFeatured) {
          featureBtnHTML = `
                        <div style="background: rgba(255, 215, 0, 0.1); border: 1px solid #FFD700; color: #FFD700; padding: 10px; border-radius: 50px; margin-bottom: 10px; font-size: 0.9rem; font-weight: bold;">
                            <i class="fas fa-check-circle"></i> هذا العقار مميز (Premium)
                        </div>
                    `;
        }

        ownerControlsHTML = `
                    <div style="margin-top: 20px; padding: 20px; border: 1px solid ${
                      isAdmin ? "#e91e63" : "#00ff88"
                    }; border-radius: 16px; background: rgba(255, 255, 255, 0.03); text-align: center; backdrop-filter: blur(5px);">
                        <p style="color: ${
                          isAdmin ? "#e91e63" : "#00ff88"
                        }; font-weight: bold; margin-bottom: 15px; font-size: 1.1rem;">
                            ${controlTitle}
                        </p>
                        ${featureBtnHTML}
                        <div style="display: flex; gap: 10px; justify-content: center;">
                            <button onclick="openEditPropertyModal()" class="btn-neon-auth" style="background: rgba(33, 150, 243, 0.1); border-color: #2196F3; color: #2196F3; flex: 1;">
                                <i class="fas fa-edit"></i> تعديل
                            </button>
                            <button onclick="deleteProperty(${
                              property.id
                            })" class="btn-neon-auth" style="background: rgba(255, 68, 68, 0.1); border-color: #ff4444; color: #ff4444; flex: 1;">
                                <i class="fas fa-trash"></i> حذف
                            </button>
                        </div>
                    </div>
                `;

        injectEditModal(property);
        if (window.isPaymentActive) injectFeatureModal();
      }
      let isFav = false;
      try {
        const favRes = await fetch(`/api/favorites`);
        if (favRes.ok) {
          const favs = await favRes.json();
          isFav = favs.some((f) => f.id === property.id);
        }
      } catch (e) {}
      const favClass = isFav ? "is-favorite" : "";
      const favIcon = isFav ? "fas fa-heart" : "far fa-heart";

      actionSectionHTML = `
                <div class="action-buttons-group">
                    <button onclick="window.handleWhatsappClick('${whatsappLink}')" class="whatsapp-btn btn-neon-auth" style="flex:2; background-color: #25d366; color: white; border: none; box-shadow: 0 0 8px #25d366;">
                        <i class="fab fa-whatsapp"></i> تواصل مع المالك
                    </button>
                    <button onclick="window.shareProperty('${property.title}')" class="btn-neon-auth" style="background:var(--neon-secondary); color:#fff; flex:1;">
                        <i class="fas fa-share-alt"></i> مشاركة
                    </button>
                    <button id="favoriteBtn" data-id="${property.id}" class="favorite-button btn-neon-auth ${favClass}" style="flex:1;">
                        <i id="favIcon" class="${favIcon}"></i>
                    </button>
                </div>
                ${ownerControlsHTML}
            `;
    } else {
      actionSectionHTML = `
                <div class="guest-action-box">
                    <p style="color:#ccc; margin-bottom:15px; font-size:0.95rem;">
                        <i class="fas fa-lock" style="color:#00ff88; margin-left:5px;"></i> يجب تسجيل الدخول للتواصل مع المالك.
                    </p>
                    <div class="guest-btns-wrapper">
                        <a href="authentication" class="btn-login-action">تسجيل دخول</a>
                        <a href="authentication?mode=register" class="btn-register-action">إنشاء حساب</a>
                    </div>
                </div>
            `;
    }

    let videoSectionHTML = "";
    const videoList = Array.isArray(property.video_urls)
      ? property.video_urls
      : [];
    if (videoList.length > 0) {
      videoSectionHTML = `<div style="width: 100%; display: flex; justify-content: center; margin-bottom: 20px;"><button onclick="goToCinemaMode()" class="video-btn-modern"><div class="icon-pulse">▶</div><span>مشاهدة فيديو العقار</span><span class="badge" style="background:white; color:red; padding:2px 6px; border-radius:50%; font-size:0.8rem; margin-right:5px;">${videoList.length}</span></button></div>`;
      window.goToCinemaMode = () => {
        localStorage.setItem("activePropertyVideos", JSON.stringify(videoList));
        window.location.href = "watch";
      };
    }

    let specsHTML = `<li><span>المساحة:</span> ${property.area} م² <i class="fas fa-ruler-combined"></i></li>`;
    if (property.rooms && parseInt(property.rooms) > 0)
      specsHTML += `<li><span>الغرف:</span> ${property.rooms} <i class="fas fa-bed"></i></li>`;
    if (property.bathrooms && parseInt(property.bathrooms) > 0)
      specsHTML += `<li><span>الحمامات:</span> ${property.bathrooms} <i class="fas fa-bath"></i></li>`;
    if (property.level && property.level !== "undefined")
      specsHTML += `<li><span>الدور:</span> ${property.level} <i class="fas fa-layer-group"></i></li>`;
    if (property.floors_count && parseInt(property.floors_count) > 0)
      specsHTML += `<li><span>عدد الأدوار:</span> ${property.floors_count} <i class="fas fa-building"></i></li>`;
    if (property.finishing_type && property.finishing_type !== "undefined")
      specsHTML += `<li><span>التشطيب:</span> ${property.finishing_type} <i class="fas fa-paint-roller"></i></li>`;

    container.innerHTML = `
            <div class="property-detail-content">
                <h1 class="page-title">${property.title} ${window.getTypeTag(
      property.type
    )}</h1>
                ${
                  property.isLegal
                    ? `<div class="legal-trust-box neon-glow"><div class="legal-icon"><i class="fas fa-shield-alt"></i></div><div class="legal-content"><h4>عقار تم الفحص القانوني له ✅</h4><p>تمت مراجعة أوراق هذا العقار.</p></div></div>`
                    : ""
                }
                
                <div class="details-layout">
                    <div class="details-info-frame neon-glow">
                        <div class="price-type-info" style="display:flex; justify-content:space-between; align-items:center;">
                            <p class="detail-price" style="margin:0;">${window.formatPrice(
                              property.price,
                              property.type
                            )}</p>
                            ${makeOfferButtonHTML}
                        </div>

                         <div style="margin: 10px 0;">
                            ${
                              property.isFeatured
                                ? '<span class="badge-featured-main"><i class="fas fa-star"></i> عقار مميز</span>'
                                : ""
                            }
                        </div>
                        
                        <div id="admin-secret-box" style="display:none; margin:15px 0; background:#fff0f0; border:2px dashed #dc3545; padding:10px; border-radius:8px;">
                            <h4 style="color:#dc3545; margin:0 0 10px 0;"><i class="fas fa-lock"></i> الأدمن</h4>
                            <div style="color:#333; font-size:0.95rem;">
                                <p><strong>المالك:</strong> <span>${
                                  property.sellerName || "-"
                                }</span></p>
                                <p><strong>الهاتف:</strong> <span>${
                                  property.sellerPhone || "-"
                                }</span></p>
                                <p><strong>الكود:</strong> <span>${
                                  property.hiddenCode
                                }</span></p>
                            </div>
                        </div>

                        <div class="property-specs">
                            <ul class="specs-list">
                                ${specsHTML}
                            </ul>
                        </div>

                        ${videoSectionHTML}

                        ${
                          property.nearby_services
                            ? `
<div class="ai-insight-box neon-glow">
    <div class="ai-header">
        <i class="fas fa-robot ai-icon"></i>
        <div>
            <h4>تحليل موقع العقار</h4>
            <span class="ai-subtitle">تم البحث بواسطة فريق عقارك 🛡️</span>
        </div>
    </div>
    <div class="ai-content">
        <p>
            <i class="fas fa-map-marker-alt" style="color:var(--neon-primary); margin-left:5px;"></i>
            يتميز هذا العقار بموقع استراتيجي، حيث يحيط به الخدمات التالية:
        </p>
        <div class="services-tags">
            ${property.nearby_services
              .split(",")
              .map(
                (service) => `
                <span class="service-tag"><i class="fas fa-check-circle"></i> ${service.trim()}</span>
            `
              )
              .join("")}
        </div>
    </div>
</div>
`
                            : ""
                        }
                        
                        <div class="property-description-box" style="margin-top:20px;">
                            <h3 style="color:#00ff88; margin-bottom:10px;">الوصف</h3>
                            <p style="color:#ccc; line-height:1.6;">${
                              property.description || "لا يوجد وصف."
                            }</p>
                        </div>
                        
                        ${publisherHTML}
                        ${actionSectionHTML}
                    </div>
                    
                    <div class="image-gallery-frame neon-glow">
                        <div class="gallery-inner">
                            <div class="main-image-container">
                                <img id="property-main-image" src="${
                                  imageUrls[0]
                                }" class="main-image">
                                ${
                                  imageUrls.length > 1
                                    ? `<button id="prev-image" class="gallery-nav-btn prev-btn"><i class="fas fa-chevron-right"></i></button><button id="next-image" class="gallery-nav-btn next-btn"><i class="fas fa-chevron-left"></i></button>`
                                    : ""
                                }
                            </div>
                            <div id="image-thumbnails" class="image-thumbnails"></div>
                        </div>
                    </div>
                </div>
                
                <div class="similar-properties-section" style="margin-top: 50px;">
                    <h2 style="margin-bottom: 20px; border-bottom: 2px solid var(--neon-secondary); display:inline-block; padding-bottom:5px; color:white;">
                        <i class="fas fa-home"></i> عقارات مشابهة
                    </h2>
                    <div id="similar-properties-container" class="listings-container" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:15px;">
                        <p>جاري البحث...</p>
                    </div>
                </div>
            </div>
        `;

    if (userRole === "admin") {
      const box = document.getElementById("admin-secret-box");
      if (box) {
        box.style.display = "block";
        const controlsDiv = document.createElement("div");
        controlsDiv.style.marginTop = "10px";
        controlsDiv.style.display = "flex";
        controlsDiv.style.gap = "10px";

        const createBadgeBtn = (text, isActive, color, onClick) => {
          const btn = document.createElement("button");
          btn.className = "btn-neon-auth";
          btn.style.fontSize = "0.7rem";
          btn.style.padding = "5px 10px";
          btn.style.background = isActive ? color : "#555";
          btn.style.color = isActive ? "#000" : "#fff";
          btn.innerHTML = isActive
            ? `<i class="fas fa-check"></i> ${text}`
            : `تفعيل ${text}`;
          btn.onclick = onClick;
          return btn;
        };

        controlsDiv.appendChild(
          createBadgeBtn("مميز", property.isFeatured, "#ffc107", async () => {
            if (!confirm("تغيير حالة التميز؟")) return;
            await fetch(`/api/admin/toggle-badge/${property.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "isFeatured",
                value: !property.isFeatured,
              }),
            });
            location.reload();
          })
        );

        controlsDiv.appendChild(
          createBadgeBtn("قانوني", property.isLegal, "#28a745", async () => {
            if (!confirm("تغيير حالة الفحص القانوني؟")) return;
            await fetch(`/api/admin/toggle-badge/${property.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "isLegal",
                value: !property.isLegal,
              }),
            });
            location.reload();
          })
        );

        box.appendChild(controlsDiv);
      }
    }

    const mainImg = document.getElementById("property-main-image");
    const thumbsContainer = document.getElementById("image-thumbnails");
    const update = () => updateMainImage(mainImg);

    if (imageUrls.length > 1) {
      document.getElementById("prev-image").onclick = () => {
        currentImageIndex =
          (currentImageIndex - 1 + imageUrls.length) % imageUrls.length;
        update();
      };
      document.getElementById("next-image").onclick = () => {
        currentImageIndex = (currentImageIndex + 1) % imageUrls.length;
        update();
      };
    } else {
      document
        .querySelectorAll(".gallery-nav-btn")
        .forEach((b) => (b.style.display = "none"));
    }

    imageUrls.forEach((url, i) => {
      const img = document.createElement("img");
      img.src = url;
      img.className = `thumbnail-image ${i === 0 ? "active" : ""}`;
      img.onclick = () => {
        currentImageIndex = i;
        update();
      };
      thumbsContainer.appendChild(img);
    });

    const favBtn = document.getElementById("favoriteBtn");
    if (favBtn) favBtn.onclick = () => window.toggleFavorite(property.id);

    loadSimilarProperties(property);
    if (window.setupLightbox) window.setupLightbox(imageUrls);

    const offerForm = document.getElementById("offer-form");
    if (offerForm) {
      offerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = offerForm.querySelector("button");
        const originalText = btn.innerHTML;
        btn.innerHTML =
          '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
        btn.disabled = true;
        const data = {
          propertyId: property.id,
          buyerName: document.getElementById("offer-name").value,
          buyerPhone: document.getElementById("offer-phone").value,
          offerPrice: document.getElementById("offer-price").value,
        };
        try {
          const res = await fetch("/api/make-offer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          const resData = await res.json();
          if (res.ok) {
            alert("✅ " + resData.message);
            window.closeOfferModal();
            offerForm.reset();
          } else {
            throw new Error(resData.message);
          }
        } catch (error) {
          alert("❌ خطأ: " + error.message);
        } finally {
          btn.innerHTML = originalText;
          btn.disabled = false;
        }
      });
    }
  } catch (error) {
    console.error(error);
    container.innerHTML = `<p class="error">خطأ: ${error.message}</p>`;
    if (loadingMessage) loadingMessage.style.display = "none";
  }
});

let currentEditImages = [];
let newEditFiles = [];

function injectEditModal(prop) {
  currentEditImages = [];
  newEditFiles = [];
  try {
    if (Array.isArray(prop.imageUrls)) currentEditImages = prop.imageUrls;
    else if (prop.imageUrls) currentEditImages = JSON.parse(prop.imageUrls);
    else if (prop.imageUrl) currentEditImages = [prop.imageUrl];
  } catch (e) {
    currentEditImages = [];
  }

  const oldModal = document.getElementById("edit-modal");
  if (oldModal) oldModal.remove();

  const modalHTML = `
        <div id="edit-modal" class="edit-modal-overlay">
            <div class="edit-modal-content">
                <h3 style="color:#00ff88; margin-bottom:20px; text-align:center;">تعديل بيانات العقار</h3>
                
                <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px; margin-bottom: 20px; border: 1px dashed #555;">
                    <label style="color: #00ff88; font-weight: bold; display: block; margin-bottom: 10px;">📸 صور العقار الحالية</label>
                    <div id="edit-images-container" class="img-grid-container"></div>
                    
                    <input type="file" id="new-images-input" multiple accept="image/*" style="display: none;">
                    <button type="button" onclick="document.getElementById('new-images-input').click()" 
                        class="btn-login-action" style="width: 100%; border-color: #2196F3; color: #2196F3; margin-top: 15px;">
                        <i class="fas fa-plus-circle"></i> إضافة صور جديدة
                    </button>
                </div>

                <form id="edit-property-form">
                    <div class="edit-input-group">
                        <label>العنوان</label>
                        <input type="text" name="title" class="edit-input" value="${prop.title}" required>
                    </div>
                    <div class="edit-input-group">
                        <label>السعر</label>
                        <input type="text" name="price" class="edit-input" value="${prop.price}" required>
                    </div>
                    <div class="edit-input-group" style="display:flex; gap:10px;">
                        <div style="flex:1;">
                            <label>المساحة</label>
                            <input type="number" name="area" class="edit-input" value="${prop.area}" required>
                        </div>
                        <div style="flex:1;">
                            <label>الغرف</label>
                            <input type="number" name="rooms" class="edit-input" value="${prop.rooms}">
                        </div>
                        <div style="flex:1;">
                            <label>الحمامات</label>
                            <input type="number" name="bathrooms" class="edit-input" value="${prop.bathrooms}">
                        </div>
                    </div>
                    <div class="edit-input-group">
                        <label>الوصف</label>
                        <textarea name="description" class="edit-input" rows="4">${prop.description}</textarea>
                    </div>
                    <div class="edit-actions">
                        <button type="submit" class="btn-save">حفظ التعديلات</button>
                        <button type="button" onclick="closeEditModal()" class="btn-cancel">إلغاء</button>
                    </div>
                </form>
            </div>
        </div>
    `;
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  renderEditImages();

  document
    .getElementById("new-images-input")
    .addEventListener("change", (e) => {
      newEditFiles = [...newEditFiles, ...Array.from(e.target.files)];
      renderEditImages();
      e.target.value = "";
    });

  document
    .getElementById("edit-property-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      if (window.isPaymentActive) {
        if (
          !confirm(
            "⚠️ تنبيه هام:\nتعديل العقار سيخصم 1 نقطة من رصيدك.\n\nهل أنت متأكد من المتابعة؟"
          )
        ) {
          return;
        }
      }
      const btn = e.target.querySelector(".btn-save");
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
      btn.disabled = true;

      const formData = new FormData();
      formData.append("title", e.target.title.value);
      formData.append("price", e.target.price.value);
      formData.append("area", e.target.area.value);
      formData.append("rooms", e.target.rooms.value);
      formData.append("bathrooms", e.target.bathrooms.value);
      formData.append("description", e.target.description.value);

      formData.append("keptImages", JSON.stringify(currentEditImages));
      newEditFiles.forEach((file) => formData.append("newImages", file));

      try {
        const res = await fetch(`/api/user/property/${prop.id}`, {
          method: "PUT",
          body: formData,
        });
        const data = await res.json();

        closeEditModal();

        if (res.ok) {
          window.showStatusModal(
            "success",
            "تم التعديل بنجاح!",
            "تم تحديث بيانات العقار ونشره."
          );
        } else {
          if (data.status === "rejected") {
            window.showStatusModal(
              "rejected",
              "عذراً، التعديل مرفوض",
              "يحتوي التعديل على مخالفة لسياسات النشر.",
              data.reason
            );
          } else {
            alert("❌ " + (data.message || "حدث خطأ ما"));
          }
        }
      } catch (err) {
        console.error(err);
        alert("خطأ في الاتصال");
      } finally {
        if (document.querySelector(".btn-save")) {
          btn.innerHTML = originalText;
          btn.disabled = false;
        }
      }
    });
}

function renderEditImages() {
  const container = document.getElementById("edit-images-container");
  container.innerHTML = "";

  currentEditImages.forEach((url, index) => {
    const div = document.createElement("div");
    div.className = "img-box";
    div.innerHTML = `<img src="${url}"><button type="button" onclick="removeOldImage(${index})" class="delete-img-btn"><i class="fas fa-times"></i></button>`;
    container.appendChild(div);
  });

  newEditFiles.forEach((file, index) => {
    const div = document.createElement("div");
    div.className = "img-box";
    div.style.borderColor = "#00ff88";
    const img = document.createElement("img");
    img.style.opacity = "0.7";
    div.appendChild(img);
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    div.innerHTML += `<button type="button" onclick="removeNewFile(${index})" class="delete-img-btn"><i class="fas fa-times"></i></button>`;
    container.appendChild(div);
  });
}

window.removeOldImage = (index) => {
  currentEditImages.splice(index, 1);
  renderEditImages();
};
window.removeNewFile = (index) => {
  newEditFiles.splice(index, 1);
  renderEditImages();
};
window.openEditPropertyModal = () => {
  document.getElementById("edit-modal").style.display = "flex";
};
window.closeEditModal = () => {
  document.getElementById("edit-modal").style.display = "none";
};

window.deleteProperty = async (id) => {
  if (
    !confirm(
      "هل أنت متأكد تماماً من حذف هذا العقار؟ لا يمكن التراجع عن هذا الإجراء."
    )
  )
    return;
  try {
    const res = await fetch(`/api/user/property/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) {
      alert("🗑️ تم حذف العقار بنجاح.");
      window.location.href = "home";
    } else {
      alert("❌ فشل الحذف: " + data.message);
    }
  } catch (err) {
    alert("خطأ في الاتصال بالسيرفر");
  }
};

window.setupLightbox = (images) => {
  const lightbox = document.getElementById("lightbox-modal");
  const lightboxImg = document.getElementById("lightbox-img");
  const counter = document.querySelector(".lightbox-counter");
  const closeBtn = document.querySelector(".close-lightbox");
  const nextBtn = document.querySelector(".next-lightbox");
  const prevBtn = document.querySelector(".prev-lightbox");
  const mainImage = document.getElementById("property-main-image");
  if (!lightbox) return;
  let currentIndex = 0;
  const open = (index) => {
    currentIndex = index;
    update();
    lightbox.style.display = "flex";
  };
  const update = () => {
    lightboxImg.src = images[currentIndex];
    counter.textContent = `${currentIndex + 1} / ${images.length}`;
  };
  const close = () => {
    lightbox.style.display = "none";
  };
  if (mainImage) {
    mainImage.style.cursor = "zoom-in";
    mainImage.addEventListener("click", () =>
      open(images.findIndex((img) => img === mainImage.src) || 0)
    );
  }
  nextBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    currentIndex = (currentIndex + 1) % images.length;
    update();
  });
  prevBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    update();
  });
  closeBtn.addEventListener("click", close);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) close();
  });
  document.addEventListener("keydown", (e) => {
    if (lightbox.style.display === "flex") {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") nextBtn.click();
      if (e.key === "ArrowRight") prevBtn.click();
    }
  });
};

window.showStatusModal = (type, title, subtitle, note = "") => {
  const isSuccess = type === "success";
  const isRejected = type === "rejected";
  const icon = isSuccess
    ? "fas fa-check-circle"
    : isRejected
    ? "fas fa-times-circle"
    : "fas fa-clipboard-check";
  const color = isSuccess ? "#00ff88" : isRejected ? "#ff4444" : "#ff9800";

  const oldModal = document.getElementById("status-modal");
  if (oldModal) oldModal.remove();

  const modalHTML = `
        <div id="status-modal" class="status-modal-overlay">
            <div class="status-modal-content" style="border-color: ${color};">
                <div class="status-icon-box" style="color: ${color};"><i class="${icon}"></i></div>
                <h2 style="color: white; margin-bottom: 10px;">${title}</h2>
                <p style="color: #ccc; font-size: 0.95rem; margin-bottom: 20px;">${subtitle}</p>
                ${
                  note
                    ? `<div class="status-note-box" style="border-color: ${color};"><strong style="color: #fff; display:block; margin-bottom:5px;">💡 ملحوظة:</strong><span style="color: #ddd; font-size: 0.9rem;">${note}</span></div>`
                    : ""
                }
                <button onclick="document.getElementById('status-modal').remove(); window.location.reload();" class="btn-status-action" style="background: linear-gradient(90deg, ${color}, #444); color: white;">${
    isSuccess ? "تم" : "إغلاق"
  }</button>
            </div>
        </div>
    `;
  document.body.insertAdjacentHTML("beforeend", modalHTML);
};

function injectFeatureModal() {
  const old = document.getElementById("feature-modal-overlay");
  if (old) old.remove();

  const html = `
        <div id="feature-modal-overlay" class="glass-modal-overlay" style="z-index: 10001;">
            <div class="glass-card">
                <span class="close-modal" onclick="document.getElementById('feature-modal-overlay').style.display='none'" style="position:absolute; top:15px; right:20px; color:#aaa; font-size:1.5rem; cursor:pointer;">&times;</span>
                <div class="crown-3d-container"><i class="fas fa-crown"></i></div>
                <h2 style="color: white; margin-bottom: 10px; font-weight:800; letter-spacing:1px;">باقات التميز</h2>
                <p style="color: #ccc; font-size: 0.9rem; margin-bottom: 25px; line-height:1.6;">ميز عقارك ليظهر في المقدمة ويحقق 5 أضعاف المشاهدات. 🚀</p>
                
                <div style="text-align: right;">
                    <input type="radio" name="feature_plan" id="plan1" value="1" class="plan-radio-input" checked>
                    <label for="plan1" class="plan-radio-label">
                        <div style="display:flex; align-items:center; gap:10px;"><i class="fas fa-calendar-alt" style="color:#FFD700;"></i><div><strong style="display:block; color:white;">أسبوعين (14 يوم)</strong><span style="font-size:0.8rem; color:#aaa;">بداية قوية لبيع أسرع</span></div></div>
                        <span style="color:#FFD700; font-weight:bold; font-size:1.1rem;">20 نقطة</span>
                    </label>

                    <input type="radio" name="feature_plan" id="plan2" value="2" class="plan-radio-input">
                    <label for="plan2" class="plan-radio-label">
                        <div style="display:flex; align-items:center; gap:10px;"><i class="fas fa-calendar-check" style="color:#FFD700;"></i><div><strong style="display:block; color:white;">شهر كامل (30 يوم)</strong><span style="font-size:0.8rem; color:#aaa;">الأكثر طلباً ومبيعاً</span></div></div>
                        <span style="color:#FFD700; font-weight:bold; font-size:1.1rem;">30 نقطة</span>
                    </label>

                    <input type="radio" name="feature_plan" id="plan3" value="3" class="plan-radio-input">
                    <label for="plan3" class="plan-radio-label">
                        <div style="display:flex; align-items:center; gap:10px;"><i class="fas fa-fire" style="color:#ff4444;"></i><div><strong style="display:block; color:white;">6 أسابيع (عرض خاص)</strong><span style="font-size:0.8rem; color:#aaa;">أقصى ظهور وضمان وصول</span></div></div>
                        <span style="color:#FFD700; font-weight:bold; font-size:1.1rem;">45 نقطة</span>
                    </label>
                </div>

                <button onclick="submitFeatureRequest()" class="btn-gold-3d">تفعيل التميز الآن <i class="fas fa-arrow-left" style="margin-right:5px;"></i></button>
            </div>
        </div>
    `;
  document.body.insertAdjacentHTML("beforeend", html);
}

window.openFeatureModal = (propId) => {
  window.currentFeaturePropId = propId;
  const modal = document.getElementById("feature-modal-overlay");
  if (modal) modal.style.display = "flex";
};

window.submitFeatureRequest = async () => {
  const selected = document.querySelector('input[name="feature_plan"]:checked');
  if (!selected) return alert("اختر باقة");
  const planId = selected.value;
  const propId = window.currentFeaturePropId;
  const btn = document.querySelector(
    'button[onclick="submitFeatureRequest()"]'
  );

  if (!confirm("سيتم خصم قيمة الباقة من رصيدك فوراً. هل أنت متأكد؟")) return;

  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التفعيل...';
  btn.disabled = true;

  try {
    const res = await fetch("/api/user/feature-property", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: propId, planId: planId }),
    });
    const data = await res.json();
    if (res.ok) {
      document.getElementById("feature-modal-overlay").style.display = "none";
      window.showStatusModal("success", "تم التمييز بنجاح! 🌟", data.message);
    } else {
      if (res.status === 402) alert("❌ " + data.message + "\nيرجى شحن رصيدك.");
      else alert("❌ خطأ: " + data.message);
    }
  } catch (err) {
    console.error(err);
    alert("خطأ في الاتصال");
  } finally {
    btn.innerHTML = 'تفعيل التميز الآن <i class="fas fa-arrow-left"></i>';
    btn.disabled = false;
  }
};
window.submitUserReport = async () => {
  const reason = document.getElementById("report-reason").value;
  const btn = document.querySelector("#report-modal button");

  const reportedPhone = window.currentProperty
    ? window.currentProperty.sellerPhone
    : null;

  if (!reportedPhone) return alert("خطأ في تحديد المستخدم");

  btn.innerHTML = "جاري الإرسال...";
  btn.disabled = true;

  try {
    const res = await fetch("/api/report-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportedPhone, reason }),
    });
    const data = await res.json();
    if (res.ok) {
      alert("✅ " + data.message);
      window.location.href = "home";
    } else {
      alert("❌ " + data.message);
    }
  } catch (e) {
    alert("خطأ في الاتصال");
  } finally {
    btn.innerHTML = "تأكيد الإبلاغ";
    btn.disabled = false;
    document.getElementById("report-modal").style.display = "none";
  }
};

const reviewStyle = document.createElement("style");
reviewStyle.innerHTML = `
    .rating-stars { color: #FFD700; font-size: 0.9rem; margin-right: 5px; direction: ltr; display: inline-block; }
    .btn-rate { 
        background: transparent; border: 1px solid #FFD700; color: #FFD700; 
        padding: 2px 8px; border-radius: 10px; font-size: 0.7rem; 
        cursor: pointer; margin-right: 5px; transition:0.3s; 
    }
    .btn-rate:hover { background: #FFD700; color: #000; }
    .star-rating-input { direction: rtl; display: flex; justify-content: center; gap: 10px; font-size: 2rem; margin: 15px 0; }
    .star-rating-input i { cursor: pointer; color: #444; transition: 0.3s; }
    .star-rating-input i.active { color: #FFD700; }
`;
document.head.appendChild(reviewStyle);

let selectedRating = 0;
window.openRateModal = (phone, name) => {
  const old = document.getElementById("rate-modal");
  if (old) old.remove();

  const html = `
        <div id="rate-modal" class="modal-overlay" style="display:flex; z-index:10002;">
            <div class="modal-content">
                <span class="close-modal" onclick="document.getElementById('rate-modal').remove()">&times;</span>
                <h3 style="text-align:center; color:#FFD700; margin-bottom:10px;">تقييم ${name}</h3>
                <div class="star-rating-input">
                    <i class="far fa-star" onclick="setRate(1)" id="s1"></i>
                    <i class="far fa-star" onclick="setRate(2)" id="s2"></i>
                    <i class="far fa-star" onclick="setRate(3)" id="s3"></i>
                    <i class="far fa-star" onclick="setRate(4)" id="s4"></i>
                    <i class="far fa-star" onclick="setRate(5)" id="s5"></i>
                </div>
                <textarea id="rate-comment" class="neon-input-white" rows="3" placeholder="اكتب تجربتك (اختياري)..." style="width:100%; margin-bottom:15px; background:#222; color:white; border:1px solid #444;"></textarea>
                <button onclick="submitRate('${phone}')" class="btn-offer-submit" style="background:#FFD700; color:black;">إرسال التقييم</button>
            </div>
        </div>
    `;
  document.body.insertAdjacentHTML("beforeend", html);
  selectedRating = 0;
};

window.setRate = (n) => {
  selectedRating = n;
  for (let i = 1; i <= 5; i++) {
    const star = document.getElementById("s" + i);
    if (i <= n) {
      star.classList.remove("far");
      star.classList.add("fas");
      star.classList.add("active");
    } else {
      star.classList.remove("fas");
      star.classList.add("far");
      star.classList.remove("active");
    }
  }
};

window.submitRate = async (phone) => {
  if (selectedRating === 0) return alert("يرجى اختيار عدد النجوم");

  const comment = document.getElementById("rate-comment").value;
  const btn = document.querySelector("#rate-modal button");
  btn.innerHTML = "جاري الإرسال...";
  btn.disabled = true;

  try {
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewedPhone: phone,
        rating: selectedRating,
        comment,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      document.getElementById("rate-modal").remove();
      location.reload();
    } else {
      alert("❌ " + data.message);
      btn.innerHTML = "إرسال التقييم";
      btn.disabled = false;
    }
  } catch (e) {
    alert("خطأ في الاتصال");
    btn.disabled = false;
  }
};
