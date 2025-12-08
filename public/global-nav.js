// logout.js - ملف متخصص لتسجيل الخروج فقط

/**
 * دالة تقوم بمسح بيانات المستخدم من السيرفر والمتصفح
 * يمكن استدعاؤها مباشرة onclick="logout()" أو ربطها بزر
 */
async function logout() {
    if (!confirm('هل تريد تأكيد تسجيل الخروج؟')) return;

    try {
        // 1. إبلاغ السيرفر بمسح "تصريح الدخول" (Cookie)
        const response = await fetch('/api/logout', { method: 'POST' });

        if (response.ok) {
            // 2. تنظيف "جيب" المتصفح من أي بيانات قديمة
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userRole');
            localStorage.clear(); // تنظيف شامل لضمان عدم بقاء أي أثر

            // 3. العودة للصفحة الرئيسية
            window.location.href = 'home';
        } else {
            console.error('Server logout failed');
            alert('حدث خطأ أثناء محاولة الخروج من السيرفر.');
        }

    } catch (error) {
        console.error('Logout Error:', error);
        alert('حدث خطأ في الاتصال. تأكد من الإنترنت.');
    }
}

// (اختياري) كود يبحث عن أي زر في الصفحة يحمل كلاس "logout-btn" ويشغله تلقائياً
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.querySelector('.logout-btn');
    if (btn) {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
});