document.addEventListener('DOMContentLoaded', () => {
    fetchAdminCounts();
});

async function fetchAdminCounts() {
    // تحديد العناصر بناءً على الـ ID الموجود في HTML الجديد
    const sellerCountEl = document.querySelector('#seller-submissions-box .count-number');
    const requestCountEl = document.querySelector('#property-requests-box .count-number');
    const complaintsCountEl = document.getElementById('complaints-count');

    try {
        // 1. جلب عدد طلبات البائعين
        const sellerResponse = await fetch('/api/admin/seller-submissions');
        if (sellerResponse.ok) {
            const sellers = await sellerResponse.json();
            if(sellerCountEl) sellerCountEl.textContent = sellers.length;
        }

        // 2. جلب عدد طلبات العقارات
        const requestResponse = await fetch('/api/admin/property-requests');
        if (requestResponse.ok) {
            const requests = await requestResponse.json();
            if(requestCountEl) requestCountEl.textContent = requests.length;
        }

        // 3. جلب عدد الشكاوي
        const compResponse = await fetch('/api/admin/complaints-count');
        if (compResponse.ok) {
            const data = await compResponse.json();
            if (complaintsCountEl) {
                complaintsCountEl.textContent = data.count;
                
                // تغيير اللون إذا كان هناك شكاوي جديدة
                if (data.count > 0) {
                    // نستخدم الستايل مباشرة أو نعتمد على CSS
                    complaintsCountEl.style.color = '#ff4444'; 
                    complaintsCountEl.style.textShadow = '0 0 10px rgba(255, 68, 68, 0.5)';
                }
            }
        }

    } catch (error) {
        console.error('Error fetching admin counts:', error);
    }
}
// --- Payment & Points Logic ---

// دالة لتغيير النص واللون عند الضغط على الزر
function togglePaymentStatus() {
    const toggle = document.getElementById('payment-toggle');
    const statusText = document.getElementById('payment-status-text');
    
    if (toggle.checked) {
        statusText.textContent = "مدفوع (شغال)";
        statusText.className = "status-active";
    } else {
        statusText.textContent = "مجاني (موقف)";
        statusText.className = "status-inactive";
    }
}

// دالة حفظ الإعدادات (هنا هنربط بالـ API لاحقاً)
async function savePaymentSettings() {
    const isPaid = document.getElementById('payment-toggle').checked;
    const price = document.getElementById('point-price').value;
    const btn = document.querySelector('#payment-settings-box .btn-neon-auth');

    // تأثير بسيط عشان تعرف إنه بيحفظ
    const originalText = btn.textContent;
    btn.textContent = "جاري الحفظ...";
    btn.style.opacity = "0.7";

    try {
        // TODO: هنا هنحط كود إرسال البيانات للسيرفر (Backend)
        console.log(`Settings Saved: Paid=${isPaid}, Price=${price}`);

        // محاكاة انتظار السيرفر
        await new Promise(r => setTimeout(r, 1000));

        alert('✅ تم حفظ إعدادات الدفع بنجاح!');

    } catch (error) {
        console.error(error);
        alert('❌ حدث خطأ أثناء الحفظ');
    } finally {
        btn.textContent = originalText;
        btn.style.opacity = "1";
    }
}

// تشغيل الدالة مرة عند فتح الصفحة عشان تظبط الحالة الافتراضية
document.addEventListener('DOMContentLoaded', () => {
    // (لاحقاً هنجيب الحالة الحقيقية من الداتا بيز هنا)
    togglePaymentStatus(); 
});