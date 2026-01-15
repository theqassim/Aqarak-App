/**
 * edit-profile.js
 * النسخة الكاملة المحدثة - تشمل إصلاح الكفر، الحذف، والتوست المودرن
 */

// متغيرات لتتبع حالة الحذف
let deleteCoverFlag = false;
let deleteProfileFlag = false;

// 1. دالة الإشعار المودرن (Toast Notification)
function showToast(message, type = 'success') {
    // لو فيه توست قديم نشيله عشان ميتراكموش
    const existing = document.getElementById('custom-toast');
    if (existing) existing.remove();

    // إنشاء العنصر
    const toast = document.createElement('div');
    toast.id = 'custom-toast';
    
    // ستايل التوست
    toast.style.cssText = `
        position: fixed; 
        top: 20px; 
        left: 50%; 
        transform: translateX(-50%);
        background: ${type === 'success' ? 'rgba(0, 255, 136, 0.95)' : 'rgba(255, 68, 68, 0.95)'};
        color: black; 
        padding: 12px 25px; 
        border-radius: 50px;
        font-weight: bold; 
        font-family: 'Cairo', sans-serif;
        box-shadow: 0 5px 20px rgba(0,0,0,0.5); 
        z-index: 10000;
        display: flex; 
        align-items: center; 
        gap: 10px;
        opacity: 0;
        transition: all 0.4s ease-out;
    `;

    // الأيقونة حسب النوع
    const icon = type === 'success' ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-exclamation-circle"></i>';
    toast.innerHTML = `${icon} ${message}`;

    // إضافة للكود
    document.body.appendChild(toast);

    // تفعيل الانيميشن
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translate(-50%, 0)'; // ينزل مكانه
    });

    // اختفاء تلقائي بعد 3 ثواني
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, -20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 2. دالة تحديد العنصر للحذف
function markDelete(type) {
    if (type === 'cover') {
        deleteCoverFlag = true;
        const img = document.getElementById("current-cover-img");
        if(img) {
            img.src = ""; 
            img.style.opacity = '0'; // إخفاء الصورة
        }
        document.getElementById("cover-upload").value = ""; // تصفير الإنبت
        showToast("تم تحديد الغلاف للحذف (اضغط حفظ للتأكيد)", "error");

    } else if (type === 'profile') {
        deleteProfileFlag = true;
        document.getElementById("current-profile-img").src = "logo.png";
        document.getElementById("current-profile-display").src = "logo.png";
        document.getElementById("profile-upload").value = ""; // تصفير الإنبت
        showToast("تم تحديد الصورة الشخصية للحذف", "error");
    }
}

// 3. دوال المعاينة (Preview)
function previewCover(event) {
    const file = event.target.files[0];
    if (file) {
        deleteCoverFlag = false; // الغاء الحذف لو المستخدم رفع صورة جديدة
        const reader = new FileReader();
        reader.onload = function (e) { 
            const img = document.getElementById("current-cover-img");
            img.src = e.target.result; 
            img.style.opacity = '1';
            img.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        deleteProfileFlag = false; // الغاء الحذف لو المستخدم رفع صورة جديدة
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById("current-profile-img").src = e.target.result;
            document.getElementById("current-profile-display").src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// 4. تحميل البيانات عند فتح الصفحة
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("/api/auth/me");
    const data = await response.json();

    if (data.isAuthenticated) {
      document.getElementById("display-name").value = data.name || "";
      document.getElementById("display-phone").value = data.phone || "";
      document.getElementById("edit-username").value = data.username || "";

      // Bio & Job
      if (data.bio) document.getElementById("edit-bio").value = data.bio;
      if (data.job_title) document.getElementById("edit-job").value = data.job_title;

      // Social Links
      if (data.social_links) {
          try {
              const links = JSON.parse(data.social_links);
              document.getElementById("social-fb").value = links.facebook || "";
              document.getElementById("social-insta").value = links.instagram || "";
              document.getElementById("social-web").value = links.website || "";
          } catch(e){}
      }

      // Profile Picture
      if (data.profile_picture && !data.profile_picture.includes("logo.png")) {
        document.getElementById("current-profile-img").src = data.profile_picture;
        document.getElementById("current-profile-display").src = data.profile_picture;
      }

      // Cover Picture
      const coverImg = document.getElementById("current-cover-img");
      if (data.cover_picture) {
          coverImg.src = data.cover_picture;
          coverImg.style.opacity = '1';
      } else {
          // لو مفيش كفر، ممكن تخفيه أو تظهر خلفية سادة
          coverImg.style.opacity = '0';
      }

    } else {
      window.location.href = "authentication";
    }
  } catch (e) {
    console.error("Error fetching user data:", e);
    showToast("فشل تحميل البيانات", "error");
  }
});

