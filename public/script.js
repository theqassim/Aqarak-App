document.addEventListener('DOMContentLoaded', async () => {
    // 1. التحقق من حالة الدخول
    try {
        const response = await fetch('/api/auth/me');
        const userData = await response.json();
        if (userData.isAuthenticated) {
            localStorage.setItem('userPhone', userData.phone);
            window.location.href = userData.role === 'admin' ? 'admin-home' : '/';
        }
    } catch (error) { console.log("Guest"); }

    // 2. تسجيل الدخول (Login) - زي ما هو
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const msgEl = document.getElementById('login-message');
            msgEl.textContent = 'جاري التحقق...';
            msgEl.style.color = '#fff';

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
                    window.location.href = data.role === 'admin' ? 'admin-home' : '/';
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                msgEl.textContent = error.message || 'خطأ في الاتصال';
                msgEl.style.color = 'red';
            }
        });
    }

    // 3. إنشاء حساب (Register) - التعديل الجوهري هنا 🔥
    const registerForm = document.getElementById('register-form');
    let isOtpSent = false; // متغير حالة (هل الكود اتبعت ولا لسه؟)

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const msgEl = document.getElementById('register-message');
            const submitBtn = document.getElementById('reg-submit-btn');
            
            const name = document.getElementById('reg-name').value;
            const phone = document.getElementById('reg-phone').value;
            const password = document.getElementById('reg-password').value;
            const otpInput = document.getElementById('reg-otp');

            // 🛑 المرحلة الأولى: إرسال الكود
            if (!isOtpSent) {
                if (!name || !phone || !password) {
                    msgEl.textContent = 'املأ جميع البيانات أولاً';
                    msgEl.style.color = 'red';
                    return;
                }

                msgEl.textContent = 'جاري إرسال كود التحقق للواتساب...';
                msgEl.style.color = 'yellow';
                submitBtn.disabled = true; // تعطيل الزر مؤقتاً

                try {
                    const response = await fetch('/api/auth/send-otp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone })
                    });
                    const data = await response.json();

                    if (data.success) {
                        // نجاح الإرسال -> نغير واجهة المستخدم
                        isOtpSent = true;
                        msgEl.textContent = '✅ تم الإرسال! أدخل الكود أدناه.';
                        msgEl.style.color = '#00ff88';
                        
                        // إظهار حقل الـ OTP
                        document.getElementById('reg-otp-group').style.display = 'block';
                        
                        // قفل الحقول القديمة عشان مايغيرش الرقم بعد ما الكود وصل
                        document.getElementById('reg-phone').readOnly = true;
                        document.getElementById('reg-name').readOnly = true;
                        
                        // تغيير نص الزر
                        submitBtn.textContent = 'تأكيد وإنشاء الحساب';
                        submitBtn.disabled = false;
                        submitBtn.classList.add('neon-glow'); // تأثير إضافي
                    } else {
                        throw new Error(data.message);
                    }
                } catch (error) {
                    msgEl.textContent = error.message;
                    msgEl.style.color = 'red';
                    submitBtn.disabled = false;
                }

            } 
            // 🛑 المرحلة الثانية: التحقق وإنشاء الحساب
            else {
                const otp = otpInput.value;
                if (!otp) {
                    msgEl.textContent = 'أدخل كود التحقق!';
                    msgEl.style.color = 'red';
                    return;
                }

                msgEl.textContent = 'جاري إنشاء الحساب...';
                submitBtn.disabled = true;

                try {
                    const response = await fetch('/api/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, phone, password, otp }),
                    });
                    const data = await response.json();

                    if (data.success) {
                        msgEl.textContent = '🎉 تم التسجيل بنجاح! سيتم تحويلك...';
                        msgEl.style.color = '#00ff88';
                        setTimeout(() => {
                            // تسجيل دخول تلقائي أو تحويل لصفحة الدخول
                            switchTab('login');
                            document.getElementById('login-phone').value = phone; // تسهيل على المستخدم
                        }, 2000);
                    } else {
                        throw new Error(data.message);
                    }
                } catch (error) {
                    msgEl.textContent = error.message;
                    msgEl.style.color = 'red';
                    submitBtn.disabled = false;
                }
            }
        });
    }
});

// دوال التبديل والمودال (زي ما هي)
function switchTab(tab) {
    const loginWrapper = document.getElementById('login-form-wrapper');
    const registerWrapper = document.getElementById('register-form-wrapper');
    const btns = document.querySelectorAll('.tab-btn');

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
    if (!phone) return;
    msgForgot.textContent = 'جاري الإرسال...';
    try {
        const response = await fetch('/api/auth/send-otp', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone })
        });
        const data = await response.json();
        if (data.success) {
            msgForgot.textContent = 'تم الإرسال!'; msgForgot.style.color = '#00ff88';
            document.getElementById('forgot-step-1').style.display = 'none';
            document.getElementById('forgot-step-2').style.display = 'block';
        } else { msgForgot.textContent = data.message; msgForgot.style.color = 'red'; }
    } catch (e) { msgForgot.textContent = 'خطأ'; }
}

async function resetPassword() {
    const phone = document.getElementById('forgot-phone').value;
    const otp = document.getElementById('forgot-otp').value;
    const newPassword = document.getElementById('new-password').value;
    try {
        const response = await fetch('/api/auth/reset-password', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, otp, newPassword })
        });
        const data = await response.json();
        if (data.success) {
            msgForgot.textContent = 'تم التغيير بنجاح!'; msgForgot.style.color = '#00ff88';
            setTimeout(closeForgotModal, 2000);
        } else { msgForgot.textContent = data.message; msgForgot.style.color = 'red'; }
    } catch (e) { msgForgot.textContent = 'خطأ'; }
}
