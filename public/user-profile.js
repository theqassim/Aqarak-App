let currentReviews = [];
let currentPage = 0;
const REVIEWS_PER_PAGE = 7;
let currentRatingValue = 0;
let profilePhone = "";

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

    profilePhone = data.phone;
    window.currentProfilePhone = data.phone;

    document.getElementById("user-name").innerText = data.name;
    document.title = `${data.name} | عقارك`;

    const verifiedBadge = data.is_verified
      ? `<div class="verified-badge"><i class="fas fa-check"></i></div>`
      : "";
    const avatarImg =
      data.profile_picture && !data.profile_picture.includes("logo.png")
        ? data.profile_picture
        : "logo.png";
    document.getElementById(
      "avatar-container"
    ).innerHTML = `<img src="${avatarImg}" class="profile-avatar">${verifiedBadge}`;

    document.getElementById(
      "prop-count-badge"
    ).innerText = `${data.properties.length} عقار`;
    const joinYear = data.created_at
      ? new Date(data.created_at).getFullYear()
      : "2025";
    document.getElementById("join-date-text").innerText = `عضو منذ ${joinYear}`;

    if (data.ai_summary) updateAiUI(data.ai_summary, data.name);

    if (data.phone) fetchReviews(data.phone);

    renderProperties(data.properties);

    if (requestedTab === "reviews") switchTab("reviews");

    window.getShareData = () => {
      return {
        title: `ملف ${data.name} على عقارك`,
        text: `تصفح الملف الشخصي المميز لـ "${data.name}" على منصة عقارك. 🏠✨\nفرص عقارية حقيقية!`,
        url: window.location.href,
      };
    };
  } catch (error) {
    console.error(error);
    document.getElementById("user-name").innerText = "مستخدم غير موجود";
  }
});

async function fetchReviews(phone) {
  const listContainer = document.getElementById("reviews-list");
  const loading = document.getElementById("loading-reviews");

  let myPhone = null;
  try {
    const authRes = await fetch("/api/auth/me");
    const authData = await authRes.json();
    if (authData.isAuthenticated) myPhone = authData.phone;
  } catch (e) {}

  if (myPhone && myPhone !== phone) {
    document.getElementById("rate-user-btn").style.display = "block";
  }

  try {
    const res = await fetch(`/api/reviews/${phone}`);
    const reviews = await res.json();
    currentReviews = reviews;

    if (loading) loading.style.display = "none";

    const avg =
      reviews.length > 0
        ? (
            reviews.reduce((a, b) => a + (parseFloat(b.rating) || 0), 0) /
            reviews.length
          ).toFixed(1)
        : "0.0";
    document.getElementById(
      "rating-badge"
    ).innerText = `${avg} (${reviews.length})`;

    renderReviewsPage(myPhone);
  } catch (e) {
    if (loading) loading.style.display = "none";
    listContainer.innerHTML =
      '<p style="text-align:center">فشل تحميل التقييمات</p>';
  }
}

function renderReviewsPage(myPhone) {
  const listContainer = document.getElementById("reviews-list");

  if (currentReviews.length === 0) {
    listContainer.innerHTML =
      '<div style="text-align:center; padding:40px; color:#666;"><i class="far fa-comments" style="font-size:2rem; margin-bottom:10px;"></i><p>لا توجد تقييمات بعد.</p></div>';
    return;
  }

  const start = currentPage * REVIEWS_PER_PAGE;
  const end = start + REVIEWS_PER_PAGE;
  const pageReviews = currentReviews.slice(start, end);

  let html = `<div class="reviews-page">`;

  html += pageReviews
    .map((r) => {
      const isMine = myPhone === r.reviewer_phone;
      const deleteBtn = isMine
        ? `<button onclick="deleteMyReview('${r.reviewer_phone}')" style="float:left; color:#ff4444; background:none; border:none; cursor:pointer;"><i class="fas fa-trash"></i> حذف تقييمي</button>`
        : "";

      const replyBtn =
        myPhone === profilePhone && !r.owner_reply
          ? `<button onclick="openReplyModal(${r.comment_id})" class="reply-btn-action"><i class="fas fa-reply"></i> رد</button>`
          : "";

      const replyBox = r.owner_reply
        ? `<div class="owner-reply-box"><div class="owner-reply-text">${r.owner_reply}</div></div>`
        : "";

      return `
            <div class="modern-review-card">
                <div class="review-header">
                    <div class="reviewer-info" onclick="window.location.href='profile?u=${
                      r.reviewer_username
                    }'">
                        <img src="${
                          r.reviewer_pic || "logo.png"
                        }" class="reviewer-img">
                        <div class="reviewer-details">
                            <h4>${r.reviewer_name}</h4>
                            <span>${new Date(r.created_at).toLocaleDateString(
                              "ar-EG"
                            )}</span>
                        </div>
                    </div>
                    <div class="review-stars">${
                      r.rating
                    } <i class="fas fa-star"></i></div>
                </div>
                <div class="review-body">
                    ${r.comment}
                    ${deleteBtn}
                </div>
                ${replyBox}
                ${replyBtn}
            </div>
        `;
    })
    .join("");

  html += `</div>`;

  if (currentReviews.length > REVIEWS_PER_PAGE) {
    html += `<div class="pagination-controls">`;
    if (currentPage > 0) {
      html += `<button class="page-btn" onclick="changePage(-1)"><i class="fas fa-chevron-right"></i></button>`;
    }
    if (end < currentReviews.length) {
      html += `<button class="page-btn" onclick="changePage(1)"><i class="fas fa-chevron-left"></i></button>`;
    }
    html += `</div>`;
  }

  listContainer.innerHTML = html;
}

