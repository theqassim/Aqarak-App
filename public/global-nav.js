document.addEventListener('DOMContentLoaded', async () => {
    const nav = document.querySelector('.main-nav');

    // 1. التحقق من السيرفر بدلاً من LocalStorage
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        // هل المستخدم مسجل دخول؟
        if (data.isAuthenticated) {
            
            // التأكد أن القائمة موجودة وأن الزر غير مضاف مسبقاً
            if (nav && !document.querySelector('.logout-btn')) {
                const logoutButton = document.createElement('a');
                logoutButton.href = '#';
                logoutButton.className = 'nav-button neon-button-white logout-btn';
                logoutButton.innerHTML = '<i class="fas fa-sign-out-alt"></i> خروج'; // أضفت أيقونة لشكل أفضل
                logoutButton.style.cursor = 'pointer';

                // 2. ماذا يحدث عند الضغط على الزر؟
                logoutButton.addEventListener('click', async (e) => {
                    e.preventDefault();
                    
                    if (!confirm('هل تريد تسجيل الخروج؟')) return;

                    try {
                        // طلب مسح الكوكيز من السيرفر
                        await fetch('/api/logout', { method: 'POST' });
                        
                        // تنظيف المتصفح تماماً
                        localStorage.clear();
                        
                        // إعادة التوجيه للصفحة الرئيسية
                        window.location.href = 'home.html';
                    } catch (error) {
                        console.error('فشل تسجيل الخروج:', error);
                        alert('حدث خطأ أثناء الخروج');
                    }
                });

                // إضافة الزر للقائمة
                nav.append(logoutButton);
            }
        }
    } catch (error) {
        console.log("زائر (غير مسجل)");
    }
});