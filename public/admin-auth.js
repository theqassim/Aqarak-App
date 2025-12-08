document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 1. الاتصال بالسيرفر للتحقق من التوكن (الكوكي المشفر)
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        // 2. فحص رد السيرفر
        // إذا لم يكن مسجلاً، أو إذا كانت رتبته ليست "admin"
        if (!data.isAuthenticated || data.role !== 'admin') {
            alert('هذه الصفحة خاصة بالادارة فقط!');
            window.location.href = 'home'; // طرده للصفحة الرئيسية
        }
        
        // إذا كان أدمن حقيقي، الكود سينتهي هنا والصفحة ستفتح بسلام
        
    } catch (error) {
        // في حالة حدوث أي خطأ في الاتصال، نطرده للأمان
        console.error("فشل التحقق من الصلاحيات");
        window.location.href = 'home';
    }
});