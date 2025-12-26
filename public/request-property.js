document.addEventListener('DOMContentLoaded', () => {
    const requestForm = document.getElementById('request-form');

    // 🎨 1. حقن ستايلات مودال الذكاء الاصطناعي (بتصميم متناسق مع Home)
    const style = document.createElement('style');
    style.innerHTML = `
        .ai-modal-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.95); backdrop-filter: blur(15px);
            z-index: 10000; display: none; justify-content: center; align-items: center;
        }
        .ai-modal-content {
            background: #121212; border: 1px solid #333; 
            width: 90%; max-width: 650px; padding: 0; border-radius: 20px;
            box-shadow: 0 0 50px rgba(0, 255, 136, 0.15);
            animation: slideUp 0.4s ease; max-height: 90vh; overflow: hidden;
            display: flex; flex-direction: column;
        }
        .ai-modal-header {
            padding: 20px; background: linear-gradient(90deg, rgba(0,255,136,0.1), transparent);
            border-bottom: 1px solid rgba(255,255,255,0.1);
            display: flex; align-items: center; gap: 15px;
        }
        .ai-modal-header i { font-size: 1.8rem; color: #00ff88; }
        .ai-modal-body { padding: 20px; overflow-y: auto; }
        
        .ai-matches-grid {
            display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 15px; margin-top: 15px;
        }
        
        /* كارت العقار المقترح (نفس تصميم الرئيسية تقريباً) */
        .ai-match-card {
            background: #1a1a1a; border-radius: 12px; overflow: hidden; border: 1px solid #333;
            transition: 0.3s; cursor: pointer; text-decoration: none; display: block; position: relative;
        }
        .ai-match-card:hover { transform: translateY(-5px); border-color: #00ff88; box-shadow: 0 5px 15px rgba(0,255,136,0.1); }
        .match-img { width: 100%; height: 140px; object-fit: cover; }
        .match-info { padding: 12px; }
        .match-title { color: white; font-size: 0.95rem; margin-bottom: 5px; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .match-price { color: #00ff88; font-size: 0.9rem; font-weight: bold; background: rgba(0,255,136,0.1); display: inline-block; padding: 2px 8px; border-radius: 4px; }
        
        .ai-modal-footer {
            padding: 20px; border-top: 1px solid rgba(255,255,255,0.1); background: #0f0f0f;
            display: flex; gap: 10px; flex-wrap: wrap;
        }
        .btn-proceed { flex: 1; background: transparent; border: 1px solid #555; color: #ccc; padding: 12px; border-radius: 50px; cursor: pointer; transition: 0.3s; font-family: inherit; }
        .btn-proceed:hover { border-color: #ff4444; color: #ff4444; }
        
        .btn-view { flex: 1; background: linear-gradient(135deg, #00ff88 0%, #00b862 100%); border: none; color: black; padding: 12px; border-radius: 50px; cursor: pointer; font-weight: bold; font-family: inherit; }
        
        @keyframes slideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    `;
    document.head.appendChild(style);

    // 2. HTML المودال
    const modalHTML = `
        <div id="aiMatchModal" class="ai-modal-overlay">
            <div class="ai-modal-content">
                <div class="ai-modal-header">
                    <i class="fas fa-robot"></i>
                    <div>
                        <h3 style="color:white; margin:0; font-size:1.2rem;">وجدنا عقارات مشابهة!</h3>
                        <p style="color:#aaa; margin:5px 0 0; font-size:0.85rem;">بناءً على طلبك، الذكاء الاصطناعي يرشح لك هذه النتائج.</p>
                    </div>
                </div>
                
                <div class="ai-modal-body">
                    <div id="aiMatchesGrid" class="ai-matches-grid"></div>
                </div>

                <div class="ai-modal-footer">
                    <button id="btnProceedRequest" class="btn-proceed">لا، أكمل إرسال طلبي الخاص</button>
                    <button id="btnCloseModal" class="btn-view">تصفح المقترحات</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById('aiMatchModal');
    const matchesGrid = document.getElementById('aiMatchesGrid');
    const btnProceed = document.getElementById('btnProceedRequest');
    const btnClose = document.getElementById('btnCloseModal');
    
    let currentFormData = null;

    if (requestForm) {
        requestForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = requestForm.querySelector('button[type="submit"]');
            const originalBtnContent = submitBtn.innerHTML;
            
            // تغيير أيقونة الزر أثناء التحميل
            submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> جاري التحليل...';
            submitBtn.disabled = true;

            const data = {
                name: document.getElementById('req-name').value,
                phone: document.getElementById('req-phone').value,
                specifications: document.getElementById('req-specs').value,
            };
            
            currentFormData = data;

            try {
                // فحص التشابه
                const matchResponse = await fetch('/api/check-request-matches', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ specifications: data.specifications }),
                });

                const matchResult = await matchResponse.json();

                // لو فيه نتائج -> اعرض المودال
                if (matchResult.matches && matchResult.matches.length > 0) {
                    showMatchesModal(matchResult.matches);
                    submitBtn.innerHTML = originalBtnContent;
                    submitBtn.disabled = false;
                    return;
                }

                // لو مفيش -> كمل
                await submitFinalRequest(data);

            } catch (error) {
                console.error('AI Check Failed:', error);
                await submitFinalRequest(data);
            }
        });
    }

    function showMatchesModal(matches) {
        matchesGrid.innerHTML = matches.map(prop => `
            <a href="/property-details?id=${prop.id}" target="_blank" class="ai-match-card">
                <img src="${prop.imageUrl || 'logo.png'}" class="match-img" alt="${prop.title}">
                <div class="match-info">
                    <div class="match-title">${prop.title}</div>
                    <div class="match-price">${prop.price} ج.م</div>
                </div>
            </a>
        `).join('');
        
        modal.style.display = 'flex';
    }

    async function submitFinalRequest(data) {
        try {
            const response = await fetch('/api/request-property', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error('فشل الإرسال');

            // إخفاء المودال لو مفتوح
            modal.style.display = 'none';
            // إظهار مودال النجاح الأصلي
            if(typeof showSuccessModal === 'function') showSuccessModal();

        } catch (error) {
            alert('حدث خطأ أثناء الاتصال بالسيرفر.');
        } finally {
            const submitBtn = requestForm.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-search-location"></i> ابحث وسجل طلبي';
            submitBtn.disabled = false;
        }
    }

    // أزرار المودال
    btnProceed.addEventListener('click', async () => {
        const submitBtn = requestForm.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> جاري الإرسال...';
        await submitFinalRequest(currentFormData);
    });

    btnClose.addEventListener('click', () => {
        modal.style.display = 'none';
    });
});