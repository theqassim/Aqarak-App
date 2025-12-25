document.addEventListener('DOMContentLoaded', async () => {
    // 1. التحقق لو المستخدم مسجل دخول بالفعل
    try {
        const response = await fetch('/api/auth/me');
        const userData = await response.json();
        if (userData.isAuthenticated) {
            localStorage.setItem('userPhone', userData.phone);
            if(userData.username) localStorage.setItem('username', userData.username);
            window.location.href = userData.role === 'admin' ? 'admin-home' : '/home';
        }
    } catch (error) { console.log("Guest User"); }

    // 🟢 معالجة تسجيل الدخول (Login)
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            document.getElementById('login-phone-error').textContent = '';
            document.getElementById('login-pass-error').textContent = '';
            
            const btn = loginForm.querySelector('button');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحقق...';
            btn.disabled = true;

            const phone = document.getElementById('login-phone').value;
            const password = document.getElementById('login-password').value;

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone, password }),
                });
                const data = await response.json();

                if (data.success) {
                    localStorage.setItem('username', data.username);
                    window.location.href = data.role === 'admin' ? 'admin-home' : '/home';
                } else {
                    if (data.errorType === 'phone' || response.status === 404) {
                        document.getElementById('login-phone-error').textContent = data.message;
                    } else if (data.errorType === 'password' || response.status === 401) {
                        document.getElementById('login-pass-error').textContent = data.message;
                    } else {
                        alert(data.message || 'حدث خطأ غير معروف');
                    }
                }
            } catch (error) { 
                alert('خطأ في الاتصال بالسيرفر'); 
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }

    // 🟢 معالجة إنشاء الحساب (Register)
    const registerForm = document.getElementById('register-form');
    let isOtpSent = false;
    let isUsernameValid = false;
    let typingTimer;

    // التحقق من اسم المستخدم
    const usernameInput = document.getElementById('reg-username');
    if (usernameInput) {
        usernameInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '');
        });

        usernameInput.addEventListener('keyup', () => {
            clearTimeout(typingTimer);
            const val = usernameInput.value;
            const iconCheck = document.getElementById('icon-check');
            const iconError = document.getElementById('icon-error');
            const msg = document.getElementById('username-msg');

            iconCheck.style.display = 'none';
            iconError.style.display = 'none';
            msg.textContent = '';
            isUsernameValid = false;

            if (val.length < 5) return;

            typingTimer = setTimeout(async () => {
                try {
                    const res = await fetch('/api/check-username', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ username: val })
                    });
                    const data = await res.json();

                    if (data.available) {
                        iconCheck.style.display = 'block';
                        isUsernameValid = true;
                    } else {
                        iconError.style.display = 'block';
                        msg.textContent = data.message === 'taken' ? 'الاسم مستخدم بالفعل' : 'الاسم غير متاح';
                    }
                } catch (e) { console.error(e); }
            }, 500);
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            document.getElementById('reg-phone-error').textContent = '';
            document.getElementById('confirm-pass-error').textContent = '';
            
            const submitBtn = document.getElementById('reg-submit-btn');
            const originalText = submitBtn.innerHTML;

            const name = document.getElementById('reg-name').value;
            const username = document.getElementById('reg-username').value;
            const phone = document.getElementById('reg-phone').value;
            const password = document.getElementById('reg-password').value;
            const confirmPassword = document.getElementById('reg-confirm-password').value;

            if (!isOtpSent) {
                if (username.length < 5) { alert('اسم المستخدم قصير جداً'); return; }
                if (!isUsernameValid) { alert('تأكد من صحة اسم المستخدم'); return; }
                if (password !== confirmPassword) {
                    document.getElementById('confirm-pass-error').textContent = 'كلمتا المرور غير متطابقتين';
                    return;
                }
                
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحقق...';
                submitBtn.disabled = true;

                try {
                    const response = await fetch('/api/auth/send-otp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone, type: 'register' }) 
                    });
                    const data = await response.json();

                    if (data.success) {
                        isOtpSent = true;
                        document.getElementById('reg-otp-group').style.display = 'block';
                        document.getElementById('reg-phone').readOnly = true;
                        document.getElementById('reg-username').readOnly = true;
                        document.getElementById('reg-name').readOnly = true;
                        submitBtn.textContent = 'تأكيد وإنشاء الحساب';
                    } else {
                        if (response.status === 409) document.getElementById('reg-phone-error').textContent = data.message;
                        else alert(data.message);
                    }
                } catch (error) { alert('خطأ في الاتصال'); }
                finally { if(!isOtpSent) submitBtn.innerHTML = originalText; submitBtn.disabled = false; }

            } else {
                // --- الجزء الخاص بالتسجيل النهائي ---
                const otp = document.getElementById('reg-otp').value;
                if (!otp) return alert('من فضلك أدخل الكود');

                submitBtn.innerHTML = 'جاري إنشاء الحساب...';
                submitBtn.disabled = true;

                // ✅ استخدام FormData لإرسال الصورة والبيانات
                const formData = new FormData();
                formData.append('name', name);
                formData.append('username', username);
                formData.append('phone', phone);
                formData.append('password', password);
                formData.append('otp', otp);
                
                // إضافة الصورة لو موجودة
                const fileInput = document.getElementById('profile-upload');
                if (fileInput && fileInput.files[0]) {
                    formData.append('profileImage', fileInput.files[0]);
                }

                try {
                    // لاحظ: شلنا headers: Content-Type عشان FormData بيحطها لوحده
                    const response = await fetch('/api/register', {
                        method: 'POST',
                        body: formData 
                    });
                    const data = await response.json();

                    if (data.success) {
                        alert('تم التسجيل بنجاح! سيتم توجيهك...');
                        setTimeout(() => { switchTab('login'); document.getElementById('login-phone').value = phone; }, 1500);
                    } else {
                        alert(data.message);
                        submitBtn.innerHTML = 'تأكيد وإنشاء الحساب';
                        submitBtn.disabled = false;
                    }
                } catch (error) { 
                    alert('حدث خطأ'); 
                    submitBtn.disabled = false; 
                }
            }
        });
    }
});

