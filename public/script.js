document.addEventListener('DOMContentLoaded', () => {

    // العناصر الرئيسية
    const loginFormWrapper = document.getElementById('login-form-wrapper');
    const registerFormWrapper = document.getElementById('register-form-wrapper');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');
    const loginMessageEl = document.getElementById('login-message');
    const registerMessageEl = document.getElementById('register-message');

    // 🚨 التأكد من أن نموذج الدخول مرئي وأن نموذج التسجيل مخفي عند التحميل
    // (هذا يحل مشكلة اختفاء الحقول عند بدء التشغيل)
    if (loginFormWrapper && registerFormWrapper) {
        loginFormWrapper.style.display = 'block';
        registerFormWrapper.style.display = 'none';
    }


    // منطق تبديل النماذج (Toggle Logic)
    showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginFormWrapper.style.display = 'none';
        registerFormWrapper.style.display = 'block';
        loginMessageEl.textContent = ''; // مسح رسالة الدخول
    });

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        loginFormWrapper.style.display = 'block';
        registerFormWrapper.style.display = 'none';
        registerMessageEl.textContent = ''; // مسح رسالة التسجيل
    });

    // 1. منطق تسجيل الدخول (Login)
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            loginMessageEl.textContent = 'جاري التحقق...';
            loginMessageEl.className = 'info';

            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'فشل تسجيل الدخول');
                }

                // حفظ الإيميل ودور المستخدم عند النجاح
                if (data.success) {
                    localStorage.setItem('userRole', data.role);
                    localStorage.setItem('userEmail', email); // حفظ الإيميل
                }


                if (data.success && data.role === 'admin') {
                    window.location.href = 'admin-home.html';
                } else if (data.success && data.role === 'user') {
                    window.location.href = 'home.html';
                }

            } catch (error) {
                loginMessageEl.textContent = error.message;
                loginMessageEl.className = 'error';
            }
        });
    }

    // 2. منطق إنشاء حساب (Register)
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            registerMessageEl.textContent = 'جاري إنشاء الحساب...';
            registerMessageEl.className = 'info';

            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            const confirmPassword = document.getElementById('reg-confirm-password').value;

            if (password !== confirmPassword) {
                registerMessageEl.textContent = 'كلمتا المرور غير متطابقتين!';
                registerMessageEl.className = 'error';
                return;
            }

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'فشل في إنشاء الحساب.');
                }

                registerMessageEl.textContent = data.message + ' يمكنك تسجيل الدخول الآن.';
                registerMessageEl.className = 'success';
                registerForm.reset();
                showLogin.click(); // التحويل لنموذج الدخول

            } catch (error) {
                registerMessageEl.textContent = `خطأ: ${error.message}`;
                registerMessageEl.className = 'error';
            }
        });
    }
});