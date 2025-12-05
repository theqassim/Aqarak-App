document.addEventListener('DOMContentLoaded', () => {

    // 1. التحقق: لو المستخدم مسجل دخول أصلاً، حوله للصفحة الرئيسية فوراً
    const savedRole = localStorage.getItem('userRole');
    if (savedRole) {
        if (savedRole === 'admin') window.location.href = 'admin-home';
        else window.location.href = 'home';
        return; 
    }

    // 2. تعريف عناصر تسجيل الدخول فقط
    const loginForm = document.getElementById('login-form');
    const loginMessageEl = document.getElementById('login-message');

    // تأكد إن الفورم ظاهر (لو كان مخفي في الـ CSS)
    const loginFormWrapper = document.getElementById('login-form-wrapper');
    if (loginFormWrapper) {
        loginFormWrapper.style.display = 'block';
    }

    // 3. منطق تسجيل الدخول
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // إظهار رسالة جاري التحميل
            if(loginMessageEl) {
                loginMessageEl.textContent = 'جاري التحقق...';
                loginMessageEl.className = 'info';
                loginMessageEl.style.color = ''; // ريست للون
            }

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
                    // حفظ البيانات والتوجه للصفحة المطلوبة
                    localStorage.setItem('userRole', data.role);
                    localStorage.setItem('userEmail', email);
                    
                    if (data.role === 'admin') window.location.href = 'admin-home';
                    else window.location.href = 'home';
                }

            } catch (error) {
                if(loginMessageEl) {
                    loginMessageEl.textContent = 'برجاء التحقق من الايميل او الباسورد وإعادة المحاولة';
                    loginMessageEl.className = 'error';
                    loginMessageEl.style.color = '#ff4444';
                }
            }
        });
    }
});