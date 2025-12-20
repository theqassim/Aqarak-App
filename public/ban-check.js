document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        // 🚨 لو السيرفر قال إن المستخدم محظور
        if (data.isBanned) {
            document.body.innerHTML = `
                <div style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:99999; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; color:white; font-family:sans-serif;">
                    <h1 style="color:#ff4444; font-size:3rem; margin-bottom:20px;">⛔ حسابك محظور</h1>
                    <p style="font-size:1.5rem; margin-bottom:40px;">تم حظر هذا الحساب لمخالفة شروط استخدام موقع عقارك.<br>يرجى التواصل مع الإدارة.</p>
                    <button id="force-logout-btn" style="padding:15px 40px; font-size:1.2rem; background:#ff4444; color:white; border:none; border-radius:50px; cursor:pointer; font-weight:bold; box-shadow: 0 0 20px rgba(255, 68, 68, 0.4);">
                        تسجيل خروج
                    </button>
                </div>
            `;
            
            // تشغيل زر الخروج
            document.getElementById('force-logout-btn').addEventListener('click', async () => {
                await fetch('/api/logout', { method: 'POST' });
                window.location.href = '/'; // توجيه للرئيسية
            });
        }
    } catch (e) {
        console.error("Ban check failed", e);
    }
});