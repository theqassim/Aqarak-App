document.addEventListener("DOMContentLoaded", () => {
  fetchAdminCounts();
});

async function fetchAdminCounts() {
  const sellerCountEl = document.querySelector(
    "#seller-submissions-box .count-number"
  );
  const requestCountEl = document.querySelector(
    "#property-requests-box .count-number"
  );
  const complaintsCountEl = document.getElementById("complaints-count");

  try {
    const sellerResponse = await fetch("/api/admin/seller-submissions");
    if (sellerResponse.ok) {
      const sellers = await sellerResponse.json();
      if (sellerCountEl) sellerCountEl.textContent = sellers.length;
    }

    const requestResponse = await fetch("/api/admin/property-requests");
    if (requestResponse.ok) {
      const requests = await requestResponse.json();
      if (requestCountEl) requestCountEl.textContent = requests.length;
    }

    const compResponse = await fetch("/api/admin/complaints-count");
    if (compResponse.ok) {
      const data = await compResponse.json();
      if (complaintsCountEl) {
        complaintsCountEl.textContent = data.count;

        if (data.count > 0) {
          complaintsCountEl.style.color = "#ff4444";
          complaintsCountEl.style.textShadow =
            "0 0 10px rgba(255, 68, 68, 0.5)";
        }
      }
    }
  } catch (error) {
    console.error("Error fetching admin counts:", error);
  }
}

function updatePaymentUI(isActive) {
  const toggle = document.getElementById("payment-toggle");
  const statusText = document.getElementById("payment-status-text");

  toggle.checked = isActive;

  if (isActive) {
    statusText.textContent = "مدفوع (شغال)";
    statusText.className = "status-active";
  } else {
    statusText.textContent = "مجاني (موقف)";
    statusText.className = "status-inactive";
  }
}

function togglePaymentStatus() {
  const toggle = document.getElementById("payment-toggle");
  updatePaymentUI(toggle.checked);
}

async function fetchPaymentSettings() {
  try {
    const response = await fetch("/api/admin/payment-settings");
    if (response.ok) {
      const data = await response.json();

      document.getElementById("point-price").value = data.point_price || 1;
      updatePaymentUI(data.is_active);
    }
  } catch (error) {
    console.error("فشل جلب إعدادات الدفع:", error);
  }
}

async function savePaymentSettings() {
  const isActive = document.getElementById("payment-toggle").checked;
  const price = document.getElementById("point-price").value;
  const btn = document.querySelector("#payment-settings-box .btn-neon-auth");

  const originalText = btn.textContent;
  btn.textContent = "جاري الحفظ...";
  btn.style.opacity = "0.7";

  try {
    const response = await fetch("/api/admin/payment-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: isActive, point_price: price }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      alert(result.message);
    } else {
      alert("❌ حدث خطأ: " + (result.message || "غير معروف"));
    }
  } catch (error) {
    console.error(error);
    alert("❌ حدث خطأ في الاتصال بالسيرفر");
  } finally {
    btn.textContent = originalText;
    btn.style.opacity = "1";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  fetchAdminCounts();
  fetchPaymentSettings();
});

async function manualCharge() {
  const phone = document.getElementById("charge-phone").value.trim();
  const amount = document.getElementById("charge-amount").value;
  const btn = document.querySelector('button[onclick="manualCharge()"]');

  if (!phone || !amount) {
    alert("⚠️ يرجى كتابة الرقم وعدد النقاط");
    return;
  }

  if (!confirm(`هل أنت متأكد من شحن ${amount} نقطة للرقم ${phone}؟`)) return;

  const originalText = btn.textContent;
  btn.textContent = "جاري الشحن...";
  btn.style.opacity = "0.7";

  try {
    const response = await fetch("/api/admin/manual-charge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, amount }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      alert(result.message);
      document.getElementById("charge-phone").value = "";
      document.getElementById("charge-amount").value = "";
    } else {
      alert("❌ خطأ: " + (result.message || "فشلت العملية"));
    }
  } catch (error) {
    console.error(error);
    alert("❌ خطأ في الاتصال");
  } finally {
    btn.textContent = originalText;
    btn.style.opacity = "1";
  }
}
