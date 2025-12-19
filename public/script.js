document.addEventListener('DOMContentLoaded', async () => {
    // التحقق من الجلسة
    try {
        const response = await fetch('/api/auth/me');
        const userData = await response.json();
        if (userData.isAuthenticated) {
            localStorage.setItem('userPhone', userData.phone);
            // حفظنا اليوزر نيم كمان عشان هنحتاجه بعدين
            if(userData.username) localStorage.setItem('username', userData.username);
            window.location.href = userData.role === 'admin' ? 'admin-home' : '/';
        }
    } catch (e) {}

    // 🟢 1. معالجة تسجيل الدخول
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            document.getElementById('login-phone-error').textContent = '';
            document.getElementById('login-pass-error').textContent = '';

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
                    localStorage.setItem('username', data.username); // حفظ اسم المستخدم
                    window.location.href = data.role === 'admin' ? 'admin-home' : '/';
                } else {
                    if (data.errorType === 'phone' || response.status === 404) {
                        document.getElementById('login-phone-error').textContent = data.message;
                    } else if (data.errorType === 'password' || response.status === 401) {
                        document.getElementById('login-pass-error').textContent = data.message;
                    } else {
                        alert(data.message || 'حدث خطأ غير معروف');
                    }
                }
            } catch (error) { alert('خطأ في الاتصال بالسيرفر'); }
        });
    }

    // 🟢 2. معالجة إنشاء الحساب والتحقق من اسم المستخدم
    const registerForm = document.getElementById('register-form');
    let isOtpSent = false;
    let isUsernameValid = false; // متغير لمنع التسجيل لو الاسم محجوز

    // منطق التحقق من اسم المستخدم (Live Check)
    const usernameInput = document.getElementById('reg-username');
    const iconCheck = document.getElementById('icon-check');
    const iconError = document.getElementById('icon-error');
    const usernameMsg = document.getElementById('username-msg');
    let typingTimer;

    if (usernameInput) {
        usernameInput.addEventListener('keyup', () => {
            clearTimeout(typingTimer);
            const val = usernameInput.value;
            
            // إعادة تعيين الحالة
            iconCheck.style.display = 'none';
            iconError.style.display = 'none';
            usernameMsg.style.display = 'none';
            isUsernameValid = false;

            if (val.length < 3) return;

            // انتظر 500ms بعد التوقف عن الكتابة
            typingTimer = setTimeout(async () => {
                try {
                    const res = await fetch('/api/check-username', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ username: val })
                    });
                    const data = await res.json();

                    if (data.available) {
                        iconCheck.style.display = 'block'; // ✅
                        isUsernameValid = true;
                    } else {
                        iconError.style.display = 'block'; // ❌
                        usernameMsg.style.display = 'block';
                        usernameMsg.textContent = data.message === 'taken' 
                            ? 'اسم المستخدم مستخدم بالفعل من قبل مستخدم اخر برجاء كتابة اسم مستخدم اخر' 
                            : 'صيغة الاسم غير صحيحة (أحرف إنجليزية وأرقام فقط)';
                    }
                } catch (e) { console.error(e); }
            }, 500);
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // تنظيف الرسائل
            document.getElementById('reg-phone-error').textContent = '';
            document.getElementById('confirm-pass-error').textContent = '';

            const name = document.getElementById('reg-name').value;
            const username = document.getElementById('reg-username').value;
            const phone = document.getElementById('reg-phone').value;
            const password = document.getElementById('reg-password').value;
            const confirmPassword = document.getElementById('reg-confirm-password').value;
            const submitBtn = document.getElementById('reg-submit-btn');

            // --- المرحلة 1: التحقق قبل الإرسال ---
            if (!isOtpSent) {
                // أ) التحقق من صحة اليوزر نيم
                if (!isUsernameValid) {
                    alert('يرجى اختيار اسم مستخدم متاح وصحيح أولاً.');
                    usernameInput.focus();
                    return;
                }

                // ب) تطابق الباسورد
                if (password !== confirmPassword) {
                    document.getElementById('confirm-pass-error').textContent = 'كلمتا المرور غير متطابقتين!';
                    return;
                }

                // ج) قوة الباسورد
                if (!isPasswordStrong(password)) {
                    document.getElementById('strength-text').textContent = 'كلمة المرور ضعيفة جداً.';
                    document.getElementById('strength-text').style.color = 'red';
                    return;
                }

                submitBtn.textContent = 'جاري التحقق...';
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
                        document.getElementById('reg-username').readOnly = true; // قفل اليوزر نيم
                        submitBtn.textContent = 'تأكيد وإنشاء الحساب';
                        submitBtn.disabled = false;
                    } else {
                        if (response.status === 409) {
                            document.getElementById('reg-phone-error').textContent = data.message;
                        } else {
                            alert(data.message);
                        }
                        submitBtn.textContent = 'إنشاء الحساب';
                        submitBtn.disabled = false;
                    }
                } catch (error) {
                    alert('خطأ في الاتصال');
                    submitBtn.disabled = false;
                }

            } 
            // --- المرحلة 2: التسجيل النهائي ---
            else {
                const otp = document.getElementById('reg-otp').value;
                if (!otp) return alert('أدخل الكود!');

                try {
                    const response = await fetch('/api/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        // بنبعت الـ username هنا
                        body: JSON.stringify({ name, username, phone, password, otp }),
                    });
                    const data = await response.json();

                    if (data.success) {
                        alert('تم التسجيل بنجاح! سيتم تحويلك للدخول.');
                        setTimeout(() => { switchTab('login'); document.getElementById('login-phone').value = phone; }, 1000);
                    } else {
                        alert(data.message);
                    }
                } catch (error) { alert('خطأ'); }
            }
        });
    }
});

