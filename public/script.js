document.addEventListener('DOMContentLoaded', async () => {

    // ============================================================
    // 1. التحقق الآمن من السيرفر (بدلاً من Local Storage)
    // ============================================================
    try {
        // نسأل السيرفر: من أنا؟
        const response = await fetch('/api/auth/me');
        const userData = await response.json();

        // إذا كان المستخدم مسجلاً
        if (userData.isAuthenticated) {
            // حفظنا الإيميل بس عشان العرض، لكن مش للأمان
            localStorage.setItem('userEmail', userData.email); 

            if (userData.role === 'admin') {
                // لو هو في صفحة الدخول، وديه للأدمن
                if(window.location.pathname.includes('login') || window.location.pathname === '/') {
                   window.location.href = 'admin-home';
                }
            } else {
                 // لو هو يوزر عادي
                if(window.location.pathname.includes('login')) {
                   window.location.href = 'home';
                }
            }
        }
    } catch (error) {
        console.log("زائر جديد أو غير مسجل");
    }

    // ============================================================
    // 2. معالجة تسجيل الدخول
    // ============================================================
    const loginForm = document.getElementById('login-form');
    const loginMessageEl = document.getElementById('login-message');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if(loginMessageEl) loginMessageEl.textContent = 'جاري التحقق...';

            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (data.success) {
                    // 🎉 نجاح! السيرفر وضع الكوكي المشفر تلقائياً
                    if (data.role === 'admin') window.location.href = 'admin-home';
                    else window.location.href = 'home';
                } else {
                    throw new Error(data.message);
                }

            } catch (error) {
                if(loginMessageEl) {
                    loginMessageEl.textContent = 'خطأ: تأكد من البيانات';
                    loginMessageEl.style.color = 'red';
                }
            }
        });
    }
});