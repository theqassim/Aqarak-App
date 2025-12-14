document.addEventListener('DOMContentLoaded', () => {
   
    fetchSubmissions();
});

async function fetchSubmissions() {
    const container = document.getElementById('submissions-container');
    container.innerHTML = '<p class="empty-message">جاري تحميل طلبات العرض...</p>';

    try {
        const response = await fetch('/api/admin/seller-submissions'); 
        if (!response.ok) throw new Error('فشل جلب الطلبات');
        
        const submissions = await response.json();
        container.innerHTML = '';

        if (submissions.length === 0) {
            container.innerHTML = '<p class="empty-message success">لا توجد طلبات عرض عقارات جديدة حالياً.</p>';
            return;
        }

        submissions.forEach(submission => {
            const cardHTML = createSubmissionCard(submission);
            container.innerHTML += cardHTML;
        });

        addSubmissionListeners();

    } catch (error) {
        console.error('Submissions Fetch Error:', error);
        container.innerHTML = `<p class="empty-message error">حدث خطأ: ${error.message}</p>`;
    }
}

function createSubmissionCard(submission) {
    const imagePaths = submission.imagePaths ? submission.imagePaths.split(' | ').filter(p => p.trim() !== '') : [];
    const imageThumbnails = imagePaths.map(path => 
        `<img src="${path}" class="submission-thumbnail" alt="صورة العقار">`
    ).join('');

    return `
        <div class="property-card submission-card neon-glow" data-id="${submission.id}">
            <div class="card-content">
                <h3 class="submission-title">${submission.propertyTitle} (${submission.propertyType})</h3>
                <p class="submission-info">
                    <strong>الاسم:</strong> ${submission.sellerName} | 
                    <strong>الهاتف:</strong> ${submission.sellerPhone}
                </p>

                <div class="submission-details-grid">
                    <p><strong>السعر:</strong> ${submission.propertyPrice} ج.م</p>
                    <p><strong>المساحة:</strong> ${submission.propertyArea} م²</p>
                    <p><strong>الغرف:</strong> ${submission.propertyRooms}</p>
                    <p><strong>الحمامات:</strong> ${submission.propertyBathrooms}</p>
                </div>

                <p class="submission-desc"><strong>الوصف:</strong> ${submission.propertyDescription || 'لا يوجد وصف.'}</p>
                
                <div class="submission-gallery">
                    <h4>الصور المرفقة:</h4>
                    <div class="thumbnails-flex">${imageThumbnails}</div>
                </div>

                <div class="admin-actions">
                    <button class="btn-neon-auth publish-btn" data-id="${submission.id}">
                        <i class="fas fa-check-circle"></i> موافقة ونشر
                    </button>
                    <button class="btn-neon-red delete-submission-btn" data-id="${submission.id}">
                        <i class="fas fa-trash"></i> حذف ورفض
                    </button>
                </div>
            </div>
        </div>
    `;
}

function addSubmissionListeners() {
    document.querySelectorAll('.delete-submission-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const submissionId = e.target.dataset.id || e.target.closest('button').dataset.id;
            if (confirm(`هل أنت متأكد من حذف طلب العرض رقم ${submissionId}؟ سيتم حذف الصور أيضاً.`)) {
                try {
                    const response = await fetch(`/api/admin/seller-submission/${submissionId}`, {
                        method: 'DELETE'
                    });

                    if (!response.ok) throw new Error('فشل الحذف');
                    
                    alert('تم حذف الطلب بنجاح.');
                    fetchSubmissions(); 
                } catch (error) {
                    alert(`خطأ في الحذف: ${error.message}`);
                }
            }
        });
    });

    document.querySelectorAll('.publish-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const submissionId = e.target.dataset.id || e.target.closest('button').dataset.id;
            
            const hiddenCode = prompt("أدخل الكود السري (Hidden Code) للعقار قبل النشر:");
            
            if (!hiddenCode || hiddenCode.trim() === '') {
                alert('الكود السري مطلوب للنشر.');
                return;
            }

            if (confirm(`هل أنت متأكد من نشر العقار رقم ${submissionId} بالكود السري: ${hiddenCode}؟`)) {
                
                try {
                    const response = await fetch('/api/admin/publish-submission', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ submissionId, hiddenCode: hiddenCode.trim() })
                    });
                    
                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || 'فشل في عملية النشر.');
                    }
                    
                    alert(data.message);
                    fetchSubmissions();

                } catch (error) {
                    alert(`خطأ في النشر: ${error.message}`);
                }
            }
        });
    });
}