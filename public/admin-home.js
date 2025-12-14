document.addEventListener('DOMContentLoaded', () => {
    fetchAdminCounts();
});

async function fetchAdminCounts() {
    const sellerCountEl = document.querySelector('#seller-submissions-box .count-number');
    const requestCountEl = document.querySelector('#property-requests-box .count-number');

    try {
        const sellerResponse = await fetch('/api/admin/seller-submissions');
        
        if (!sellerResponse.ok) {
             throw new Error('فشل جلب طلبات العرض.');
        }

        const sellers = await sellerResponse.json();
        sellerCountEl.textContent = sellers.length;

        const requestResponse = await fetch('/api/admin/property-requests');
        
        if (!requestResponse.ok) {
             throw new Error('فشل جلب طلبات العقارات المخصصة.');
        }
        
        const requests = await requestResponse.json();
        requestCountEl.textContent = requests.length;

    } catch (error) {
        console.error('Error fetching admin counts:', error);
        sellerCountEl.textContent = 'خطأ';
        requestCountEl.textContent = 'خطأ';
    }
}