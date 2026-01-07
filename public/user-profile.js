function getShareData() {
  const name = document.getElementById("user-name")?.innerText || "مستخدم";
  const propCount =
    document.getElementById("prop-count-badge")?.innerText || "0 عقار";
  const rating = document.getElementById("rating-badge")?.innerText || "0.0";
  const joinDate = document.getElementById("join-date-text")?.innerText || "";

  const urlParams = new URLSearchParams(window.location.search);
  const username = urlParams.get("u");
  const cleanUrl = `${window.location.origin}/profile?u=${username}`;

  const shareText = `تصفح الملف الشخصي المميز لـ "${name}" على منصة عقارك. 🏠✨
فرص عقارية حقيقية وتعامل موثوق يستحق وقتك! 👌

📊 إحصائيات الحساب:
• ${propCount} معروضة للبيع/الإيجار
• تقييم عام: ${rating} ⭐
• ${joinDate}
`;

  return { title: `ملف ${name} على عقارك`, text: shareText, url: cleanUrl };
}

window.openShareModal = () => {
  const data = getShareData();

  if (navigator.share) {
    navigator
      .share({
        title: data.title,
        text: data.text,
        url: data.url,
      })
      .catch((error) => console.log("Error sharing", error));
  } else {
    const modal = document.getElementById("share-modal-overlay");
    if (modal) modal.style.display = "flex";
  }
};

window.closeShareModal = (e) => {
  if (e.target.id === "share-modal-overlay") {
    document.getElementById("share-modal-overlay").style.display = "none";
  }
};

window.shareTo = (platform) => {
  const data = getShareData();
  let shareUrl = "";

  if (platform === "whatsapp") {
    const fullMessage = `${data.text}\n🔗 رابط الملف: ${data.url}`;
    shareUrl = `https://wa.me/?text=${encodeURIComponent(fullMessage)}`;
  } else if (platform === "facebook") {
    shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      data.url
    )}`;
  } else if (platform === "copy") {
    navigator.clipboard.writeText(data.url).then(() => {
      alert("تم نسخ رابط الملف الشخصي بنجاح! ✅");
      document.getElementById("share-modal-overlay").style.display = "none";
    });
    return;
  }

  if (shareUrl) {
    window.open(shareUrl, "_blank");
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

  if (data.ai_summary) {
    updateAiUI(data.ai_summary);
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
    .map((prop) => {
      const typeBadge =
        prop.type === "buy" || prop.type === "بيع"
          ? '<span style="position:absolute; top:10px; right:10px; background:#00ff88; color:black; padding:4px 10px; border-radius:6px; font-weight:bold; font-size:0.8rem;">للبيع</span>'
          : '<span style="position:absolute; top:10px; right:10px; background:#00d4ff; color:black; padding:4px 10px; border-radius:6px; font-weight:bold; font-size:0.8rem;">للإيجار</span>';

      return `
        <div class="property-card" onclick="window.location.href='property?id=${
          prop.id
        }'" style="position:relative;">
            ${typeBadge}
            <img src="${
              prop.imageUrl || "logo.png"
            }" class="card-img" onerror="this.src='logo.png'">
            <div class="card-info">
                <h3 style="color:white; margin:0 0 5px 0; font-size:1.1rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${
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
window.openReplyModal = (commentId) => {
  const reply = prompt("اكتب ردك على هذا التعليق:");
  if (reply) {
    submitReply(commentId, reply);
  }
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
      alert("تم الرد بنجاح ✅");
      location.reload();
    } else {
      alert("خطأ: " + data.message);
    }
  } catch (e) {
    alert("خطأ في الاتصال");
  }
}

async function fetchReviews(phone) {
  const listContainer = document.getElementById("reviews-list");
  const loading = document.getElementById("loading-reviews");
  const aiContainer = document.getElementById("ai-summary-container");

  window.currentProfilePhone = phone;
  let currentUserPhone = null;

  try {
    const authRes = await fetch("/api/auth/me");
    const authData = await authRes.json();
    if (authData.isAuthenticated) currentUserPhone = authData.phone;
  } catch (e) {}

  try {
    const res = await fetch(`/api/reviews/${phone}`);
    if (!res.ok) throw new Error("Failed");
    const reviews = await res.json();

    if (loading) loading.style.display = "none";

    const aiTextElement = document.getElementById("ai-summary-text");
    if (reviews.length >= 5 && aiContainer) {
    }

    if (reviews.length === 0) {
      if (listContainer)
        listContainer.innerHTML =
          '<div style="text-align:center; padding:40px; color:#666;"><i class="far fa-comments" style="font-size:2rem; margin-bottom:10px;"></i><p>لا توجد تقييمات مكتوبة بعد. كن أول من يقيم!</p></div>';
      return;
    }

    const avg =
      reviews.reduce((a, b) => a + (b.rating || 0), 0) / (reviews.length || 1);
    const badge = document.getElementById("rating-badge");
    if (badge) badge.innerText = `${avg.toFixed(1)} (${reviews.length})`;

    if (listContainer) {
      listContainer.innerHTML = reviews
        .map((r) => {
          const reviewerImg = r.reviewer_pic || "logo.png";
          const reviewerLink = r.reviewer_username
            ? `profile?u=${r.reviewer_username}`
            : "#";

          const deleteBtn =
            currentUserPhone === "01008102237" || window.isAdmin
              ? `<button onclick="deleteReview(${r.comment_id})" style="color:#ff4444; background:none; border:none; cursor:pointer; float:left;"><i class="fas fa-trash"></i></button>`
              : "";

          const replyBtn =
            currentUserPhone === phone && !r.owner_reply
              ? `<button onclick="openReplyModal(${r.comment_id})" class="reply-btn-action"><i class="fas fa-reply"></i> رد</button>`
              : "";

          const replyBox = r.owner_reply
            ? `<div class="owner-reply-box"><div class="owner-reply-text">${r.owner_reply}</div></div>`
            : "";

          return `
            <div class="modern-review-card">
                <div class="review-header">
                    <a href="${reviewerLink}" class="reviewer-info">
                        <img src="${reviewerImg}" class="reviewer-img" onerror="this.src='logo.png'">
                        <div class="reviewer-details">
                            <h4>${r.reviewer_name || "مستخدم عقارك"}</h4>
                            <span>${new Date(r.created_at).toLocaleDateString(
                              "ar-EG"
                            )}</span>
                        </div>
                    </a>
                    <div class="review-stars">
                        ${r.rating} <i class="fas fa-star"></i>
                    </div>
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
    }
  } catch (e) {
    if (loading) loading.style.display = "none";
    console.error("Review Error:", e);
  }
}

window.deleteReview = async (commentId) => {
  if (!confirm("حذف هذا التعليق فقط؟")) return;
  try {
    const res = await fetch(`/api/admin/reviews/${commentId}`, {
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

function updateAiUI(summary) {
  const container = document.getElementById("ai-summary-container");
  const text = document.getElementById("ai-summary-text");
  if (container && text && summary) {
    container.style.display = "block";
    container.className = "ai-summary-modern";
    container.innerHTML = `
            <div class="ai-brain-icon"><i class="fas fa-brain"></i></div>
            <div>
                <h4 style="color:var(--neon-secondary); margin:0 0 5px 0;">تحليل العقار AI</h4>
                <p style="color:#eee; margin:0; line-height:1.5;">${summary}</p>
            </div>
        `;
  }
}
