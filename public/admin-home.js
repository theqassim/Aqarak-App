document.addEventListener('DOMContentLoaded', () => {
    fetchAdminCounts();
});

async function fetchAdminCounts() {
    const sellerCountEl = document.querySelector('#seller-submissions-box .count-number');
    const requestCountEl = document.querySelector('#property-requests-box .count-number');
    const complaintsCountEl = document.getElementById('complaints-count');

    try {
        const sellerResponse = await fetch('/api/admin/seller-submissions');
        if (sellerResponse.ok) {
            const sellers = await sellerResponse.json();
            sellerCountEl.textContent = sellers.length;
        }

        const requestResponse = await fetch('/api/admin/property-requests');
        if (requestResponse.ok) {
            const requests = await requestResponse.json();
            requestCountEl.textContent = requests.length;
        }

        // جلب عدد الشكاوي الجديد
        const compResponse = await fetch('/api/admin/complaints-count');
        if (compResponse.ok) {
            const data = await compResponse.json();
            if (complaintsCountEl) {
                complaintsCountEl.textContent = data.count;
                if (data.count > 0) {
                    complaintsCountEl.style.color = 'red';
                    complaintsCountEl.style.textShadow = '0 0 10px red';
                }
            }
        }

    } catch (error) {
        console.error('Error fetching admin counts:', error);
    }
}