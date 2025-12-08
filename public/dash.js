document.addEventListener('DOMContentLoaded', async () => {
    const nav = document.querySelector('.main-nav');

    // 1. الاتصال بالسيرفر للتحقق من الرتبة الحقيقية
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        // 2. هل هو مسجل دخول؟ وهل رتبته أدمن؟
        if (data.isAuthenticated && data.role === 'admin') {
            
            // التأكد أن القائمة موجودة وأن الزر غير مضاف مسبقاً
            if (nav && !document.querySelector('.admin-btn')) {
                const adminButton = document.createElement('a');
                adminButton.href = 'admin-home.html'; // تأكد أن الامتداد .html موجود لو بتفتح الملف مباشرة
                adminButton.className = 'nav-button neon-button-white admin-btn';
                
                // أضفت أيقونة ليكون الشكل احترافي
                adminButton.innerHTML = '<i class="fas fa-user-shield"></i> لوحة التحكم'; 
                
                // إضافة الزر في بداية القائمة
                nav.prepend(adminButton);
            }
        }
    } catch (error) {
        // لا تفعل شيئاً إذا كان زائر عادي
        console.log("User check: Guest or Error");
    }
});