document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("/api/auth/me");
    const userData = await response.json();
    if (userData.isAuthenticated) {
      localStorage.setItem("userPhone", userData.phone);
      if (userData.username)
        localStorage.setItem("username", userData.username);
      window.location.href = userData.role === "admin" ? "admin-home" : "/home";
    }
  } catch (error) {
    console.log("Guest User");
  }

  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      document.getElementById("login-phone-error").textContent = "";
      document.getElementById("login-pass-error").textContent = "";

      const btn = loginForm.querySelector("button");
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحقق...';
      btn.disabled = true;

      const phone = document.getElementById("login-phone").value;
      const egyptPhoneRegex = /^01[0-2,5]{1}[0-9]{8}$/;
      
      if (!egyptPhoneRegex.test(phone)) {
        showWarning("رقم الهاتف غير صحيح. تأكد أنه يبدأ بـ 010, 011, 012, أو 015 ومكون من 11 رقم.");
        if(typeof btn !== 'undefined') { btn.innerHTML = originalText; btn.disabled = false; }
        if(typeof submitBtn !== 'undefined') { submitBtn.innerHTML = originalText; submitBtn.disabled = false; }
        return;
      }
      const password = document.getElementById("login-password").value;
      try {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, password }),
        });

        if (response.status === 404) {
          showNotFoundModal(phone);
          btn.innerHTML = originalText;
          btn.disabled = false;
          return;
        }

        const data = await response.json();

        if (data.success) {
          localStorage.setItem("username", data.username);
          window.location.href = data.role === "admin" ? "admin-home" : "/home";
        } else {
          if (data.errorType === "phone") {
            showNotFoundModal(phone);
          } else if (data.errorType === "password" || response.status === 401) {
            document.getElementById("login-pass-error").textContent =
              data.message;
          } else {
            alert(data.message || "حدث خطأ غير معروف");
          }
        }
      } catch (error) {
        console.error(error);
        alert("خطأ في الاتصال بالسيرفر");
      } finally {
        if (btn.disabled && btn.innerHTML.includes("spinner")) {
          btn.innerHTML = originalText;
          btn.disabled = false;
        }
      }
    });
  }
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("mode") === "register") {
  setTimeout(() => {
      switchTab("register");
  }, 100);
}

