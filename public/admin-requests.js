document.addEventListener('DOMContentLoaded', () => {
    fetchRequests();
});

async function fetchRequests() {
    const container = document.getElementById('requests-container');
    container.innerHTML = '<p class="empty-message" style="color:var(--neon-secondary)">جاري تحميل الطلبات <i class="fas fa-spinner fa-spin"></i></p>';

    try {
        const response = await fetch('/api/admin/property-requests'); 
        if (!response.ok) throw new Error('فشل جلب الطلبات');
        
        const requests = await response.json();
        container.innerHTML = '';

        if (requests.length === 0) {
            container.innerHTML = `
                <div class="empty-message">
                    <i class="fas fa-check-circle" style="font-size:2rem; margin-bottom:10px; display:block; color:var(--neon-secondary);"></i>
                    لا توجد طلبات عقارات مخصصة حالياً.
                </div>`;
            return;
        }

        requests.forEach(request => {
            const formattedDate = new Date(request.submissionDate).toLocaleString('ar-EG', {
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            const cardHTML = `
                <div class="request-card" data-id="${request.id}">
                    <div class="request-header">
                        <h3 class="request-title"><i class="fas fa-user-circle"></i> ${request.name}</h3>
                        <span class="request-date"><i class="far fa-clock"></i> ${formattedDate}</span>
                    </div>

                    <div class="info-grid">
                        <div class="info-item">
                            <strong><i class="fas fa-phone-alt"></i> الهاتف:</strong> 
                            <a href="tel:${request.phone}" style="color:white; text-decoration:none;">${request.phone}</a>
                        </div>
                        <div class="info-item">
                            <strong><i class="fas fa-envelope"></i> الإيميل:</strong> 
                            ${request.email ? request.email : '<span style="color:#777;">غير متوفر</span>'}
                        </div>
                    </div>

                    <span class="specs-label"><i class="fas fa-list-ul"></i> المواصفات المطلوبة:</span>
                    <div class="specs-box">
                        ${request.specifications}
                    </div>
                    
                    <div class="admin-actions">
                        <button class="action-btn btn-delete delete-request-btn" data-id="${request.id}">
                            <i class="fas fa-trash-alt"></i> حذف (تم التواصل)
                        </button>
                    </div>
                </div>
            `;
            container.innerHTML += cardHTML;
        });

        addRequestListeners();

    } catch (error) {
        console.error('Requests Fetch Error:', error);
        container.innerHTML = `<p class="empty-message" style="color:var(--neon-danger)">حدث خطأ: ${error.message}</p>`;
    }
}

function addRequestListeners() {
    document.querySelectorAll('.delete-request-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const btn = e.target.closest('button'); // لضمان التقاط الزر حتى لو ضغط على الأيقونة
            const requestId = btn.dataset.id;
            
            if (confirm(`⚠️ هل أنت متأكد من حذف هذا الطلب؟\nرقم الطلب: ${requestId}`)) {
                try {
                    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحذف...';
                    
                    const response = await fetch(`/api/admin/property-request/${requestId}`, {
                        method: 'DELETE'
                    });

                    if (!response.ok) throw new Error('فشل الحذف');
                    
                    // تأثير بصري للحذف
                    const card = document.querySelector(`.request-card[data-id="${requestId}"]`);
                    card.style.opacity = '0';
                    setTimeout(() => {
                        card.remove();
                        // إعادة التحقق لو الصفحة فضيت
                        if(document.querySelectorAll('.request-card').length === 0) fetchRequests();
                    }, 500);

                } catch (error) {
                    alert(`خطأ في الحذف: ${error.message}`);
                    btn.innerHTML = '<i class="fas fa-trash-alt"></i> حذف (تم التواصل)';
                }
            }
        });
    });
}