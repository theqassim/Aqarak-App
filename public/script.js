document.addEventListener('DOMContentLoaded', () => {

    // التحقق الفوري (كما هو)
    const savedRole = localStorage.getItem('userRole');
    if (savedRole) {
        if (savedRole === 'admin') window.location.href = 'admin-home.html';
        else window.location.href = 'home.html';
        return;
    }

    // التعريفات
    const loginFormWrapper = document.getElementById('login-form-wrapper');
    const registerFormWrapper = document.getElementById('register-form-wrapper');
    
    // ✅ تعريف أزرار التبويب الجديدة
    const tabRegister = document.getElementById('tab-register');
    const tabLogin = document.getElementById('tab-login');

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginMessageEl = document.getElementById('login-message');
    const registerMessageEl = document.getElementById('register-message');

    // الحالة الافتراضية (تسجيل جديد)
    if (loginFormWrapper && registerFormWrapper) {
        loginFormWrapper.style.display = 'none';
        registerFormWrapper.style.display = 'block';
    }

    // ✅ دالة للتبديل إلى وضع "إنشاء حساب"
    function switchToRegister() {
        loginFormWrapper.style.display = 'none';
        registerFormWrapper.style.display = 'block';
        
        // تحديث شكل التبويبات
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        
        loginMessageEl.textContent = '';
    }

    // ✅ دالة للتبديل إلى وضع "تسجيل الدخول"
    function switchToLogin() {
        loginFormWrapper.style.display = 'block';
        registerFormWrapper.style.display = 'none';
        
        // تحديث شكل التبويبات
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        
        registerMessageEl.textContent = '';
    }

    // ✅ ربط الأحداث بأزرار التبويب
    if (tabRegister) {
        tabRegister.addEventListener('click', (e) => {
            e.preventDefault();
            switchToRegister();
        });
    }

    if (tabLogin) {
        tabLogin.addEventListener('click', (e) => {
            e.preventDefault();
            switchToLogin();
        });
    }

    // --- باقي كود الفورم (Login & Register submit logic) ---
    // --- يظل كما هو تماماً بدون تغيير ---
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            loginMessageEl.textContent = 'جاري التحقق...';
            loginMessageEl.className = 'info';
            loginMessageEl.style.color = '';

            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (!response.ok) throw new Error(data.message || 'فشل الدخول');

                if (data.success) {
                    localStorage.setItem('userRole', data.role);
                    localStorage.setItem('userEmail', email);
                    
                    if (data.role === 'admin') window.location.href = 'admin-home.html';
                    else window.location.href = 'home.html';
                }

            } catch (error) {
                loginMessageEl.textContent = 'برجاء التحقق من الايميل او الباسورد وإعادة المحاولة';
                loginMessageEl.className = 'error';
                loginMessageEl.style.color = '#ff4444';
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            registerMessageEl.textContent = 'جاري إنشاء الحساب...';
            registerMessageEl.className = 'info';
            registerMessageEl.style.color = '';

            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            const confirmPassword = document.getElementById('reg-confirm-password').value;

            if (password !== confirmPassword) {
                registerMessageEl.textContent = 'كلمتا المرور غير متطابقتين!';
                registerMessageEl.className = 'error';
                registerMessageEl.style.color = '#ff4444';
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
                    if(data.message && data.message.includes('مسجل')) throw new Error('هذا البريد الإلكتروني مسجل بالفعل.');
                    throw new Error('فشل التسجيل');
                }

                registerMessageEl.textContent = 'تم إنشاء الحساب بنجاح! جاري التحويل لتسجيل الدخول...';
                registerMessageEl.className = 'success';
                registerMessageEl.style.color = '#28a745';
                
                registerForm.reset();
                
                // ✅ استخدام دالة التبديل الجديدة للتحويل التلقائي
                setTimeout(() => {
                    switchToLogin();
                }, 1500);

            } catch (error) {
                if (error.message.includes('مسجل')) registerMessageEl.textContent = error.message;
                else registerMessageEl.textContent = 'برجاء التحقق من البيانات وإعادة المحاولة';
                
                registerMessageEl.className = 'error';
                registerMessageEl.style.color = '#ff4444';
            }
        });
    }
});