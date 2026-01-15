/**
 * edit-profile.js
 * الكود الكامل المحدث
 */

function showCustomError(message) {
  const modal = document.getElementById("errorModal");
  const msgEl = document.getElementById("errorModalMessage");

  if (modal && msgEl) {
    msgEl.innerText = message;
    modal.classList.add("show");

    modal.onclick = function (e) {
      if (e.target === modal) closeErrorModal();
    };
  } else {
    alert(message);
  }
}

function closeErrorModal() {
  const modal = document.getElementById("errorModal");
  if (modal) {
    modal.classList.remove("show");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("/api/auth/me");
    const data = await response.json();

    if (data.isAuthenticated) {
      document.getElementById("display-name").value = data.name || "";
      document.getElementById("display-phone").value = data.phone || "";
      document.getElementById("edit-username").value = data.username || "";

      if (data.bio) {
        document.getElementById("edit-bio").value = data.bio;
        if(data.job_title) document.getElementById("edit-job").value = data.job_title;
if(data.cover_picture) document.getElementById("current-cover-img").src = data.cover_picture;
if(data.social_links) {
    try {
        const links = JSON.parse(data.social_links);
        document.getElementById("social-fb").value = links.facebook || "";
        document.getElementById("social-insta").value = links.instagram || "";
        document.getElementById("social-web").value = links.website || "";
    } catch(e){}
}
      }

      if (data.profile_picture && !data.profile_picture.includes("logo.png")) {
        document.getElementById("current-profile-img").src =
          data.profile_picture;
      }
    } else {
      window.location.href = "authentication";
    }
  } catch (e) {
    console.error("Error fetching user data:", e);
  }
});

function previewImage(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      document.getElementById("current-profile-img").src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

document
  .getElementById("edit-profile-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("save-btn");

    const usernameInput = document.getElementById("edit-username");
    let usernameVal = usernameInput.value.trim();

    if (!usernameVal) {
      showCustomError("⚠️ لا يمكن ترك اسم المستخدم فارغاً!");
      return;
    }

    if (usernameVal.length < 3) {
      showCustomError("⚠️ اسم المستخدم قصير جداً (3 حروف على الأقل).");
      return;
    }

    const validCharsRegex = /^[a-zA-Z0-9._]+$/;
    if (!validCharsRegex.test(usernameVal)) {
      showCustomError(
        "❌ اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام فقط (بدون مسافات أو رموز خاصة)."
      );
      return;
    }

    const hasLetterRegex = /[a-zA-Z]/;
    if (!hasLetterRegex.test(usernameVal)) {
      showCustomError(
        "⛔ لا يمكن أن يكون اسم المستخدم أرقاماً فقط، يجب أن يحتوي على حروف."
      );
      return;
    }

    btn.innerHTML = "جاري الحفظ...";
    btn.disabled = true;

    const formData = new FormData();
    formData.append("newUsername", usernameVal);
    formData.append("name", document.getElementById("display-name").value);
    formData.append("phone", document.getElementById("display-phone").value);
    formData.append("bio", document.getElementById("edit-bio").value);
    formData.append("job_title", document.getElementById("edit-job").value);
formData.append("facebook", document.getElementById("social-fb").value);
formData.append("instagram", document.getElementById("social-insta").value);
formData.append("website", document.getElementById("social-web").value);

const coverFile = document.getElementById("cover-upload").files[0];
if(coverFile) formData.append("coverImage", coverFile);

    const fileInput = document.getElementById("profile-upload");
    if (fileInput.files[0]) {
      formData.append("profileImage", fileInput.files[0]);
    }

    try {
      const response = await fetch("/api/user/update-profile", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (response.ok) {
        alert("✅ " + result.message);
        window.location.reload();
      } else {
        showCustomError("❌ " + result.message);
      }
    } catch (error) {
      showCustomError("حدث خطأ أثناء الاتصال بالسيرفر، حاول مرة أخرى.");
    } finally {
      btn.innerHTML = "حفظ التغييرات";
      btn.disabled = false;
    }
  });

async function confirmDeleteAccount() {
  const password = document.getElementById("delete-pass").value;

  if (!password) {
    showCustomError("⚠️ يرجى إدخال كلمة المرور لتأكيد الحذف");
    return;
  }

  const btn = document.querySelector("#deleteModal .btn-delete");
  const originalText = btn.innerHTML;
  btn.innerHTML = "جاري الحذف...";
  btn.disabled = true;

  try {
    const res = await fetch("/api/user/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();

    if (data.success) {
      alert("تم حذف الحساب بنجاح. إلى اللقاء 👋");
      window.location.href = "authentication";
    } else {
      showCustomError("خطأ: " + data.message);
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  } catch (e) {
    showCustomError("حدث خطأ في الاتصال بالسيرفر");
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}
function previewCover(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) { document.getElementById("current-cover-img").src = e.target.result; };
    reader.readAsDataURL(file);
  }
}