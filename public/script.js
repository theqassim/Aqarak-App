document.addEventListener('DOMContentLoaded', async () => {
    // 1. التحقق من حالة الدخول عند فتح الصفحة
    try {
        const response = await fetch('/api/auth/me');
        const userData = await response.json();

        if (userData.isAuthenticated) {
            localStorage.setItem('userPhone', userData.phone); 
            if (userData.role === 'admin') {
                window.location.href = 'admin-home'; // أو الصفحة الخاصة بالأدمن
            } else {
                window.location.href = '/'; // الصفحة الرئيسية
            }
        }
    } catch (error) {
        console.log("زائر جديد");
    }

    // 2. تفعيل فورم تسجيل الدخول
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
                    if (data.role === 'admin') window.location.href = 'admin-home'; // صفحة الأدمن
                    else window.location.href = '/'; // الصفحة الرئيسية
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                msgEl.textContent = error.message || 'بيانات خاطئة';
                msgEl.style.color = 'red';
            }
        });
    }

    // 3. تفعيل فورم إنشاء الحساب
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const msgEl = document.getElementById('register-message');
            
            const name = document.getElementById('reg-name').value;
            const phone = document.getElementById('reg-phone').value;
            const password = document.getElementById('reg-password').value;
            const otp = document.getElementById('reg-otp').value;

            if (!otp) {
                msgEl.textContent = 'من فضلك أدخل كود التحقق المرسل للواتساب';
                msgEl.style.color = 'red';
                return;
            }

            msgEl.textContent = 'جاري إنشاء الحساب...';
            
            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, phone, password, otp }),
                });
                const data = await response.json();

                if (data.success) {
                    msgEl.textContent = 'تم التسجيل بنجاح! يمكنك الدخول الآن.';
                    msgEl.style.color = '#00ff88';
                    setTimeout(() => switchTab('login'), 2000);
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                msgEl.textContent = error.message;
                msgEl.style.color = 'red';
            }
        });
    }
});

// =======================
// دوال مساعدة (UI Logic)
// =======================

// التبديل بين التبويبات
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

// 🟢 إرسال OTP للتسجيل
async function sendRegisterOTP() {
    const phone = document.getElementById('reg-phone').value;
    const msgEl = document.getElementById('register-message');
    const btn = document.getElementById('send-otp-btn');

    if (!phone || phone.length < 11) {
        msgEl.textContent = 'أدخل رقم واتساب صحيح أولاً';
        msgEl.style.color = 'red';
        return;
    }

    btn.textContent = 'جاري الإرسال...';
    btn.disabled = true;

    try {
        const response = await fetch('/api/auth/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone })
        });
        const data = await response.json();

        if (data.success) {
            msgEl.textContent = 'تم إرسال الكود للواتساب. افحص رسائلك.';
            msgEl.style.color = '#00ff88';
            document.getElementById('reg-otp-group').style.display = 'block';
            document.getElementById('reg-submit-btn').disabled = false;
            btn.textContent = 'أعيد الإرسال';
            btn.disabled = false;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        msgEl.textContent = 'فشل الإرسال: ' + error.message;
        msgEl.style.color = 'red';
        btn.textContent = 'حاول مرة أخرى';
        btn.disabled = false;
    }
}

// 🟠 منطق استعادة كلمة المرور
const modal = document.getElementById("forgotModal");
const msgForgot = document.getElementById("forgot-message");

function openForgotModal() { modal.style.display = "block"; }
function closeForgotModal() { modal.style.display = "none"; }

window.onclick = function(event) {
    if (event.target == modal) closeForgotModal();
}

async function sendForgotOTP() {
    const phone = document.getElementById('forgot-phone').value;
    if (!phone) return;

    msgForgot.textContent = 'جاري الإرسال...';
    
    try {
        const response = await fetch('/api/auth/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone })
        });
        const data = await response.json();

        if (data.success) {
            msgForgot.textContent = 'تم الإرسال! أدخل الكود وكلمة المرور الجديدة.';
            msgForgot.style.color = '#00ff88';
            document.getElementById('forgot-step-1').style.display = 'none';
            document.getElementById('forgot-step-2').style.display = 'block';
        } else {
            msgForgot.textContent = data.message;
            msgForgot.style.color = 'red';
        }
    } catch (e) {
        msgForgot.textContent = 'خطأ في الاتصال';
    }
}

async function resetPassword() {
    const phone = document.getElementById('forgot-phone').value;
    const otp = document.getElementById('forgot-otp').value;
    const newPassword = document.getElementById('new-password').value;

    try {
        const response = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, otp, newPassword })
        });
        const data = await response.json();

        if (data.success) {
            msgForgot.textContent = 'تم تغيير الباسورد بنجاح! جرب تسجل دخول.';
            msgForgot.style.color = '#00ff88';
            setTimeout(closeForgotModal, 3000);
        } else {
            msgForgot.textContent = data.message;
            msgForgot.style.color = 'red';
        }
    } catch (e) {
        msgForgot.textContent = 'حدث خطأ';
    }
}