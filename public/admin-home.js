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
// --- Payment & Points Logic (Linked to Server) ---

// دالة تحديث الشكل بناءً على الحالة
function updatePaymentUI(isActive) {
    const toggle = document.getElementById('payment-toggle');
    const statusText = document.getElementById('payment-status-text');
    
    toggle.checked = isActive; // ضبط الزرار
    
    if (isActive) {
        statusText.textContent = "مدفوع (شغال)";
        statusText.className = "status-active";
    } else {
        statusText.textContent = "مجاني (موقف)";
        statusText.className = "status-inactive";
    }
}

// دالة التغيير اليدوي (لما تدوس كليك)
function togglePaymentStatus() {
    const toggle = document.getElementById('payment-toggle');
    updatePaymentUI(toggle.checked);
}

// 1. جلب الإعدادات من السيرفر عند فتح الصفحة
async function fetchPaymentSettings() {
    try {
        const response = await fetch('/api/admin/payment-settings');
        if (response.ok) {
            const data = await response.json();
            
            // تحديث الزرار والسعر بالبيانات اللي جاية من الداتابيز
            document.getElementById('point-price').value = data.point_price || 1;
            updatePaymentUI(data.is_active);
        }
    } catch (error) {
        console.error('فشل جلب إعدادات الدفع:', error);
    }
}

// 2. حفظ الإعدادات في السيرفر
async function savePaymentSettings() {
    const isActive = document.getElementById('payment-toggle').checked;
    const price = document.getElementById('point-price').value;
    const btn = document.querySelector('#payment-settings-box .btn-neon-auth');

    // تأثير التحميل
    const originalText = btn.textContent;
    btn.textContent = "جاري الحفظ...";
    btn.style.opacity = "0.7";

    try {
        const response = await fetch('/api/admin/payment-settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: isActive, point_price: price })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert(result.message);
        } else {
            alert('❌ حدث خطأ: ' + (result.message || 'غير معروف'));
        }

    } catch (error) {
        console.error(error);
        alert('❌ حدث خطأ في الاتصال بالسيرفر');
    } finally {
        btn.textContent = originalText;
        btn.style.opacity = "1";
    }
}

// تشغيل الدالة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    fetchAdminCounts(); // دالتك القديمة
    fetchPaymentSettings(); // الدالة الجديدة
});