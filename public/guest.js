// guest.js - إنشاء هوية الضيف التلقائية
(function() {
    // التحقق: هل يوجد أي مستخدم (حقيقي أو ضيف)؟
    const currentUser = localStorage.getItem('userEmail');

    if (!currentUser) {
        // إنشاء ID عشوائي للضيف
        const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        
        // حفظ البيانات
        localStorage.setItem('userEmail', guestId);
        localStorage.setItem('userRole', 'guest');
        
        console.log('✅ Guest Mode Activated:', guestId);
    }
})();