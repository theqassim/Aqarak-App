let currentReviews = [];
let currentPage = 0;
const REVIEWS_PER_PAGE = 5;
let profilePhone = "";
let myPhone = "";
let userRole = "";

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
    try {
      const authRes = await fetch("/api/auth/me");
      if (authRes.ok) {
        const authData = await authRes.json();
        myPhone = authData.phone;
        userRole = authData.role;
      }
    } catch (e) {
      console.log("زائر غير مسجل");
    }

    const res = await fetch(`/api/public/profile/${username}`);
    if (!res.ok) throw new Error("User not found");
    const data = await res.json();

    profilePhone = data.phone;
    window.currentProfilePhone = data.phone;

    if (data.ai_summary) updateAiUI(data.ai_summary);

    const verifiedIcon = data.is_verified
      ? `<div class="verified-badge"><i class="fas fa-check"></i></div>`
      : "";

    const avatarImg =
      data.profile_picture && !data.profile_picture.includes("logo.png")
        ? data.profile_picture
        : "logo.png";
    const avatarContainer = document.getElementById("avatar-container");
    if (avatarContainer)
      avatarContainer.innerHTML = `<img src="${avatarImg}" class="profile-avatar">${verifiedIcon}`;

    document.getElementById("user-name").innerText = data.name;
    document.title = `${data.name} | عقارك`;

    const countBadge = document.getElementById("prop-count-badge");
    if (countBadge) countBadge.innerText = `${data.properties.length} عقار`;

    let joinYear = "2025";
    if (data.created_at) joinYear = new Date(data.created_at).getFullYear();
    const joinText = document.getElementById("join-date-text");
    if (joinText) joinText.innerText = `عضو منذ ${joinYear}`;

    if (data.phone) fetchReviews(data.phone);
    else
      document.getElementById("reviews-list").innerHTML =
        '<p style="text-align:center;">لا يمكن تحميل التقييمات.</p>';

    renderProperties(data.properties);

    if (requestedTab === "reviews") window.switchTab("reviews");
  } catch (error) {
    console.error(error);
    const nameEl = document.getElementById("user-name");
    if (nameEl) nameEl.innerText = "مستخدم غير موجود";
  }
});

function renderProperties(properties) {
  const grid = document.getElementById("properties-grid");
  const loading = document.getElementById("loading-props");
  if (loading) loading.style.display = "none";
  if (!grid) return;

  if (!properties || properties.length === 0) {
    grid.innerHTML =
      '<p style="grid-column:1/-1; text-align:center; color:#777; padding:20px;">لا توجد عقارات حالياً.</p>';
    return;
  }

  grid.innerHTML = properties
    .map((prop) => {
      const typeBadge =
        prop.type === "buy" || prop.type === "بيع"
          ? '<span style="position:absolute; top:10px; right:10px; background:#00ff88; color:black; padding:4px 10px; border-radius:6px; font-weight:bold; font-size:0.8rem;">للبيع</span>'
          : '<span style="position:absolute; top:10px; right:10px; background:#00d4ff; color:black; padding:4px 10px; border-radius:6px; font-weight:bold; font-size:0.8rem;">للإيجار</span>';

      return `
        <div class="property-card" onclick="window.location.href='property-details.html?id=${
          prop.id
        }'" style="position:relative; cursor:pointer;">
            ${typeBadge}
            <img src="${
              prop.imageUrl || "logo.png"
            }" class="card-img" onerror="this.src='logo.png'">
            <div class="card-info">
                <h3 style="color:white; margin:0 0 5px 0; font-size:1.1rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${
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
    `;
    })
    .join("");
}

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

async function fetchReviews(phone) {
  const loading = document.getElementById("loading-reviews");
  try {
    const res = await fetch(`/api/reviews/${phone}`);
    if (!res.ok) throw new Error("Failed");
    currentReviews = await res.json();

    if (loading) loading.style.display = "none";

    const avg =
      currentReviews.reduce((a, b) => a + (b.rating || 0), 0) /
      (currentReviews.length || 1);
    const badge = document.getElementById("rating-badge");
    if (badge) badge.innerText = `${avg.toFixed(1)} (${currentReviews.length})`;

    renderReviewsPage();
  } catch (e) {
    if (loading) loading.style.display = "none";
    console.error("Review Error:", e);
  }
}