// === دوال مساعدة ===

function checkStrength() {
    const password = document.getElementById('reg-password').value;
    const bar = document.getElementById('strength-bar');
    const text = document.getElementById('strength-text');
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.match(/[a-z]+/)) strength++;
    if (password.match(/[0-9]+/)) strength++;
    if (password.match(/[$@#&!]+/)) strength++;

    if (password.length < 6) {
        bar.style.width = '20%'; bar.style.background = 'red'; text.textContent = 'ضعيفة'; text.style.color = 'red';
    } else if (strength <= 2) {
        bar.style.width = '50%'; bar.style.background = 'orange'; text.textContent = 'متوسطة'; text.style.color = 'orange';
    } else {
        bar.style.width = '100%'; bar.style.background = '#00ff88'; text.textContent = 'قوية'; text.style.color = '#00ff88';
    }
}

function isPasswordStrong(password) {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.match(/[a-z]+/)) strength++;
    if (password.match(/[0-9]+/)) strength++;
    return strength >= 2; 
}

function switchTab(tab) {
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
}

const modal = document.getElementById("forgotModal");
const msgForgot = document.getElementById("forgot-message");
function openForgotModal() { modal.style.display = "block"; }
function closeForgotModal() { modal.style.display = "none"; }
window.onclick = function(event) { if (event.target == modal) closeForgotModal(); }

async function sendForgotOTP() {
    const phone = document.getElementById('forgot-phone').value;
    const msg = document.getElementById('forgot-message');
    msg.textContent = 'جاري الإرسال...';
    try {
        const response = await fetch('/api/auth/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, type: 'reset' }) });
        const data = await response.json();
        if (data.success) {
            msg.textContent = 'تم الإرسال'; msg.style.color = 'green';
            document.getElementById('forgot-step-1').style.display = 'none';
            document.getElementById('forgot-step-2').style.display = 'block';
        } else { msg.textContent = data.message; msg.style.color = 'red'; }
    } catch(e) { msg.textContent = 'خطأ'; }
}

async function resetPassword() {
    const phone = document.getElementById('forgot-phone').value;
    const otp = document.getElementById('forgot-otp').value;
    const newPassword = document.getElementById('new-password').value;
    const msg = document.getElementById('forgot-message');
    try {
        const response = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, otp, newPassword }) });
        const data = await response.json();
        if (data.success) {
            msg.textContent = 'تم التغيير!'; msg.style.color = 'green';
            setTimeout(closeForgotModal, 2000);
        } else { msg.textContent = data.message; msg.style.color = 'red'; }
    } catch(e) { msg.textContent = 'خطأ'; }
}