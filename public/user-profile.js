window.openShareModal = () => {
  const userName = document.getElementById("user-name")
    ? document.getElementById("user-name").innerText
    : "";
  const shareText = userName
    ? `شاهد الملف الشخصي لـ ${userName} على منصة عقارك 🏠`
    : "شاهد هذا الملف الشخصي على منصة عقارك 🏠";
  const cleanUrl = window.location.href.split("&")[0];

  if (navigator.share) {
    navigator
      .share({
        title: document.title,
        text: shareText,
        url: cleanUrl,
      })
      .catch((error) => console.log("Error sharing", error));
  } else {
    const modal = document.getElementById("share-modal-overlay");
    if (modal) modal.style.display = "flex";
  }
};

window.shareTo = (platform) => {
  const userName = document.getElementById("user-name")
    ? document.getElementById("user-name").innerText
    : "";
  const shareText = userName
    ? `شاهد الملف الشخصي لـ ${userName} على منصة عقارك 🏠`
    : "شاهد هذا الملف الشخصي على منصة عقارك 🏠";
  const cleanUrl = window.location.href.split("&")[0];

  const urlEncoded = encodeURIComponent(cleanUrl);
  const textEncoded = encodeURIComponent(shareText + "\n" + cleanUrl);

  let shareUrl = "";

  if (platform === "whatsapp") {
    shareUrl = `https://wa.me/?text=${textEncoded}`;
  } else if (platform === "facebook") {
    shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${urlEncoded}`;
  } else if (platform === "copy") {
    navigator.clipboard.writeText(cleanUrl).then(() => {
      alert("تم نسخ الرابط بنجاح! ✅");
      document.getElementById("share-modal-overlay").style.display = "none";
    });
    return;
  }

  if (shareUrl) {
    window.open(shareUrl, "_blank");
  }
};

window.closeShareModal = (e) => {
  if (e.target.id === "share-modal-overlay") {
    document.getElementById("share-modal-overlay").style.display = "none";
  }
};

window.switchTab = (tabName) => {
  const propsSec = document.getElementById("properties-section");
  const reviewsSec = document.getElementById("reviews-section");
  const btns = document.querySelectorAll(".tab-btn");

  if (!propsSec || !reviewsSec) return;

  btns.forEach((b) => b.classList.remove("active"));

  if (tabName === "properties") {
    propsSec.classList.remove("hidden-section");
    reviewsSec.classList.add("hidden-section");
    if (btns[0]) btns[0].classList.add("active");
  } else {
    propsSec.classList.add("hidden-section");
    reviewsSec.classList.remove("hidden-section");
    if (btns[1]) btns[1].classList.add("active");
  }
};

window.deleteFullReview = async (reviewerPhone) => {
  if (!confirm("هل أنت متأكد؟ سيتم حذف النجوم والتعليق لهذا المستخدم نهائياً."))
    return;

  const reviewedPhone = window.currentProfilePhone;

  if (!reviewedPhone) {
    alert("حدث خطأ: رقم المستخدم غير معروف. يرجى تحديث الصفحة.");
    return;
  }

  try {
    const res = await fetch(
      `/api/admin/reviews/full/${reviewerPhone}/${reviewedPhone}`,
      {
        method: "DELETE",
      }
    );
    const data = await res.json();

    if (res.ok) {
      alert("✅ " + data.message);
      location.reload();
    } else {
      alert("❌ خطأ: " + data.message);
    }
  } catch (e) {
    alert("حدث خطأ أثناء الاتصال بالسيرفر");
    console.error(e);
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  let lastScrollY = window.scrollY;
  const header = document.getElementById("main-header");
  if (header) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > lastScrollY && window.scrollY > 50) {
        header.style.transform = "translateY(-100%)";
      } else {
        header.style.transform = "translateY(0)";
      }
      lastScrollY = window.scrollY;
    });
  }

  const urlParams = new URLSearchParams(window.location.search);
  const username = urlParams.get("u");
  const requestedTab = urlParams.get("tab");

  if (!username) return;

  try {
    const res = await fetch(`/api/public/profile/${username}`);
    if (!res.ok) throw new Error("User not found");
    const data = await res.json();

    const verifiedIcon = data.is_verified
      ? `<div class="verified-badge"><i class="fas fa-check"></i></div>`
      : "";
    const avatarImg =
      data.profile_picture && !data.profile_picture.includes("logo.png")
        ? data.profile_picture
        : "logo.png";

    const avatarContainer = document.getElementById("avatar-container");
    if (avatarContainer) {
      avatarContainer.innerHTML = `<img src="${avatarImg}" class="profile-avatar">${verifiedIcon}`;
    }

    document.getElementById("user-name").innerHTML = data.name;
    document.title = `${data.name} | عقارك`;

    const countBadge = document.getElementById("prop-count-badge");
    if (countBadge) countBadge.innerText = `${data.properties.length} عقار`;

    let joinYear = "2025";
    if (data.created_at) {
      const joinDate = new Date(data.created_at);
      if (!isNaN(joinDate.getFullYear())) {
        joinYear = joinDate.getFullYear();
      }
    }
    const joinText = document.getElementById("join-date-text");
    if (joinText) joinText.innerText = `عضو منذ ${joinYear}`;

    if (data.phone) {
      fetchReviews(data.phone);
    } else {
      const reviewList = document.getElementById("reviews-list");
      if (reviewList)
        reviewList.innerHTML =
          '<p style="text-align:center; color:#777;">لا يمكن تحميل التقييمات.</p>';
    }

    renderProperties(data.properties);

    if (requestedTab === "reviews") {
      window.switchTab("reviews");
    }
  } catch (error) {
    console.error(error);
    const nameEl = document.getElementById("user-name");
    if (nameEl) nameEl.innerText = "مستخدم غير موجود";
    const loadingProps = document.getElementById("loading-props");
    if (loadingProps) loadingProps.style.display = "none";
  }
});

function renderProperties(properties) {
  const grid = document.getElementById("properties-grid");
  const loading = document.getElementById("loading-props");
  if (loading) loading.style.display = "none";
  if (!grid) return;

  if (properties.length === 0) {
    grid.innerHTML =
      '<p style="grid-column:1/-1; text-align:center; color:#777; padding:20px;">لا توجد عقارات حالياً.</p>';
    return;
  }

  grid.innerHTML = properties
    .map(
      (prop) => `
        <div class="property-card" onclick="window.location.href='property?id=${
          prop.id
        }'">
            <img src="${
              prop.imageUrl || "logo.png"
            }" class="card-img" onerror="this.src='logo.png'">
            <div class="card-info">
                <h3 style="color:white; margin:0 0 5px 0; font-size:1.1rem;">${
                  prop.title
                }</h3>
                <div style="color:#FFD700; font-weight:bold; font-size:1.2rem;">${Number(
                  prop.price
                ).toLocaleString()} ج.م</div>
                <div style="color:#aaa; font-size:0.9rem; margin-top:10px; display:flex; gap:10px;">
                    <span><i class="fas fa-bed"></i> ${prop.rooms || 0}</span>
                    <span><i class="fas fa-bath"></i> ${
                      prop.bathrooms || 0
                    }</span>
                    <span><i class="fas fa-ruler-combined"></i> ${
                      prop.area
                    } م²</span>
                </div>
            </div>
        </div>
    `
    )
    .join("");
}

async function fetchReviews(phone) {
  const listContainer = document.getElementById("reviews-list");
  const loading = document.getElementById("loading-reviews");
  const aiContainer = document.getElementById("ai-summary-container");

  window.currentProfilePhone = phone;

  try {
    const res = await fetch(`/api/reviews/${phone}`);
    if (!res.ok) throw new Error("Failed to fetch reviews");
    const reviews = await res.json();
    if (loading) loading.style.display = "none";

    let isAdmin = false;
    try {
      const authRes = await fetch("/api/auth/me");
      const authData = await authRes.json();
      if (authData.isAuthenticated && authData.role === "admin") {
        isAdmin = true;
      }
    } catch (e) {
      console.log("Not logged in");
    }

    if (reviews.length > 0) {
      const avg = reviews.reduce((a, b) => a + b.rating, 0) / reviews.length;
      const badge = document.getElementById("rating-badge");
      if (badge) badge.innerText = `${avg.toFixed(1)} (${reviews.length})`;
    }

    if (reviews.length === 0) {
      if (listContainer)
        listContainer.innerHTML =
          '<p style="text-align:center; color:#777; padding:20px;">لا توجد تقييمات مكتوبة بعد.</p>';
      return;
    }

    if (listContainer) {
      listContainer.innerHTML = reviews
        .map((r) => {
          const deleteBtn = isAdmin
            ? `<button onclick="window.deleteFullReview('${r.reviewer_phone}')" style="background:transparent; border:none; color:#ff4444; cursor:pointer; margin-right:auto; font-size:0.9rem;" title="حذف التقييم بالكامل"><i class="fas fa-trash"></i></button>`
            : "";

          return `
                <div class="review-item" style="position: relative;">
                    <div style="flex-shrink:0;">
                    <div style="width:40px; height:40px; background:#333; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#FFD700; font-weight:bold;">
                            ${
                              r.rating
                            }<i class="fas fa-star" style="font-size:0.7rem; margin-right:2px;"></i>
                    </div>
                    </div>
                    <div style="flex:1;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <h4 style="margin:0 0 5px 0; color:white;">${
                              r.reviewer_name || "مستخدم"
                            }</h4>
                            ${deleteBtn}
                        </div>
                        <p style="margin:0; color:#ccc; line-height:1.5;">${
                          r.comment || ""
                        }</p>
                        <span style="font-size:0.75rem; color:#666;">${new Date(
                          r.created_at
                        ).toLocaleDateString("ar-EG")}</span>
                    </div>
                </div>
            `;
        })
        .join("");
    }

    if (reviews.length >= 1 && aiContainer) {
      aiContainer.style.display = "block";
      const aiText = document.getElementById("ai-summary-text");
      if (aiText)
        aiText.innerHTML =
          '<i class="fas fa-pulse fa-spinner"></i> جاري تحليل آراء الناس...';
      try {
        const aiRes = await fetch("/api/reviews/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviews }),
        });
        const aiData = await aiRes.json();
        if (aiText) aiText.innerHTML = aiData.summary;
      } catch (e) {
        aiContainer.style.display = "none";
      }
    }
  } catch (e) {
    if (loading) loading.style.display = "none";
    console.error("Review Error:", e);
  }
}
