// admin-home.js

document.addEventListener('DOMContentLoaded', () => {
    fetchAdminCounts();
});

async function fetchAdminCounts() {
    const sellerCountEl = document.querySelector('#seller-submissions-box .count-number');
    const requestCountEl = document.querySelector('#property-requests-box .count-number');

    try {
        // 1. جلب عدد طلبات عرض العقارات (قيد المراجعة)
        const sellerResponse = await fetch('/api/admin/seller-submissions');
        
        if (!sellerResponse.ok) {
             throw new Error('فشل جلب طلبات العرض.');
        }

        const sellers = await sellerResponse.json();
        sellerCountEl.textContent = sellers.length;

        // 2. جلب عدد طلبات العقارات المخصصة
        const requestResponse = await fetch('/api/admin/property-requests');
        
        if (!requestResponse.ok) {
             throw new Error('فشل جلب طلبات العقارات المخصصة.');
        }
        
        const requests = await requestResponse.json();
        requestCountEl.textContent = requests.length;

    } catch (error) {
        console.error('Error fetching admin counts:', error);
        // في حالة الخطأ، سيتم عرض "خطأ" بدلاً من الرقم
        sellerCountEl.textContent = 'خطأ';
        requestCountEl.textContent = 'خطأ';
    }
}