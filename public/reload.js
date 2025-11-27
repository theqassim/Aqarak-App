// ✅ حل مشكلة الرجوع بعد تسجيل الخروج (Mobile Cache Fix)
window.addEventListener('pageshow', function(event) {
    // لو الصفحة جاية من الذاكرة (Cache) أو زر الرجوع
    var historyTraversal = event.persisted || 
                           (typeof window.performance != "undefined" && 
                            window.performance.navigation.type === 2);
    
    if (historyTraversal) {
        // اجبر الصفحة تعمل Refresh عشان تقرأ حالة تسجيل الخروج صح
        window.location.reload();
    }
});