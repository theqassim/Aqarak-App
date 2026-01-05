document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const username = urlParams.get("u");
  const grid = document.getElementById("properties-grid");
  const loading = document.getElementById("loading");

  if (!username) {
    document.getElementById("user-name").textContent = "رابط غير صحيح";
    loading.style.display = "none";
    return;
  }

  try {
    const response = await fetch(`/api/public/profile/${username}`);

    if (!response.ok) {
      document.getElementById("user-name").textContent = "مستخدم غير موجود";
      loading.style.display = "none";
      return;
    }

    const data = await response.json();

    const verifiedBadge = data.is_verified
      ? `<i class="fas fa-check verified-badge" title="موثق"></i>`
      : "";

    document.getElementById(
      "user-name"
    ).innerHTML = `${data.name} ${verifiedBadge}`;
    document.getElementById(
      "listing-count"
    ).innerHTML = `إجمالي العقارات: <span>${data.properties.length}</span>`;
    document.title = `عقارات ${data.name} - عقارك`;

    const avatarContainer = document.getElementById("avatar-container");
    if (data.profile_picture && !data.profile_picture.includes("logo.png")) {
      avatarContainer.innerHTML = `<img src="${data.profile_picture}" alt="${data.name}">`;
    } else {
      avatarContainer.innerHTML = `<i class="fas fa-user"></i>`;
    }

    loading.style.display = "none";

    if (data.properties.length === 0) {
      grid.innerHTML =
        '<div style="grid-column:1/-1; text-align:center; color:#777; padding:40px; border:1px dashed #444; border-radius:15px;"><i class="fas fa-box-open fa-3x" style="margin-bottom:15px;"></i><p>لا توجد عقارات نشطة لهذا المستخدم حالياً.</p></div>';
      return;
    }

    data.properties.forEach((prop) => {
      const price = Number(prop.price).toLocaleString("ar-EG");

      const card = `
                        <div class="property-card" onclick="window.location.href='property?id=${
                          prop.id
                        }'">
                            <div class="card-img-wrapper">
                                <img src="${
                                  prop.imageUrl || "logo.png"
                                }" class="card-img" alt="${prop.title}">
                            </div>
                            <div class="card-content">
                                <h3 class="card-title">${prop.title}</h3>
                                <div class="card-price">${price} ج.م</div>
                                <div class="card-details">
                                    <span><i class="fas fa-bed"></i> ${
                                      prop.rooms || 0
                                    }</span> &nbsp;|&nbsp; 
                                    <span><i class="fas fa-bath"></i> ${
                                      prop.bathrooms || 0
                                    }</span> &nbsp;|&nbsp; 
                                    <span><i class="fas fa-ruler-combined"></i> ${
                                      prop.area
                                    } م²</span>
                                </div>
                            </div>
                        </div>
                    `;
      grid.innerHTML += card;
    });
  } catch (error) {
    console.error(error);
    loading.style.display = "none";
    grid.innerHTML =
      '<p style="text-align:center; color:#ff4444; grid-column:1/-1;">حدث خطأ في تحميل البيانات.</p>';
  }
});
