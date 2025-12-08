// admin-requests.js

document.addEventListener('DOMContentLoaded', () => {
    
    fetchRequests();
});

async function fetchRequests() {
    const container = document.getElementById('requests-container');
    container.innerHTML = '<p class="empty-message">جاري تحميل الطلبات...</p>';

    try {
        const response = await fetch('/api/admin/property-requests'); 
        if (!response.ok) throw new Error('فشل جلب الطلبات');
        
        const requests = await response.json();
        container.innerHTML = '';

        if (requests.length === 0) {
            container.innerHTML = '<p class="empty-message success">لا توجد طلبات عقارات مخصصة حالياً.</p>';
            return;
        }

        requests.forEach(request => {
            const formattedDate = new Date(request.submissionDate).toLocaleString('ar-EG');
            const cardHTML = `
                <div class="property-card submission-card neon-glow" data-id="${request.id}">
                    <div class="card-content">
                        <h3 class="submission-title">طلب عقار من: ${request.name}</h3>
                        <p class="submission-info">
                            <strong>الهاتف:</strong> ${request.phone} | 
                            <strong>الإيميل:</strong> ${request.email || 'غير متوفر'}
                        </p>
                        <p class="submission-info"><strong>تاريخ الطلب:</strong> ${formattedDate}</p>

                        <p class="submission-desc"><strong>المواصفات المطلوبة:</strong></p>
                        <div class="specs-box">
                            <p>${request.specifications}</p>
                        </div>
                        
                        <div class="admin-actions">
                            <button class="btn-neon-red delete-request-btn" data-id="${request.id}">
                                <i class="fas fa-trash"></i> حذف الطلب (تم التعامل معه)
                            </button>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += cardHTML;
        });

        addRequestListeners();

    } catch (error) {
        console.error('Requests Fetch Error:', error);
        container.innerHTML = `<p class="empty-message error">حدث خطأ: ${error.message}</p>`;
    }
}

function addRequestListeners() {
    document.querySelectorAll('.delete-request-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const requestId = e.target.dataset.id;
            if (confirm(`هل أنت متأكد من حذف الطلب رقم ${requestId}؟`)) {
                try {
                    const response = await fetch(`/api/admin/property-request/${requestId}`, {
                        method: 'DELETE'
                    });

                    if (!response.ok) throw new Error('فشل الحذف');
                    
                    alert('تم حذف الطلب بنجاح.');
                    fetchRequests(); 
                } catch (error) {
                    alert(`خطأ في الحذف: ${error.message}`);
                }
            }
        });
    });
}