function changePage(dir) {
  currentPage += dir;
  if (currentPage < 0) currentPage = 0;
  fetchReviews(profilePhone);
}

function updateAiUI(summary, name) {
  const container = document.getElementById("ai-summary-container");
  const text = document.getElementById("ai-summary-text");
  if (container) {
    container.style.display = "block";
    container.innerHTML = `
            <div class="ai-mini-capsule">
                <i class="fas fa-robot ai-icon-pulse"></i>
                <div>
                    <strong style="color:var(--neon-secondary); display:block; margin-bottom:5px;">خلاصة السمعة:</strong>
                    <span style="color:#eee; font-size:0.9rem; line-height:1.4;">${summary}</span>
                </div>
            </div>
        `;
  }
}

window.openRateModal = () => {
  document.getElementById("rate-modal").style.display = "flex";
};

window.closeRateModal = (e) => {
  if (e.target.id === "rate-modal")
    document.getElementById("rate-modal").style.display = "none";
};

window.setRating = (val) => {
  currentRatingValue = val;
  document.querySelectorAll("#star-container i").forEach((icon) => {
    if (parseInt(icon.dataset.val) <= val) icon.classList.add("active");
    else icon.classList.remove("active");
  });
};

window.submitRating = async () => {
  if (currentRatingValue === 0) {
    alert("يرجى اختيار عدد النجوم");
    return;
  }
  const comment = document.getElementById("rate-comment").value;

  try {
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewedPhone: profilePhone,
        rating: currentRatingValue,
        comment: comment,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      location.reload();
    } else {
      alert(data.message);
    }
  } catch (e) {
    alert("خطأ في الاتصال");
  }
};

window.deleteMyReview = async (phone) => {
  if (!confirm("متأكد عايز تمسح تقييمك؟")) return;
  try {
    const res = await fetch(`/api/reviews/mine/${profilePhone}`, {
      method: "DELETE",
    });
    if (res.ok) {
      alert("تم الحذف بنجاح");
      location.reload();
    }
  } catch (e) {
    alert("خطأ");
  }
};

window.switchTab = (tabName) => {
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("active"));
  document.getElementById("properties-section").classList.add("hidden-section");
  document.getElementById("reviews-section").classList.add("hidden-section");

  if (tabName === "properties") {
    document
      .getElementById("properties-section")
      .classList.remove("hidden-section");
    document.querySelector(".tab-btn:first-child").classList.add("active");
  } else {
    document
      .getElementById("reviews-section")
      .classList.remove("hidden-section");
    document.getElementById("reviews-tab-btn").classList.add("active");
  }
};

function renderProperties(properties) {
  const grid = document.getElementById("properties-grid");
  if (!grid) return;
  document.getElementById("loading-props").style.display = "none";

  if (properties.length === 0) {
    grid.innerHTML =
      '<p style="grid-column:1/-1; text-align:center; color:#777;">لا توجد عقارات.</p>';
    return;
  }

  grid.innerHTML = properties
    .map(
      (prop) => `
        <div class="property-card" onclick="window.location.href='property?id=${
          prop.id
        }'">
            <span style="position:absolute; top:10px; right:10px; background:${
              prop.type.includes("بيع") ? "#00ff88" : "#00d4ff"
            }; color:black; padding:4px 10px; border-radius:6px; font-weight:bold; font-size:0.8rem; z-index:2;">
                ${prop.type.includes("بيع") ? "بيع" : "إيجار"}
            </span>
            <img src="${
              prop.imageUrl
            }" class="card-img" onerror="this.src='logo.png'">
            <div class="card-info">
                <h3 style="color:white; margin:0 0 5px 0; font-size:1.1rem;">${
                  prop.title
                }</h3>
                <div style="color:#FFD700; font-weight:bold; font-size:1.2rem;">${Number(
                  prop.price
                ).toLocaleString()} ج.م</div>
            </div>
        </div>
    `
    )
    .join("");
}
window.openShareModal = () =>
  (document.getElementById("share-modal-overlay").style.display = "flex");
window.closeShareModal = (e) => {
  if (e.target.id === "share-modal-overlay")
    document.getElementById("share-modal-overlay").style.display = "none";
};
window.shareTo = (p) => {
  const url = window.location.href;
  if (p === "whatsapp")
    window.open(`https://wa.me/?text=${encodeURIComponent(url)}`);
  if (p === "facebook")
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    );
  if (p === "copy") {
    navigator.clipboard.writeText(url);
    alert("تم النسخ!");
    document.getElementById("share-modal-overlay").style.display = "none";
  }
};
