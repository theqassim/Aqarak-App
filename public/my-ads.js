document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("my-ads-container");
  const spinner = document.getElementById("loading-spinner");

  try {
    const response = await fetch("/api/user/my-properties");

    if (response.status === 401) {
      window.location.href = "authentication";
      return;
    }

    const properties = await response.json();
    spinner.style.display = "none";

    if (properties.length === 0) {
      container.innerHTML = `
                        <div class="empty-ads">
                            <i class="fas fa-box-open fa-3x" style="margin-bottom:15px; color:#444;"></i>
                            <p>لم تقم بنشر أي عقارات حتى الآن.</p>
                            <a href="sell" class="nav-button" style="margin-top:20px; display:inline-block; background:transparent;">اعرض عقارك الآن</a>
                        </div>
                    `;
      return;
    }

    properties.forEach((prop) => {
      const cleanPrice = prop.price.replace(/[^0-9.]/g, "");
      const price = Number(cleanPrice).toLocaleString("ar-EG");
      const typeLabel =
        prop.type === "buy" || prop.type === "بيع" ? "بيع" : "إيجار";

      let statusHtml = "",
        link = "#",
        clickAction = "";

      if (prop.status === "active") {
        statusHtml = `<span class="status-badge status-active">نشط <i class="fas fa-check"></i></span>`;
        link = `property-details?id=${prop.id}`;
      } else {
        statusHtml = `<span class="status-badge status-pending">قيد المراجعة <i class="fas fa-clock"></i></span>`;
        clickAction = `onclick="alert('جاري مراجعة هذا العقار من قبل الإدارة، سيتم نشره قريباً.'); return false;"`;
      }

      const itemHTML = `
                        <a href="${link}" ${clickAction} class="ad-item">
                            <div class="ad-info">
                                <h3>${prop.title} ${statusHtml}</h3>
                                <div class="ad-price">${price} ج.م <span style="font-size:0.85rem; color:#888; font-weight:normal;">(${typeLabel})</span></div>
                            </div>
                            <i class="fas fa-chevron-left arrow-icon"></i>
                        </a>
                    `;
      container.innerHTML += itemHTML;
    });
  } catch (error) {
    spinner.style.display = "none";
    container.innerHTML =
      '<p style="text-align:center; color:#ff4444;">حدث خطأ في الاتصال.</p>';
  }
});
