// guest.js - النسخة المعدلة (متوافقة مع النظام الآمن)
(function() {
    // 1. هل المستخدم عنده إيميل أو هوية محفوظة؟
    const currentEmail = localStorage.getItem('userEmail');

    if (!currentEmail) {
        // لو لأ.. نعم له هوية ضيف عشوائية (عشان يقدر يستخدم المفضلة مثلاً)
        const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        
        localStorage.setItem('userEmail', guestId);
        console.log('✅ Guest Mode Activated:', guestId);
    }

    // 2. تنظيف مهم جداً:
    // بنمسح أي "رتبة" محفوظة في المتصفح عشان نضمن إن الموقع 
    // يعتمد فقط على السيرفر (Cookies) في تحديد الصلاحيات
    localStorage.removeItem('userRole'); 
})();