document.addEventListener('DOMContentLoaded', () => {

    // 1. 🎨 حقن تصميم ومحتوى مودال الخروج الفخم (مرة واحدة)
    const logoutModalHTML = `
        <style>
            #luxLogoutModal { display: none; position: fixed; z-index: 99999; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); backdrop-filter: blur(8px); justify-content: center; align-items: center; }
            .lux-logout-card { 
                background: linear-gradient(145deg, #1a1a1a, #111); 
                padding: 40px; border-radius: 25px; 
                border: 1px solid #ff4444; 
                box-shadow: 0 0 50px rgba(255, 68, 68, 0.15); 
                text-align: center; max-width: 90%; width: 400px; 
                animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
            }
            .lux-logout-icon { font-size: 3.5rem; color: #ff4444; margin-bottom: 20px; text-shadow: 0 0 15px rgba(255, 68, 68, 0.4); }
            .lux-logout-title { color: white; font-size: 1.6rem; margin-bottom: 10px; font-weight: bold; font-family: 'Cairo', sans-serif; }
            .lux-logout-desc { color: #ccc; font-family: 'Cairo', sans-serif; margin-bottom: 30px; font-size: 1.1rem; }
            
            .lux-logout-btns { display: flex; gap: 15px; justify-content: center; }
            .lux-btn { padding: 12px 35px; border-radius: 50px; cursor: pointer; font-weight: bold; font-family: 'Cairo', sans-serif; border: none; transition: 0.3s; font-size: 1rem; }
            
            .lux-btn-yes { background: #ff4444; color: white; box-shadow: 0 5px 15px rgba(255, 68, 68, 0.3); }
            .lux-btn-yes:hover { background: #ff2222; transform: translateY(-2px); box-shadow: 0 10px 25px rgba(255, 68, 68, 0.5); }
            
            .lux-btn-no { background: transparent; color: white; border: 1px solid #555; }
            .lux-btn-no:hover { background: rgba(255, 255, 255, 0.1); border-color: white; }

            @keyframes popIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        </style>

        <div id="luxLogoutModal">
            <div class="lux-logout-card">
                <i class="fas fa-sign-out-alt lux-logout-icon"></i>
                <h3 class="lux-logout-title">تسجيل الخروج</h3>
                <p class="lux-logout-desc">هل أنت متأكد أنك تريد المغادرة؟</p>
                <div class="lux-logout-btns">
                    <button id="confirmLogoutBtn" class="lux-btn lux-btn-yes">نعم، خروج</button>
                    <button id="cancelLogoutBtn" class="lux-btn lux-btn-no">إلغاء</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', logoutModalHTML);

    // 2. تعريف العناصر
    const modal = document.getElementById('luxLogoutModal');
    const confirmBtn = document.getElementById('confirmLogoutBtn');
    const cancelBtn = document.getElementById('cancelLogoutBtn');
    
    // 3. دالة تنفيذ الخروج الفعلية
    async function performLogout() {
        try {
            confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الخروج...'; 
            confirmBtn.disabled = true;
            
            // طلب للسيرفر لمسح الكوكيز
            await fetch('/api/logout', { method: 'POST' });

            // مسح البيانات المحلية
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userPhone');
            localStorage.removeItem('username');
            localStorage.clear();
            
            // التوجيه
            window.location.href = 'index'; 
        } catch (error) {
            console.error('Logout failed:', error);
            // تنظيف إجباري في حالة الخطأ
            localStorage.clear();
            window.location.href = 'index';
        }
    }

    // إغلاق المودال
    cancelBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // إغلاق عند الضغط خارج الكارت
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    // 4. معالجة إعادة تحميل الصفحة (للكاش)
    window.addEventListener('pageshow', function(event) {
        if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
            window.location.reload();
        }
    });

    // 5. ربط الأزرار بالمودال الجديد
    const logoutButtons = document.querySelectorAll('.logout-btn');
    
    logoutButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            // فتح المودال الفخم بدلاً من confirm()
            modal.style.display = 'flex';
            
            // ربط زر التأكيد داخل المودال
            confirmBtn.onclick = performLogout;
        });
    });
});