const registerForm = document.getElementById("register-form");
  let isOtpSent = false;
  let isUsernameValid = false;
  let typingTimer;

  const usernameInput = document.getElementById("reg-username");

  usernameInput.addEventListener("keyup", () => {
    clearTimeout(typingTimer);
    const val = usernameInput.value;
    const iconCheck = document.getElementById("icon-check");
    const iconError = document.getElementById("icon-error");
    const msg = document.getElementById("username-msg");

    iconCheck.style.display = "none";
    iconError.style.display = "none";
    msg.textContent = "";
    isUsernameValid = false;

    if (val.length < 3) return;

    const hasLetters = /[a-z]/.test(val);
    if (!hasLetters) {
      iconError.style.display = "block";
      msg.textContent =
        "يجب أن يحتوي الاسم على حروف (لا يمكن أن يكون أرقاماً فقط)";
      return;
    }

    typingTimer = setTimeout(async () => {
      try {
        const res = await fetch("/api/check-username", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: val }),
        });
        const data = await res.json();

        if (data.available) {
          iconCheck.style.display = "block";
          isUsernameValid = true;
        } else {
          iconError.style.display = "block";
          msg.textContent =
            data.message === "taken" ? "الاسم مستخدم بالفعل" : "الاسم غير متاح";
        }
      } catch (e) {
        console.error(e);
      }
    }, 500);
  });

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      document.getElementById("reg-phone-error").textContent = "";
      document.getElementById("confirm-pass-error").textContent = "";

      const submitBtn = document.getElementById("reg-submit-btn");
      const originalText = submitBtn.innerHTML;

      const name = document.getElementById("reg-name").value;
      const username = document.getElementById("reg-username").value;
      const phone = document.getElementById("reg-phone").value;
      const password = document.getElementById("reg-password").value;
      const confirmPassword = document.getElementById(
        "reg-confirm-password"
      ).value;

      if (!isOtpSent) {
        if (phone.length < 11) {
          showWarning("رقم الهاتف غير كامل، يجب أن يكون 11 رقم.");
          return;
        }

        if (username.length < 3) {
          showWarning("اسم المستخدم قصير جداً (يجب أن يكون 3 حروف على الأقل)");
          return;
        }

        if (!/[a-z]/.test(username)) {
          showWarning("اسم المستخدم يجب أن يحتوي على حروف إنجليزية.");
          return;
        }

        if (!isUsernameValid) {
          showWarning("اسم المستخدم غير متاح أو مستخدم بالفعل");
          return;
        }
        if (password !== confirmPassword) {
          document.getElementById("confirm-pass-error").textContent =
            "كلمتا المرور غير متطابقتين";
          return;
        }

        submitBtn.innerHTML =
          '<i class="fas fa-spinner fa-spin"></i> جاري التحقق...';
        submitBtn.disabled = true;

        try {
          const response = await fetch("/api/auth/send-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone, type: "register" }),
          });
          const data = await response.json();

          if (data.success) {
            isOtpSent = true;
            document.getElementById("reg-otp-group").style.display = "block";
            document.getElementById("reg-phone").readOnly = true;
            document.getElementById("reg-username").readOnly = true;
            document.getElementById("reg-name").readOnly = true;
            submitBtn.textContent = "تأكيد وإنشاء الحساب";
          } else {
            if (response.status === 409)
              document.getElementById("reg-phone-error").textContent =
                data.message;
            else alert(data.message);
          }
        } catch (error) {
          alert("خطأ في الاتصال");
        } finally {
          if (!isOtpSent) submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
        }
      } else {
        const otp = document.getElementById("reg-otp").value;
        if (!otp) return alert("من فضلك أدخل الكود");

        submitBtn.innerHTML = "جاري إنشاء الحساب...";
        submitBtn.disabled = true;

        const formData = new FormData();
        formData.append("name", name);
        formData.append("username", username);
        formData.append("phone", phone);
        formData.append("password", password);
        formData.append("otp", otp);

        const fileInput = document.getElementById("profile-upload");

        if (fileInput && fileInput.files && fileInput.files[0]) {
          formData.append("profileImage", fileInput.files[0]);
        } else {
        }

        try {
          const response = await fetch("/api/register", {
            method: "POST",
            body: formData,
          });
          const data = await response.json();

          if (data.success) {
            alert("تم التسجيل بنجاح! سيتم توجيهك...");
            setTimeout(() => {
              switchTab("login");
              document.getElementById("login-phone").value = phone;
            }, 1500);
          } else {
            alert(data.message);
            submitBtn.innerHTML = "تأكيد وإنشاء الحساب";
            submitBtn.disabled = false;
          }
        } catch (error) {
          alert("حدث خطأ");
          submitBtn.disabled = false;
        }
      }
    });
  }
});

window.previewProfileImage = function (event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      document.getElementById("profile-preview").src = e.target.result;
      document.getElementById("profile-preview").style.display = "block";
      document.getElementById("upload-placeholder").style.display = "none";
    };
    reader.readAsDataURL(file);
  }
};
window.switchTab = function (tab) {
  const loginWrapper = document.getElementById("login-form-wrapper");
  const registerWrapper = document.getElementById("register-form-wrapper");
  const btns = document.querySelectorAll(".tab-btn");
  document.querySelectorAll(".error-msg").forEach((e) => (e.textContent = ""));

  if (tab === "login") {
    loginWrapper.style.display = "block";
    registerWrapper.style.display = "none";
    btns[0].classList.add("active");
    btns[1].classList.remove("active");
  } else {
    loginWrapper.style.display = "none";
    registerWrapper.style.display = "block";
    btns[0].classList.remove("active");
    btns[1].classList.add("active");
  }
};

