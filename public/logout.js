// 3. زر تسجيل الخروج
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('هل تريد تسجيل الخروج؟')) {
                // ✅ مسح شامل للبيانات
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userRole');
                localStorage.removeItem('userPhone');
                localStorage.clear(); // مسح احتياطي لكل شيء
                
                // توجيه للصفحة الرئيسية (أو صفحة الدخول)
                window.location.href = 'index';
            }
        });
    }