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
    // تغيير خلفية الهيرو لتكون صورة الغلاف
const hero = document.querySelector('.profile-hero');
    if (hero && profileData.cover_picture) {
        // دمج الصورة مع طبقة سوداء متدرجة عشان الكلام يبان بوضوح
        hero.style.backgroundImage = `linear-gradient(to bottom, rgba(0,0,0,0.2), #0f0f0f), url('${profileData.cover_picture}')`;
        hero.style.backgroundSize = 'cover';
        hero.style.backgroundPosition = 'center center';
        hero.style.boxShadow = 'none'; // شلنا الضل القديم عشان الجرادينت أحلى
    }

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
    let nameHTML = profileData.name;
if(profileData.job_title) nameHTML += `<div style="font-size:0.9rem; color:#00d4ff; font-weight:normal; margin-top:5px;">${profileData.job_title}</div>`;
document.getElementById("user-name").innerHTML = nameHTML;
    document.title = `${profileData.name} | عقارك`;

    if (profileData.bio && profileData.bio.trim() !== "") {
      const bioContainer = document.getElementById("user-bio-container");
      const bioText = document.getElementById("user-bio-text");
      if (bioContainer && bioText) {
        bioText.innerText = profileData.bio;
        bioContainer.style.display = "block";
      }
    }

    if (myPhone && profilePhone && myPhone === profilePhone) {
      const editBtn = document.getElementById("edit-profile-btn");
      if (editBtn) editBtn.style.display = "inline-flex";
    }
    if(profileData.social_links) {
    try {
        const links = JSON.parse(profileData.social_links);
        let socialHTML = '<div style="margin:10px 0; display:flex; gap:15px; justify-content:center;">';
        if(links.facebook) socialHTML += `<a href="${links.facebook}" target="_blank" style="color:#1877f2; font-size:1.5rem"><i class="fab fa-facebook"></i></a>`;
        if(links.instagram) socialHTML += `<a href="${links.instagram}" target="_blank" style="color:#e4405f; font-size:1.5rem"><i class="fab fa-instagram"></i></a>`;
        if(links.website) socialHTML += `<a href="${links.website}" target="_blank" style="color:white; font-size:1.5rem"><i class="fas fa-globe"></i></a>`;
        socialHTML += '</div>';

        // هنحطها قبل شريط الاحصائيات
        document.querySelector('.user-stats-bar').insertAdjacentHTML('beforebegin', socialHTML);
    } catch(e){}
}
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
      console.error(err);
    }

    const aiContainer = document.getElementById("ai-summary-container");
    if (aiContainer) {
      if (profileData.ai_summary && profileData.ai_summary.trim() !== "") {
        updateAiUI(profileData.ai_summary);
        aiContainer.style.display = "block";
      } else {
        aiContainer.style.display = "none";
      }
    }

    if (myPhone && profilePhone && myPhone !== profilePhone) {
      const rateBtn = document.getElementById("rate-user-btn");
      if (rateBtn) {
        rateBtn.style.display = "block";
        rateBtn.onclick = () =>
          window.openRateModal(profilePhone, profileData.name || "المستخدم");
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
        const isReplyAdmin = r.is_reply_admin === true;

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

const styles = document.createElement("style");
styles.innerHTML = `
    /* Common Overlay */
    .fancy-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.9); z-index: 10005;
        display: flex; justify-content: center; align-items: center;
        backdrop-filter: blur(8px); animation: fadeInOverlay 0.3s ease;
    }
    
    /* Common Card */
    .fancy-card {
        background: linear-gradient(145deg, #1a1a1a, #0d0d0d);
        width: 90%; max-width: 450px;
        border-radius: 20px; padding: 30px;
        position: relative; animation: slideUpFancy 0.4s ease;
        text-align: center; border: 1px solid #333;
    }

    /* Delete Specifics (Red) */
    .card-delete { border-color: #ff4444; box-shadow: 0 0 30px rgba(255, 68, 68, 0.15); }
    .icon-trash-anim { font-size: 3.5rem; color: #ff4444; margin-bottom: 15px; display: inline-block; animation: shakeTrash 0.5s ease-in-out infinite alternate; }
    
    /* Edit Specifics (Cyan) */
    .card-edit { border-color: #00d4ff; box-shadow: 0 0 30px rgba(0, 212, 255, 0.15); }
    .icon-edit-anim { font-size: 3.5rem; color: #00d4ff; margin-bottom: 15px; display: inline-block; animation: writePen 1s ease-in-out infinite; }

    /* Reply Specifics (Gold) */
    .card-reply { border-color: #FFD700; box-shadow: 0 0 30px rgba(255, 215, 0, 0.15); }
    
    /* Animations */
    @keyframes slideUpFancy { from {transform: translateY(50px); opacity:0;} to {transform: translateY(0); opacity:1;} }
    @keyframes fadeInOverlay { from {opacity: 0;} to {opacity: 1;} }
    @keyframes shakeTrash { 0% {transform: rotate(-10deg);} 100% {transform: rotate(10deg);} }
    @keyframes writePen { 0% {transform: translateX(0) rotate(0);} 50% {transform: translateX(5px) rotate(-10deg);} 100% {transform: translateX(0) rotate(0);} }
    
    /* Elements */
    .fancy-title { font-family: 'Cairo', sans-serif; font-size: 1.5rem; margin-bottom: 15px; color: white; font-weight: bold; }
    .fancy-text { color: #ccc; margin-bottom: 25px; line-height: 1.6; font-size: 1rem; }
    
    .fancy-textarea {
        width: 100%; background: rgba(255,255,255,0.05);
        border: 1px solid #444; color: white; padding: 15px;
        border-radius: 12px; font-size: 1rem; line-height: 1.6;
        min-height: 100px; outline: none; transition: 0.3s;
        font-family: 'Cairo', sans-serif; margin-bottom: 20px;
    }
    .fancy-textarea:focus { background: rgba(0,0,0,0.4); border-color: inherit; }
    
    .fancy-actions { display: flex; gap: 10px; justify-content: center; }
    
    .btn-fancy { padding: 12px 25px; border-radius: 50px; font-weight: bold; font-size: 1rem; cursor: pointer; transition: 0.3s; border: none; display: flex; align-items: center; gap: 8px; justify-content: center; }
    
    .btn-del { background: #ff4444; color: white; flex: 2; }
    .btn-del:hover { background: #cc0000; box-shadow: 0 5px 15px rgba(255, 68, 68, 0.4); }
    
    .btn-edit { background: #00d4ff; color: black; flex: 2; }
    .btn-edit:hover { background: #00aadd; box-shadow: 0 5px 15px rgba(0, 212, 255, 0.4); }

    .btn-reply { background: #FFD700; color: black; flex: 2; }
    .btn-reply:hover { background: #e6c200; box-shadow: 0 5px 15px rgba(255, 215, 0, 0.4); }
    
    .btn-cancel { background: transparent; border: 1px solid #555; color: #aaa; flex: 1; }
    .btn-cancel:hover { border-color: white; color: white; }
`;
document.head.appendChild(styles);

window.deleteReview = (commentId) => {
  const html = `
        <div id="fancy-modal" class="fancy-overlay">
            <div class="fancy-card card-delete">
                <i class="fas fa-trash-alt icon-trash-anim"></i>
                <div class="fancy-title" style="color:#ff4444">حذف التقييم</div>
                <div class="fancy-text">هل أنت متأكد من حذف هذا التقييم نهائياً؟<br>لا يمكن التراجع عن هذا الإجراء.</div>
                <div class="fancy-actions">
                    <button onclick="performDelete('${commentId}')" class="btn-fancy btn-del">نعم، احذف</button>
                    <button onclick="document.getElementById('fancy-modal').remove()" class="btn-fancy btn-cancel">إلغاء</button>
                </div>
            </div>
        </div>
    `;
  document.body.insertAdjacentHTML("beforeend", html);
};

window.performDelete = async (id) => {
  try {
    const res = await fetch(`/api/reviews/delete/${id}`, { method: "DELETE" });
    if (res.ok) location.reload();
    else alert("حدث خطأ أثناء الحذف");
  } catch (e) {
    alert("Error");
  }
};

window.editReview = (id, oldText) => {
  const html = `
        <div id="fancy-modal" class="fancy-overlay">
            <div class="fancy-card card-edit">
                <i class="fas fa-pen icon-edit-anim"></i>
                <div class="fancy-title" style="color:#00d4ff">تعديل التقييم</div>
                <textarea id="edit-text-area" class="fancy-textarea" style="border-color:#00d4ff">${oldText}</textarea>
                <div class="fancy-actions">
                    <button onclick="performEdit('${id}')" class="btn-fancy btn-edit">حفظ التعديلات</button>
                    <button onclick="document.getElementById('fancy-modal').remove()" class="btn-fancy btn-cancel">إلغاء</button>
                </div>
            </div>
        </div>
    `;
  document.body.insertAdjacentHTML("beforeend", html);
};

window.performEdit = async (id) => {
  const newText = document.getElementById("edit-text-area").value;
  if (!newText.trim()) return;
  try {
    const res = await fetch(`/api/reviews/edit/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: newText }),
    });
    if (res.ok) location.reload();
  } catch (e) {
    alert("حدث خطأ");
  }
};

window.openReplyModal = (commentId) => {
  const html = `
    <div id="fancy-reply-modal" class="fancy-overlay">
        <div class="fancy-card card-reply">
            <div class="fancy-title" style="color:#FFD700"><i class="fas fa-pen-fancy"></i> رد رسمي</div>
            <p class="fancy-text">سيظهر ردك بصفة رسمية أسفل تقييم العميل.</p>
            <textarea id="fancy-reply-text" class="fancy-textarea" style="border-color:#FFD700" placeholder="اكتب ردك هنا..."></textarea>
            <div class="fancy-actions">
                <button onclick="confirmFancyReply(${commentId})" class="btn-fancy btn-reply">نشر الرد</button>
                <button onclick="document.getElementById('fancy-reply-modal').remove()" class="btn-fancy btn-cancel">إلغاء</button>
            </div>
        </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", html);
};

window.confirmFancyReply = (commentId) => {
  const text = document.getElementById("fancy-reply-text").value;
  if (!text.trim()) return;
  const btn = document.querySelector(".btn-reply");
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> نشر...';
  btn.disabled = true;
  submitReply(commentId, text);
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
window.openShareModal = () => {
  const data = getShareData();
  if (navigator.share) {
    navigator
      .share({
        title: data.title,
        text: data.text,
        url: data.url,
      })
      .catch((err) => console.log("Sharing failed", err));
  } else {
    document.getElementById("share-modal-overlay").style.display = "flex";
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

let selectedRating = 0;

window.openRateModal = async (phone, name) => {
  const old = document.getElementById("rate-modal");
  if (old) old.remove();

  const html = `
        <div id="rate-modal" class="modal-overlay" style="display:flex; z-index:10002; backdrop-filter: blur(10px); background: rgba(0,0,0,0.85);">
            <div class="modal-content" style="background: linear-gradient(145deg, #1a1a1a, #0d0d0d); border: 1px solid #FFD700; border-radius: 20px; padding: 30px; width: 90%; max-width: 450px; box-shadow: 0 0 40px rgba(255, 215, 0, 0.15); text-align: center; position: relative;">
                
                <span class="close-modal" onclick="document.getElementById('rate-modal').remove()" style="position: absolute; top: 15px; left: 15px; color: #666; cursor: pointer; font-size: 1.5rem; transition: 0.3s;">&times;</span>
                
                <div style="width: 60px; height: 60px; background: rgba(255, 215, 0, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; border: 1px solid #FFD700;">
                    <i class="fas fa-star" style="color: #FFD700; font-size: 1.8rem;"></i>
                </div>

                <h3 style="color: white; margin-bottom: 5px; font-family: 'Cairo', sans-serif;">تقييم التجربة</h3>
                <p style="color: #888; font-size: 0.9rem; margin-bottom: 25px;">كيف كانت تجربتك مع ${name}؟</p>
                
                <div id="loading-rate" style="color:#aaa; font-size:0.9rem; padding:10px;">
                    <i class="fas fa-spinner fa-spin"></i> جاري التحميل...
                </div>

                <div id="rate-form-content" style="display:none;">
                    <div class="star-rating-input" style="display:flex; justify-content:center; direction: rtl; gap:8px; font-size:2.2rem; margin-bottom:25px;">
                        <i class="far fa-star" onclick="setRate(1)" id="s1" style="cursor:pointer; transition:0.2s;" title="سيء"></i>
                        <i class="far fa-star" onclick="setRate(2)" id="s2" style="cursor:pointer; transition:0.2s;" title="مقبول"></i>
                        <i class="far fa-star" onclick="setRate(3)" id="s3" style="cursor:pointer; transition:0.2s;" title="جيد"></i>
                        <i class="far fa-star" onclick="setRate(4)" id="s4" style="cursor:pointer; transition:0.2s;" title="جيد جداً"></i>
                        <i class="far fa-star" onclick="setRate(5)" id="s5" style="cursor:pointer; transition:0.2s;" title="ممتاز"></i>
                    </div>

                    <textarea id="rate-comment" rows="3" placeholder="اكتب تعليقك هنا (اختياري)..." 
                        style="width:100%; margin-bottom:20px; background: rgba(255,255,255,0.05); color:white; border: 1px solid #333; padding: 15px; border-radius: 12px; font-family: 'Cairo', sans-serif; resize: none; outline: none; transition: 0.3s;"></textarea>
                    
                    <button onclick="submitRate('${phone}')" style="width:100%; background: linear-gradient(45deg, #FFD700, #FFA500); color:black; border:none; padding: 14px; border-radius: 50px; font-weight:bold; font-size: 1rem; cursor:pointer; box-shadow: 0 5px 15px rgba(255, 215, 0, 0.3); transition: transform 0.2s;">
                        إرسال التقييم
                    </button>
                </div>
            </div>
        </div>
    `;
  document.body.insertAdjacentHTML("beforeend", html);

  const textarea = document.getElementById("rate-comment");
  if (textarea) {
    textarea.onfocus = () => (textarea.style.borderColor = "#FFD700");
    textarea.onblur = () => (textarea.style.borderColor = "#333");
  }
  const closeBtn = document.querySelector(".close-modal");
  if (closeBtn) {
    closeBtn.onmouseover = () => (closeBtn.style.color = "#ff4444");
    closeBtn.onmouseout = () => (closeBtn.style.color = "#666");
  }

  selectedRating = 0;

  try {
    const res = await fetch(`/api/reviews/my-rating/${phone}`);
    const data = await res.json();

    const loader = document.getElementById("loading-rate");
    const content = document.getElementById("rate-form-content");

    if (loader) loader.style.display = "none";
    if (content) content.style.display = "block";

    if (data.found) {
      window.setRate(data.rating);
    }
  } catch (e) {
    console.error("Error fetching rating:", e);
    const loader = document.getElementById("loading-rate");
    if (loader) loader.style.display = "none";
    const content = document.getElementById("rate-form-content");
    if (content) content.style.display = "block";
  }
};

window.setRate = (n) => {
  selectedRating = n;
  for (let i = 1; i <= 5; i++) {
    const star = document.getElementById("s" + i);
    if (!star) continue;
    if (i <= n) {
      star.classList.remove("far");
      star.classList.add("fas");
      star.style.color = "#FFD700";
    } else {
      star.classList.remove("fas");
      star.classList.add("far");
      star.style.color = "#444";
    }
  }
};

window.submitRate = async (phone) => {
  if (selectedRating === 0) return alert("يرجى اختيار عدد النجوم");

  const comment = document.getElementById("rate-comment").value;
  const btn = document.querySelector("#rate-modal button");
  const originalText = btn.innerHTML;

  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
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

    if (res.status === 403 && data.errorType === "LIMIT_EXCEEDED") {
      document.getElementById("rate-modal").remove();
      const refusalHTML = `
            <div id="refusal-modal" class="fancy-overlay" onclick="this.remove()">
                <div class="fancy-card card-delete" style="border-color:#ff4444;">
                    <div style="font-size:4rem; color:#ff4444; margin-bottom:15px;"><i class="fas fa-hand-paper"></i></div>
                    <div class="fancy-title" style="color:#ff4444">كفاية كده!</div>
                    <p class="fancy-text">مينفعش تكتب أكتر من 5 تعليقات لنفس الشخص.<br>(تم تحديث النجوم فقط)</p>
                </div>
            </div>
        `;
      document.body.insertAdjacentHTML("beforeend", refusalHTML);
      return;
    }

    if (res.ok) {
      alert("✅ " + data.message);
      document.getElementById("rate-modal").remove();
      location.reload();
    } else {
      alert("❌ " + data.message);
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  } catch (e) {
    alert("خطأ في الاتصال");
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
};
