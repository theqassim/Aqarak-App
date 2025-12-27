document.addEventListener('DOMContentLoaded', () => {
    const requestForm = document.getElementById('request-form');

    // 🎨 ستايلات المودال
    const style = document.createElement('style');
    style.innerHTML = `
        .team-modal-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.95); backdrop-filter: blur(10px);
            z-index: 10000; display: none; justify-content: center; align-items: center;
        }
        .team-modal-content {
            background: #151515; border: 1px solid #333; 
            width: 90%; max-width: 600px; padding: 0; border-radius: 20px;
            box-shadow: 0 0 40px rgba(0, 255, 136, 0.1);
            animation: fadeIn 0.4s ease; display: flex; flex-direction: column; overflow: hidden;
            max-height: 90vh;
        }
        .team-modal-header {
            padding: 20px; background: #1a1a1a; border-bottom: 1px solid #333;
            display: flex; align-items: center; gap: 15px;
        }
        .team-modal-header i { font-size: 1.8rem; color: #00ff88; }
        
        .team-modal-body { padding: 20px; overflow-y: auto; }
        .matches-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; margin-top: 15px; }
        
        .match-card {
            background: #222; border-radius: 10px; overflow: hidden; border: 1px solid #444;
            transition: 0.3s; text-decoration: none; display: block;
        }
        .match-card:hover { border-color: #00ff88; transform: translateY(-3px); }
        .match-img { width: 100%; height: 120px; object-fit: cover; }
        .match-info { padding: 10px; }
        .match-title { color: white; font-size: 0.9rem; font-weight: bold; margin-bottom: 5px; }
        .match-price { color: #00ff88; font-size: 0.85rem; }

        .team-modal-footer {
            padding: 15px 20px; background: #1a1a1a; border-top: 1px solid #333;
            display: flex; gap: 10px;
        }
        .btn-outline { flex: 1; background: transparent; border: 1px solid #666; color: #ccc; padding: 12px; border-radius: 50px; cursor: pointer; transition: 0.3s; font-family: inherit; }
        .btn-outline:hover { border-color: white; color: white; }
        .btn-primary { flex: 1; background: #00ff88; border: none; color: black; padding: 12px; border-radius: 50px; cursor: pointer; font-weight: bold; font-family: inherit; }

        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    `;
    document.head.appendChild(style);

    // HTML المودال (نصوص بشرية)
    const modalHTML = `
        <div id="teamMatchModal" class="team-modal-overlay">
            <div class="team-modal-content">
                <div class="team-modal-header">
                    <i class="fas fa-user-tie"></i>
                    <div>
                        <h3 style="color:white; margin:0; font-size:1.1rem;">وجدنا عقارات تناسبك! 🎉</h3>
                        <p style="color:#aaa; margin:5px 0 0; font-size:0.85rem;">
                            فريق عقارك وجد بعض الوحدات المتاحة حالياً والمطابقة لمواصفاتك.
                        </p>
                    </div>
                </div>
                
                <div class="team-modal-body">
                    <div id="matchesGrid" class="matches-grid"></div>
                </div>

                <div class="team-modal-footer">
                    <button id="btnProceedRequest" class="btn-outline">لا، أكمل إرسال طلبي</button>
                    <button id="btnCloseModal" class="btn-primary">مشاهدة الاقتراحات</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById('teamMatchModal');
    const matchesGrid = document.getElementById('matchesGrid');
    const btnProceed = document.getElementById('btnProceedRequest');
    const btnClose = document.getElementById('btnCloseModal');
    
    let currentFormData = null;

    if (requestForm) {
        requestForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = requestForm.querySelector('button[type="submit"]');
            const originalBtnContent = submitBtn.innerHTML;
            
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري البحث في قاعدة البيانات...';
            submitBtn.disabled = true;

            const typeVal = document.getElementById('req-type').value;
            const priceVal = document.getElementById('req-price').value;
            const locVal = document.getElementById('req-location').value;
            const notesVal = document.getElementById('req-notes').value;

            const data = {
                name: document.getElementById('req-name').value,
                phone: document.getElementById('req-phone').value,
                type: typeVal,
                maxPrice: priceVal,
                location: locVal,
                notes: notesVal,
                // تجميع المواصفات كنص عشان الداتابيز القديمة
                specifications: `مطلوب ${typeVal} في ${locVal}، بحد أقصى ${priceVal} جنية. ملاحظات: ${notesVal}`
            };
            
            currentFormData = data;

            try {
                // إرسال البيانات المفصلة للبحث
                const matchResponse = await fetch('/api/check-request-matches', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });

                const matchResult = await matchResponse.json();

                if (matchResult.matches && matchResult.matches.length > 0) {
                    showMatchesModal(matchResult.matches);
                    submitBtn.innerHTML = originalBtnContent;
                    submitBtn.disabled = false;
                    return;
                }

                await submitFinalRequest(data);

            } catch (error) {
                console.error('Check Failed:', error);
                await submitFinalRequest(data);
            }
        });
    }

    function showMatchesModal(matches) {
        matchesGrid.innerHTML = matches.map(prop => `
            <a href="/property-details?id=${prop.id}" target="_blank" class="match-card">
                <img src="${prop.imageUrl || 'logo.png'}" class="match-img" alt="${prop.title}">
                <div class="match-info">
                    <div class="match-title">${prop.title}</div>
                    <div class="match-price">${parseInt(prop.price).toLocaleString()} ج.م</div>
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

            modal.style.display = 'none';
            if(typeof showSuccessModal === 'function') showSuccessModal();

        } catch (error) {
            alert('حدث خطأ أثناء الاتصال.');
        } finally {
            const submitBtn = requestForm.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-search"></i> ابحث بدقة';
            submitBtn.disabled = false;
        }
    }

    btnProceed.addEventListener('click', async () => {
        const submitBtn = requestForm.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري تسجيل الطلب...';
        await submitFinalRequest(currentFormData);
    });

    btnClose.addEventListener('click', () => {
        modal.style.display = 'none';
    });
});
 document.addEventListener('DOMContentLoaded', async () => {
            try {
                const res = await fetch('/api/auth/me');
                if(res.ok) {
                    const data = await res.json();
                    if(data.isAuthenticated) {
                        document.getElementById('req-name').value = data.name || '';
                        document.getElementById('req-phone').value = data.phone || '';
                    }
                }
            } catch(e) {}
        });
        function showSuccessModal() { document.getElementById('successModal').style.display = 'flex'; }