// 5. إرسال الفورم (Submit)
document.getElementById("edit-profile-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("save-btn");

    const usernameInput = document.getElementById("edit-username");
    let usernameVal = usernameInput.value.trim();

    // Validations
    if (!usernameVal) return showToast("⚠️ لا يمكن ترك اسم المستخدم فارغاً!", "error");
    if (usernameVal.length < 3) return showToast("⚠️ اسم المستخدم قصير جداً", "error");
    
    const validCharsRegex = /^[a-zA-Z0-9._]+$/;
    if (!validCharsRegex.test(usernameVal)) return showToast("❌ اسم المستخدم حروف إنجليزية وأرقام فقط", "error");
    
    const hasLetterRegex = /[a-zA-Z]/;
    if (!hasLetterRegex.test(usernameVal)) return showToast("⛔ لازم يكون فيه حروف مش أرقام بس", "error");

    // UI Loading State
    const originalBtnText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
    btn.disabled = true;

    // تجميع البيانات
    const formData = new FormData();
    formData.append("newUsername", usernameVal);
    formData.append("name", document.getElementById("display-name").value);
    formData.append("phone", document.getElementById("display-phone").value);
    formData.append("bio", document.getElementById("edit-bio").value);
    formData.append("job_title", document.getElementById("edit-job").value);
    formData.append("facebook", document.getElementById("social-fb").value);
    formData.append("instagram", document.getElementById("social-insta").value);
    formData.append("website", document.getElementById("social-web").value);

    // إرسال فلاج الحذف للسيرفر
    formData.append("deleteCover", deleteCoverFlag);
    formData.append("deleteProfile", deleteProfileFlag);

    // رفع الملفات (فقط لو المستخدم اختار ملف ومكنش معلم على حذف)
    const coverFile = document.getElementById("cover-upload").files[0];
    if(coverFile && !deleteCoverFlag) formData.append("coverImage", coverFile);

    const profileFile = document.getElementById("profile-upload").files[0];
    if (profileFile && !deleteProfileFlag) formData.append("profileImage", profileFile);

    try {
      const response = await fetch("/api/user/update-profile", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (response.ok) {
        showToast(result.message, "success");
        // استنى ثانية ونص عشان المستخدم يشوف الرسالة وبعدين ريفرش
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showToast("❌ " + result.message, "error");
        btn.innerHTML = originalBtnText;
        btn.disabled = false;
      }
    } catch (error) {
      console.error(error);
      showToast("حدث خطأ أثناء الاتصال بالسيرفر", "error");
      btn.innerHTML = originalBtnText;
      btn.disabled = false;
    }
});

// 6. حذف الحساب نهائياً
async function confirmDeleteAccount() {
  const password = document.getElementById("delete-pass").value;

  if (!password) {
    showToast("⚠️ يرجى إدخال كلمة المرور لتأكيد الحذف", "error");
    return;
  }

  const btn = document.querySelector("#deleteModal .btn-delete");
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحذف...';
  btn.disabled = true;

  try {
    const res = await fetch("/api/user/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();

    if (data.success) {
      showToast("تم حذف الحساب بنجاح. إلى اللقاء 👋", "success");
      setTimeout(() => window.location.href = "authentication", 2000);
    } else {
      showToast("خطأ: " + data.message, "error");
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  } catch (e) {
    showToast("حدث خطأ في الاتصال بالسيرفر", "error");
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}