function renderReviewsPage() {
  const listContainer = document.getElementById("reviews-list");
  if (!listContainer) return;

  if (currentReviews.length === 0) {
    listContainer.innerHTML =
      '<div style="text-align:center; padding:40px; color:#666;"><i class="far fa-comments" style="font-size:2rem; margin-bottom:10px;"></i><p>لا توجد تقييمات مكتوبة بعد. كن أول من يقيم!</p></div>';
    return;
  }

  const start = currentPage * REVIEWS_PER_PAGE;
  const end = start + REVIEWS_PER_PAGE;
  const pageReviews = currentReviews.slice(start, end);

  let html = `<div class="reviews-page">`;

  html += pageReviews
    .map((r) => {
      const isMine = myPhone === r.reviewer_phone;
      const isAdminUser = userRole === "admin";

      let controls = "";
      if (isMine || isAdminUser) {
        controls = `
            <div style="display:flex; gap:15px; margin-top:10px; border-top:1px solid rgba(255,255,255,0.1); padding-top:8px;">
                <button onclick="deleteReview('${
                  r.comment_id
                }')" style="color:#ff4444; background:none; border:none; cursor:pointer; font-size:0.85rem;">
                    <i class="fas fa-trash"></i> حذف
                </button>
                ${
                  isMine
                    ? `<button onclick="editReview('${r.comment_id}', '${r.comment}')" style="color:#00d4ff; background:none; border:none; cursor:pointer; font-size:0.85rem;">
                    <i class="fas fa-edit"></i> تعديل
                </button>`
                    : ""
                }
            </div>
        `;
      }

      let badge = "";
      let nameStyle = "";
      if (r.is_admin || r.role === "admin") {
        badge = `<span style="background: linear-gradient(45deg, #ffd700, #ffaa00); color:black; padding:2px 8px; border-radius:10px; font-size:0.7rem; font-weight:bold; margin-right:5px;">إدارة الموقع</span>`;
        nameStyle = "color: #ffd700;";
        r.reviewer_name = "موقع عقارك";
      }

      let verifiedIcon = r.is_verified
        ? `<i class="fas fa-check-circle" style="color:#00ff88; margin-right:4px;"></i>`
        : "";

      const canReply = myPhone === profilePhone || isAdminUser;
      const replyBtn =
        canReply && !r.owner_reply
          ? `<button onclick="openReplyModal(${r.comment_id})" class="reply-btn-action" style="margin-top:10px;"><i class="fas fa-reply"></i> رد</button>`
          : "";

      const replyBox = r.owner_reply
        ? `<div class="owner-reply-box" style="margin-top:10px; padding:10px; background:rgba(0,255,136,0.05); border-right:2px solid #00ff88;">
            <strong style="color:#00ff88; font-size:0.8rem;">رد المالك:</strong>
            <div style="color:#ccc; font-size:0.9rem;">${r.owner_reply}</div>
           </div>`
        : "";

      return `
        <div class="modern-review-card" style="background:#151515; padding:15px; border-radius:10px; margin-bottom:15px; border:1px solid #333;">
            <div class="review-header" style="display:flex; justify-content:space-between;">
                <div class="reviewer-info" onclick="window.location.href='profile?u=${
                  r.reviewer_username || "#"
                }'" style="cursor:pointer; display:flex; gap:10px;">
                    <img src="${
                      r.reviewer_pic || "logo.png"
                    }" class="reviewer-img" style="width:40px; height:40px; border-radius:50%; object-fit:cover;">
                    <div class="reviewer-details">
                        <h4 style="margin:0; font-size:0.95rem; color:white; ${nameStyle}">${
        r.reviewer_name || "مستخدم"
      } ${verifiedIcon} ${badge}</h4>
                        <span style="font-size:0.75rem; color:#888;">${new Date(
                          r.created_at
                        ).toLocaleDateString("ar-EG")}</span>
                    </div>
                </div>
                <div class="review-stars" style="color:#FFD700;">${
                  r.rating
                } <i class="fas fa-star"></i></div>
            </div>
            <div class="review-body" style="margin-top:10px; color:#eee; line-height:1.6;">${
              r.comment
            }</div>
            ${replyBox}
            ${controls}
            ${replyBtn}
        </div>
      `;
    })
    .join("");

  html += `</div>`;

  if (currentReviews.length > REVIEWS_PER_PAGE) {
    html += `<div class="pagination-controls" style="display:flex; justify-content:center; gap:10px; margin-top:20px;">`;
    if (currentPage > 0)
      html += `<button onclick="changePage(-1)" style="padding:5px 15px; background:#333; color:white; border:none; border-radius:5px;">السابق</button>`;
    if (end < currentReviews.length)
      html += `<button onclick="changePage(1)" style="padding:5px 15px; background:#333; color:white; border:none; border-radius:5px;">التالي</button>`;
    html += `</div>`;
  }

  listContainer.innerHTML = html;
}

