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

    document.getElementById(
      "avatar-container"
    ).innerHTML = `<img src="${avatarImg}" class="profile-avatar">${verifiedIcon}`;
    document.getElementById("user-name").innerHTML = data.name;
    document.title = `${data.name} | عقارك`;
    document.getElementById(
      "prop-count-badge"
    ).innerText = `${data.properties.length} عقار`;

    const joinDate = new Date(data.created_at);
    const dateStr = joinDate.getFullYear();
    document.getElementById("join-date-text").innerText = `عضو منذ ${dateStr}`;

    if (data.phone) {
      fetchReviews(data.phone);
    } else {
      document.getElementById("reviews-list").innerHTML =
        '<p style="text-align:center; color:#777;">لا يمكن تحميل التقييمات.</p>';
    }

    renderProperties(data.properties);

    if (requestedTab === "reviews") {
      switchTab("reviews");
    }
  } catch (error) {
    console.error(error);
    document.getElementById("user-name").innerText = "مستخدم غير موجود";
    document.getElementById("loading-props").style.display = "none";
  }
});

function renderProperties(properties) {
  const grid = document.getElementById("properties-grid");
  document.getElementById("loading-props").style.display = "none";

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

  try {
    const res = await fetch(`/api/reviews/${phone}`);
    if (!res.ok) throw new Error("Failed to fetch reviews");

    const reviews = await res.json();
    loading.style.display = "none";

    if (reviews.length > 0) {
      const avg = reviews.reduce((a, b) => a + b.rating, 0) / reviews.length;
      document.getElementById("rating-badge").innerText = `${avg.toFixed(1)} (${
        reviews.length
      })`;
    }

    if (reviews.length === 0) {
      listContainer.innerHTML =
        '<p style="text-align:center; color:#777; padding:20px;">لا توجد تقييمات مكتوبة بعد.</p>';
      return;
    }

    listContainer.innerHTML = reviews
      .map(
        (r) => `
            <div class="review-item">
                <div style="flex-shrink:0;">
                   <div style="width:40px; height:40px; background:#333; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#FFD700; font-weight:bold;">
                        ${
                          r.rating
                        }<i class="fas fa-star" style="font-size:0.7rem; margin-right:2px;"></i>
                   </div>
                </div>
                <div>
                    <h4 style="margin:0 0 5px 0; color:white;">${
                      r.reviewer_name || "مستخدم"
                    }</h4>
                    <p style="margin:0; color:#ccc; line-height:1.5;">${
                      r.comment
                    }</p>
                    <span style="font-size:0.75rem; color:#666;">${new Date(
                      r.created_at
                    ).toLocaleDateString("ar-EG")}</span>
                </div>
            </div>
        `
      )
      .join("");

    if (reviews.length >= 1) {
      aiContainer.style.display = "block";
      const aiText = document.getElementById("ai-summary-text");
      aiText.innerHTML =
        '<i class="fas fa-pulse fa-spinner"></i> جاري تحليل آراء الناس...';

      try {
        const aiRes = await fetch("/api/reviews/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviews }),
        });
        const aiData = await aiRes.json();
        aiText.innerHTML = aiData.summary;
      } catch (e) {
        aiContainer.style.display = "none";
      }
    }
  } catch (e) {
    loading.style.display = "none";
    console.error("Review Error:", e);
  }
}

window.switchTab = (tabName) => {
  const propsSec = document.getElementById("properties-section");
  const reviewsSec = document.getElementById("reviews-section");
  const btns = document.querySelectorAll(".tab-btn");

  btns.forEach((b) => b.classList.remove("active"));

  if (tabName === "properties") {
    propsSec.classList.remove("hidden-section");
    reviewsSec.classList.add("hidden-section");
    btns[0].classList.add("active");
  } else {
    propsSec.classList.add("hidden-section");
    reviewsSec.classList.remove("hidden-section");
    btns[1].classList.add("active");
  }
};
