document.addEventListener('DOMContentLoaded', () => {

    // ============================================================
    // 1. التحقق من حالة الدخول (تم التعديل لحل مشكلة الضيف)
    // ============================================================
    const savedRole = localStorage.getItem('userRole');

    // التعديل الهام هنا:
    // الشرط يتأكد إن فيه دور محفوظ، ولكن بيسمح بالمرور لو الدور كان "guest"
    // ده عشان الضيف يقدر يفتح الصفحة ويدخل بيانات أدمن أو مستخدم حقيقي
    if (savedRole && savedRole !== 'guest') {
        if (savedRole === 'admin') window.location.href = 'admin-home';
        else window.location.href = 'home';
        return; // توقف هنا لو هو مسجل كـ أدمن أو يوزر
    }

    // ============================================================
    // 2. إجبار ظهور فورم الدخول (بدلاً من none)
    // ============================================================
    const loginFormWrapper = document.getElementById('login-form-wrapper');
    if (loginFormWrapper) {
        loginFormWrapper.style.display = 'block'; 
    }

    // ============================================================
    // 3. منطق زر تسجيل الدخول
    // ============================================================
    const loginForm = document.getElementById('login-form');
    const loginMessageEl = document.getElementById('login-message');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // 1. رسالة الانتظار
            if(loginMessageEl) {
                loginMessageEl.textContent = 'جاري التحقق...';
                loginMessageEl.className = 'info'; // كلاس للتنسيق لو موجود في CSS
                loginMessageEl.style.color = '#00bcd4'; // لون سماوي (Neon Blue)
            }

            // 2. جلب البيانات من الحقول
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                // 3. إرسال الطلب للسيرفر
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (!response.ok) throw new Error(data.message || 'فشل الدخول');

                if (data.success) {
                    // 4. عند النجاح: تحديث البيانات في التخزين المحلي
                    // ده هيمسح كلمة "guest" ويحط بدالها "admin" أو "user"
                    localStorage.setItem('userRole', data.role);
                    localStorage.setItem('userEmail', email);
                    
                    // 5. التوجيه
                    if (data.role === 'admin') window.location.href = 'admin-home';
                    else window.location.href = 'home';
                }

            } catch (error) {
                // 6. عند الفشل
                if(loginMessageEl) {
                    loginMessageEl.textContent = 'خطأ: تأكد من البريد الإلكتروني أو كلمة المرور';
                    loginMessageEl.className = 'error';
                    loginMessageEl.style.color = '#ff4444'; // لون أحمر
                }
            }
        });
    }
});