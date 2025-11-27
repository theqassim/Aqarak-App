document.addEventListener('DOMContentLoaded', () => {
    
    // 1. حل مشكلة زر الرجوع في الموبايل (عشان لو عمل خروج وداس Back ميرجعش وهو مسجل)
    window.addEventListener('pageshow', function(event) {
        if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
            window.location.reload();
        }
    });

    // 2. منطق تسجيل الخروج
    const logoutButtons = document.querySelectorAll('.logout-btn');
    
    logoutButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (confirm('هل تريد تسجيل الخروج؟')) {
                // ✅ مسح شامل للبيانات
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userRole');
                localStorage.removeItem('userPhone');
                localStorage.clear(); // مسح احتياطي لكل شيء
                
                // التوجيه لصفحة الدخول
                window.location.href = 'index';
            }
        });
    });
});