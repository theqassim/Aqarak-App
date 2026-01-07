let currentReviews = [];
let currentPage = 0;
const REVIEWS_PER_PAGE = 5;
let profilePhone = "";
let myPhone = "";
let userRole = "";
let profileData = {};

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
    profileData = await res.json();

    profilePhone = profileData.phone;
    window.currentProfilePhone = profileData.phone;

    const aiContainer = document.getElementById("ai-summary-container");
    if (aiContainer) aiContainer.style.display = "none";

    const verifiedIcon = profileData.is_verified
      ? `<div class="verified-badge"><i class="fas fa-check"></i></div>`
      : "";

    const avatarImg =
      profileData.profile_picture &&
      !profileData.profile_picture.includes("logo.png")
        ? profileData.profile_picture
        : "logo.png";

    const avatarContainer = document.getElementById("avatar-container");
    if (avatarContainer)
      avatarContainer.innerHTML = `<img src="${avatarImg}" class="profile-avatar">${verifiedIcon}`;

    document.getElementById("user-name").innerText = profileData.name;
    document.title = `${profileData.name} | عقارك`;

    const countBadge = document.getElementById("prop-count-badge");
    if (countBadge)
      countBadge.innerText = `${
        profileData.properties ? profileData.properties.length : 0
      } عقار`;

    let joinYear = "2025";
    if (profileData.created_at)
      joinYear = new Date(profileData.created_at).getFullYear();
    const joinText = document.getElementById("join-date-text");
    if (joinText) joinText.innerText = `عضو منذ ${joinYear}`;

    if (profileData.phone) fetchReviews(profileData.phone);

    renderProperties(profileData.properties || []);

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
        <div class="property-card" onclick="window.location.href='property?id=${
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
                  prop.price || 0
                ).toLocaleString()} ج.م</div>
                <div style="color:#aaa; font-size:0.9rem; margin-top:10px; display:flex; gap:10px;">
                    <span><i class="fas fa-bed"></i> ${prop.rooms || 0}</span>
                    <span><i class="fas fa-bath"></i> ${
                      prop.bathrooms || 0
                    }</span>
                    <span><i class="fas fa-ruler-combined"></i> ${
                      prop.area || 0
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

    try {
      const statsRes = await fetch(`/api/reviews/stats/${phone}`);
      const stats = await statsRes.json();

      const badge = document.getElementById("rating-badge");
      if (badge) {
        badge.innerText = `${Number(stats.average || 0).toFixed(1)} (${
          stats.count || 0
        })`;
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }

    const aiContainer = document.getElementById("ai-summary-container");
    if (aiContainer) {
      if (currentReviews.length >= 5 && profileData.ai_summary) {
        updateAiUI(profileData.ai_summary);
        aiContainer.style.display = "block";
      } else {
        aiContainer.style.display = "none";
      }
    }

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
      '<div style="text-align:center; padding:40px; color:#666;"><i class="far fa-comments" style="font-size:2rem; margin-bottom:10px;"></i><p>لا توجد تقييمات مكتوبة بعد.</p></div>';
    return;
  }

  const start = currentPage * REVIEWS_PER_PAGE;
  const end = start + REVIEWS_PER_PAGE;
  const pageReviews = currentReviews.slice(start, end);

  let html = `<div class="reviews-page">`;

  const ownerName = profileData.name || "المالك";
  const ownerPic =
    profileData.profile_picture &&
    !profileData.profile_picture.includes("logo.png")
      ? profileData.profile_picture
      : "logo.png";
  const ownerVerified = profileData.is_verified
    ? `<i class="fas fa-check-circle" style="color:#00ff88; margin-right:4px;" title="موثق"></i>`
    : "";

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

      let reviewerBadge = "";
      let reviewerNameStyle = "";
      if (r.is_admin || r.role === "admin") {
        reviewerBadge = `<span style="background: linear-gradient(45deg, #ffd700, #ffaa00); color:black; padding:2px 8px; border-radius:10px; font-size:0.7rem; font-weight:bold; margin-right:5px;">إدارة الموقع</span>`;
        reviewerNameStyle = "color: #ffd700;";
        r.reviewer_name = "موقع عقارك";
      }
      let reviewerVerified = r.is_verified
        ? `<i class="fas fa-check-circle" style="color:#00ff88; margin-right:4px;"></i>`
        : "";

      const canReply = myPhone === profilePhone || isAdminUser;
      const replyBtn =
        canReply && !r.owner_reply
          ? `<button onclick="openReplyModal(${r.comment_id})" class="reply-btn-action" style="margin-top:10px;"><i class="fas fa-reply"></i> رد على التقييم</button>`
          : "";

      let replyBox = "";
      if (r.owner_reply) {
        const isReplyAdmin =
          profilePhone === "01008102237" || userRole === "admin";

        const replyName = isReplyAdmin ? "موقع عقارك" : ownerName;
        const replyBadge = isReplyAdmin
          ? `<span style="background: linear-gradient(45deg, #ffd700, #ffaa00); color:black; padding:2px 8px; border-radius:10px; font-size:0.7rem; font-weight:bold; margin-right:5px;">إدارة الموقع</span>`
          : `<span style="background:rgba(0,255,136,0.1); color:#00ff88; font-size:0.65rem; padding:2px 6px; border-radius:4px; margin-right:5px; border:1px solid rgba(0,255,136,0.3);">صاحب الحساب</span>`;

        const replyImg = isReplyAdmin ? "logo.png" : ownerPic;
        const replyVerify = isReplyAdmin
          ? `<i class="fas fa-check-circle" style="color:#00ff88; margin-right:4px;"></i>`
          : ownerVerified;
        const borderColor = isReplyAdmin ? "#ffd700" : "#00ff88";

        replyBox = `
           <div class="owner-reply-container" style="margin-top:15px; margin-right:20px; padding:15px; background:rgba(20,20,20,0.6); border-right:3px solid ${borderColor}; border-radius:12px; border: 1px solid #333;">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:8px;">
                     <img src="${replyImg}" style="width:35px; height:35px; border-radius:50%; object-fit:cover; border:1px solid ${borderColor};">
                     <div>
                        <div style="font-size:0.95rem; font-weight:bold; color:white;">
                            ${replyName} ${replyVerify} ${replyBadge}
                        </div>
                        <div style="font-size:0.7rem; color:#888;">${
                          r.reply_date
                            ? new Date(r.reply_date).toLocaleDateString("ar-EG")
                            : "رد رسمي"
                        }</div>
                     </div>
                </div>
                <div style="color:#eee; font-size:0.95rem; line-height:1.6; padding: 0 5px;">
                    <i class="fas fa-quote-right" style="color: ${borderColor}; opacity:0.3; font-size:0.8rem; margin-left:5px;"></i>
                    ${r.owner_reply}
                </div>
           </div>
          `;
      }

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
                        <h4 style="margin:0; font-size:0.95rem; color:white; ${reviewerNameStyle}">${
        r.reviewer_name || "مستخدم"
      } ${reviewerVerified} ${reviewerBadge}</h4>
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
        alert("تم التعديل");
        location.reload();
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
    if (res.ok) {
      alert("تم الحذف");
      location.reload();
    }
  } catch (e) {
    alert("Error");
  }
};