window.checkStrength = function () {
  const password = document.getElementById("reg-password").value;
  const bar = document.getElementById("strength-bar");
  const text = document.getElementById("strength-text");
  let strength = 0;
  if (password.length >= 6) strength++;
  if (password.match(/[a-z]+/)) strength++;
  if (password.match(/[0-9]+/)) strength++;
  if (password.match(/[$@#&!]+/)) strength++;

  if (password.length < 6) {
    bar.style.width = "20%";
    bar.style.background = "#ff4444";
    text.textContent = "ضعيفة";
    text.style.color = "#ff4444";
  } else if (strength <= 2) {
    bar.style.width = "50%";
    bar.style.background = "orange";
    text.textContent = "متوسطة";
    text.style.color = "orange";
  } else {
    bar.style.width = "100%";
    bar.style.background = "#00ff88";
    text.textContent = "قوية";
    text.style.color = "#00ff88";
  }
};

window.togglePassword = function (inputId, icon) {
  const input = document.getElementById(inputId);
  if (input.type === "password") {
    input.type = "text";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  } else {
    input.type = "password";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  }
};

const modal = document.getElementById("forgotModal");
const msgForgot = document.getElementById("forgot-message");

window.openForgotModal = () => {
  modal.style.display = "flex";
};
window.closeForgotModal = () => {
  modal.style.display = "none";
};
window.sendForgotOTP = async () => {
  const phone = document.getElementById("forgot-phone").value;
  if (!phone) return alert("أدخل الرقم");
  msgForgot.textContent = "جاري الإرسال...";
  try {
    const response = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, type: "reset" }),
    });
    const data = await response.json();
    if (data.success) {
      msgForgot.textContent = "تم الإرسال!";
      msgForgot.style.color = "#00ff88";
      document.getElementById("forgot-step-1").style.display = "none";
      document.getElementById("forgot-step-2").style.display = "block";
    } else {
      msgForgot.textContent = data.message;
      msgForgot.style.color = "#ff4444";
    }
  } catch (e) {
    msgForgot.textContent = "خطأ";
  }
};

window.resetPassword = async () => {
  const phone = document.getElementById("forgot-phone").value;
  const otp = document.getElementById("forgot-otp").value;
  const newPassword = document.getElementById("new-password").value;
  if (!otp || !newPassword) return alert("أدخل البيانات");

  try {
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, otp, newPassword }),
    });
    const data = await response.json();
    if (data.success) {
      msgForgot.textContent = "تم التغيير بنجاح!";
      msgForgot.style.color = "#00ff88";
      setTimeout(closeForgotModal, 2000);
    } else {
      msgForgot.textContent = data.message;
      msgForgot.style.color = "#ff4444";
    }
  } catch (e) {
    msgForgot.textContent = "خطأ";
  }
};
document.addEventListener("input", function (e) {
  if (
    e.target.type === "number" ||
    e.target.type === "tel" ||
    e.target.classList.contains("number-only")
  ) {
    let val = e.target.value;
    val = val.replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
    e.target.value = val.replace(/[^0-9.]/g, "");
  }
});
window.showWarning = function (message) {
  document.getElementById("warning-message").textContent = message;
  document.getElementById("warningModal").style.display = "flex";
};

window.closeWarningModal = function () {
  document.getElementById("warningModal").style.display = "none";
};


let pendingPhoneNumber = "";

function showNotFoundModal(phone) {
  pendingPhoneNumber = phone;
  document.getElementById("modal-phone-display").textContent = phone;
  document.getElementById("notFoundModal").style.display = "flex";
}

function closeNotFoundModal() {
  document.getElementById("notFoundModal").style.display = "none";
}

function confirmCreateAccount() {
  closeNotFoundModal();
  switchTab("register");

  const regPhoneInput = document.getElementById("reg-phone");
  regPhoneInput.value = pendingPhoneNumber;

  document.getElementById("reg-name").focus();

  regPhoneInput.style.borderColor = "var(--neon-primary)";
  setTimeout(() => {
    regPhoneInput.style.borderColor = "#444";
  }, 1500);
}

window.addEventListener("click", (event) => {
  const notFoundModal = document.getElementById("notFoundModal");
  const forgotModal = document.getElementById("forgotModal");
  const warnModal = document.getElementById("warningModal");
  const complaintModal = document.getElementById("complaint-modal");

  if (notFoundModal && event.target === notFoundModal) closeNotFoundModal();
  if (forgotModal && event.target === forgotModal) closeForgotModal();
  if (warnModal && event.target === warnModal) closeWarningModal();
  if (complaintModal && event.target === complaintModal) {
    complaintModal.style.display = "none";
  }
});