window.changePage = (dir) => {
  currentPage += dir;
  renderReviewsPage();
  document
    .getElementById("reviews-section")
    .scrollIntoView({ behavior: "smooth" });
};

window.editReview = async (id, oldText) => {
  const newText = prompt("تعديل التقييم:", oldText);
  if (newText && newText !== oldText) {
    try {
      const res = await fetch(`/api/reviews/edit/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: newText }),
      });
      if (res.ok) {
        alert("تم التعديل بنجاح");
        location.reload();
      } else {
        alert("فشل التعديل");
      }
    } catch (e) {
      alert("حدث خطأ");
    }
  }
};

window.deleteReview = async (commentId) => {
  if (!confirm("هل أنت متأكد من حذف هذا التعليق؟")) return;
  try {
    const res = await fetch(`/api/reviews/delete/${commentId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (res.ok) {
      alert("تم الحذف");
      location.reload();
    } else {
      alert(data.message || "فشل الحذف");
    }
  } catch (e) {
    alert("Error");
  }
};

window.deleteFullReview = async (reviewerPhone) => {
  if (!confirm("هل أنت متأكد؟ سيتم حذف النجوم والتعليق لهذا المستخدم نهائياً."))
    return;
  if (!window.currentProfilePhone) return alert("خطأ في البيانات");

  try {
    const res = await fetch(
      `/api/admin/reviews/full/${reviewerPhone}/${window.currentProfilePhone}`,
      { method: "DELETE" }
    );
    const data = await res.json();
    if (res.ok) {
      alert("✅ " + data.message);
      location.reload();
    } else {
      alert("❌ خطأ: " + data.message);
    }
  } catch (e) {
    alert("خطأ في الاتصال");
  }
};

window.openReplyModal = (commentId) => {
  const reply = prompt("اكتب ردك على هذا التعليق:");
  if (reply) submitReply(commentId, reply);
};

async function submitReply(commentId, replyText) {
  try {
    const res = await fetch("/api/reviews/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId, replyText }),
    });
    if (res.ok) {
      alert("تم الرد بنجاح ✅");
      location.reload();
    } else {
      alert("فشل الرد");
    }
  } catch (e) {
    alert("خطأ في الاتصال");
  }
}

function getShareData() {
  const name = document.getElementById("user-name")?.innerText || "مستخدم";
  const propCount =
    document.getElementById("prop-count-badge")?.innerText || "0 عقار";
  const rating = document.getElementById("rating-badge")?.innerText || "0.0";
  const urlParams = new URLSearchParams(window.location.search);
  const cleanUrl = `${window.location.origin}/profile?u=${urlParams.get("u")}`;

  return {
    title: `ملف ${name} على عقارك`,
    text: `تصفح الملف الشخصي المميز لـ "${name}" على منصة عقارك.\nإحصائيات:\n• ${propCount}\n• تقييم: ${rating} ⭐`,
    url: cleanUrl,
  };
}

window.openShareModal = () => {
  const data = getShareData();
  if (navigator.share) {
    navigator.share(data).catch((err) => console.log("Error sharing", err));
  } else {
    const modal = document.getElementById("share-modal-overlay");
    if (modal) modal.style.display = "flex";
  }
};

window.closeShareModal = (e) => {
  if (e.target.id === "share-modal-overlay")
    document.getElementById("share-modal-overlay").style.display = "none";
};

window.shareTo = (platform) => {
  const data = getShareData();
  let shareUrl = "";
  if (platform === "whatsapp")
    shareUrl = `https://wa.me/?text=${encodeURIComponent(
      data.text + "\n" + data.url
    )}`;
  else if (platform === "facebook")
    shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      data.url
    )}`;
  else if (platform === "copy") {
    navigator.clipboard.writeText(data.url).then(() => {
      alert("تم نسخ الرابط!");
      document.getElementById("share-modal-overlay").style.display = "none";
    });
    return;
  }
  if (shareUrl) window.open(shareUrl, "_blank");
};

function updateAiUI(summary) {
  const container = document.getElementById("ai-summary-container");
  if (container && summary) {
    container.style.display = "block";
    container.innerHTML = `
        <div class="ai-brain-icon"><i class="fas fa-brain"></i></div>
        <div>
            <h4 style="color:var(--neon-secondary); margin:0 0 5px 0;">تحليل العقار AI</h4>
            <p style="color:#eee; margin:0; line-height:1.5;">${summary}</p>
        </div>
    `;
  }
}