window.openReplyModal = (commentId) => {
  const reply = prompt("اكتب ردك:");
  if (reply) submitReply(commentId, reply);
};

async function submitReply(commentId, replyText) {
  try {
    const res = await fetch("/api/reviews/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId, replyText }),
    });
    const data = await res.json();
    if (res.ok) {
      alert("تم الرد بنجاح");
      location.reload();
    } else {
      alert(data.message || "فشل الرد");
    }
  } catch (e) {
    alert("خطأ في الاتصال");
  }
}

function getShareData() {
  const name = document.getElementById("user-name")?.innerText || "مستخدم";
  const urlParams = new URLSearchParams(window.location.search);
  const cleanUrl = `${window.location.origin}/profile?u=${urlParams.get("u")}`;
  return {
    title: `ملف ${name}`,
    text: `تصفح ملف ${name} على عقارك`,
    url: cleanUrl,
  };
}
window.openShareModal = () =>
  (document.getElementById("share-modal-overlay").style.display = "flex");
window.closeShareModal = (e) => {
  if (e.target.id === "share-modal-overlay")
    document.getElementById("share-modal-overlay").style.display = "none";
};
window.shareTo = (platform) => {
  const data = getShareData();
  let shareUrl = "";
  if (platform === "whatsapp")
    shareUrl = `https://wa.me/?text=${encodeURIComponent(
      data.text + " " + data.url
    )}`;
  else if (platform === "copy") {
    navigator.clipboard.writeText(data.url);
    alert("تم النسخ");
    return;
  }
  if (shareUrl) window.open(shareUrl, "_blank");
};

function updateAiUI(summary) {
  const container = document.getElementById("ai-summary-container");
  if (container && summary) {
    container.innerHTML = `
        <div class="ai-brain-icon"><i class="fas fa-brain"></i></div>
        <div>
            <h4 style="color:var(--neon-secondary); margin:0 0 5px 0;">تحليل العقار AI</h4>
            <p style="color:#eee; margin:0; line-height:1.5;">${summary}</p>
        </div>
    `;
  }
}
