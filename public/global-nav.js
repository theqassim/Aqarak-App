if (data.isAuthenticated) {
    // 1. إظهار زر الخروج (لو كان مخفي)
    // const logoutBtn = document.querySelector('.logout-btn');
    // if(logoutBtn) logoutBtn.style.display = 'block';

    // 2. دالة تسجيل الخروج
    async function logout() {
        if (!confirm('هل تريد تأكيد تسجيل الخروج؟')) return;

        try {
            // محاولة إبلاغ السيرفر بمسح الكوكيز
            await fetch('/api/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout API Error (Ignored):', error);
        } finally {
            // ⚠️ تنظيف المتصفح (أهم خطوة)
            // مسحنا userEmail وحطينا userPhone عشان التحديث الجديد
            localStorage.removeItem('userPhone'); 
            localStorage.removeItem('userRole');
            localStorage.clear(); // مسح كل حاجة للأمان

            // تحويل للصفحة الرئيسية
            window.location.href = '/'; 
        }
    }

    // 3. ربط الزر بالدالة
    document.addEventListener('DOMContentLoaded', () => {
        const btn = document.querySelector('.logout-btn');
        // أو لو الزرار عبارة عن لينك في النافبار
        // const btn = document.getElementById('logout-link'); 
        
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }
    });
}