// --- دوال مساعدة ---
window.previewProfileImage = function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('profile-preview').src = e.target.result;
            document.getElementById('profile-preview').style.display = 'block';
            document.getElementById('upload-placeholder').style.display = 'none';
        }
        reader.readAsDataURL(file);
    }
};
window.switchTab = function(tab) {
    const loginWrapper = document.getElementById('login-form-wrapper');
    const registerWrapper = document.getElementById('register-form-wrapper');
    const btns = document.querySelectorAll('.tab-btn');
    document.querySelectorAll('.error-msg').forEach(e => e.textContent = '');

    if (tab === 'login') {
        loginWrapper.style.display = 'block';
        registerWrapper.style.display = 'none';
        btns[0].classList.add('active');
        btns[1].classList.remove('active');
    } else {
        loginWrapper.style.display = 'none';
        registerWrapper.style.display = 'block';
        btns[0].classList.remove('active');
        btns[1].classList.add('active');
    }
};

window.checkStrength = function() {
    const password = document.getElementById('reg-password').value;
    const bar = document.getElementById('strength-bar');
    const text = document.getElementById('strength-text');
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.match(/[a-z]+/)) strength++;
    if (password.match(/[0-9]+/)) strength++;
    if (password.match(/[$@#&!]+/)) strength++;

    if (password.length < 6) {
        bar.style.width = '20%'; bar.style.background = '#ff4444'; text.textContent = 'ضعيفة'; text.style.color = '#ff4444';
    } else if (strength <= 2) {
        bar.style.width = '50%'; bar.style.background = 'orange'; text.textContent = 'متوسطة'; text.style.color = 'orange';
    } else {
        bar.style.width = '100%'; bar.style.background = '#00ff88'; text.textContent = 'قوية'; text.style.color = '#00ff88';
    }
};

// 👁️ دالة إظهار/إخفاء كلمة المرور
window.togglePassword = function(inputId, icon) {
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

// مودال نسيت كلمة المرور
const modal = document.getElementById("forgotModal");
const msgForgot = document.getElementById("forgot-message");

window.openForgotModal = () => { modal.style.display = "flex"; };
window.closeForgotModal = () => { modal.style.display = "none"; };
window.onclick = (event) => { if (event.target == modal) closeForgotModal(); };

window.sendForgotOTP = async () => {
    const phone = document.getElementById('forgot-phone').value;
    if(!phone) return alert('أدخل الرقم');
    msgForgot.textContent = 'جاري الإرسال...';
    try {
        const response = await fetch('/api/auth/send-otp', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, type: 'reset' })
        });
        const data = await response.json();
        if (data.success) {
            msgForgot.textContent = 'تم الإرسال!'; msgForgot.style.color = '#00ff88';
            document.getElementById('forgot-step-1').style.display = 'none';
            document.getElementById('forgot-step-2').style.display = 'block';
        } else { msgForgot.textContent = data.message; msgForgot.style.color = '#ff4444'; }
    } catch(e) { msgForgot.textContent = 'خطأ'; }
};

window.resetPassword = async () => {
    const phone = document.getElementById('forgot-phone').value;
    const otp = document.getElementById('forgot-otp').value;
    const newPassword = document.getElementById('new-password').value;
    if(!otp || !newPassword) return alert('أدخل البيانات');

    try {
        const response = await fetch('/api/auth/reset-password', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, otp, newPassword })
        });
        const data = await response.json();
        if (data.success) {
            msgForgot.textContent = 'تم التغيير بنجاح!'; msgForgot.style.color = '#00ff88';
            setTimeout(closeForgotModal, 2000);
        } else { msgForgot.textContent = data.message; msgForgot.style.color = '#ff4444'; }
    } catch(e) { msgForgot.textContent = 'خطأ'; }
};