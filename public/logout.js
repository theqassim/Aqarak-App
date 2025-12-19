document.addEventListener('DOMContentLoaded', () => {
    
    // إعادة تحميل الصفحة عند العودة للخلف (لمنع ظهور صفحات الكاش للمستخدم المسجل خروجه)
    window.addEventListener('pageshow', function(event) {
        if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
            window.location.reload();
        }
    });

    const logoutButtons = document.querySelectorAll('.logout-btn');
    
    logoutButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            
            if (confirm('هل تريد تسجيل الخروج؟')) {
                try {
                    // 1. 🟢 خطوة مهمة: طلب للسيرفر لمسح كوكيز الجلسة
                    await fetch('/api/logout', { method: 'POST' });

                    // 2. مسح البيانات المحلية
                    localStorage.removeItem('userEmail');
                    localStorage.removeItem('userRole');
                    localStorage.removeItem('userPhone');
                    localStorage.removeItem('username');
                    localStorage.clear();
                    
                    // 3. التوجيه للصفحة الرئيسية
                    window.location.href = 'index'; // أو 'login' حسب رغبتك
                    
                } catch (error) {
                    console.error('Logout failed:', error);
                    // في حالة حدوث خطأ، نمسح المحلي ونخرج برضو
                    localStorage.clear();
                    window.location.href = 'index';
                }
            }
        });
    });
});