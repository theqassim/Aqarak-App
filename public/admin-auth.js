document.addEventListener('DOMContentLoaded', async () => {
    try {
        // نطلب من السيرفر التحقق من الكوكيز
        const response = await fetch('/api/auth/me');
        
        // إذا كان السيرفر لا يعمل أو الرابط خطأ
        if (!response.ok) {
            throw new Error('Server validation failed');
        }

        const data = await response.json();

        // الشرط الحاسم: هل أنت مسجل؟ وهل أنت أدمن؟
        if (!data.isAuthenticated || data.role !== 'admin') {
            // إذا لم تكن أدمن، سيتم توجيهك لصفحة الدخول فوراً
            console.warn("محاولة دخول غير مصرح بها. جاري التوجيه...");
            window.location.href = '/home.html'; // أو صفحة login.html
        } else {
            // إذا كنت أدمن، نظهر المحتوى (لو كنت تخفيه افتراضياً)
            document.body.style.display = 'block';
        }

    } catch (error) {
        console.error("فشل التحقق من الصلاحيات:", error);
        // في حالة الخطأ، للأمان نعيدك للصفحة الرئيسية
        window.location.href = '/home.html';
    }
});